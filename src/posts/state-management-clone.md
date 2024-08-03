---
layout: "../layouts/BlogPost.astro"
title: "State management clone"
slug: state-management-clone
description: ""
added: "Sep 8 2020"
tags: [code]
updatedDate: "Oct 30 2022"
---

```js
const createStore = function(reducer, initState) {
  let state = initState;
  let listeners = [];

  function subscribe(listener) {
    listeners.push(listener);
  }

  function dispatch(action) {
    state = reducer(state, action);
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function getState() {
    return state;
  }

  return {
    subscribe,
    dispatch,
    getState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return {
        ...state,
        count: state.count + action.payload
      }
    case "DECREMENT":
      return {
        ...state,
        count: state.count - action.payload
      }
    default:
      return state;
  }
}

// use this state management
const initState = { count: 0 };
let store = createStore(reducer, initState);

store.subscribe(() => {
  console.log("count:", store.getState().count);
});

store.dispatch({
  type: 'INCREMENT',
  payload: 2
})

store.dispatch({
  type: 'DECREMENT',
  payload: 1
})
```

### Zustand and XState Store

```js
import { create } from 'zustand'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<State & Actions>((set) => ({
  count: 0,
  increment: (qty: number) => set((state) => ({
    count: state.count + qty
  })),
  decrement: (qty: number) => set((state) => ({
    count: state.count - qty
  })),
}));

const Component = () => {
  const count = useCountStore((state) => state.count);
  const increment = useCountStore((state) => state.increment);
  const decrement = useCountStore((state) => state.decrement);
  // ...
}
```

```js
import { createStore } from '@xstate/store';
import { useSelector } from '@xstate/store/react';

const store = createStore(
  // context
  {
    count: 0
  },
  // transitions
  {
    increment: (context, { qty }: { qty: number }) => ({
      count: context.count + qty;
    }),
    decrement: (context, { qty }: { qty: number }) => ({
      count: context.count - qty;
    })
  }
);

const Component = () => {
  const count = useSelector(store, (state) => state.context.count);
  const increment = (qty) => store.send({ type: 'increment', qty });
  const decrement = (qty) => store.send({ type: 'decrement', qty });
  // ...
}
```
