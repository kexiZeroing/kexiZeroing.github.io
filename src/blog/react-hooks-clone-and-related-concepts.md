---
title: "React hooks clone and related concepts"
description: ""
added: "Sep 12 2020"
tags: [react]
updatedDate: "Feb 18 2025"
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

### Simple React custom renderer
```jsx
const React = {
  createElement: (tag, props, ...children) => {
    if (typeof tag === "function") {
      return tag(props);
    }
    let element = { tag, props: { ...props, children } };
    return element;
  }
}

const render = (reactElementOrText, container) => {
  if (['string', 'number'].includes(typeof reactElementOrText)) {
    container.appendChild(document.createTextNode(String(reactElementOrText)));
    return;
  }

  let actualElement = document.createElement(reactElementOrText.tag);
  if (reactElementOrText.props) {
    Object.keys(reactElementOrText.props).filter(p => p !== children).forEach(p => {
      actualElement.setAttribute(p, reactElementOrText.props[p])
    })
  }
  if (reactElementOrText.props.children) {
    reactElementOrText.props.children.forEach(child => {
      render(child, actualElement)
    })
  }
  container.appendChild(actualElement);
}

const App = () => (
  <div className="react-div">
    <h1>Hello</h1>
    <p>Some text here</p>
  </div>
)

render(<App />, document.querySelector("#app"));
```

### Vanilla React data fetching
If you're going to fetch in `useEffect()`, you should at least make sure that you're handling:
- Loading states
- Error handling (rejections & HTTP error codes)
- Race conditions & cancellation

```js
import * as React from "react"

export default function useQuery(url) {
  const [data, setData] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let ignore = false  // isCancelled

    const handleFetch = async () => {
      setData(null)
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(url)

        if (ignore) {
          return 
        }

        if (res.ok === false) {
          throw new Error(`A network error occurred.`)
        }

        const json = await res.json()

        setData(json)
        setIsLoading(false)
      } catch (e) {
        setError(e.message)
        setIsLoading(false)
      }
    }

    handleFetch()

    return () => {
      ignore = true
    }
  }, [url])

  return { data, isLoading, error }
}
```

In reality, we still need to think about:
1. For every component that needs the same data, we have to refetch it.
2. It's possible that while fetching to the same endpoint, one request could fail while the other succeeds.
3. If our state is moved to "global", we've just introduced a small, in-memory cache. Since we've introduced a cache, we also need to introduce a way to invalidate it.
4. Context often becomes confusing over time. A component subscribed to QueryContext will re-render whenever anything changes – even if the change isn't related to the url it cares about.
5. We're treating asynchronous state as if it were synchronous state.

That's [why React Query](https://ui.dev/c/query/why-react-query) was created.

### You Might Not Need an Effect
> Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and re-read the page about why you don't need an effect. You really don't. -@TkDodo

When developing an application in React 18+, you may encounter an issue where the `useEffect` hook is being run twice on mount. This occurs because since React 18, when you are in development, your application is being run in StrictMode by default. In Strict Mode, React will try to simulate the behavior of mounting, unmounting, and remounting a component to help developers uncover bugs during testing. *From the user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, and then pressing Back. React verifies that your components don’t break this principle by remounting them once in development.* In most cases, it should be fine to leave your code as-is, since the `useEffect` will only run once in production.

- https://react.dev/learn/you-might-not-need-an-effect
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect
- https://www.youtube.com/watch?v=bGzanfKVFeU

### Referencing Values with Refs
When you want a component to “remember” some information, but you don’t want that information to trigger new renders, you can use a `ref`. Typically, you will use a ref when your component needs to “step outside” React and communicate with external APIs. (e.g. storing timeout IDs, DOM elements)

- Refs are an escape hatch to hold onto values that aren’t used for rendering. You won’t need them often.
- A ref is a plain JavaScript object with a single property called `current`, which you can read or set.
- You can ask React to give you a ref by calling the `useRef` Hook.
- Like state, refs let you retain information between re-renders of a component.
- Unlike state, setting the ref’s current value does not trigger a re-render.

```js
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    // this update does not trigger a re-render
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

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