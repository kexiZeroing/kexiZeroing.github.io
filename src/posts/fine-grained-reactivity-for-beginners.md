---
layout: "../layouts/BlogPost.astro"
title: "Fine-grained reactivity for beginners"
slug: fine-grained-reactivity-for-beginners
description: ""
added: "Feb 20 2023"
tags: [web]
updatedDate: "June 22 2023"
---

> Reactivity can be broadly defined as the automatic update of the UI due to a change in the application's state.

In a reactive programming context, dependency tracking is a technique used to automatically update computations that depend on some input data when that data changes. In order for dependency tracking to work, the reactive framework needs to know which computations depend on which data. This is typically done by wrapping the data in reactive objects or variables that the framework can monitor for changes. When a piece of data changes, the framework can then notify any computations that depend on that data and trigger a re-evaluation of those computations.

If you access properties directly instead of through getter functions, the reactive framework may not be able to detect changes to the data. For example, if you have a property `myData` and you directly modify it with `myData = newValue`, the reactive framework may not be able to detect this change because it doesn't know that `myData` is being used by some computation. On the other hand, if you use a getter function to access `myData`, the reactive framework can detect that the getter function is being used by a computation and can monitor it for changes. If `myData` changes, the reactive framework will be notified and can update any computations that depend on it.

### Why Vue need to use `.value` to access the ref property?
The `.value` syntax is used in Vue 3 to access the value of a ref property because refs are designed to be reactive objects rather than simple values. When you create a ref, you are actually creating an object with a single property named `value`. The `value` property holds the actual value that the ref represents, and any changes to the `value` property trigger reactivity. When we access the ref directly, we are accessing the object, not the value.

When you create a reactive object with `reactive()`, you can access its properties directly using dot notation, without needing to use `.value`. This is because reactive objects use JavaScript's built-in getters and setters to intercept property access and modification, allowing Vue to track dependencies and trigger reactivity as needed.

### Vue `shallowRef()`
Adding deep reactivity to a large object can cost you a lot of performance, you can optimize the reactivity in your app by using `shallowRef`. Here reactivity is only triggered when the `value` of the `ref` itself is changed, but modifying any of the nested properties won’t trigger anything.

```js
const state = shallowRef({ count: 1 })

// does NOT trigger change
state.value.count = 2

// does trigger change
state.value = { count: 2 }
```

### Shortcomings of React `useState()`
React `useState()` returns a state, the value. This means that `useState()` has no idea how the state value is used inside the component. The implication is that once you notify React of state change through a call to `setState()`, React has no idea which part of the page has changed and therefore must re-render the whole component.

It's worth noting that while React may re-render the entire component, it does so efficiently. React uses virtual DOM diffing to minimize the amount of work required to update the DOM. This means that even if a component has a large number of elements, React can update only the parts of the DOM that have changed, resulting in a fast and efficient re-render.

> The virtual DOM was created to address performance issues caused by frequent manipulation of the real DOM. It is a lightweight, in-memory representation of the real DOM, which can be later used as reference to update the actual web page. When a component is rendered, the virtual DOM calculates the difference between the new state and the previous state (a process called "diffing") and makes the minimal set of changes to the real DOM to bring it in sync with the updated virtual DOM (a process called "reconciliation").
>
> Understand React [reconciliation](https://www.developerway.com/posts/reconciliation-in-react):  
> React will compare the "type" field of the object from "before" and "after" the state update. If the type is the same, the component will be marked as "needs update," and its re-render will be triggered. Everything that is associated with the existing component, like its DOM element or state, is still there. If the type has changed, then React, during the re-render cycle, will remove (unmount) the "previous" component and add (mount) the "next" component.

Diffing isn't free. The more nodes you have, the more time it takes to diff. With newer frameworks like Svelte, the virtual DOM isn't even used because of the performance overhead. Instead, Svelte uses a technique called "dirty checking" to determine what has changed. Fine-grained reactivity frameworks like SolidJS take this a step further by pinpointing exactly what has changed and updating only that part of the DOM.

### Solid.js
[Solid](https://github.com/solidjs/solid) is a declarative JavaScript library for creating user interfaces. Instead of using a Virtual DOM, it compiles its templates to real DOM nodes and updates them with fine-grained reactions. Declare your state and use it throughout your app, and when a piece of state changes, only the code that depends on it will rerun.

```js
import { createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";

const CountingComponent = () => {
	const [count, setCount] = createSignal(0);
	const interval = setInterval(
		() => setCount(c => c + 1),
		1000
	);
	onCleanup(() => clearInterval(interval));
	return <div>Count value is {count()}</div>;
};

render(() => <CountingComponent />, document.getElementById("app"));
```

### Angular Reactivity with Signals
> Angular before signals run dirty-check algorithm (relies on `zone.js`) to detect when the states change and mark the component(s) as dirty. Once the component(s) marked dirty, the component is re-run so that the framework can re-read/re-create the values and therefore detect which parts have changed and reflect the changes to the DOM.

- Angular Reactivity with Signals: https://github.com/angular/angular/discussions/49090
- Angular Signals Demo: https://angular-signals.netlify.app
- Angular Signals in Vue by Evan You: https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals

```js
import { shallowRef, triggerRef, computed as _computed } from 'vue'

export function signal(initialValue) {
  const r = shallowRef(initialValue)
  const s = () => r.value
  s.set = value => { r.value = value }
  s.update = updater => { r.value = updater(r.value) }
  s.mutate = mutator => { mutator(r.value); triggerRef(r) }
  return s
}

export function computed(getter) {
  const c = _computed(getter)
  return () => c.value
}
```
