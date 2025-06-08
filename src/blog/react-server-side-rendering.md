---
title: "React Server Side Rendering and Server Components"
description: ""
added: "July 8 2023"
tags: [react]
updatedDate: "Jun 8 2025"
---

## Adding Server-Side Rendering
SSR focuses on initial page load, sending pre-rendered HTML to the client that must then be hydrated with downloaded JavaScript before it behaves as a typical React app. SSR also only happens one time: when directly navigating to a page.

Let’s create a simple React component App. We will render this component on the server-side and hydrate it on the client-side. *(The HTML React creates on the server must perfectly match what React tries to create in the browser.)*

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
  const jsx = ReactDOMServer.renderToString(<App initialData={someData} />)
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
        <script>window.__INITIAL_DATA__ = ${JSON.stringify(someData)}</script>
        ${clientBundleScript}
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`)
})
```

> The `window.__INITIAL_DATA__` is used for hydration. When React "hydrates" the server-rendered HTML on the client, it needs the same data that was used on the server. The client doesn't need to re-fetch the same data that the server already used.

In the client-side entry point, we will “hydrate” the React component that was SSR-ed into the root DOM container with the ID "ssr-app".

```js
// ./client/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

ReactDOM.hydrate(<App />, document.getElementById('ssr-app'));
```

It's extremely important that SSR React output (HTML) and CSR React output (HTML) are matching, otherwise React will not be able to render and attach event listeners properly. If you follow semantic HTML principles, most of your app should work even before React has hydrated. Links can be followed, forms can be submitted, accordions can be expanded and collapsed (using `<details>` and `<summary>`). For most projects, it's fine if it takes a few seconds for React to hydrate.

> For Vue server-side rendering, check out https://vuejs.org/guide/scaling-up/ssr.html
>
> Vite provides built-in support for Vue [server-side rendering](https://vite.dev/guide/ssr.html), but it is intentionally low-level *(for library and framework authors)*. If you wish to go directly with Vite, check out [vite-plugin-ssr](https://vite-plugin-ssr.com), a community plugin that abstracts away many challenging details for you.

### Where to deploy
Hosting static resources is extremely cheap. But now, I need to have a server. There are two most common solutions here.

- We can use the serverless functions of the hosting provider that serve the static resources: Cloudflare Workers, Netlify Functions, Vercel Functions, Amazon Lambdas.
- Another option is to keep it as an actual tiny Node server and deploy it to any cloud platform, from AWS to Azure to Digital Ocean.

If it’s deployed as one of the Serverless Functions, then there is a chance that it's not that bad. Some of the providers can run those functions “on Edge.” I.e., those functions are distributed to different servers that are closer to the end user. In this case, the latency will be minimal, and the performance degradation will be minimal.

If, however, I went with the self-managed server, I don’t have the advantages of a distributed network. I’d have to deploy it to one particular region. So, users on the opposite side of the planet from this region have a chance to really feel the impact of the performance degradation.

### React hydration error
While rendering your application, there was a difference between the React tree that was pre-rendered from the server and the React tree that was rendered during the first render in the browser (hydration).

When the React app runs on the client for the first time, it builds up a mental picture of what the DOM should look like, by mounting all of your components. Then it squints at the DOM nodes already on the page, and tries to fit the two together. We're rendering one thing on the server, but then telling React to expect something else on the client.

To avoid issues, we need to ensure that the hydrated app matches the original HTML. When the React app adopts the DOM during hydration, `useEffect` hasn't been called yet, and so we're meeting React's expectation. Immediately after this comparison, we trigger a re-render, and this allows React to do a proper reconciliation. It'll notice that there's some new content to render here.

```tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <>{children}</>
  );
};

export default ClientOnly;
```

> Fix Next.js error: `window` is not defined:
> 1. Keep it as server component, and use `if (typeof window !== 'undefined')` to check first.
> 2. Add `use client` and have a `useEffect` run when mounting the component.
> 3. Use Next `next/dynamic` to dynamic import the component and disable SSR: `dynamic(() => import('./MyComponent'), { ssr: false })`. (use Suspense under the hood)

> Fix Next.js error: Event handlers cannot be passed to client component:  
> You use `<Card onClick={() => console.log(1)} />` to pass a function from the server to the client. The issue here is the function is not serializable. The workaround is to make both of them client components.

`useSyncExternalStore` can be more appropriate if your data exists outside the React tree. It takes in three parameters: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`, and returns the current snapshot of the external data you’re subscribed to. Any changes in the external store will be immediately reflected, and React will re-render the UI based on snapshot changes.

- `subscribe` is a callback that takes in a function that subscribes to the external store data.
- `getSnapshot` is a function that returns the current snapshot of external store data.
- `getServerSnapshot` is an optional parameter that sends you a snapshot of the initial store data. You can use it on the server when generating the HTML or during the initial hydration of the server data.

Note that on the server, React will only call `getServerSnapshot()`. On the client during hydration, it will initially call `getServerSnapshot()`, too — before calling `getSnapshot()`. This ensures that both environments start with the exact same value.

```js
// This is your external "store"
let lastUpdated = new Date()

// A no-op subscription function — tells React we won't update
const emptySubscribe = () => () => {}

function LastUpdated() {
  const date = React.useSyncExternalStore(
    emptySubscribe,
    () => lastUpdated.toLocaleDateString(),
    () => null // safe for server-side render
  )

  return date ? <span>Last updated at: {date}</span> : null
}
```

### Understand the "children pattern"
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

The way to fight this, other than `React.memo`, is to extract `ChildComponent` outside and pass it as children. React "children" is just a prop. When children are passed through props, React doesn't recreate them on each render. The child component's element is created when the JSX is evaluated. Once created, it's just passed down as a prop reference that stays stable across re-renders.

```jsx
// https://www.developerway.com/posts/react-elements-children-parents
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

`React.memo` is a higher order component that accepts another component as a prop. It will only render the component if there is any change in the props. *(Hey React, I know that this component is pure. You don't need to re-render it unless its props change.)*

`useMemo` is used to memoize a calculation result, which focuses on avoiding heavy calculation.

`useCallback` will return a memoized version of the callback that only changes if one of the inputs has changed. This is useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders. Note that `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

```js
const PageMemoized = React.memo(Page);

const App = () => {
  const [state, setState] = useState(1);
  const onClick = useCallback(() => {
    console.log('Do something on click');
  }, []);

  return (
    // will NOT re-render because onClick is memoized
    <PageMemoized onClick={onClick} />
    // WILL re-render because value is not memoized
    <PageMemoized onClick={onClick} value={[1, 2, 3]} />
  );
};
```

> `useCallback` and `useMemo` for props don’t prevent re-renders by themselves. You can probably remove 90% of all `useMemo` and `useCallback` in your app right now, and the app will be fine and might even become slightly faster.

## Add File-System Based Routing and Data Fetching into the server
Learn from https://www.youtube.com/watch?v=3RzhNYhjVAw&t=460s
1. server side rendering
2. file based routing
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
    // getServerSideProps: Data Fetching (Server-Side) before rendering (only works at the page level)
    // export const gSSP = async () => await getStuff();
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

    // replace `res.send` with `renderToPipeableStream` to use React concurrent features
    // const { pipe } = renderToPipeableStream(<Component {...props} />, { ... })
    // pipe(res)
  });
});

app.listen(3000, () => {
  console.info("App is live on port 3000");
});
```

## Write React Server Components from Scratch
Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server.

Before React Server Components, all React components are “client” components — they are all run in the browser. RSC makes it possible for some components to be rendered by the server, and some components to be rendered by the browser. Server Components are not a replacement for SSR. They render exclusively on the server. Their code isn't included in the JS bundle, and so they never hydrate or re-render. With only SSR, we haven't been able to do server-exclusive work within our components (e.g. access database), because that same code would re-run in the browser.

- Server Component: Fetch data; Access backend resources directly; Keep large dependencies on the server.
- Client Component: Add interactivity and event listeners (`onClick()`); Use State and Lifecycle Effects (`useState()`, `useEffect()`); Use browser-only APIs.

A common misconception here is that components with `"use client"` only run in browser. Client components still get pre-rendered to the initial HTML on the server (SSR). The `"use client"` doesn't mean the component is "client only", it means that we send the code for this component to the client and hydrate it.

Also note that wrapping your root layout in the client component does not automatically turn your entire app into a client rendering. The children can stay server components. (It's about the structure of the import, not the rendering.) So if you want to have server components inside a client component, you need to use the children pattern to pass them down.

```jsx
// layout.tsx
return (
  <body>
    <ThemeContextProvider>{children}</ThemeContextProvider>
  </body>
)

// ThemeContext.tsx
"use client";

export default function ThemeContextProvider(
  { children }: { children: React.ReactNode }
) {
  return <div>{children}</div>;
}
```

> What is RSC wire format?  
> The server sends a serialized tree (similar to JSON but with “holes”) to the browser, and the browser can do the work of deserializing it, filling the client placeholders with the actual client components, and rendering the end result. **RSCs don’t output HTML.**
>
> Essentially, we're telling React “Hey, I know you're missing the server component code, but don't worry: here's what it rendered”. We send along the rendered value, the virtual representation that was generated by the server. When React loads on the client, it re-uses that description instead of re-generating it.
>
> How is the Next.js App Router related to Server Components?  
> If a page uses server-side rendering, the page HTML is generated on each request. Next.js used to allow us to do so by using `getServerSideProps`, which will be called by the server on every request.
> 
> Next.js 13.4 introduced the App Router with new features, conventions, and support for React Server Components. Components in the app directory are React Server Components by default. `"use client"` directive used to mark components as Client Components. Server and Client Components can be interleaved in the same component tree, with React handling the merging of both environments.
>
> Currently in Next.js, a route is either fully static or fully dynamic. If you have just one dynamic part, the whole page becomes dynamic. This means slower page loads even when most content could be static. Partial prerendering (https://partialprerendering.com) lets you mix static and dynamic parts in the same route. At build time, Next.js creates static HTML for as much as it can, and dynamic parts get wrapped in React Suspense boundaries. The static parts show up instantly while dynamic parts load.

Compare for server side rendering and server components:
- https://github.com/TejasQ/makeshift-next.js/tree/spoiled
- https://github.com/TejasQ/react-server-components-from-scratch/tree/spoild

```jsx
// This code only runs on the server (and only works at the route level)
export const gSSP = async () => {
  const data = await getStuff();
  return {
    initialBreeds: data,
  };
};
```

```jsx
// React Server Components
// The big difference is that we've never before had a way 
// to run server-exclusive code inside our components (component level).
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

Besides a `<script>` tag that loads up the JS bundle (client components used in our application), we also tells React “Hey, I know you're missing the server components code, but don't worry: here's what it rendered”.

```jsx
app.get("/:path", async (req, res) => {
  const page = await import(
    join(process.cwd(), "dist", "pages", req.params.path)
  );
  const Component = page.default;
  // `createReactTree` is a method to turn jsx into "a big object" that React can recognize
  // {
  //   $$typeof: Symbol("react.element"),
  //   type: "div",  // -> typeof jsx.type === "string"
  //   props: { title: "oh my" },
  //   ...
  // }
  // {
  //   $$typeof: Symbol.for("react.element"),
  //   type: MyComponent  // -> typeof jsx.type === "function"
  //   props: { children: "oh my" },
  //   ...
  // }
  // 
  // https://github.com/TejasQ/react-server-components-from-scratch/blob/spoild/server.tsx#L37
  const clientJsx = await createReactTree(
    <Layout bgColor="white">
      <Component {...req.query} />
    </Layout>
  );

  const html = `${renderToString(clientJsx)}
    <script>
    window.__INITIAL_CLIENT_JSX_STRING__=\`${JSON.stringify(clientJsx, escapeJsx)}\`;
    </script>
    <script src="/client.js" type="module"></script>`;
  res.end(html);
});

const escapeJsx = (key, value) => {
  // A Symbol value doesn't "survive" JSON serialization
  // We're going to substutute `Symbol.for('react.element')` with a special string like "$RE"
  if (value === Symbol.for("react.element")) {
    return "$RE";  // Could be arbitrary. I picked RE for React Element.
  } else if (typeof value === "string" && value.startsWith("$")) {
    // To avoid clashes, prepend an extra $ to any string already starting with $.
    return "$" + value;
  } else {
    return value;
  }
}
```

Note that if we directly send `renderToString(<Component>)` to the client, React will complain *"Error: Objects are not valid as a React child (found: [object Promise])"*. The code doesn't support RSC yet. We need transform JSX into an object that client React can recognize, which the function `createReactTree` does.

```js
async function createReactTree(jsx) {
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
```

> The goal on the client is to reconstruct the React element tree. It is much easier to accomplish this from this format than from html, where we’d have to parse the HTML to create the React elements. Note that the reconstruction of the React element tree is important, as this allows us to merge subsequent changes to the React tree with minimal commits to the DOM.

```js
// We need to hydrate the root with the initial client JSX on the client.
const root = hydrateRoot(document, getInitialClientJSX());

function getInitialClientJSX() {
  const clientJSX = JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, reviveJSX);
  return clientJSX;
}

// On the client, we'll replace "$RE" back with `Symbol.for('react.element')`
function reviveJSX(key, value) {
  if (value === "$RE") {
    return Symbol.for("react.element");
  } else if (typeof value === "string" && value.startsWith("$$")) {
    // This is a string starting with $. Remove the extra $ added by the server.
    return value.slice(1);
  } else {
    return value;
  }
}
```

Must-read articles on React Server Components: 
- https://www.joshwcomeau.com/react/server-components
- https://github.com/reactwg/server-components/discussions/5
- https://vercel.com/blog/understanding-react-server-components
- https://www.youtube.com/watch?v=CvAySC5ex9c

## React Server Actions
React Server Actions allow you to run asynchronous code directly on the server. They eliminate the need to create API endpoints to mutate your data. Instead, you write asynchronous functions that execute on the server and can be invoked from your Client or Server Components. *(Server actions let us put our API endpoint back into the component boundary in the same way that server components let us move `getServerSideProps` into the component boundary.)*

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

Behind the scenes, Server Actions create a POST API endpoint. This is why you don't need to create API endpoints manually when using Server Actions. Server actions are different from regular server-side code. They are specifically designed to be invoked from the client-side, usually through form submissions or other user interactions. If you need to "expose" server functions to the client, you can use `"use server"`.
- Next.js creates a unique identifier for each server action. This identifier links the client-side request to the correct server-side function.
- Next.js automatically generates an API endpoint for each server action. These endpoints are created during the compilation process and are not visible in your codebase. The generated endpoints handle the incoming requests from the client and route them to the corresponding server action. The request includes a special header called "Next-Action" which contains the unique identifier of the server action.
- Server Actions integrate with Next.js' caching and revalidation architecture. `revalidatePath` accepts a relative URL string where it will clear the cache and revalidate the data for that path after a server action.

> *Server Actions have officially been renamed to Server Functions.* Until September 2024, we referred to all Server Functions as “Server Actions”. If a Server Function is passed to an action prop or called from inside an action then it is a Server Action, but not all Server Functions are Server Actions. The naming in this documentation has been updated to reflect that Server Functions can be used for multiple purposes.
