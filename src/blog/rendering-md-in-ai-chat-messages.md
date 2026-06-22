---
title: "Rendering Markdown in AI Chat Messages"
description: ""
added: "Jun 22 2026"
tags: [react]
---

LLMs stream their responses as Markdown — `**bold**`, lists, tables, fenced code, links. A chat frontend has to render that into DOM, update it as tokens arrive, and do it safely because the text is untrusted.

## Markdown isn't one spec

The baseline standard is **CommonMark**. It defines the syntax almost everyone means by "Markdown": headings (`#`), paragraphs, emphasis (`*x*`), bold (`**x**`), links, images, inline code, fenced code blocks, blockquotes, and lists. That's the entire core.

CommonMark deliberately leaves out several things people assume are "Markdown" but aren't:

- **Tables** (`| a | b |` with a `---` separator row)
- **Strikethrough** (`~~text~~`)
- **Task lists** (`- [ ]` / `- [x]`)
- **Autolinked URLs** (a bare `https://...` becoming a link without `[]()`)
- **Footnotes** (`[^1]`)

These are GitHub's additions, collectively called **GFM** (GitHub Flavored Markdown). This matters for AI chat because models emit tables and strikethrough constantly. With a CommonMark-only parser, a model's table renders as literal `|` characters. So you'll always enable GFM on top of the core.

## The standard setup: react-markdown + remark-gfm

For almost every chat UI, the answer is `react-markdown` with the `remark-gfm` plugin:

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Message({ text }: { text: string }) {
  return <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>;
}
```

**Input** (`text`):

```
Here's a **summary**:

- Revenue grew 12%
- Costs ~~rose~~ fell

| Quarter | Result |
| ------- | ------ |
| Q1      | Good   |

See the [report](https://example.com).
```

**Output** (the React elements it renders, shown as their HTML):

```html
<p>Here's a <strong>summary</strong>:</p>
<ul>
  <li>Revenue grew 12%</li>
  <li>Costs <del>rose</del> fell</li>
</ul>
<table>
  <thead><tr><th>Quarter</th><th>Result</th></tr></thead>
  <tbody><tr><td>Q1</td><td>Good</td></tr></tbody>
</table>
<p>See the <a href="https://example.com">report</a>.</p>
```

`remark-gfm` is what makes the `~~rose~~` become `<del>` and the pipe syntax become a real `<table>`. Without it, both stay as raw text.

### Why this is the safe default

The text comes from a model, and model output is untrusted — it can be prompted or jailbroken into emitting an XSS payload. The dangerous way to render Markdown-as-HTML in React is:

```tsx
<div dangerouslySetInnerHTML={{ __html: htmlString }} />
```

`dangerouslySetInnerHTML` is React's escape hatch for setting an element's raw `innerHTML` from a string. If that string contains `<img src=x onerror="fetch('/steal?c='+document.cookie)">`, the browser parses it as real HTML and runs the `onerror` handler — XSS in your chat window.

`react-markdown` works differently. It first parses the Markdown into a tree, then walks that tree and builds React elements from it (`<strong>`, `<a>`, `<table>`) — the same elements you'd write in JSX. Text content becomes plain string children, which React renders as escaped text, never as live HTML. So if the model writes a literal `<script>` tag, `react-markdown` shows the characters on screen instead of creating a real, executing `<script>` element. `dangerouslySetInnerHTML` does the opposite: it hands a raw string to the browser's HTML parser, which turns any tags in it into live DOM. That's why `react-markdown` is safe by default, and why you should never route model output through `dangerouslySetInnerHTML`.

## Streaming: append deltas, then re-parse

The response doesn't arrive at once. You get a stream of small deltas (a few characters each) over SSE or a fetch `ReadableStream`. The model is mid-sentence, so at any moment you may hold incomplete Markdown like `Here's a **bold sta`.

The approach: keep the accumulated text in state, append each delta to it, and let react-markdown re-parse the whole string on each update. "Append each delta" concretely means concatenating onto the previous value:

```tsx
function StreamingMessage() {
  const [text, setText] = useState('');

  useEffect(() => {
    const es = new EventSource('/chat/stream');
    es.onmessage = (e) => {
      const { delta } = JSON.parse(e.data);     // e.g. "bold "
      setText((prev) => prev + delta);          // <-- append to what we have so far
    };
    es.addEventListener('done', () => es.close());
    return () => es.close();
  }, []);

  return <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>;
}
```

Re-parsing the entire message on every delta is fine — chat messages are small and the parser is fast. The useful property is that incomplete Markdown self-heals: `**bold sta` parses as plain text now, and the moment the closing `**` arrives, the next parse turns it into `<strong>`. You don't write any logic to detect half-finished syntax.

The one problem with the code above is frequency: it re-parses and re-renders on every token. That's where the two production refinements come in.

## Production refinement 1: throttle and memoize the parse

**Throttle** so you parse roughly once per animation frame instead of once per token. Buffer incoming deltas in a ref and flush to state on a timer:

```tsx
const buffer = useRef('');
const [text, setText] = useState('');

useEffect(() => {
  const es = new EventSource('/chat/stream');
  let frame = 0;
  const flush = () => { frame = 0; setText(buffer.current); };

  es.onmessage = (e) => {
    buffer.current += JSON.parse(e.data).delta;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  es.addEventListener('done', () => { es.close(); flush(); });
  return () => es.close();
}, []);
```

`frame` acts as a flag that answers one question: *is a screen update already scheduled?* This flag is what lets you throttle. When a token arrives, you always append it to `buffer.current`, so no token is ever dropped. But you only schedule a `requestAnimationFrame` if `frame` is 0, the token just adds itself to the buffer and moves on. So a burst of tokens within the same frame collapses into a single `setText` when that frame fires. Since `requestAnimationFrame` runs at most once per repaint (~60 times a second), React reconciles and react-markdown re-parses ~60 times a second at the most.

**Memoize** so the parse doesn't re-run when the component re-renders for unrelated reasons. react-markdown does not cache internally — every render reparses the full string. If a parent re-renders (new props, a sibling updates), a finished 2,000-word message gets reparsed for nothing. Wrap it so it only re-parses when `text` actually changes:

```tsx
const RenderedMarkdown = React.memo(({ text }: { text: string }) => (
  <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
));
```

`React.memo` skips re-rendering (and therefore re-parsing) when the `text` prop is unchanged. During streaming `text` changes each frame so it still updates; once the message is complete, it stops reparsing entirely.

## Production refinement 2: highlight code blocks

Models emit a lot of fenced code, and react-markdown renders it as a plain `<pre><code>` with no colors. To highlight it, override the `code` element and route it through a syntax highlighter (here `react-syntax-highlighter`):

```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ className, children, ...rest }) {
      // fenced blocks carry a `language-xxx` class; inline code does not
      const lang = /language-(\w+)/.exec(className || '')?.[1];
      return lang ? (
        <SyntaxHighlighter language={lang} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...rest}>{children}</code>
      );
    },
  }}
>
  {text}
</Markdown>
```

The `components` prop lets you replace what any node renders as. Here, a fenced block (it has a `language-js` class) goes to the highlighter; inline code (no language class) stays a plain `<code>`.

## Going lower-level: parse to the tree yourself

`react-markdown` only renders to HTML/React, and it doesn't give you the parsed structure to work with. Two situations call for working one layer down: 

- You need to render Markdown to something that isn't HTML — a canvas, a native mobile view, a rich-text editor's own document model.
- You need to inspect or transform the message — collect every code block, rewrite links, extract tables.

Both need the parsed tree, and the package that produces just the tree is **`mdast-util-from-markdown`**: string in, **mdast** out, renders nothing.

Two terms here:

- **micromark** is the low-level Markdown parser library. It is a tokenizer: it reads the string character by character and emits a flat stream of tokens (heading-start, emphasis-start, text, and so on). It implements CommonMark, is small and security-conscious, and is the actual parsing engine underneath remark and react-markdown. It produces tokens, not a tree.
- **mdast** (Markdown Abstract Syntax Tree) is the tree format. It is a typed JSON structure that describes the document. `mdast-util-from-markdown` runs micromark and assembles its tokens into that tree. 

```tsx
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';

const tree = fromMarkdown('# Hello *world*', {
  // lets the parser recognize GFM syntax (tables, ~~strikethrough~~) in the raw text
  extensions: [gfm()],
  // turns that recognized GFM syntax into tree nodes
  mdastExtensions: [gfmFromMarkdown()],
});
```

**Input:** `# Hello *world*`

**Output** (`tree`):

```js
{
  type: 'root',
  children: [
    {
      type: 'heading',
      depth: 1,
      children: [
        { type: 'text', value: 'Hello ' },
        { type: 'emphasis', children: [
          { type: 'text', value: 'world' }
        ]}
      ]
    }
  ]
}
```

The `#` and `*` are gone — you have a structured description of meaning. Note GFM is added in two places, one for each stage of parsing. The first stage scans the raw text and recognizes syntax. `extensions: [gfm()]` plugs into this stage so that GFM syntax like tables and `~~strikethrough~~` gets noticed instead of being treated as ordinary text. The second stage builds the tree from what was recognized. `mdastExtensions: [gfmFromMarkdown()]` plugs into this stage so that the recognized syntax becomes real tree nodes, such as a `table` node or a `delete` node.

You need both halves: one to spot the syntax, one to build the matching node. This is why every extension comes as a pair, a `micromark-extension-*` package for the first stage and a `mdast-util-*` package for the second.

Once you have the tree, you render it by walking it: a recursive function that looks at each node's type and returns the matching output. Parent nodes render their children by calling the same function on each one, so the walk naturally follows the tree's shape down to the leaves.

```tsx
function render(node) {
  const kids = (n) => n.children?.map((c, i) => <Fragment key={i}>{render(c)}</Fragment>);
  switch (node.type) {
    case 'root':      return kids(node);
    case 'heading':   return <Heading level={node.depth}>{kids(node)}</Heading>;
    case 'paragraph': return <p>{kids(node)}</p>;
    case 'strong':    return <strong>{kids(node)}</strong>;
    case 'emphasis':  return <em>{kids(node)}</em>;
    case 'text':      return node.value;
    case 'link':      return <a href={safeUrl(node.url)}>{kids(node)}</a>;
    default:          return node.children ? kids(node) : null;
  }
}
```

The recursion runs through `kids()`, which calls `render` on every child. So any node that has children recurses into them. The recursion stops at leaf nodes, the ones with no children. `text` is the most common leaf. It returns `node.value` directly and never calls `kids()`, so that branch ends there. But it is not the only kind of leaf. There are two:

- **Value leaves** hold content but no children. `text` is one. So are `inlineCode` and `code`, whose text lives in `node.value`, and `image`, which carries `url` and `alt`. These return their value instead of recursing.
- **Empty leaves** have no children and no value. `thematicBreak` (a `---` rule) and `break` (a hard line break) are examples. They return a self-closing element such as `<hr />` or `<br />`.

> So the rule is simple: a node with children recurses into them, and a leaf node ends the recursion. Container nodes like `paragraph` and `strong` keep the walk going, while leaf nodes like `text` and `thematicBreak` are the base cases that finish it.

The takeaway from this lower layer is that the `switch` is the only part tied to HTML. Every case returns a React element, but nothing forces that. Swap the returns for canvas drawing calls, native components, or an editor's own document format, and the same tree feeds a completely different output. The parsing stays identical, and you decide what the tree becomes. That is the whole reason to drop down to `mdast-util-from-markdown`: you trade the convenience of a ready-made renderer for full control over the result.

## Wrapping up

For most AI chat interfaces, the path is short. Render with `react-markdown` and `remark-gfm` so tables and the rest of GFM work, and trust it to stay safe because it builds React elements instead of injecting raw HTML. For streaming, append each delta to an accumulated string, throttle the updates to about one parse per frame, and memoize so a finished message stops re-parsing. Override the `code` component to highlight fenced blocks. That setup covers the large majority of cases.

Reach for `mdast-util-from-markdown` only when you outgrow that: when you need to render Markdown somewhere other than the DOM, or when you need the parsed structure itself to inspect or transform. At that point you are working with the same tree that react-markdown uses internally, just with the final step in your own hands.
