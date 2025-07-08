---
title: "React hooks clone and related concepts"
description: ""
added: "Sep 12 2020"
tags: [react]
updatedDate: "May 5 2025"
---

### Getting Closure on Hooks presented by @swyx
```js
// https://www.youtube.com/watch?v=KJP1E-Y-xyo
const React = (function() {
  let hooks = [];
  let idx = 0;

  function useState(initVal) {
    const state = hooks[idx] || initVal;
    const _idx = idx;
    const setState = newVal => {
      hooks[_idx] = newVal;
    };
    idx++;
    return [state, setState];
  }

  function useEffect(cb, depArray) {
    const oldDeps = hooks[idx];
    let hasChanged = true;

    if(oldDeps) {
      hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
    }
    if(hasChanged) cb();
    hooks[idx] = depArray;
    idx++;
  }

  function render(Component) {
    idx = 0;
    const C = Component();
    C.render();
    return C;
  }

  return { useState, useEffect, render };
})();

function Component() {
  const [count, setCount] = React.useState(1);
  const [text, setText] = React.useState('apple');
  
  React.useEffect(() => {
    console.log('useEffect with count dep')
  }, [count]);
  
  React.useEffect(() => {
    console.log('useEffect empty dep')
  }, []);

  React.useEffect(() => {
    console.log('useEffect no dep')
  });

  return {
    render: () => console.log({count, text}),
    click: () => setCount(count + 1),
    type: word => setText(word)
  }
}

var App = React.render(Component);
App.click();
var App = React.render(Component);
App.type('pear');
var App = React.render(Component);

/*
  useEffect with count dep
  useEffect empty dep
  useEffect no dep
  {count: 1, text: "apple"} 

  useEffect with count dep
  useEffect no dep
  {count: 2, text: "apple"}

  useEffect no dep
  {count: 2, text: "pear"}`
*/
```

### How reconciliation works
If we had two components of the same type:

```jsx
{isEditing ? (
  <input
    type="text"
    placeholder="Enter your name"
    className="edit-input"
  />
) : (
  <input
    type="text"
    placeholder="Enter your name"
    disabled
    className="view-input"
  />
)}
```

React preserves the DOM element and its state because both elements are of the same type (`input`) at the same position in the element tree. React simply updates the props of the existing element rather than recreating it.

Note that here React still re-renders the component, but the DOM node for the `<input>` is preserved (not re-created). **"DOM reuse" is not equivalent to "component render skip"** — you can render a component again, and still reuse DOM nodes.

Read this article: https://cekrem.github.io/posts/react-reconciliation-deep-dive

### What is Fiber
React Fiber was introduced in React 16, which is a reimplementation of React's core algorithm. At it's core, Fiber is a JavaScript object that represents a unit of work. It's a lightweight representation of a component tree that React can work on.

React processes Fibers and when done, it commits the changes to the DOM. This happens in two phases:

1. **Render phase:** During this phase, React does asynchronous work behind the scenes. It processes all Fibers. Because it happens asynchronously, work can be prioritized, paused, resumed, and aborted. Internal functions like `beginWork()` and `completeWork()` are called during this process.

2. **Commit phase:** Once the render phase is complete, React commits the changes to the DOM by calling `commitWork()`. This is synchronous and can't be interrupted.

Fiber nodes are organized in a tree structure that mirrors the component tree. Each Fiber has a reference to its parent, child, and sibling Fibers. This allows React to traverse the tree efficiently and perform updates.

When React starts rendering, it creates a work-in-progress tree that mirrors the current tree. As React processes the work, it updates the work-in-progress tree. Once the work is complete, React swaps the current tree with the work-in-progress tree.

```js
// React's Commit Phase
// This runs on the main thread
function commitToDOM() {
 // React calls DOM APIs
 // Each call gets added to the call stack
 mutateDOM() {
   document.createElement()
   element.setAttribute()
   element.appendChild()
   // ...
 }

 // remember useLayoutEffect?
 // Now we'll run all the layout effects
 // this is synchronous
 // the code in here gets added to the call stack too
 runLayoutEffects()

 // Queue useEffect for later
 queueMicrotask(() => {
   runEffects()
 })
}
```

### You Might Not Need an Effect
> Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and re-read the page about why you don't need an effect. You really don't. -@TkDodo

When developing an application in React 18+, you may encounter an issue where the `useEffect` hook is being run twice on mount. This occurs because since React 18, when you are in development, your application is being run in StrictMode by default. In Strict Mode, React will try to simulate the behavior of mounting, unmounting, and remounting a component to help developers uncover bugs during testing. *From the user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, and then pressing Back. React verifies that your components don’t break this principle by remounting them once in development.* In most cases, it should be fine to leave your code as-is, since the `useEffect` will only run once in production.

- https://react.dev/learn/you-might-not-need-an-effect
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect

### Referencing values with `ref`s
When you want a component to “remember” some information, but you don’t want that information to trigger new renders, you can use a `ref`. Typically, you will use a ref when your component needs to “step outside” React and communicate with external APIs. (e.g. storing timeout IDs, DOM elements)

- Refs are an escape hatch to hold onto values that aren’t used for rendering. You won’t need them often.
- A ref is a plain JavaScript object with a single property called `current`, which you can read or set.
- You can ask React to give you a ref by calling the `useRef` Hook.
- Like state, refs let you retain information between re-renders of a component.
- Unlike state, setting the ref’s current value does not trigger a re-render.

```js
import React, { useState, useEffect, useRef } from 'react';

function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <p>Current count: {count}</p>
      <p>Previous count: {previousCount}</p>
    </div>
  );
}
```

The key to understanding this hook is realizing there's a timing difference. When your component renders, the hook returns the current value of `ref.current`. After rendering, the effect runs and updates `ref.current` to the new value. On the next render, `ref.current` contains what was the value in the previous render.

#### `ref` callback function
Instead of a ref object, you may pass a function to the ref attribute. When the `<div>` DOM node is added to the screen, React will call your `ref` callback with the DOM node as the argument. When that `<div>` DOM node is removed, React will call your `ref` callback with null. React will also call your `ref` callback whenever you pass a different `ref` callback.

- Called immediately when the element is attached to the DOM. 
- It runs before `useLayoutEffect`.
- It's best for immediate DOM measurements or setup.

```tsx
const scroller = (node: HTMLDivElement | null) => {
  node?.scrollIntoView({ behavior: "smooth" });
};

const ChatWindow = () => {
  return (
    <>
      {Array.from(Array(100).keys()).map((e) => (
        <div key={e}>Chat message: {e}</div>
      ))}
      <div ref={scroller} />
    </>
  );
};
```

So if you need to interact with DOM nodes directly after they rendered, try not to jump to `useRef` + `useEffect` directly, but consider using [callback refs](https://tkdodo.eu/blog/ref-callbacks-react-19-and-the-compiler) instead.

#### `ref` as a prop in React 19
In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead.

```jsx
export default function SearchInput({ inputRef }) {
  return <input ref={inputRef} />;
}

export default function App() {
  const inputRef = React.useRef();
  return (
    <>
      <SearchInput inputRef={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

### batching and flushSync in rendering
In early versions (React 17 and earlier), React updated the DOM immediately after each state change. Multiple state updates within a single event cycle would cause multiple, unnecessary re-renders, affecting the application's responsiveness.

```js
// React 17
const handleUpdate = () => {
  setCount(count + 1); // First update
  setFlag(!flag);      // Second update
  // In pre-batching React, this would cause two separate re-renders
};
```

React 18 introduced batching to prevent these issues. Batching means that React groups multiple state updates into a single re-render cycle. This approach ensures that the UI is updated efficiently, reflecting all state changes in one go.

`flushSync` allows you to opt-out of batching for specific updates, forcing them to be processed immediately. This ensures that critical updates are executed in the correct order, even within a batched state update cycle. *(But, use it carefully and not too much, because using it too often can cancel out the performance advantages of batching.)*

```js
import { flushSync } from "react-dom";

const handleClick = () => {
  flushSync(() => {
    setCount(count + 1); // Triggers an immediate re-render
  });
  setFlag(!flag); // Queued state update
};
```

### Higher Order Components
HOCs are wrapper components that help provide additional functionality to existing components. While hooks probably replaced most of shared logic concerns, there are still use cases where higher-order components could be useful. For example, you want to fire analytics event on every click of every button, dropdown and link everywhere.

```js
export const withLoggingOnClick = (Component) => {
  return (props) => {
    const log = useLoggingFromSomewhere();

    const onClick = () => {
      // console.info('Log on click something');
      log('Log on click something');
      props.onClick();
    };

    // return original component with all the props
    // and overriding onClick with our own callback
    return <Component {...props} onClick={onClick} />;
  };
};
```
