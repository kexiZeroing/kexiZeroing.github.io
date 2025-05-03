---
title: "Reading Dan's new articles"
description: ""
added: "Apr 20 2025"
tags: [react, code]
updatedDate: "May 3 2025"
---

Dan is really a good writer. He recently published several articles this April, which is uncommon in recent years. I'm particularly drawn to his storytelling style that captivates readers from beginning to end. Instead of sharing his original texts here, I'll show some code from his articles that demonstrates key ideas.

## React for Two Computers

```js
// 1. blueprint of tags
window.concat = (a, b) => a + b;

function greeting() {
  return {
    fn: 'alert',
    args: [{
      fn: 'concat',
      args: ['Hello, ', {
        fn: 'prompt',
        args: ['Who are you?']
      }]
    }]
  };
}

function interpret(json) {
  if (json && json.fn) {
    let fn = window[json.fn];
    let args = json.args.map((arg) => interpret(arg));
    let result = fn(...args);
    return interpret(result);
  } else {
    return json;
  }
}

interpret(greeting());
```

```js
// 2. dissolve some tags earlier and some later
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args.map(arg => interpret(arg, knownTags));
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else {
    return json;
  }
}

const step1 = greeting();
 
const step2 = interpret(step1, {
  prompt: window.prompt,
  concat: (a, b) => a + b,
});
// {
//   fn: 'alert',
//   args: ['Hello, Dan']
// };
 
interpret(step2, {
  alert: window.alert,
});
```

```js
// 3. interpret and perform / Thinking and Doing

// interprets tags outside-in
// embed stuff and return tags
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args;
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else if (Array.isArray(json)) {
    return json.map(item => interpret(item, knownTags));
  } else {
    return json;
  }
}

// run inside-out
// introspect stuff and need to know their arguments
function perform(json, knownTags) {
  if (json && json.fn) {
    let fn = knownTags[json.fn];
    let args = perform(json.args, knownTags);
    let result = fn(...args);
    return perform(result, knownTags);
  } else if (Array.isArray(json)) {
    return json.map(item => perform(item, knownTags));
  } else {
    return json;
  }
}
```

```js
// 4. convert a tree of Components to a tree of Primitives
function App() {
  return {
    type: "div", // Primitive (string)
    props: {
      children: [
        { type: "Greeting", props: {} }, // Component (function)
        {
          type: "p", // Primitive (string)
          props: {
            className: "text-purple-500",
            children: [
              "The time is: ",
              { type: "Clock", props: {} } // Component (function)
            ],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

// If json.type is a function, that function itself is the Component.
// Otherwise, it must be a Primitive,
function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const primitives = interpret({ type: App, props: {} });
const tree = perform(primitives);
document.body.appendChild(tree);
```

```js
// 5. Early and Late Components
function App() {
  return {
    type: "div",
    props: {
      children: [
        { type: Greeting, props: {} },
        {
          type: "/src/Donut.js#Donut",
          props: {
            children: ["The time is: ", { type: Clock, props: {} }],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

function Donut({ children }) {
  return {
    type: "p",
    props: {
      style: { color: prompt("Pick a color:") },
      children,
    },
  };
}

async function loadReference(lateReference) {
  // Pretend it was loaded over the network or from the bundler cache.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (lateReference === "/src/Clock.js#Clock") {
    return Clock;
  } else if (lateReference === "/src/Donut.js#Donut") {
    return Donut;
  } else {
    throw Error("Module not found.");
  }
}

function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else if (propKey === "style") {
        for (let [styleKey, styleValue] of Object.entries(propValue)) {
          node.style[styleKey] = styleValue;
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const jsonString = JSON.stringify(interpret({ type: App, props: {} }));
const pendingPromises = [];
const lateComponents = JSON.parse(jsonString, (key, value) => {
  if (value && typeof value.type === "string" && value.type.includes("#")) {
    const promise = loadReference(value.type).then((fn) => {
      value.type = fn;
    });
    pendingPromises.push(promise);
  }
  return value;
});

async function render() {
  await Promise.all(pendingPromises);
  const primitives = interpret(lateComponents);
  const tree = perform(primitives);
  document.body.innerHTML = "";
  document.body.appendChild(tree);
}

render();
```

## JSX Over The Wire

```js
// 1. Model, View, ViewModel
type Like = {
  createdAt: string, // Timestamp
  likedById: number, // User ID
  postId: number     // Post ID
};
type Model = Like;

type LikeButtonProps = {
  totalLikeCount: number,
  isLikedByUser: boolean,
  friendLikes: string[]
}
type ViewModel = LikeButtonProps;
```

```js
// 2. BFF layer
import { getPost, getFriendLikes, getRecentPostIds } from '@your-company/data-layer';

// Only place generating props for `LikeButton` component
// which is showing “You, Alice, and 13 others liked this” 
async function LikeButtonViewModel({ postId }) {
  const [post, friendLikes] = await Promise.all([
    getPost(postId),
    getFriendLikes(postId, { limit: 2 }),
  ]);
  return {
    totalLikeCount: post.totalLikeCount,
    isLikedByUser: post.isLikedByUser,
    friendLikes: friendLikes.likes.map(l => l.firstName)
  };
}
 
async function PostDetailsViewModel({ postId }) {
  const [post, postLikes] = await Promise.all([
    getPost(postId),
    LikeButtonViewModel({ postId }),
  ]);
  return {
    postTitle: post.title,
    postContent: parseMarkdown(post.content),
    postAuthor: post.author,
    postLikes
  };
}
 
app.get('/screen/post-details/:postId', async (req, res) => {
  const postId = req.params.postId;
  const viewModel = await PostDetailsViewModel({ postId });
  res.json(viewModel);
});
 
app.get('/screen/post-list', async (req, res) => {
  const postIds = await getRecentPostIds();
  const viewModel = {
    posts: await Promise.all(postIds.map(postId =>
      PostDetailsViewModel({ postId })
    ))
  };
  res.json(viewModel);
});
```

```js
// 3. ViewModel Parameters

// Client doesn’t pass parameters like `?includeAvatars=true` to the server
// BFF itself knows a page include avatars or not, 
// and we have split BFF endpoints into units of reusable logic.
async function PostDetailsViewModel({
  postId,
  truncateContent,
  includeAvatars
}) {
  const [post, postLikes] = await Promise.all([
    getPost(postId),
    LikeButtonViewModel({ postId, includeAvatars }),
  ]);
  return {
    postTitle: post.title,
    postContent: parseMarkdown(post.content, {
      maxParagraphs: truncateContent ? 1 : undefined
    }),
    postAuthor: post.author,
    postLikes
  };
}
```

```js
// 4. Components as JSON

// Producing HTML as the primary output format is a dead end for interactive applications
// However, if tags are objects, they can be sent as JSON.
const json = (
  <Page title={`${person.firstName}'s Profile`}>
    <Header>
      <Avatar src={person.avatarUrl} />
      {person.isPremium && <PremiumBadge />}
    </Header>

    <Layout columns={featureFlags.includes('TWO_COL_LAYOUT') ? 2 : 1}>
      <Panel title="User Info">
        <UserDetails user={person} />
        {req.user.id === person.id && <EditButton />}
      </Panel>

      <Panel title="Activity">
        <ActivityFeed userId={person.id} limit={3} />
      </Panel>
    </Layout>
  </Page>
);

// /app/profile/123
{
  type: "Page",
  props: {
    title: "Jae's Profile",
    children: [{
      type: "Header",
      props: {
        children: [{
          type: "Avatar",
          props: {
            src: "https://example.com/avatar.jpg"
          }
        }, {
          type: "PremiumBadge",
          props: {},
        }]
      }
    }, {
      type: "Layout",
      props: {
        columns: 2,
        children: [
          // ...
        ]
      }
    }]
  }
}
```

```js
// 5. Connect the ViewModel to its component
async function LikeButtonViewModel({
  postId,
  includeAvatars
}) {
  const [post, friendLikes] = await Promise.all([
    getPost(postId),
    getFriendLikes(postId, { limit: includeAvatars ? 5 : 2 }),
  ]);
  return (
    <LikeButton
      totalLikeCount={post.totalLikeCount}
      isLikedByUser={post.isLikedByUser}
      friendLikes={friendLikes.likes.map(l => ({
        firstName: l.firstName,
        avatar: includeAvatars ? l.avatar : null,
      }))}
    />
  );
}
// {
//   type: "LikeButton",
//   props: {
//     totalLikeCount: 8,
//     isLikedByUser: false,
//     friendLikes: [{
//       firstName: 'Alice',
//       avatar: 'https://example.com/alice.jpg'
//     }, {
//       firstName: 'Bob',
//       avatar: 'https://example.com/bob.jpg'
//     }]
//   }
// }

// On the client, React will take these props and pass them to the component
function LikeButton({
  totalLikeCount,
  isLikedByUser,
  friendLikes
}) {
  let buttonText = 'Like';
  if (totalLikeCount > 0) {
    // e.g. "Liked by You, Alice, and 13 others"
    buttonText = formatLikeText(totalLikeCount, isLikedByUser, friendLikes);
  }
  return (
    <button className={isLikedByUser ? 'liked' : ''}>
      {buttonText}
    </button>
  );
}
```

```js
// 6. We’re describing React Server Components:
// “ViewModels” are Server Components
// “Components” are Client Components

import { LikeButton } from './LikeButton';

// you just get a reference which describes how to load the client component
// "src/LikeButton.js#LikeButton"
console.log(LikeButton);

async function LikeButtonViewModel() {
  return (
    <LikeButton
      ...
    />
  );
}

// {
//   type: "src/LikeButton.js#LikeButton", // This is a Client Component
//   props: {
//     totalLikeCount: 8,
//     // ...
//   }
// }

'use client';
 
export function LikeButton({
  totalLikeCount,
  isLikedByUser,
  friendLikes
}) {
  // ... 
}
```

## Impossible Components

```js
// 1. backend passes data to the frontend
import { readFile } from 'fs/promises';
import { GreetingFrontend } from './client';
 
async function GreetingBackend() {
  const myColor = await readFile('./color.txt', 'utf8');
  return <GreetingFrontend color={myColor} />;
}

'use client';
import { useState } from 'react';
 
export function GreetingFrontend({ color }) {
  const [yourName, setYourName] = useState('Alice');
  return (
    <>
      <input placeholder="What's your name?"
        value={yourName}
        onChange={e => setYourName(e.target.value)}
      />
      <p style={{ color }}>
        Hello, {yourName}!
      </p>
    </>
  );
}
```

```js
// 2. backend renders the frontend, and rendering the backend gives you both

// The `GreetingFrontend` state inside of each `GreetingBackend` is isolated,
// and how each `GreetingBackend` loads its data is also isolated.
import { readFile } from 'fs/promises';
import { GreetingFrontend } from './client';
 
function Welcome() {
  return (
    <>
      <GreetingBackend colorFile="./color1.txt" />
      <GreetingBackend colorFile="./color2.txt" />
      <GreetingBackend colorFile="./color3.txt" />
    </>
  );
}
 
async function GreetingBackend({ colorFile }) {
  const myColor = await readFile(colorFile, 'utf8');
  return <GreetingFrontend color={myColor} />;
}
```

```js
// 3. another example of backend rendering the frontend
import { SortableList } from './client';
import { readdir } from 'fs/promises';
 
async function SortableFileList({ directory }) {
  const files = await readdir(directory);
  return <SortableList items={files} />;
}

'use client';
import { useState } from 'react';
 
export function SortableList({ items }) {
  const [isReversed, setIsReversed] = useState(false);
  const sortedItems = isReversed ? items.toReversed() : items;
  return (
    <>
      <button onClick={() => setIsReversed(!isReversed)}>
        Flip order
      </button>
      <ul>
        {sortedItems.map(item => (
          <li key={item}>
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}
```

```js
// 4. Expand a preview on click

// you can always take a tag like <section> and replace it with a frontend component
// that enriches a plain <section> with some stateful logic and event handlers.
import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import { ExpandingSection } from './client';
 
async function PostPreview({ slug }) {
  const fileContent = await readFile('./public/' + slug + '/index.md', 'utf8');
  const { data, content } = matter(fileContent);
  const wordCount = content.split(' ').filter(Boolean).length;
  const firstSentence = content.split('.')[0];
 
  return (
    <ExpandingSection
      extraContent={<p>{firstSentence} [...]</p>}
    >
      <h5 className="font-bold">
        <a href={'/' + slug} target="_blank">
          {data.title}
        </a>
      </h5>
      <i>{wordCount.toLocaleString()} words</i>
    </ExpandingSection>
  );
}

'use client';
import { useState } from 'react';
 
export function ExpandingSection({ children, extraContent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <section
      className="rounded-md bg-black/5 p-2"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {children}
      {isExpanded && extraContent}
    </section>
  );
}
```

## What Does "use client" Do

```js
// 1. "normal" backend server and frontend code
async function likePost(postId) {
  const userId = getCurrentUser();
  await db.likes.create({ postId, userId });
  const count = await db.likes.count({ where: { postId } });
  return { likes: count };
}

app.post('/api/like', async (req, res) => {
  const { postId } = req.body;
  const json = await likePost(postId);
  res.json(json);
});

document.getElementById('likeButton').onclick = async function() {
  const postId = this.dataset.postId;
  const response = await fetch('/api/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, userId })
  });
  const { likes } = await response.json();
  this.classList.add('liked');
  this.textContent = likes + ' Likes';
});
```

```js
// 2. single program split between two machines
// 'use server' exports server functions to the client. 
// The frontend sees them as async functions that call the backend via HTTP.

'use server'; // Mark all exports as "callable" from the frontend
 
export async function likePost(postId) {
  const userId = getCurrentUser();
  await db.likes.create({ postId, userId });
  const count = await db.likes.count({ where: { postId } });
  return { likes: count };
}
 
export async function unlikePost(postId) {
  const userId = getCurrentUser();
  await db.likes.destroy({ where: { postId, userId } });
  const count = await db.likes.count({ where: { postId } });
  return { likes: count };
}

import { likePost, unlikePost } from './backend';
 
document.getElementById('likeButton').onclick = async function() {
  const postId = this.dataset.postId;
  if (this.classList.contains('liked')) {
    const { likes } = await unlikePost(postId); // HTTP call
    this.classList.remove('liked');
    this.textContent = likes + ' Likes';
  } else {
    const { likes } = await likePost(postId); // HTTP call
    this.classList.add('liked');
    this.textContent = likes + ' Likes';
  }
};
```

```js
// 3. We pass information from the backend to the frontend code.

// With purely client-side rendering, 
// our server code’s job is just to pass the initial props.
app.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  const userId = getCurrentUser();
  const likeCount = await db.likes.count({ where: { postId } });
  const isLiked = await db.likes.count({ where: { postId, userId } }) > 0;
  const html = `<html>
    <body>
      <script src="./frontend.js></script>
      <script>
        const output = LikeButton(${JSON.stringify({
          postId,
          likeCount,
          isLiked
        })});
        render(document.body, output);
      </script>
    </body>
  </html>`;
  res.text(html);
});
```

```js
// 4. Look at them as a single program rather than as two separate programs.
// 'use client' from the backend doesn’t give us the `LikeButton` function itself.
// Instead, it gives a client reference—something that
// we can turn into a <script> tag under the hood later.

import { LikeButton } from './frontend'; // "/src/frontend.js#LikeButton"
 
app.get('/posts/:postId', async (req, res) => {
  // ...
  const jsx = (
    <html>
      <body>
        <LikeButton
          postId={postId}
          likeCount={likeCount}
          isLiked={isLiked}
        />
      </body>
    </html>
  );
  // ...
});

// The JSX produces this JSON:
// {
//   type: "html",
//   props: {
//     children: {
//       type: "body",
//       props: {
//         children: {
//           type: "/src/frontend.js#LikeButton", // A client reference!
//           props: {
//             postId: 42
//             likeCount: 8
//             isLiked: true
//           }
//         }
//       }
//     }
//   }
// }

'use client'; // Mark all exports as "renderable" from the backend
 
export function LikeButton({ postId, likeCount, isLiked }) {
  // ...

  return (
    <button className={isLiked ? 'liked' : ''}>
      {likeCount} Likes
    </button>
  );
}

// 'use server' opens a door from the client to the server, 
// 'use client' opens a door from the server to the client.
```

## Functional HTML

```js
// 1. Serialize our imaginary HTML into a JSON tree
<html>
  <body>
    <p style="color: purple">Hello, Alice</p>
    <p style="color: pink">Hello, Bob</p>
  </body>
</html>

// ["html", {
//   children: ["body", {
//     children: [
//       ["p", {
//         children: "Hello, Alice",
//         style: { color: "purple" }
//       }],
//       ["p", {
//         children: "Hello, Bob",
//         style: { color: "pink" }
//       }]
//     ]
//   }]
// }]
```

```js
// 2. Our “imaginary HTML” allows us to speak the user’s language
<html>
  <body>
    <Greeting username="alice123" />
    <Greeting username="bob456" />
  </body>
</html>
 
async function Greeting({ username }) {
  const filename = `./${username.replace(/\W/g, '')}.json`;
  const person = JSON.parse(await readFile(filename, 'utf8'));
  return (
    <p style={{ color: person.favoriteColor }}>
      Hello, {person.name}
    </p>
  );
}
```

```js
// 3. We want the function to run later
// Client Reference is not a function, so the server 
// that serializes our JSON does not need to do anything with it.
import { onLike } from './onLike';
 
<button onClick={onLike}>
  Like
</button>

// ["button", {
//   children: "Like",
//   onClick: "/src/bundle.js#onLike"
// }]

'use client'; // Serialize me as a Client Reference
 
export function onLike() {
  alert('You liked this.');
}
```

```js
// 4. Another pattern is to make it callable by the client
<button onClick={onLike}>
  Like
</button>

// ["button", {
//   children: "Like",
//   onClick: "/api?fn=onLike"
// }]

async function onLike() {
  'use server'; // Serialize me as a Server Reference
  const likes = Number(await readFile('./likes.txt', 'utf8'));
  await writeFile('./likes.txt', likes + 1, 'utf8');
}
```

```js
// 5. Compose our own tags on both sides
import { LikeButton } from './LikeButton';
 
<>
  <PersonalizedLikeButton username="alice123" />
  <PersonalizedLikeButton username="bob456" />
</>
 
async function PersonalizedLikeButton({ username }) {
  const filename = `./${username.replace(/\W/g, '')}.txt`;
  const color = await readFile(filename);
  return <LikeButton color={color} />;
}

'use client';
export function LikeButton({ color }) {
  function onLike() {
    alert('You liked this.');
  }
 
  return (
    <button onClick={onLike} style={{ color }}>
      Like
    </button>
  );
}
```

```js
// 6. Streaming
// The downside is that rendering the entire page is blocked
// until all of the Async Server Tags resolve.

// We can specify that a server should serialize our tags to JSON without blocking
// but leave “holes” whenever a part of the content is not yet available.
// We could then stream in the contents of those holes as they resolve on the server.

["article", {
  children: [
    ["header", {
      children: 'Welcome to Overreacted'
    }],
    /* HOLE_1 */,
    /* HOLE_2 */,
    ["footer", {
      children: 'Thanks for reading'
    }]
  ]
}]
/* HOLE_1: */["article", { children: [["p", "Here is a piece of HTML:", ...]]}]
/* HOLE_2: */["ul", { className: "comments", children: [["li", { children: "Server rendering sucks, you should only do things on the client" }]] }]
```
