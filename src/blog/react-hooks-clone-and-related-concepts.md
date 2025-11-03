---
title: "React hooks clone and related concepts"
description: ""
added: "Sep 12 2020"
tags: [react]
updatedDate: "Sep 29 2025"
---

### Getting Closure on Hooks presented by @swyx
```js
// https://www.youtube.com/watch?v=KJP1E-Y-xyo
const React = (function() {
  let hooks = [];
  let idx = 0;

  function useState(initVal) {
    const state = hooks[idx] ?? initVal;
    const _idx = idx;
    const setState = newVal => {
      if (typeof newVal === 'function') {
        hooks[_idx] = newVal(hooks[_idx]);
      } else {
        hooks[_idx] = newVal;
      }
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
// 1. JSX and virtual DOM
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

<App />

// 2. Render to real DOM
const render = (reactElement, container) => {
  if (['string', 'number'].includes(typeof reactElement)) {
    container.appendChild(document.createTextNode(String(reactElement)))
    return
  }

  const actualElement = document.createElement(reactElement.type)
  if (reactElement.props) {
    Object.keys(reactElement.props)
      .filter(p => p !== 'children')
      .forEach(p => actualElement[p] = reactElement.props[p])
  }
  if (reactElement.props.children) {
    reactElement.props.children.forEach(child => render(child, actualElement))
  }
  container.appendChild(actualElement)
}

render(<App />, document.querySelector('#app'))
```

Babel compiles JSX `<div>Hi</div>` to a function call `React.createElement('div', null, 'hi')`. If you have a comment like `/** @jsx cool */`, Babel will transpile the JSX using the function `cool` you defined instead of `React.createElement`, so you can have a function `const cool = (el, props, ...children) => {}`, which could be totally not related to React.

> You might recall that you needed to `import React from 'react'` to write JSX correctly. Starting with React 17, React introduced a new JSX transform that automatically imports special functions in the React package and calls them behind the scenes.

### State updates are asynchronous and batched

```js
const [user, setUser] = useState({})

setUser(data);
console.log(user);
```

The `console.log(user)` will not show the updated data immediately. `setUser(data)` schedules a state update, it does not update user instantly. React batches state updates and triggers a re-render later. Only after the re-render will user reflect the new value.

```js
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
```

It will only increment the count by 1, despite the three calls. React state updates are async and batched so it will re-render only once. All three `setCount` are looking at the state of count on the same loop, so all of them see that count is 0 and all of them change it to 1. You're just setting it to 1 three times. If it was `setCount(c => c + 1)` then the result is 3.

Something strange happening in the below code: the interval gets destroyed and re-created every time it ticks. It seems like this Effect’s code depends on `count`. Is there some way to not need this dependency?

```js
const [count, setCount] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    console.log('Interval tick');
    setCount(count + 1);
  }, 1000);
  return () => {
    clearInterval(id);
  };
}, [count]);
```

```js
// To solve this, use the updater function `setCount(c => c + 1)`
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  return () => {
    clearInterval(id);
  };
}, []);
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

When React rerenders this conditional input component, it performs reconciliation by comparing the new virtual DOM tree with the previous one. Since both the editing and non-editing branches render an input element of the same type at the same position in the component tree, React treats them as the same element and preserves the existing DOM node rather than destroying and recreating it. During this process, React updates the element's props, but maintains the DOM element's internal state, including any text the user has typed.

Note that here React still fully re-renders the component when `isEditing` changes. However, during reconciliation, React's diffing algorithm determines that the DOM node can be reused rather than recreated. This demonstrates that "DOM reuse" is not equivalent to "component render skip" - you can render a component again and still reuse DOM nodes.

**Force remount with a `key` prop**: React's reconciliation algorithm sees different keys and treats them as different elements, destroying the old DOM node and creating a fresh one. This breaks the normal DOM reuse behavior, forcing a complete remount rather than a prop update, which clears any user input since the new DOM element starts with empty state.

### Understand the "children pattern"
Extract components and pass JSX as `children` to them. For example, maybe you pass data props like `posts` to visual components that don’t use them directly, like `<Layout posts={posts} />`. Instead, make `Layout` take `children` as a prop, and render `<Layout><Posts posts={posts} /></Layout>`. This reduces the number of layers between the component specifying the data and the one that needs it.

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

The way to fight this, other than `React.memo`, is to extract `ChildComponent` outside and pass it as children. React "children" is just a prop. **When you pass children through props, React treats them as stable references**. The child components were already created when the parent's JSX was evaluated, so they don't get recreated just because the parent re-renders. React simply passes the same element references down.

> The children prop acts like a "slot" that holds pre-created elements, making it one of React's most effective built-in optimization techniques.

```jsx
// Read this article: https://www.developerway.com/posts/react-elements-children-parents
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

React compares the props of a memoized component with `Object.is` to check if it can skip rendering that sub-tree.

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
>
> You should treat `useCallback` as a performance optimization only, which means your code should still work if you remove it. It might not work as efficiently as before, but it also shouldn't crash.
>
> If we don't have any dependencies, we can even just move the function outside of our component to make it stable - no `useCallback` with empty dependency array necessary.

Note that in the example above, `ChildComponent` does not automatically re-render because its parent component's states change. But if the parent's parent `SomeOutsideComponent` re-renders, it creates a new React element for `<ChildComponent />` (a new object). That causes `MovingComponent` to re-render, even if nothing inside changed.

For example, rerendering the `<App>` component will break memoization. JSX is just syntactic sugar for `React.createElement`, which will create a new object on every render. So, even though the `<p>` tag looks like it's the same to us, it won't be the same reference.

```js
function App() {
  return (
    <ExpensiveTree>
      <p>Hello, world!</p>
    </ExpensiveTree>
  )
}

function ExpensiveComponent({ children }) {
  return (
    <div>
      I'm expensive!
      {children}
    </div>
  )
}
const ExpensiveTree = React.memo(ExpensiveComponent)
```

How to memoize below code correctly? We can re-write the code to make the flow clearer by using children prop which accepts a React element. We re-create this object on every render, so that children prop changed, and will trigger re-render. And since `SomeOtherComponent`'s definition was re-created, it will trigger its re-render as well.

```js
<VerySlowComponent>
  <SomeOtherComponent />
</VerySlowComponent>

// Same as:
<VerySlowComponent children={<SomeOtherComponent />} />

// It should memoize like this:
const VerySlowComponentMemo = React.memo(VerySlowComponent);

export const SomeComponent = () => {
  const child = useMemo(() => <SomeOtherComponent />, []);
  return <VerySlowComponentMemo>{child}</VerySlowComponentMemo>;
};
```

#### Client wrapper for server components
Instead of turning the `ServerComponent` into a client component, we can pass it down as a child to a client component wrapper that handles the state and UI rendering. The server component is still responsible only for data fetching. *This also means that wrapping your root layout in the client component does not automatically turn your entire app into a client rendering.*

```js
'use client';

function ClientWrapper({ children }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div>
      {children}
      <button onClick={() => setVisible(false)}>Dismiss</button>
    </div>
  );
}

function Page() {
  return (
    <ClientWrapper>
      {/* the ServerComponent remains a server component */}
      <ServerComponent />
    </ClientWrapper>
  );
}
```

Look at another example, the `ShowMore` component is a reusable UI component to handle the “Show More” logic, and the `CategoryList` component remains focused on data fetching. This way, server and client responsibilities stay separate and your code stays clean.

```js
async function CategoryList() {
  const categories = await getCategories();
  
  return (
    <ShowMore initial={5}>
      {categories.map((category) => (
        <div key={category.id}>{category.name}</div>
      ))}
    </ShowMore>
  );
}

'use client';

export default function ShowMore({ children, initial = 5 }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? children : Children.toArray(children).slice(0, initial);
  const remaining = Children.count(children) - initial;

  return (
    <div>
      <div>{items}</div>
      {remaining > 0 && (
        <div>
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show Less' : `Show More (${remaining})`}
          </button>
        </div>
      )}
    </div>
  );
}
```

> The `children` prop can be a single React element or an array of elements, so using native `.map()`, `.forEach()` directly on `children` can be risky. React provides the `React.Children` utility to handle children safely and consistently, regardless of its form. It includes:
>
> - React.Children.map(children, fn)
> - React.Children.forEach(children, fn)
> - React.Children.count(children)
> - React.Children.toArray(children)

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
Before getting to Effects, you need to be familiar with two types of logic inside React components:
- **Rendering code** lives at the top level of your component. This is where you take the props and state, transform them, and return the JSX you want to see on the screen. Rendering code must be pure.
- **Event handlers** are functions inside your components that contain “side effects” caused by a specific user action.

In React, rendering should be a pure calculation of JSX and should not contain side effects. The solution is to wrap the side effect with `useEffect` to move it out of the rendering calculation. When you choose whether to put some logic into an event handler or an Effect, the main question you need to answer is what kind of logic it is from the user’s perspective. If this logic is caused by a particular interaction, keep it in the event handler. If it’s caused by the user seeing the component on the screen, keep it in the Effect.

Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and re-read the page about why you don't need an effect. You really don't. -@TkDodo

- Goodbye, useEffect: https://www.youtube.com/watch?v=bGzanfKVFeU
- https://react.dev/learn/you-might-not-need-an-effect
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect

When developing an application in React 18+, you may encounter an issue where the `useEffect` hook is being run twice on mount. This occurs because since React 18, when you are in development, your application is being run in StrictMode by default. In Strict Mode, React will try to simulate the behavior of mounting, unmounting, and remounting a component to help developers uncover bugs during testing. *From the user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, and then pressing Back. React verifies that your components don’t break this principle by remounting them once in development.* In most cases, it should be fine to leave your code as-is, since the `useEffect` will only run once in production.

> Strict Mode enables the following checks in development:
> - Your components will re-render an extra time to find bugs caused by impure rendering.
> - Your components will re-run Effects an extra time to find bugs caused by missing Effect cleanup.
> - Your components will re-run ref callbacks an extra time to find bugs caused by missing ref cleanup.
> - Your components will be checked for usage of deprecated APIs.

```js
useEffect(() => {
  // Wrong: This Effect fires twice in development, exposing a problem in the code.
  fetch('/api/buy', { method: 'POST' });
}, []);
```

You wouldn’t want to buy the product twice. This is also why you shouldn’t put this logic in an Effect. Buying is not caused by rendering; it’s caused by a specific interaction. It should run only when the user presses the button. Delete the Effect and move it into the Buy button event handler.

#### Declaring an Effect Event
Use a special Hook called `useEffectEvent` *(~~experimental API that has not yet been released in a stable version of React~~ available in React 19.2)* to extract non-reactive logic out of your Effect.

```js
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]);
  // ...
}
```

Since `theme` is a dependency, the chat also re-connects every time you switch between the dark and the light theme. That’s not great! In other words, you need a way to separate this non-reactive logic from the reactive Effect around it.

```js
const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme);
});

useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.on('connected', () => {
    onConnected();
  });
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

Here, `onConnected` is called an Effect Event. It’s a part of your Effect logic, but it behaves a lot more like an event handler. The logic inside it is not reactive, and it always “sees” the latest values of your props and state.

Why `onConnected` can't just be a normal function?
1. React's linter detects you're using `onConnected` inside the Effect, so it must be in the dependency array.
2. If you put it in the array, when `theme` changes in parent, component re-renders, `onConnected` is recreated, Effect sees a new `onConnected`, so it cleans up and re-runs the Effect, reconnecting to the chat server. But reconnecting just because `theme` changed is unnecessary - you only want to reconnect when `roomId` changes.

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
```js
React.useEffect(() => {
  // ref.current is always null when this runs
  ref.current?.focus()
}, [])


{show && <input ref={ref} />}
```

The input is not rendered at first, ref is still null, then effect runs, does nothing. When input is shown, ref will be filled, but will not be focussed because effect won't run again.

This is where callback refs come into play. Instead of a ref object, you may **pass a function to the `ref` attribute**. When the `<div>` DOM node is added to the screen, React will call your `ref` callback with the DOM node as the argument. When that `<div>` DOM node is removed, React will call your `ref` callback with null. React will also call your `ref` callback whenever you pass a different `ref` callback.

- Called immediately when the element is attached to the DOM.
- Called with `null` when the element is removed.
- Runs before `useEffect`, but after `useLayoutEffect`.
- It's best for immediate DOM measurements or setup.
- React 19 added cleanup functions for ref callbacks. When the `ref` is detached, React will call the cleanup function.

Passing a ref from `useRef` (a RefObject) to a React element is therefore just syntactic sugar for:
```js
<input
  ref={(node) => {
    ref.current = node;
  }}
/>
```

```tsx
// move the function out of the component
// never re-create the function during a re-render 
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

So if you need to interact with DOM nodes directly after they rendered, try not to jump to `useRef` + `useEffect` directly, but consider using callback refs instead.

#### The latest ref pattern

```js
function Child({ onClick }) {
  useEffect(() => {
    function onKeyDown() {
      onClick();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClick]);

  return ...
}
```

We want to remove the `onClick` dependency here. The idea is to store the function in a ref, and make sure that the ref is updated when the function changes, and we can do that with an additional effect that purposefully runs on every render:

```js
function Child({ onClick }) {
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  });

  useEffect(() => {
    function onKeyDown() {
      onClickRef.current();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return ...
}
```

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

### Compound components pattern
The compound components in React lets you break a complex component into smaller, related parts that share state and logic through a common parent. Instead of managing many props in one monolithic component, the parent provides context and each child (e.g., `Card.Title`) consumes it, giving developers the flexibility to compose and arrange the subcomponents in any structure they need.

- Consumers choose what to include and in what order.
- Adding new features is just adding a new subcomponent.
- Each piece handles its own logic and rendering.
- All children can access parent state without prop drilling.

```js
type PostCardContextType = {
  post: Post;
}

const PostCardContext = createContext<PostCardContextType | null>(null);

function usePostCardContext() {
  const context = useContext(PostCardContext);
  if (!context) {
    throw new Error('usePostCardContext must be used within PostCard component');
  }
  return context;
}

export default function PostCard({ post, children }: { post: Post, children: ReactNode }) {
  return (
    <PostCardContext.Provider value={{ post }}>
      <div>{children}</div>
    </PostCardContext.Provider>
  );
}

PostCard.Title = function PostCardTitle() {
  const { post } = usePostCardContext();
  return <h2>{post.title}</h2>;
}

PostCard.User = function PostCardUser() {
  const { post } = usePostCardContext();
  return <p>By {post.author}</p>;
}

PostCard.Buttons = function PostCardButtons() {
  return (
    <div>
      <button>Read More</button>
      <button>Comments</button>
    </div>
  );
}

// Usage
<PostCard post={somePost}>
  <PostCard.Title />
  <PostCard.User />
  <PostCard.Buttons />
</PostCard>
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

### Render Prop pattern
A way of making components reusable is by using the render prop pattern. A render prop is a prop on a component, which value is a function that returns a JSX element.
- The component simply calls the render prop, instead of implementing its own rendering logic.
- We usually want to pass data from the component that takes the render prop, to the element that we pass as a render prop.
- We can pass functions as children to React components. This function is available through the children prop, which is technically also a render prop.

```js
const Card = ({ Content }: {
  Content: ComponentType<{ selected: boolean }>,
}) => {
  const [selected, setSelected] = useState(false);
  return (
    <div>
      <Content selected={selected} /> {/* New component instance each time! */}
    </div>
  );
};

const App = () => {
  const [appState, setAppState] = useState('something');

  const AppliedCardContent = ({ selected }: {
    selected: boolean,
  }) => {
    return <CardContent selected={selected} appState={appState} />
  }

  return (
    <Card Content={AppliedCardContent} />
  )
};
```

```js
const Card = ({ renderContent }: {
  renderContent: ({ selected }: { selected: boolean }) => ReactNode,
}) => {
  const [selected, setSelected] = useState(false);
  return (
    <div>
      {renderContent({ selected })}
    </div>
  );
};

const App = () => {
  const [appState, setAppState] = useState('something');

  const renderContent = ({ selected }) => <CardContent selected={selected} appState={appState} />;

  return (
    <Card renderContent={renderContent} />
  );
};
```

First approach follows the Higher-Order Component pattern. Second approach follows the Render Prop pattern.

When `App` re-renders, `Card` will re-render too. The problem with the first approach is that when `App` re-renders, a brand new `AppliedCardContent` component function is created, so `<Content />` is seen as a completely new component. React unmounts the old one and mounts a new one, causing internal state to be lost. In the second approach, when `App` re-renders, the function is called and returns `<CardContent />`. React sees this as the same component type, so state is preserved. *It's not about preventing re-renders - it's about React thinking you're rendering a completely different component vs. the same component with different props.*

```js
// Creating a wrapper component
const ListItemImpl = ({ item }) => (
  <ListItem item={item} highContrast={highContrast} />
);

// Passing the component as a prop
// Instead of <List listItems={listItems} highContrast={highContrast} />
// Do this:
<List listItems={listItems} ListItem={ListItemImpl} />

// Using the injected component
const List = ({ listItems, ListItem }) => (
  <ul>
    {listItems.map((item) => (
      <ListItem key={item.id} item={item} />
    ))}
  </ul>
);
```

This is a form of dependency injection and is closely related to patterns like render props. In React, “DI” usually means inverting control so components don’t create their dependencies. Instead of passing data down through multiple component layers, you pass a pre-configured component that already has access to the data it needs. For example, a List component can focus purely on iteration and rendering structure without needing to understand styling preferences. This creates better separation of concerns and makes components more reusable and testable.

### React context and MobX
React Context is great for passing state down without prop drilling, but it always flows top to down. Updates in the parent trigger re-renders in consumers.

```js
const App = () => {
  const [language, setLanguage] = useState("en");
  const value = { language, setLanguage };

  return (
    <LanguageContext.Provider value={value}>
      <h2>Current Language: {language}</h2>
      <LanguageSwitcher />
    </LanguageContext.Provider>
  );
};
```

Calling `setLanguage` in a child via context updates the state in App. When state updates, React re-renders the component where that state lives — here, that’s App. Then all components that call  `useContext(LanguageContext)` see the new value and re-render.

> Even if `language` didn’t change but App re-rendered for some other reason, you’d still be creating a new `{ language, setLanguage }` object each time. That would cause all consumers to re-render unnecessarily. You can memoize the value: `const value = useMemo(() => ({ language, setLanguage }), [language])`.

With MobX you don’t lift state into React, you keep it in a MobX store. Components re-render only if they directly use an observable value.

```js
class LanguageStore {
  language = "en";

  constructor() {
    makeAutoObservable(this);
  }

  setLanguage(lang: string) {
    this.language = lang;
  }
}
export const languageStore = new LanguageStore();

// LanguageSwitcher.tsx
import { observer } from "mobx-react-lite";
import { languageStore } from "./store";

const LanguageSwitcher = observer(() => {
  return (
    <div>
      <h2>Current Language: {languageStore.language}</h2>
      <button onClick={() => languageStore.setLanguage("jp")}>
        Switch to JP
      </button>
    </div>
  );
});
```

Here the store is just a plain JavaScript object (observable). You can import it anywhere, and as long as your component is wrapped with `observer`, MobX will track what observables are accessed and re-render only those components. If you want fine-grained reactivity without constantly thinking about `memo`, `useMemo`, or context optimization, MobX can be a simpler and more scalable choice.
