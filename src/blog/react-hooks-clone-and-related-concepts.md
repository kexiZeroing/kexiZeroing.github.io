---
title: "React hooks clone and related concepts"
description: ""
added: "Sep 12 2020"
tags: [react]
updatedDate: "Apr 14 2025"
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

### Simplified version of virtual DOM diffing and rendering
https://gist.github.com/developit/2038b141b31287faa663f410b6649a87

```js
// JSX constructor, similar to createElement()
// Use /** @jsx h */ comment
export const h = (type, props, ...children) => ({
  type,
  props,
  children,
  key: props && props.key
});

export const render = (
  newVNode,
  dom,
  oldVNode = dom._vnode || (dom._vnode = {}),
  currentChildIndex
) => {
  if (Array.isArray(newVNode)) {
    return newVNode.map((child, i) => render(child, dom, oldVNode._normalizedChildren?.[i]));
  }
  // Handle components
  // Here components have a different signature compared to React:
	// (props, state, updateFn) => VNode;
  else if (typeof newVNode.type === 'function') {
    newVNode.state = oldVNode.state || {};
    const props = { ...newVNode.props, children: newVNode.children };
    const renderResult = newVNode.type(
      props,
      newVNode.state,
      nextState => {
        Object.assign(newVNode.state, nextState);
        render(newVNode, dom, newVNode);
    });

    render(renderResult, dom, oldVNode.rendered || {});
  }
  // Handle DOM elements and text nodes
  else {
    // assumes the types match here
    newVNode.dom = oldVNode.dom || (newVNode.type ? document.createElement(newVNode.type) : new Text(newVNode.props));

    // Update props
    if (newVNode.type) {
      for (const name in newVNode.props || {}) {
        const value = newVNode.props[name];
        if (value !== (oldVNode.props?.[name])) {
          // DOM Properties like value, checked, className
          name in newVNode.dom ? (newVNode.dom[name] = value) : newVNode.dom.setAttribute(name, value);
        }
      }
    } else if (newVNode.props !== oldVNode.props) {
      // document.createTextNode("Hello").data
      newVNode.dom.data = newVNode.props;
    }

    // Newly created node won’t have a parentNode and needs to be inserted
    if (!newVNode.dom.parentNode) {
      dom.insertBefore(newVNode.dom, dom.childNodes[currentChildIndex] || null);
    }

    // Diff children
    const newChildren = newVNode.children.flat();
    const oldChildren = oldVNode._normalizedChildren || [];
    newVNode._normalizedChildren = newChildren.map((child, i) => {
      const nextNewChild = typeof child === 'string' ? h('', child) : child;
      // Find oldChild with matching key
      const matchingOldChild = oldChildren.find(oldChild => oldChild?.key === nextNewChild.key) || {};
      return render(nextNewChild, newVNode.dom, matchingOldChild, i);
    });

    // Remove old children if there are any
		if (oldVNode._normalizedChildren) {
			oldVNode._normalizedChildren.map(oldChild => {
				oldChild && oldChild.dom.remove();
			});
		}
    
    Object.assign(oldVNode, newVNode);
  }
};
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

### You Might Not Need an Effect
> Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and re-read the page about why you don't need an effect. You really don't. -@TkDodo

When developing an application in React 18+, you may encounter an issue where the `useEffect` hook is being run twice on mount. This occurs because since React 18, when you are in development, your application is being run in StrictMode by default. In Strict Mode, React will try to simulate the behavior of mounting, unmounting, and remounting a component to help developers uncover bugs during testing. *From the user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, and then pressing Back. React verifies that your components don’t break this principle by remounting them once in development.* In most cases, it should be fine to leave your code as-is, since the `useEffect` will only run once in production.

- https://react.dev/learn/you-might-not-need-an-effect
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect
- https://www.youtube.com/watch?v=bGzanfKVFeU

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
const handleUpdate = () => {
  setCount(count + 1); // First update
  setFlag(!flag);      // Second update
  // In pre-batching React, this would cause two separate renders
};
```

React 18 introduced batching to prevent these issues. Batching means that React groups multiple state updates into a single re-render cycle. This approach ensures that the UI is updated efficiently, reflecting all state changes in one go.

`flushSync` allows you to opt-out of batching for specific updates, forcing them to be processed immediately. This ensures that critical updates are executed in the correct order, even within a batched state update cycle. *(But, use it carefully and not too much, because using it too often can cancel out the performance advantages of batching.)*

```js
// https://tigerabrodi.blog/understanding-flushsync-mastering-batching-behavior-in-reactjs
const receiveMessage = () => {
  const newMessage = `Message ${messages.length + 1}`;

  // Update messages and Forces re-render
  flushSync(() => {
    setMessages(prevMessages => [...prevMessages, newMessage]);
  });

  // Scroll to the bottom after messages update
  endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
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

### What's new in React 17+
React 17:
- https://legacy.reactjs.org/blog/2020/10/20/react-v17.html
- https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html

React 18:
- https://react.dev/blog/2022/03/29/react-v18
- https://www.youtube.com/watch?v=Z-NCLePa2x8
- https://www.youtube.com/watch?v=ytudH8je5ko
- https://tigerabrodi.blog/reacts-evolution-from-hooks-to-concurrent-react

React 19:
- https://react.dev/blog/2024/12/05/react-19
- https://shrutikapoor.dev/posts/react-react19
- https://www.youtube.com/watch?v=AJOGzVygGcY
- https://www.youtube.com/watch?v=O3ZtlTwDnbk