---
layout: "../layouts/BlogPost.astro"
title: "React Server Components from scratch"
slug: react-server-components-from-scratch
description: ""
added: "June 12 2023"
tags: [code]
---

We can learn from Dan Abramov's writing about [RSC From Scratch. Part 1: Server Components](https://github.com/reactwg/server-components/discussions/5), which is a technical deep dive implementing a very simplified version of React Server Components from scratch.

In this blog, my primary emphasis lies on the code segment *(talk less show me the code)*. For a comprehensive understanding of the author's insights and step-by-step instructions, I recommend referring to the original article. Also note that I want to show the code less abstract but more clear for learning purpose here, so I'm not copying the [final code](https://codesandbox.io/p/sandbox/agitated-swartz-4hs4v1?file=%2Fserver%2Frsc.js) but a somewhere in the middle version before things get clean up.

<video src="https://github.com/kexiZeroing/blog-images/raw/main/242748034-66ec402c-60c5-4bc6-a31f-c5c953b38142.mp4" controls="controls" muted="muted" style="max-width: 100%; max-height:640px; min-height: 200px"></video>


```js
// server.js

import { createServer } from "http";
import { readFile, readdir } from "fs/promises";
import escapeHtml from "escape-html";
import sanitizeFilename from "sanitize-filename";

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/client.js") {
      await sendScript(res, "./client.js");
    } else if (url.searchParams.has("jsx")) {
      url.searchParams.delete("jsx");
      await sendJSX(res, <Router url={url} />);
    } else {
      await sendHTML(res, <Router url={url} />);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8080);

function Router({ url }) {
  let page;
  if (url.pathname === "/") {
    page = <BlogIndexPage />;
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1));
    page = <BlogPostPage postSlug={postSlug} />;
  }
  return <BlogLayout>{page}</BlogLayout>;
}

async function BlogIndexPage() {
  const postFiles = await readdir("./posts");
  const postSlugs = postFiles.map((file) =>
    file.slice(0, file.lastIndexOf("."))
  );
  return (
    <section>
      <h1>Welcome to my blog</h1>
      <div>
        {postSlugs.map((slug) => (
          <Post key={slug} slug={slug} />
        ))}
      </div>
    </section>
  );
}

function BlogPostPage({ postSlug }) {
  return <Post slug={postSlug} />;
}

async function Post({ slug }) {
  let content;
  try {
    content = await readFile("./posts/" + slug + ".txt", "utf8");
  } catch (err) {
    throwNotFound(err);
  }
  return (
    <section>
      <h2>
        <a href={"/" + slug}>{slug}</a>
      </h2>
      <article>{content}</article>
    </section>
  );
}

function BlogLayout({ children }) {
  const author = "Jae Doe";
  return (
    <html>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
          <input />
          <hr />
        </nav>
        <main>{children}</main>
        <Footer author={author} />
      </body>
    </html>
  );
}

function Footer({ author }) {
  return (
    <footer>
      <hr />
      <p>
        <i>
          (c) {author} {new Date().getFullYear()}
        </i>
      </p>
    </footer>
  );
}

async function sendScript(res, filename) {
  const content = await readFile(filename, "utf8");
  res.setHeader("Content-Type", "text/javascript");
  res.end(content);
}

async function sendJSX(res, jsx) {
  const clientJSX = await renderJSXToClientJSX(jsx);
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);
  res.setHeader("Content-Type", "application/json");
  res.end(clientJSXString);
}

async function sendHTML(res, jsx) {
  let html = await renderJSXToHTML(jsx);
  const clientJSX = await renderJSXToClientJSX(jsx);
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);
  html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `;
  html += JSON.stringify(clientJSXString).replace(/</g, "\\u003c");
  html += `</script>`;
  html += `
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@canary",
          "react-dom/client": "https://esm.sh/react-dom@canary/client"
        }
      }
    </script>
    <script type="module" src="/client.js"></script>
  `;
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}

function throwNotFound(cause) {
  const notFound = new Error("Not found.", { cause });
  notFound.statusCode = 404;
  throw notFound;
}

function stringifyJSX(key, value) {
  if (value === Symbol.for("react.element")) {
    return "$RE";
  } else if (typeof value === "string" && value.startsWith("$")) {
    return "$" + value;
  } else {
    return value;
  }
}

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    jsx == null
  ) {
    return jsx;
  } else if (Array.isArray(jsx)) {
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)));
  } else if (jsx != null && typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        };
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToClientJSX(returnedJsx);
      } else throw new Error("Not implemented.");
    } else {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      );
    }
  } else throw new Error("Not implemented");
}

async function renderJSXToHTML(jsx) {
  if (typeof jsx === "string" || typeof jsx === "number") {
    return escapeHtml(jsx);
  } else if (jsx == null || typeof jsx === "boolean") {
    return "";
  } else if (Array.isArray(jsx)) {
    const childHtmls = await Promise.all(
      jsx.map((child) => renderJSXToHTML(child))
    );
    let html = "";
    let wasTextNode = false;
    let isTextNode = false;
    for (let i = 0; i < jsx.length; i++) {
      isTextNode = typeof jsx[i] === "string" || typeof jsx[i] === "number";
      if (wasTextNode && isTextNode) {
        html += "<!-- -->";
      }
      html += childHtmls[i];
      wasTextNode = isTextNode;
    }
    return html;
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        let html = "<" + jsx.type;
        for (const propName in jsx.props) {
          if (jsx.props.hasOwnProperty(propName) && propName !== "children") {
            html += " ";
            html += propName;
            html += "=";
            html += escapeHtml(jsx.props[propName]);
          }
        }
        html += ">";
        html += await renderJSXToHTML(jsx.props.children);
        html += "</" + jsx.type + ">";
        return html;
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToHTML(returnedJsx);
      } else throw new Error("Not implemented.");
    } else throw new Error("Cannot render an object.");
  } else throw new Error("Not implemented.");
}
```

```js
// client.js

import { hydrateRoot } from "react-dom/client";

const root = hydrateRoot(document, getInitialClientJSX());
let currentPathname = window.location.pathname;

async function navigate(pathname) {
  currentPathname = pathname;
  const clientJSX = await fetchClientJSX(pathname);
  if (pathname === currentPathname) {
    root.render(clientJSX);
  }
}

function getInitialClientJSX() {
  const clientJSX = JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX);
  return clientJSX;
}

async function fetchClientJSX(pathname) {
  const response = await fetch(pathname + "?jsx");
  const clientJSXString = await response.text();
  const clientJSX = JSON.parse(clientJSXString, parseJSX);
  return clientJSX;
}

function parseJSX(key, value) {
  if (value === "$RE") {
    return Symbol.for("react.element");
  } else if (typeof value === "string" && value.startsWith("$$")) {
    return value.slice(1);
  } else {
    return value;
  }
}

window.addEventListener(
  "click",
  (e) => {
    if (e.target.tagName !== "A") {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const href = e.target.getAttribute("href");
    if (!href.startsWith("/")) {
      return;
    }
    e.preventDefault();
    window.history.pushState(null, null, href);
    navigate(href);
  },
  true
);

window.addEventListener("popstate", () => {
  navigate(window.location.pathname);
});
```
