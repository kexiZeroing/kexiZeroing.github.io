---
layout: "../layouts/BlogPost.astro"
title: "React Server Side Rendering"
slug: react-server-side-rendering
description: ""
added: "July 8 2023"
tags: [react]
updatedDate: "Jan 13 2024"
---

## Adding Server-Side Rendering
With SSR, you render your JS on the server into HTML. You serve that HTML to your client so it appears to have fast startup. But you still have to wait for your JS to reach the user before anything can be interactive (hydration). React will render your component tree in memory, but instead of generating DOM nodes for it, it will attach all the logic to the existing HTML. After hydration, SSR can't be used again - it's typically only used for initial loads.

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

> It's extremely important that SSR React output (HTML) and CSR React output (HTML) are matching, otherwise React will not be able to render and attach event listeners properly.
> 
> If you follow semantic HTML principles, most of your app should work even before React has hydrated. Links can be followed, forms can be submitted, accordions can be expanded and collapsed (using `<details>` and `<summary>`). For most projects, it's fine if it takes a few seconds for React to hydrate.

### React hydration error
While rendering your application, there was a difference between the React tree that was pre-rendered from the server and the React tree that was rendered during the first render in the browser (hydration).

When the React app runs on the client for the first time, it builds up a mental picture of what the DOM should look like, by mounting all of your components. Then it squints at the DOM nodes already on the page, and tries to fit the two together. By rendering something different depending on whether we're within the server-side render or not, we're hacking the system. We're rendering one thing on the server, but then telling React to expect something else on the client.

To avoid issues, we need to ensure that the hydrated app matches the original HTML. When the React app adopts the DOM during hydration, `useEffect` hasn't been called yet, and so we're meeting React's expectation. (And immediately after this comparison, we trigger a re-render, and this allows React to do a proper reconciliation. It'll notice that there's some new content to render here.)

```tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  // `useEffect` doesn't run during SSR. It runs until the JavaScript is downloaded.
  useEffect(() => {
    setHasMounted(true);
  }, [])

  if (!hasMounted) return null;

  return (
    <>
      {children}
    </>
  );
};

export default ClientOnly;
```

The above code also helps solve the error: "`window` is not defined" in the client component (i.e. render `{ window.navigator.platform }`). You can move the `window` to `useEffect` to access it.

### Understand the "children pattern" from Developer Way
React components re-render themselves and all their children when the state is updated. In this case, on every mouse move the state of `MovingComponent` is updated, its re-render is triggered, and as a result, `ChildComponent` will re-render as well.

```jsx
const MovingComponent = () => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div
      onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })}
      style={{ left: state.x, top: state.y }}
    >
      <ChildComponent />
    </div>
  );
};
```

The way to fight this, other than `React.memo`, is to extract `ChildComponent` outside and pass it as children. React "children" is just a prop. Components passed as children don’t re-render since they are just props.

```jsx
const MovingComponent = ({ children }) => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div
      onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })}
      style={{ left: state.x, top: state.y }}>
      // children now will not be re-rendered!
      {children}
    </div>
  );
};

const SomeOutsideComponent = () => {
  return (
    <MovingComponent>
      <ChildComponent />
    </MovingComponent>
  );
};
```

React Element is nothing more than syntax sugar for a function `React.createElement` that returns an object. If the Parent component re-renders, the content of the `child` constant will be re-created from scratch, which is fine and super cheap since it’s just an object. And this is what allows memoization to work: the object will not be re-created, React will think that it doesn’t need updating, and Child’s re-render won’t happen.

```jsx
const ChildMemo = React.memo(Child);

const Parent = () => {
  const child = <ChildMemo />;

  return <div>{child}</div>;
};
```

```jsx
const Parent = () => {
  const child = useMemo(() => <Child />, []);

  return <div>{child}</div>;
};
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
Before React Server Components, all React components are “client” components — they are all run in the browser. RSC makes it possible for some components to be rendered by the server, and some components to be rendered by the browser. Server Components are not a replacement for SSR. They render exclusively on the server. Their code isn't included in the JS bundle, and so they never hydrate or re-render.

- Server Component: Fetch data; Access backend resources directly; Keep large dependencies on the server.
- Client Component: Add interactivity and event listeners (`onClick()`); Use State and Lifecycle Effects (`useState()`, `useEffect()`); Use browser-only APIs.

A common misconception here is that components with `"use client"` only run in browser. Client components still get pre-rendered to the initial HTML on the server (SSR). The `"use client"` doesn't mean the component is "client only", it means that we send the code for this component to the client and hydrate it.

> What is RSC wire format?  
> The server sends a serialized tree (similar to JSON but with “holes”) to the browser, and the browser can do the work of deserializing it, filling the client placeholders with the actual client components, and rendering the end result.
>
> Essentially, we're telling React “Hey, I know you're missing the server component code, but don't worry: here's what it rendered”. We send along the rendered value, the virtual representation that was generated by the server. When React loads on the client, it re-uses that description instead of re-generating it.
> 
> Why invent a whole new wire format?   
> The goal on the client is to reconstruct the React element tree. It is much easier to accomplish this from this format than from html, where we’d have to parse the HTML to create the React elements. Note that the reconstruction of the React element tree is important, as this allows us to merge subsequent changes to the React tree with minimal commits to the DOM.
>
> How is the Next.js App Router related to Server Components?
> Next.js 13+ introduced the App Router with new features, conventions, and support for React Server Components. Components in the app directory are React Server Components by default. `"use client"` directive used to mark components as Client Components. Server and Client Components can be interleaved in the same component tree, with React handling the merging of both environments.

Compare for server side rendering and server components:
- https://github.com/TejasQ/makeshift-next.js/tree/spoiled
- https://github.com/TejasQ/react-server-components-from-scratch/tree/spoild
- https://www.joshwcomeau.com/react/server-components

If a page uses server-side rendering, the page HTML is generated on each request. Next.js used to allow us to do so by using `getServerSideProps`, which will be called by the server on every request *(only works at the route level)*. Next.js 13.4 with the "App Router" has a transformative shift for the core of the framework, watch the [talk](https://www.youtube.com/watch?v=5HaX0Q_Do1I) by Lee Robinson.

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

// This code runs on the server and on the client
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

// This code only runs on the server
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
  // https://github.com/TejasQ/react-server-components-from-scratch
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

## What are Server Actions
React Server Actions allow you to run asynchronous code directly on the server. They eliminate the need to create API endpoints to mutate your data. Instead, you write asynchronous functions that execute on the server and can be invoked from your Client or Server Components.

An advantage of invoking a Server Action within a Server Component is progressive enhancement - forms work even if JavaScript is disabled on the client.

```js
// Server Component
export default function Page() {
  async function create(formData: FormData) {
    'use server';
 
    // Logic to mutate data...
  }
 
  return <form action={create}>...</form>;
}
```

Behind the scenes, Server Actions create a POST API endpoint. This is why you don't need to create API endpoints manually when using Server Actions. *(Server actions let us put our API endpoint back into the component boundary in the same way that server components let us move `getServerSideProps` into the component boundary.)*
