---
title: "New to MobX in React"
description: ""
added: "Oct 26 2025"
tags: [react]
---

## Why use MobX
MobX is a simple, scalable and battle tested state management solution. You can start learning it from https://mobx.js.org/getting-started.

In large enterprise apps, state is not just a few `useState` variables, but a complex, reactive graph of data that changes from many sources. MobX’s philosophy is *“Anything that can be derived from state, should be derived automatically.”* That means no manual setState, no reducers, no boilerplate — MobX tracks dependencies automatically.

## Core concepts of MobX

| Concept           | Description                                | Example                                             |
| ----------------- | ------------------------------------------ | --------------------------------------------------- |
| `@observable`     | Marks state as reactive                    | `@observable count = 0`                             |
| `@computed`       | Derives new data from existing state       | `@computed get doubled() { return this.count * 2 }` |
| `@action`         | Modifies state in an organized way         | `@action increase() { this.count++ }`               |
| `runInAction`     | Updates observable state inside async code | `runInAction(() => { this.count = res.value })`     |
| `@observable.ref` | Tracks reference only (not deep)           | `@observable.ref data = someProtoMessage`           |
| `observer()`      | Makes React component reactive             | `observer(() => <div>{store.count}</div>)`          |

> @observable.ref Explained:
> `@observable` deeply tracks objects and arrays. `@observable.ref` tracks only the reference, not inner fields. Use `@observable.ref` when you want MobX to react only when you replace the object entirely.

MobX enforces that state changes must happen inside actions. When fetching async data, use `runInAction` to safely mutate observables:

```js
async fetchUser() {
  const data = await fetch("/api/user").then(res => res.json());
  runInAction(() => {
    this.user = data;
  });
}
```

### Understanding `autorun()`
`autorun()` automatically tracks any observable values used inside its function. When one of those values changes, the function re-runs, but only if the result of the computation actually changes.

```js
const todoStore = observable({
  todos: [],
  get unfinishedCount() {
    return this.todos.filter(t => !t.done).length;
  }
});

autorun(() => {
  console.log("Unfinished todos:", todoStore.unfinishedCount);
});

todoStore.todos.push({ task: "read docs", done: false }); // logs → Unfinished todos: 1
todoStore.todos[0].done = true;                           // logs → Unfinished todos: 0
todoStore.todos[0].task = "rename task";                  // no log — count didn’t change

// Another example with observable nested objects
const user = observable({
  profile: { name: "Alice", age: 20 }
});

autorun(() => {
  console.log("User name:", user.profile.name);
});

user.profile.name = "Bob";  // logs → User name: Bob
user.profile.age = 21;      // no log — name didn’t change
```

This behavior is the foundation of MobX’s reactivity system. It’s dependency-aware, meaning it only re-executes if the specific values used inside the function actually change. The `observer()` function in React is built on this exact idea, you can think of each reactive component as its own `autorun`, which re-renders only when the data it reads during rendering changes.

## Use MobX in React
Let’s write an example using decorators syntax, which is cleaner and more common in large MobX apps.

```js
import { makeObservable, observable, action, computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

class CounterStore {
  @observable.ref count = 0;

  constructor() {
    makeObservable(this);
  }

  @action increase() {
    this.count++;
  }

  @action decrease() {
    this.count--;
  }

  @computed get doubled() {
    return this.count * 2;
  }
}

const store = new CounterStore();

const Counter = observer(({ store }: { store: CounterStore }) => (
  <div>
    <p>Count: {store.count}</p>
    <p>Double: {store.doubled}</p>
    <button onClick={() => store.decrease()}>-</button>
    <button onClick={() => store.increase()}>+</button>
  </div>
));

export default function App() {
  return <Counter store={store} />;
}
```

The `observer()` function from `mobx-react-lite` is what makes your React component reactive. Under the hood, this higher-order component (HoC) works similarly to MobX’s `autorun`: it automatically tracks all observable values accessed during rendering. When any of those observables change, MobX knows exactly which components depend on them and re-renders only those components. This makes MobX both magical and efficient — you don’t need to manually connect state or trigger updates; components simply re-render whenever the data they rely on changes.
