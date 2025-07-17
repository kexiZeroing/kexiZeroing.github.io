---
title: "React hooks clone and related concepts"
description: ""
added: "Sep 12 2020"
tags: [react]
updatedDate: "July 17 2025"
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

    if (oldDeps) {
      hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
    }
    if (hasChanged) cb();
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

### JSX Basics

```js
const React = {
  createElement(type, props, ...children) {
    if (typeof type === 'function') {
      return type(props)
    }
    const element = { type, props: { ...props, children } }
    return element
  }
}

const App = () => (
  <div className="react">
    <h1>Hello</h1>
    <p>some text here</p>
  </div>
)

const render = (reactElement, container) => {
  if (['string', 'number'].includes(typeof reactElement)) {
    container.appendChild(document.createTextNode(String(reactElement)))
    return
  }

  const actualElement = document.createElement(reactElement.type)
  if (reactElement.props) {
    // set attributes for each reactElement.props (filter out children)
  }
  if (reactElement.props.children) {
    // render recursively
  }
  container.appendChild(actualElement)
}

render(<App />, document.querySelector('#app'))
```

> You might recall that you needed to `import React from 'react'` to write JSX correctly. Starting with React 17, React introduced a new JSX transform that automatically imports special functions in the React package and calls them behind the scenes.

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

When React rerenders this conditional input component, it performs reconciliation by comparing the new virtual DOM tree with the previous one. Since both the editing and non-editing branches render an input element of the same type at the same position in the component tree, React treats them as the same element and preserves the existing DOM node rather than destroying and recreating it. During this process, React updates the element's props, but maintains the DOM element's internal state, including any text the user has typed.

Note that here React still fully re-renders the component when `isEditing` changes. However, during reconciliation, React's diffing algorithm determines that the DOM node can be reused rather than recreated. This demonstrates that "DOM reuse" is not equivalent to "component render skip" - you can render a component again and still reuse DOM nodes.

**Force remount with a `key` prop**: React's reconciliation algorithm sees different keys and treats them as different elements, destroying the old DOM node and creating a fresh one. This breaks the normal DOM reuse behavior, forcing a complete remount rather than a prop update, which clears any user input since the new DOM element starts with empty state.

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

The way to fight this, other than `React.memo`, is to extract `ChildComponent` outside and pass it as children. React "children" is just a prop. When you pass children through props, React treats them as stable references. The child components were already created when the parent's JSX was evaluated, so they don't get recreated just because the parent re-renders. React simply passes the same element references down.

> The children prop acts like a "slot" that holds pre-created elements, making it one of React's most effective built-in optimization techniques.

```jsx
// https://www.developerway.com/posts/react-elements-children-parents
const MovingComponent = ({ children }) => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div
      onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })}
      style={{ left: state.x, top: state.y }}
    >
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
// Without memo, it still re-renders even though props didn't change
const Child = React.memo(({ onClick, items }) => {
 return <div onClick={onClick}>{items.join(', ')}</div>;
});

const App = () => {
 const [count, setCount] = useState(0);
 const [filter, setFilter] = useState('');
 
 const handleClick = useCallback(() => {
   console.log('clicked');
 }, []);
 
 const filteredItems = useMemo(() => {
   return ['apple', 'banana', 'cherry'].filter(item => 
     item.includes(filter)
   );
 }, [filter]);
 
 return (
   <div>
     <button onClick={() => setCount(count + 1)}>Count: {count}</button>
     <input onChange={(e) => setFilter(e.target.value)} />
     
     {/* Will NOT re-render when count changes */}
     <Child onClick={handleClick} items={filteredItems} />
   </div>
 );
};
```

> `useCallback` and `useMemo` for props don’t prevent re-renders by themselves. They only create stable references. `React.memo` is what actually checks those references and prevents re-renders.

### What is Fiber
React Fiber was introduced in React 16 as a complete reimplementation of React's core reconciliation algorithm. At its core, Fiber is a JavaScript object that represents both a unit of work and a node in React's internal tree structure, essentially serving as the modern implementation of React's Virtual DOM.

Fiber nodes are organized in a linked-list tree structure that mirrors the component hierarchy, with each Fiber having pointers to its parent, first child, and next sibling. Fiber nodes are sophisticated objects that serve as both the Virtual DOM elements and the reconciliation units, containing work scheduling information.

React processes Fibers in a two-phase cycle:

1. **Render phase:** React performs interruptible work, processing Fiber nodes and calculating what changes need to be made. This work can be prioritized, paused, resumed, and aborted based on scheduling needs. Internal functions like `beginWork()` and `completeWork()` are called during this process to traverse and process the Fiber tree.

2. **Commit phase:** Once the render phase completes, React synchronously commits all changes to the DOM by calling `commitWork()`. This phase cannot be interrupted to ensure DOM consistency.

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

 // Let browser paint (happens automatically after call stack clears)

 // Queue useEffect for later (after paint)
 queueMicrotask(() => {
   runEffects()
 })
}
```

### You Might Not Need an Effect
Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and re-read the page about why you don't need an effect. You really don't. -@TkDodo

- Goodbye, useEffect: https://www.youtube.com/watch?v=bGzanfKVFeU
- https://react.dev/learn/you-might-not-need-an-effect
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect

When developing an application in React 18+, you may encounter an issue where the `useEffect` hook is being run twice on mount. This occurs because since React 18, when you are in development, your application is being run in StrictMode by default. In Strict Mode, React will try to simulate the behavior of mounting, unmounting, and remounting a component to help developers uncover bugs during testing. *From the user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, and then pressing Back. React verifies that your components don’t break this principle by remounting them once in development.* In most cases, it should be fine to leave your code as-is, since the `useEffect` will only run once in production.

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

The key to understanding this hook is realizing there's a timing difference. When your component renders, the hook returns the current value of `ref.current`. After rendering, the effect runs and updates `ref.current` to the new value. On the next render, `ref.current` contains what was the value in the previous render. Note that `useRef()` doesn't create a new ref object on every render. **React's hook system ensures that the same ref object persists across re-renders.**

#### `ref` callback function
Instead of a ref object, you may pass a function to the `ref` attribute. When the `<div>` DOM node is added to the screen, React will call your `ref` callback with the DOM node as the argument. When that `<div>` DOM node is removed, React will call your `ref` callback with null. React will also call your `ref` callback whenever you pass a different `ref` callback.

- Called immediately when the element is attached to the DOM.
- Called with `null` when the element is removed.
- Runs before `useEffect`, but after `useLayoutEffect`
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
