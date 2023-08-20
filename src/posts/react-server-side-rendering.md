---
layout: "../layouts/BlogPost.astro"
title: "React Server Side Rendering"
slug: react-server-side-rendering
description: ""
added: "July 8 2023"
tags: [code]
updatedDate: "Aug 20 2023"
---

## Adding Server-Side Rendering
With SSR, you render your JS on the server into HTML. You serve that HTML to your client so it appears to have fast startup. But you still have to wait for your JS to reach the user before anything can be interactive (hydration). After hydration, SSR can't be used again - it's typically only used for initial loads.

1. Browser sends HTTP request to server to load a page.
2. Server receives HTTP request and turns React JSX into HTML markup.
3. Server inserts the markup into a HTML template and sends the HTML response back to the browser.
4. Browser renders the HTML, downloads the client-side JavaScript bundle, and “hydrates” the HTML.

Let’s create a simple React component App. We will render this component on the server-side and hydrate it on the client-side.

```js
// client/components/App/index.js

import React from 'react'
const App = () => (
  <>
    <div>Hello World</div>
    <button onClick={e => alert('Hello You!')}>Say Hello</button>
  </>
);

export default App; 
```

Then create an Express server and define a route that serves an HTML page when a user visits `http://localhost:3000`.

```js
// server/index.js

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import express from 'express'
import App from '../client/components/App'

const app = express()
const port = 3000
// This is the local static server that serves the client-side bundles.
const cdnHost = `http://localhost:5000`;

app.get('/', (req, res) => {
  // This turns the React component App into an HTML string
  const jsx = ReactDOMServer.renderToString(<App />)
  const clientBundleStyle = `<link rel="stylesheet" href="${cdnHost}/styles/bundle.css">`
  // This loads the JS code to “hydrate” the markup with interactivity.
  const clientBundleScript = `<script src="${cdnHost}/scripts/bundle.js"></script>`

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My SSR App</title>
        ${clientBundleStyle}
      </head>
      <body>
        <div id='ssr-app'>${jsx}</div>
        ${clientBundleScript}
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`)
})
```

In the client-side entry point, we will “hydrate” the React component that was SSR-ed into the root DOM container with the ID "ssr-app".

```js
// ./client/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

ReactDOM.hydrate(<App />, document.getElementById('ssr-app'));
```

## Adding File-System Based Routing and Data Fetching
Learn from https://www.youtube.com/watch?v=3RzhNYhjVAw&t=460s
1. server side rendering
2. server side routing
3. fetch data as early as possible (from client `useEffect` to the server before rendering)
4. renderToString vs. renderToPipeableStream

```js
import React from "react";
import express from "express";
// renderToPipeableStream is better
import { renderToString } from "react-dom/server";
import { readdirSync } from "fs";
import { join } from "path";

const app = express();

app.use(express.static("./dist"));

const pages = readdirSync(join(process.cwd(), "pages")).map(
  file => file.split(".")[0]
);

pages.forEach((page) => {
  app.get(`/${page}`, async (req, res) => {
    const mod = await import(`./pages/${page}`);
    // This is why nextjs needs default export
    const Component = mod.default;
     
    let props = {};
    // getServerSideProps
    // Data Fetching (Server-Side) before rendering
    if (mod.gSSP) {
      props = await mod.gSSP(req);
    }
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSR</title>
      </head>
      <body>
        <div id='root'>${renderToString(<Component {...props} />)}</div>
        <script src="/client.js"></script>
      </body>
      </html>
    `)
  });
});

app.listen(3000, () => {
  console.info("App is live on port 3000");
});
```

## Write React Server Components from Scratch
In SSR, JavaScript still needs to be fetched for interactivity which is often achieved via a hydration step. Server-side rendering is generally used for the initial page load, so post-hydration you're unlikely to see it used again.

Before React Server Components, all React components are “client” components — they are all run in the browser. RSC makes it possible for some components to be rendered by the server, and some components to be rendered by the browser. Server Components are not a replacement for SSR, enabling rendering into an intermediate abstraction format without needing to add to the JavaScript bundle. When an RSC needs to be re-rendered, due to state change, it refreshes on the server and seamlessly merges into the existing DOM without a hard refresh.

> What is RSC wire format?  
> The server sends a serialized tree (similar to JSON but with “holes”) to the browser, and the browser can do the work of deserializing it, filling the client placeholders with the actual client components, and rendering the end result.
> 
> Why invent a whole new wire format?   
> The goal on the client is to reconstruct the React element tree. It is much easier to accomplish this from this format than from html, where we’d have to parse the HTML to create the React elements. Note that the reconstruction of the React element tree is important, as this allows us to merge subsequent changes to the React tree with minimal commits to the DOM.

Compare for server side rendering and server components:
- https://github.com/TejasQ/react-server-components-from-scratch/tree/spoild
- https://github.com/TejasQ/makeshift-next.js/tree/spoiled

```jsx
// React Components (used in server-side rendering)
import React from "react";

export const getStuff = async () => {
  return fetch("https://dog.ceo/api/breeds/list/all")
    .then((response) => response.json())
    .then((data) => {
      return Object.keys(data.message);
    });
};

const Breeds = ({ initialBreeds }) => {
  const [breeds, setBreeds] = React.useState(initialBreeds);

  React.useEffect(() => {
    getStuff().then(setBreeds);
  }, []);

  return (
    <ul>
      {breeds.map((breed) => (
        <li key={breed}>
          <a href={`/detail?breed=${breed}`}>{breed}</a>
        </li>
      ))}
    </ul>
  );
};

export default Breeds;

export const gSSP = async () => {
  const data = await getStuff();
  return {
    initialBreeds: data,
  };
};
```

```jsx
// React Server Components, notice the difference from above
import React from "react";

const List = async () => {
  const breeds = await fetch("https://dog.ceo/api/breeds/list/all")
    .then((r) => r.json())
    .then((data) => Object.keys(data.message));

  return (
    <ul>
      {breeds.map((breed) => (
        <li key={breed}>
          <a href={`/detail?breed=${breed}`}>{breed}</a>
        </li>
      ))}
    </ul>
  );
};

export default List;
```

```jsx
app.get("/:path", async (req, res) => {
  const page = await import(
    join(process.cwd(), "dist", "pages", req.params.path)
  );
  const Component = mod.default;
  // `createReactTree` is a method to turn jsx into "a big object" that React can recognize
  // {
  //   $$typeof: Symbol(react.element),
  //   type: "div",
  //   props: { title: "oh my" },
  //   ...
  // }
  // {
  //   $$typeof: Symbol(react.element),
  //   type: MyComponent  // reference to the MyComponent function
  //   props: { children: "oh my" },
  //   ...
  // }
  // 
  // Read https://kexizeroing.github.io/post/react-server-components-from-scratch for more details
  const clientJsx = await createReactTree(
    <Layout bgColor="white">
      <Component {...req.query} />
    </Layout>
  );

  const html = `${renderToString(clientJsx)}
    <script>
    window.__initialMarkup=\`${JSON.stringify(clientJsx, escapeJsx)}\`;
    </script>
    <script src="/client.js" type="module"></script>`;
  res.end(html);
});

const escapeJsx = (key, value) => {
  if (value === Symbol.for("react.element")) {
    return "$";
  }
  return value;
}
```
