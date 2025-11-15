---
title: "React 18 Suspense and startTransition"
description: ""
added: "Oct 7 2023"
tags: [react]
updatedDate: "July 17 2025"
---

**Concurrent React** is a new feature introduced in React 18 that changes how React handles rendering and updates. A key property of Concurrent React is that rendering is interruptible. With synchronous rendering, once an update starts rendering, nothing can interrupt it until the user can see the result on screen. In a concurrent render, React may start rendering an update, pause in the middle, then continue later. It may even abandon an in-progress render altogether.

> Fiber architecture allows using double buffering. You have two buffers of the current state and next state, and you can either throw away the next state if a higher priority update comes in or you can switch the current state to the next state seamlessly.

## New Root API
Concurrent React is opt-in — it’s only enabled when you use a concurrent feature. The new root API in React 18 enables the new concurrent renderer, which allows you to opt-into concurrent features. 

```js
// Before
import { render } from 'react-dom';
const container = document.getElementById('app');
render(<App />, container);

// After
import { createRoot } from 'react-dom/client';
const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
```

```js
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);
```

## Automatic Batching
Before React 18, updates outside events were not batched. This meant that React updated the DOM immediately after each state change. Multiple state updates within a single event cycle would cause multiple, unnecessary re-renders, affecting the application's responsiveness.

```js
// React 17
const handleUpdate = () => {
  setCount(count + 1); // First update
  setFlag(!flag);      // Second update
  // In pre-batching React, this would cause two separate re-renders
};
```

React 18 introduced automatic batching to prevent these issues. Batching means that React groups multiple state updates into a single re-render cycle. This approach ensures that the UI is updated efficiently, reflecting all state changes in one go.

`flushSync` allows you to opt-out of batching for specific updates, forcing them to be processed immediately. This will instruct React to update the DOM synchronously right after the code wrapped in `flushSync` executes. *(But, use it carefully and not too much, because using it too often can cancel out the performance advantages of batching.)*

```js
import { flushSync } from "react-dom";

const handleClick = () => {
  flushSync(() => {
    setCount(count + 1); // Triggers an immediate re-render
  });
  setFlag(!flag); // Queued state update
};
```

## Transitions
Consider typing in an input field that filters a list of data. Here, whenever the user types a character, we update the input value and use the new value to search the list and show the results. For huge data updates, this can cause lag on the page while everything renders, making typing or other interactions feel slow and unresponsive. Conceptually, there are two different updates that need to happen. The first update is an urgent update, to change the value of the input field. The second, is a less urgent update to show the results of the search.

Until React 18, all updates were rendered urgently. A transition is a new concept in React to distinguish between urgent and non-urgent updates.
- Urgent updates reflect direct interaction, like typing, clicking, pressing, and so on.
- Transition is a "potential future UI state". It's not committed immediately, it's enqueued.

```jsx
import { startTransition } from 'react';

// Urgent: Show what was typed
setInputValue(input);

// Mark any unurgent state updates inside as transitions
startTransition(() => {
  setSearchQuery(input);
});
```

`startTransition` allows you to mark certain updates in the app as non-urgent, so they are paused while the more urgent updates like clicks or key presses come in. If a transition gets interrupted by the user, React will throw out the stale rendering work that wasn’t finished and render only the latest update. *The function passed to `startTransition` is called an “Action”.*

> How is it different from `setTimeout`?
> 1. `startTransition` is not scheduled for later like `setTimeout` is. The function passed to `startTransition` runs synchronously, but any updates inside of it are marked as “transitions”. React will use this information later when processing the updates to decide how to render the update. This means that we start rendering the update earlier than if it were wrapped in a timeout. 
> 2. If the user is still typing or interacting with the page when the timeout fires, they will still be blocked from interacting with the page. But state updates marked with `startTransition` are interruptible, so they won’t lock up the page.

The function you pass to `startTransition` does not get delayed. React executes your function immediately. However, any state updates scheduled while it is running are marked as transition (low-priority) updates, they don’t flush immediately. React can wait to apply them until either the browser has time, or a higher-priority update (like user input, navigation) triggers a render pass.

```js
let isInsideTransition = false;

function startTransition(scope) {
  isInsideTransition = true;
  scope();
  isInsideTransition = false;
}

function setState() {
  if (isInsideTransition) {
    // ... schedule a Transition state update ...
  } else {
    // ... schedule an urgent state update ...
  }
}
```

Note that when you use `await` inside a `startTransition` function, the state updates that happen after the `await` are not marked as Transitions. You must wrap state updates after each `await` in a `startTransition` call:

```js
startTransition(async () => {
  await someAsyncFunction();
  startTransition(() => {
    setPage('/about');
  });
});
```

What if you want to display something on the search results while waiting for the expensive UI render to finish? For this, we can use the `isPending` flag that comes from the `useTransition` hook.

```jsx
function App() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deferredQuery, setDeferredQuery] = useState(query);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    startTransition(() => {
      setDeferredQuery(newQuery);
    });
  };

  return (
    <div>
      <input type="text" value={query} onChange={handleChange} />
      {/* isPending remains true until the component re-renders with the new deferred value */}
      { isPending ? <Spinner /> : <List q={deferredQuery} /> }
    </div> 
  )
}
```

We can also use `useDeferredValue` for the query used in rendering the list, allowing React to prioritize more urgent input changes over re-rendering the list. During updates, React will first attempt a re-render with the old value, and then try another re-render in the background with the new value.

`useTransition` returns *isPending* and `useDeferredValue` you can check if *value !== deferredValue*.

```jsx
function App() {
  const [query, setQuery] = useState('');
  // It lets you defer updating a part of the UI
  // Users don't notice the deferral because urgent UI stays responsive
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      { query !== deferredQuery ? <Spinner /> : <List q={deferredQuery} /> }
    </div> 
  )
}

// never rerender the list unless the query changes
const List = React.memo(({ q }) => {
  /* filter the list based on the query */
})
```

## Suspense on the server
Suspense allows you to render a fallback component while a component is waiting for some asynchronous operations. With React 18, Suspense can be used on the server.

Suspense is used on the client in React 16, but it would throw an error when used in SSR. Suspense and code-splitting using `React.lazy` were not compatible with SSR, until React 18.

```jsx
import React, { lazy, Suspense } from 'react';

const LazyComments = lazy(() => import('./Comments'));

const Component = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComments />
  </Suspense>
);
```

SSR lets you render your React components on the server into HTML and send it to the user. It's useful because it lets users with worse connections start reading or looking at the content while JavaScript is loading. The problem with SSR today is a “waterfall”: fetch data (server) → render to HTML (server) → load code (client) → hydrate (client). Neither of the stages can start until the previous stage has finished. This is why it’s inefficient. To solve this, React created Suspense.

React 18 includes architectural improvements to React SSR performance *(with `renderToPipeableStream` and `<Suspense>`)*. It lets you use `<Suspense>` to break down your app into smaller independent units. As a result, your app’s users will see the content sooner and be able to start interacting with it much faster. When the data for a component is ready on the server, React will send additional HTML into the same stream, as well as a minimal inline `<script>` tag to put that HTML in the “right place”. Read "New Suspense SSR Architecture in React 18": https://github.com/reactwg/react-18/discussions/37

`<Suspense>` allows for server-side HTML streaming and selective hydration on the client:
1. To opt into **streaming HTML** on the server, you’ll need to switch from `renderToString` to the new `renderToPipeableStream` method.
2. To opt into **selective hydration** on the client, you’ll need to switch to `hydrateRoot` on the client and then start wrapping parts of your app with `<Suspense>`.

## Suspense and `startTransition`
These two APIs are designed for different use cases and can absolutely be used together. Read from https://github.com/reactwg/react-18/discussions/94

- When you initially load data on an unloaded page (ex. navigating to a new page). Suspense is a way to specify fallbacks instead of content, so it should used in this case.
- When you load new data on a page that has already loaded (ex. tab navigations). In this case, it's bad to hide something the user has already seen. In this case, `startTransition` lets you show a pending indicator until that render completes, and avoid retriggering Suspense boundaries.

```jsx
import { Suspense, useState, startTransition, useTransition } from 'react';

function Router() {
  const [page, setPage] = useState('/');
  const [isPending, startTransition] = useTransition();

  function navigate(url) {
    startTransition(() => {
      setPage(url);
    });
  }

  let content;
  if (page === '/') {
    content = (
      <Suspense fallback={<h2>Loading page...</h2>}>
        <IndexPage navigate={navigate} />
      </Suspense>
    );
  } else if (page === '/the-beatles') {
    content = (
      <Suspense fallback={<h2>Loading page...</h2>}>
        <ArtistPage artist={{ id: 'the-beatles' }} />
      </Suspense>
    );
  }

  return (
    <Layout>
      {isPending && <div style={{ opacity: 0.7 }}>Loading...</div>}
      {content}
    </Layout>
  );
}
```

## New API `useId` and `useSyncExternalStore`
The `useId` hook is used to generate unique IDs for elements within a component. This is particularly useful for accessibility purposes, such as linking form inputs with their labels. It ensures that IDs are unique across the entire application, even if the component is rendered multiple times.

> Do not call `useId` to generate keys in a list:
> 
> The point of keys is that it uniquely identifies your item in the list - so when you move it down or up it still has the same id as it had in the other place. You don't get that with `useId`, and you don't get that using index.

Sometimes you have data that lives outside of React - like browser APIs, third-party libraries, or global state managers. React doesn't automatically know when this external data changes, so your components won't re-render when they should. `useSyncExternalStore` is essentially **a notification system that bridges React and external data**. It tells React "Hey, this external thing changed, you should re-render!" In response, React says "I can't track external data myself, so help me by telling me when it changes. I'll make sure your UI stays in sync and give you the current value of that external data to use in your component."

`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`:
- `subscribe` ia a function that takes a single `callback` argument and subscribes it to the store. It should return a cleanup function.
- `getSnapshot` is a function that returns the current value of external store data.
- `getServerSnapshot` is an optional parameter that sends you a snapshot of the initial store data. Used for server-side rendering to avoid hydration mismatches.

The `callback` is React's way of saying "call me when something changes so I can re-render the component."
1. React calls your subscribe function and passes in a callback function
2. You set up event listeners that will call this callback when data changes
3. When external data changes, your event listener calls the callback
4. React receives the callback call and knows to re-render the component

```js
import { useSyncExternalStore } from 'react';

function useWindowWidth() {
  return useSyncExternalStore(
    // subscribe: "Tell me when window resizes"
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    
    // getSnapshot: "What's the current width?"
    () => window.innerWidth,
  );
}

function MyComponent() {
  const width = useWindowWidth();
  return <div>Window width: {width}px</div>;
}
```

## How to fetch data in React
> **Render-as-you-fetch** is a pattern that lets you start fetching the data you will need at the same time you start rendering the component using that data. Used along with `Suspense`, the data call is made while the component is being rendered.
>
> For SPA, "download the JS files -> initializing React -> starting to render React tree, CALLING THE ROUTE LOADERS": We can do it today with React Router v7 and Tanstack Router.

1. React Server Components (server-side data fetching)
    ```jsx
    const PostsPage = async () => {
      const posts = await getPosts();

      return (
        <ul>
          {posts?.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    };
    ```

2. React Suspense is a feature that allows you to suspend the rendering of a component until some asynchronous operation is done.
    ```jsx
    const PostsPage = () => {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <PostList />
        </Suspense>
      );
    };

    const PostList = async () => {
      const posts = await getPosts();

      return (
        <ul>
          {posts?.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    }
    ```

3. When it comes to CSR React applications (i.e. SPAs), the most recommended way to fetch data is by using a library like React Query.
    ```jsx
    "use client";

    const PostsPage = () => {
      const { data: posts } = useQuery({
        queryKey: ["posts"],
        queryFn: getPosts,
      });

      return (
        <ul>
          {posts?.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    };
    ```

4. Combine React Server Components and client-side data fetching with React Query. You want to fetch initial data on the server-side and then use React Query for continued client-side data fetching.
    ```jsx
    const PostsPage = async () => {
      const posts = await getPosts();

      return (
        <div>
          <PostList initialPosts={posts} />
        </div>
      );
    };
    ```

    ```jsx
    "use client";

    const PostList = ({ initialPosts }: PostListProps) => {
      const { data: posts } = useQuery({
        queryKey: ["posts"],
        queryFn: getPosts,
        initialData: initialPosts,
      });

      return (
        <ul>
          {posts?.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    };
    ```

5. React's `use()` API. It allows you to pass a Promise from a Server Component to a Client Component and resolve it in the Client Component.
    ```jsx
    const PostsPage = () => {
      const postsPromise = getPosts();

      return (
        <Suspense>
          <PostList promisedPosts={postsPromise} />
        </Suspense>
      );
    };
    ```

    ```jsx
    "use client";

    const PostList = ({ promisedPosts }: PostListProps) => {
      // this will suspend the component and stream data as well
      const posts = use(promisedPosts);

      return (
        <ul>
          {posts?.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      );
    };
    ```

Read https://nextjs.org/docs/app/getting-started/fetching-data to learn fetch data in Server and Client Components, and how to stream components that depend on data.
