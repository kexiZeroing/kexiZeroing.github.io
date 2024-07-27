---
layout: "../layouts/BlogPost.astro"
title: "React hooks clone"
slug: react-hooks-clone
description: ""
added: "Sep 12 2020"
tags: [react, code]
updatedDate: "Oct 30 2022"
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
    let ignore = false

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
