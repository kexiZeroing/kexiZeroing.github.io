---
title: "React 18 Suspense and startTransition"
description: ""
added: "Oct 7 2023"
tags: [react]
updatedDate: "Nov 6 2024"
---

A key property of Concurrent React is that rendering is interruptible. With synchronous rendering, once an update starts rendering, nothing can interrupt it until the user can see the result on screen. In a concurrent render, this is not always the case. React may start rendering an update, pause in the middle, then continue later. It may even abandon an in-progress render altogether.

Concurrent React is opt-in — it’s only enabled when you use a concurrent feature. The new root API in React 18 enables the new concurrent renderer, which allows you to opt-into concurrent features. Continue to read [How to Upgrade to React 18](https://react.dev/blog/2022/03/08/react-18-upgrade-guide).

```js
// Before
import { render } from 'react-dom';
const container = document.getElementById('app');
render(<App tab="home" />, container);

// After
import { createRoot } from 'react-dom/client';
const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App tab="home" />);
```

> The first big win came from upgrading to React 18. The key benefit of this update was concurrent rendering since high-priority tasks like user input can interrupt rendering. This single change improved desktop performance by 46%. The crucial insight is that sometimes framework-level changes can have more impact than local optimizations.

## Transitions
Consider typing in an input field that filters a list of data. Here, whenever the user types a character, we update the input value and use the new value to search the list and show the results. For large screen updates, this can cause lag on the page while everything renders, making typing or other interactions feel slow and unresponsive. Conceptually, there are two different updates that need to happen. The first update is an urgent update, to change the value of the input field. The second, is a less urgent update to show the results of the search.

Until React 18, all updates were rendered urgently. A transition is a new concept in React to distinguish between urgent and non-urgent updates.
- Urgent updates reflect direct interaction, like typing, clicking, pressing, and so on.
- Transition is a "potential future UI state". It's not committed immediately, it's enqueued.

```jsx
import { startTransition } from 'react';

// Urgent: Show what was typed
setInputValue(input);

// Mark any state updates inside as transitions
startTransition(() => {
  // Transition: Show the results
  setSearchQuery(input);
});
```

`startTransition` allows you to mark certain updates in the app as non-urgent, so they are paused while the more urgent updates like clicks or key presses come in. If a transition gets interrupted by the user, React will throw out the stale rendering work that wasn’t finished and render only the latest update. 

By default, React 18 still handles updates as urgent. You can use `startTransition` to wrap any update that you want to move to the background. (If some state update causes a component to suspend, that state update should be wrapped in a transition.)

> How is it different from `setTimeout`?
> 1. `startTransition` is not scheduled for later like `setTimeout` is. The function passed to `startTransition` runs synchronously, but any updates inside of it are marked as “transitions”. React will use this information later when processing the updates to decide how to render the update. This means that we start rendering the update earlier than if it were wrapped in a timeout. 
> 2. If the user is still typing or interacting with the page when the timeout fires, they will still be blocked from interacting with the page. But state updates marked with `startTransition` are interruptible, so they won’t lock up the page.

What if you want to display something on the search results while waiting for the expensive UI render to finish? For this, we can use the `isPending` flag that comes from the `useTransition` hook.

```jsx
function App() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deferredQuery, setDeferredQuery] = useState(query);

  useEffect(() => {
    // Hi React, schedule this function for later
    startTransition(() => {
      setDeferredQuery(query);
    });
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      { isPending ? <Spinner /> : <List q={deferredQuery} /> }
    </div> 
  )
}
```

We can also use `useDeferredValue` for the query used in rendering the list, allowing React to prioritize more urgent input changes over re-rendering the list. `useTransition` returns *isPending* and `useDeferredValue` you can do *value !== deferredValue*.

```jsx
function App() {
  const [query, setQuery] = useState('');
  // Get a deferred version of that value
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
```

If we didn't use `useDeferredValue`, the expensive computation ("List" component here) would run on every keystroke, which could lead to performance issues. By deferring the update of the text value, we ensure that the expensive computation only runs when the text value has stabilized.

## New Suspense Features 
Suspense allows you to render a fallback component while a component is waiting for some asynchronous operations.

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

```js
import { renderToPipeableStream } from 'react-dom/server';

app.use('/', (request, response) => {
  const { pipe } = renderToPipeableStream(<App />, {
    // This points to the JavaScript file used to bootstrap the client-side code.
    bootstrapScripts: ['/main.js'],
    // The `onShellReady` callback fires when the entire shell has been rendered. 
    // The part of your app outside of any `<Suspense>` boundaries is called the shell.
    // By the time `onShellReady` fires, components in nested `<Suspense>` might still be loading data.
    onShellReady() {
      response.setHeader('content-type', 'text/html');
      pipe(response);
    }
  });
});
```

`<Suspense>` allows for server-side HTML streaming and selective hydration on the client:
1. To opt into **streaming HTML** on the server, you’ll need to switch from `renderToString` to the new `renderToPipeableStream` method.
2. To opt into **selective hydration** on the client, you’ll need to switch to `hydrateRoot` on the client and then start wrapping parts of your app with `<Suspense>`.
3. Only Suspense-enabled data sources will activate the Suspense component. Server Components integrate with Suspense out of the box.

> Understand Node stream:  
> The HTTP response object is a writable stream. All streams are instances of `EventEmitter`. They emit events that can be used to read and write data. The `pipe()` function reads data from a readable stream as it becomes available and writes it to a destination writable stream. All that the `pipe` operation does is subscribe to the relevant events on the source and call the relevant functions on the destination. The `pipe` method is the easiest way to consume streams.

### How Suspense works
One of the key benefits of React Suspense is that it lets you render as you fetch. Basically the React Component wrapped in Suspense tags, will start to try to render continuosly and **it expects for a method that throws a new promise** until the original promise is not resolved, that's how it knows that it has to keep rendering the fallback. So you need to pass a resource with a very specific shape, that's why you need a wrapper. Fetching libraries like react-query or SWR will implement the wrapper themselves, so you won't have to care of that part.

```js
// Use Suspense without a 3rd party library
const OuterComponent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataLoader />
    </Suspense>
  );
}

let data;

const DataLoader = () => {
  if (!data) {
    throw fetchUserProfile(userId)
      .then((profile) => { data = profile });
  }

  return <UserProfile data={data} />
}
```

### Streaming in Next.js
Streaming enables you to progressively render UI from the server, which allows you to break down the page's HTML into smaller chunks and progressively send those chunks from the server to the client. This enables parts of the page to be displayed sooner, without waiting for all the data to load before any UI can be rendered. Streaming is built into the Next.js App Router by default.

```tsx
import { Suspense } from 'react'
import { PostFeed, Weather } from './Components'
 
export default function Posts() {
  return (
    <section>
      <Suspense fallback={<p>Loading feed...</p>}>
        <PostFeed />
      </Suspense>
      <Suspense fallback={<p>Loading weather...</p>}>
        <Weather />
      </Suspense>
    </section>
  )
}
```

## Suspense and `startTransition`
These two APIs are designed for different use cases and can absolutely be used together. Read from https://github.com/reactwg/react-18/discussions/94

When a component suspends, the closest parent Suspense boundary switches to showing the fallback. This can lead to a jarring user experience if it was already displaying some content. To prevent the whole site layout got replaced by `BigSpinner`, you can mark the navigation state update as a transition with `startTransition`. This tells React that the state transition is not urgent, and it’s better to keep showing the previous page instead of hiding any already revealed content.

```jsx
export default function App() {
  return (
    <Suspense fallback={<BigSpinner />}>
      <Router />
    </Suspense>
  );
}

function Router() {
  const [page, setPage] = useState('/');

  function navigate(url) {
    startTransition(() => {
      setPage(url);
    });
  }

  let content;
  if (page === '/') {
    content = (
      <IndexPage navigate={navigate} />
    );
  } else if (page === '/the-beatles') {
    content = (
      <ArtistPage artist={{ id: 'the-beatles' }} />
    );
  }
  return (
    <Layout>
      {content}
    </Layout>
  );
}

function BigSpinner() {
  return <h2>Loading...</h2>;
}
```

- When you initially load data on an unloaded page (ex. navigating to a new page). Suspense is a way to specify fallbacks instead of content, so it should used in this case.
- When you load new data on a page that has already loaded (ex. tab navigations). In this case, it's bad to hide something the user has already seen. In this case, `startTransition` lets you show a pending indicator until that render completes, and avoid retriggering Suspense boundaries.

> **Render-as-you-fetch** is a pattern that lets you start fetching the data you will need at the same time you start rendering the component using that data. Used along with `Suspense`, the data call is made while the component is being rendered. While the data is being loaded the component is in a suspended state and `Suspense` is used to show a fallback UI.

### `useOptimistic` use case
When the app is settled, the server is their source of truth. Whenever the server responds with a page, the checkboxes should reflect the URL that was used to generate that page. When the app is transitioning, the client is their source of truth. If we press a checkbox and trigger a server-side refresh, the client should immediately reflect our press while the app is preparing the next page.

This is exactly what `useOptimistic` was designed for. It gives you some local React state that's seeded with server-side data, but lets you make temporary changes while your app is transitioning. Once all pending transitions settle, `useOptimistic` automatically discards any changes you made, and resets its value to the latest version of your server-side data.

```js
// 
// 1. `optimisticState` is the resulting optimistic state. It is equal to state
// unless an action is pending, in which case it is equal to the value returned by `updateFn`.
// 2. `addOptimistic` is the dispatching function to call when you have an optimistic update, 
// it takes one argument `optimisticValue`, and will call the `updateFn`.
const [optimisticState, addOptimistic] = useOptimistic(
  // the value to be returned initially
  state,
  // updateFn
  (currentState, optimisticValue) => {
    // merge and return new state
    // with optimistic value
  }
);
```

```jsx
// https://buildui.com/posts/instant-search-params-with-react-server-components
export default function GenresPanel({ genres }: { genres: string[] }) {
  let [optimisticGenres, setOptimisticGenres] = useOptimistic(genres);
  let [isPending, startTransition] = useTransition();
  let router = useRouter();

  return (
    <>
      <input
        name={genre}
        type="checkbox"
        checked={optimisticGenres.includes(genre)}
        onChange={(e) => {
          let { name, checked } = e.target;
          let newGenres = checked
            ? [...optimisticGenres, name]
            : optimisticGenres.filter((g) => g !== name);

          let newParams = new URLSearchParams(
            newGenres.map((genre) => ["genre", genre])
          );

          startTransition(() => {
            setOptimisticGenres(newGenres);
            router.push(`?${newParams}`);
          });
        }}
      />
    </>
  );
}
```