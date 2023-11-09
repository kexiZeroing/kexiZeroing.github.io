---
layout: "../layouts/BlogPost.astro"
title: "React 18 Suspense and startTransition"
slug: react-18-suspense-transition
description: ""
added: "Oct 7 2023"
tags: [react]
updatedDate: "Nov 9 2023"
---

A key property of Concurrent React is that rendering is interruptible. With synchronous rendering, once an update starts rendering, nothing can interrupt it until the user can see the result on screen. In a concurrent render, this is not always the case. React may start rendering an update, pause in the middle, then continue later. It may even abandon an in-progress render altogether.

React guarantees that the UI will appear consistent even if a render is interrupted. To do this, it waits to perform DOM mutations until the end, once the entire tree has been evaluated. With this capability, React can prepare new screens in the background without blocking the main thread. This means the UI can respond immediately to user input even if it’s in the middle of a large rendering task, creating a fluid user experience.

Concurrent React is opt-in — it’s only enabled when you use a concurrent feature. you can gradually start adding concurrent features at your own pace.

> The new root API in React 18 enables the new concurrent renderer, which allows you to opt-into concurrent features. Continue to read [How to Upgrade to React 18](https://react.dev/blog/2022/03/08/react-18-upgrade-guide).

## Transitions
Consider typing in an input field that filters a list of data. Here, whenever the user types a character, we update the input value and use the new value to search the list and show the results. For large screen updates, this can cause lag on the page while everything renders, making typing or other interactions feel slow and unresponsive. Conceptually, there are two different updates that need to happen. The first update is an urgent update, to change the value of the input field. The second, is a less urgent update to show the results of the search.

Until React 18, all updates were rendered urgently. A transition is a new concept in React to distinguish between urgent and non-urgent updates.
- Urgent updates reflect direct interaction, like typing, clicking, pressing, and so on.
- Transition updates transition the UI from one view to another.

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
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

{isPending && <Spinner />}
```

## New Suspense Features 
Suspense allows you to render a fallback component while a component is waiting for some asynchronous operations.

Suspense (React 16) on the client. It would throw an error when used in SSR. Suspense and code-splitting using `React.lazy` were not compatible with SSR, until React 18.
```jsx
import React, { lazy, Suspense } from 'react';

const LazyComments = lazy(() => import('./Comments'));

const Component = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComments />
  </Suspense>
);
```

React 18 lets you use `<Suspense>` to break down your app into smaller independent units. As a result, your app’s users will see the content sooner and be able to start interacting with it much faster. This also means that `React.lazy` "just works" with SSR now. Read "New Suspense SSR Architecture in React 18": https://github.com/reactwg/react-18/discussions/37

1. To opt into streaming HTML on the server, you’ll need to switch from `renderToString` to the new `renderToPipeableStream` method.
2. Only Suspense-enabled data sources will activate the Suspense component. (Data fetching with Suspense-enabled frameworks like Next.js; Lazy-loading component code with `lazy`)
3. Suspense does not detect when data is fetched inside an Effect or event handler.

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