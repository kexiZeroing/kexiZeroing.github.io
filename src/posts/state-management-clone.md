---
layout: "../layouts/BlogPost.astro"
title: "State management clone"
slug: state-management-clone
description: ""
added: "Sep 8 2020"
tags: [code]
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
