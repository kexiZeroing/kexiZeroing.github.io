---
title: "Frontend interview questions"
description: ""
added: ""
top: true
order: 5
updatedDate: "Jan 12 2025"
---

更全面的准备可以参考:
- https://hzfe.github.io/awesome-interview
- https://github.com/Sunny-117/js-challenges
- https://blog.algomooc.com
- https://github.com/tigerabrodi/leetcode-2025-notes

---

1. 假设现在有 20 个异步请求需要发送，但由于某些原因，我们必须将同一时刻的并发请求数量控制在 3 个以内。实现一个并发请求函数，要求最大并发数 maxNum，每当有一个请求返回，就留下一个空位，可以增加新的请求。当所有请求完成后，结果按照 urls 里面的顺序依次输出。

> 由于 http2 支持并发处理，如果后端接口设计基于这个假设，可能不会提供批量获取数据的接口，需要前端通过 id 来逐个获取。但当同时发送上千个请求时，浏览器会变的明显卡顿，虽然这样发送可以更快的获取数据，但会带来不好的用户体验，所以一个解决方案是给并发添加最大数量限制。如果是 http1.1，浏览器会有默认的并发限制，并不需要我们处理这个问题，比如 Chrome 中并发数量是 6 个，所以这个问题的成立是建立在 http2 的基础上。

```js
const concurrencyRequest = (urls, maxNum) => {
  return new Promise((resolve) => {
    if (urls.length === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let index = 0; // 下一个请求的下标
    let count = 0; // 当前请求完成的数量

    async function request() {
      if (index === urls.length) return;
      const i = index; // 保存序号，使得 result 和 url 对应
      const url = urls[index];
      index++;

      try {
        const resp = await fetch(url);
        results[i] = resp;
      } catch (err) {
        results[i] = err;
      } finally {
        count++;
        // 判断是否所有的请求都已完成
        if (count === urls.length) {
          resolve(results);
        }
        request();
      }
    }

    const times = Math.min(maxNum, urls.length);
    for (let i = 0; i < times; i++) {
      request();
    }
  })
}

// test
const urls = [];
for (let i = 1; i <= 20; i++) {
  urls.push(`https://jsonplaceholder.typicode.com/todos/${i}`);
}
concurrencyRequest(urls, 3).then(res => {
  console.log(res);
})
```

2. Implement `Promise.all` and `Promise.resolve` by yourself.
```js
Promise._all = function (promises) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    const result = [];
    for (let i = 0; i < promises.length; i++) {
      // Use `Promise.resolve(promises[i])` instead of `promises[i].then()`, 
      // because `promises[i]` could be a non-promise so it won’t have `.then()` method
      Promise.resolve(promises[i]).then(res => {
        result[i] = res;
        counter += 1;
        if (counter === promises.length) {
          resolve(result);
        }
      }, err => {
        reject(err);
      });
    }
  });
};

Promise._resolve = function (value) {
  if (value instanceof Promise) {
    return value;
  } else {
    return new Promise((resolve, reject) => {
      resolve(value);
    });
  }
};
```

3. Implement `debounce` and `throttle`.
```js
function debounce(fn, time) {
  let timer = null

  return (...args) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => {
      fn(...args)
    }, time)
  }
}

function throttle(fn, delay) {
  let currentTime = Date.now()

  return (...args) => {
    if (Date.now() - currentTime > delay) {
      fn(...args)
      currentTime = Date.now()
    }
  }
}
```

4. Implement calling click event listener only once without using `{once: true}`.
```js
function clickOnce(el, cb) {
  const cb2 = () => {
    cb();
    el.removeEventListener('click', cb2, false);
  }
  el.addEventListener('click', cb2, false);
}

clickOnce($0, () => console.log('click'));
```

5. Implement the `bind` function by yourself.

```js
Function.prototype.myBind = function(context, ...args1) {
  const fn = this;
  
  return function(...args2) {
    return fn.apply(context, [...args1, ...args2]);
  };
};
```

6. Calling the same function over and over again is wasteful if we know that the function is pure. We can create a memoized version of a function that we don't have to reexecute it if we keep using the same value.

```js
function memoize(fn) {
  let cachedArg;
  let cachedResult;
  return function(arg) {
    if (cachedArg === arg) {
      return cachedResult;
    }
    cachedArg = arg;
    cachedResult = fn(arg);
    return cachedResult;
  };
}
```

7. Implement the deep clone method.
```js
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  let copy = Array.isArray(obj) ? [] : {};
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = typeof obj[key] === 'object' ? deepClone(obj[key]) : obj[key];
    }
  }
  return copy;
}

// `for...in` iterates over all enumerable properties, including those inherited.
// `Object.keys()` gets only own enumerable property names.
```

8. Convert a list of objects into a tree.
```js
let list = [
  { id: 1, name: 'node1', pid: 0 },
  { id: 2, name: 'node2', pid: 1 },
  { id: 3, name: 'node3', pid: 1 },
  { id: 4, name: 'node4', pid: 3 },
  { id: 5, name: 'node5', pid: 4 },
  { id: 6, name: 'node6', pid: 0 },
]

function listToTree(list) {
  const map = {}
  const roots = []

  list.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })

  list.forEach(item => {
    if (item.pid === 0) {
      roots.push(map[item.id])
    } else {
      if (map[item.pid]) {
        map[item.pid].children.push(map[item.id])
      }
    }
  })

  return roots
}
```

9. Use `setTimeout` to invoke a function multiple times in the fixed interval.
```js
function repeat(func, times, ms, immediate) {
  let count = 0;

  return function inner(...args) { 
    if (count === 0 && immediate) {
      func(...args);
      count++; 
    }
    if (count >= times) {
      return;
    }
    setTimeout(() => {
      func(...args);
      count++;
      inner(...args);
    }, ms);
  }
}

// test
const repeatFunc = repeat(console.log, 4, 3000, true);
repeatFunc("hello");
```

10. Implement the functionality of `lodash.get`.
```js
// _.get(object, path, [defaultValue])
function get(obj, path, defaultValue = undefined) {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

// test
const obj = { a: { b: { c: 42 } } };
console.log(get(obj, 'a.b.c')); // 42
console.log(get(obj, ['a', 'b', 'c'])); // 42
console.log(get(obj, 'a.b.d', 'default')); // 'default'
console.log(get(obj, 'x.y.z', 'not found')); // 'not found'
```

11. Implement a simple middleware composition system, which is a common pattern in server-side JavaScript environments. `app.use` is used to register middleware functions, and `app.compose` is meant to run them in sequence.

```js
const app = { middlewares: [] };

app.use = (fn) => {
  app.middlewares.push(fn);
};

app.compose = function() {
  // Your code goes here
}

app.use(next => {
  console.log(1);
  next();
  console.log(2);
});
app.use(next => {
  console.log(3);
  next();
  console.log(4);
});
app.use(next => {
  console.log(5);
  next();
  console.log(6);
});

app.compose();  // Logs: 1, 3, 5, 6, 4, 2
```

```js
const compose = (middlewares) => {
  return () => {
    const dispatch = (i) => {
      const fn = middlewares[i];
      if (!fn) return;
      fn(() => dispatch(i + 1));
    };
    dispatch(0);
  };
};

app.compose = compose(app.middlewares);
```

12. Implement the render function to convert the virtual dom JSON to real DOM.
```js
function render(vnode) {
  const { tag, props, children } = vnode;
  const el = document.createElement(tag);

  if (props) {
    for (const key in props) {
      const value = props[key];
      if (key.startsWith("on")) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  if (children) {
    if (typeof children === "string") {
      el.textContent = children;
    } else {
      children.forEach((item) => {
        el.appendChild(render(item));
      });
    }
  }

  return el;
}
```

13. Write a `diff` function compares an old Virtual DOM node with a new one and returns a "patch" object describing the necessary changes.

```js
function diff(oldVNode, newVNode) {
  if (!oldVNode) {
    return { type: 'CREATE', newVNode };
  }
  if (!newVNode) {
    return { type: 'REMOVE' };
  }
  if (typeof oldVNode !== typeof newVNode || oldVNode.tag !== newVNode.tag) {
    return { type: 'REPLACE', newVNode };
  }
  if (typeof newVNode === 'string') {
    if (oldVNode !== newVNode) {
      return { type: 'TEXT', newVNode };
    } else {
      return null;
    }
  }

  const patch = {
    type: 'UPDATE',
    props: diffProps(oldVNode.props, newVNode.props),
    children: diffChildren(oldVNode.children, newVNode.children),
  };
  return patch;
}

function diffProps(oldProps, newProps) {
  const patches = [];

  for (let key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patches.push({ key, value: newProps[key] });
    }
  }
  for (let key in oldProps) {
    if (!(key in newProps)) {
      patches.push({ key, value: undefined });
    }
  }
  return patches;
}

function diffChildren(oldChildren, newChildren) {
  // diff(oldChildren[i], newChildren[i])
}
```

14. You need to send to the browser is HTML — not a JSON tree. Write a function that turns your JSX to an HTML string. That's what React's built-in `renderToString` does.

```js
// written by Dan Abramov
// e.g. <div>hello<span>world</div>
// {
//   $$typeof: Symbol("react.element"),
//   type: "div",
//   props: {
//     children: [
//       "hello",
//       {
//         $$typeof: Symbol("react.element"),
//         type: "span",
//         props: {
//           children: "world"
//         }
//       }
//     ]
//   },
// }
async function renderJSXToHTML(jsx) {
  if (typeof jsx === "string" || typeof jsx === "number") {
    // This is a string. Escape it and put it into HTML directly.
    return escapeHtml(jsx);
  } else if (jsx == null || typeof jsx === "boolean") {
    // This is an empty node. Don't emit anything in HTML for it.
    return "";
  } else if (Array.isArray(jsx)) {
    const childHtmls = await Promise.all(
      jsx.map((child) => renderJSXToHTML(child))
    );
    return childHtmls.join("");
  } else if (typeof jsx === "object") {
    // Check if this object is a React JSX element.
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        let html = "<" + jsx.type;
        for (const propName in jsx.props) {
          if (jsx.props.hasOwnProperty(propName) && propName !== "children") {
            html += " ";
            html += propName;
            html += "=";
            html += escapeHtml(jsx.props[propName]);
          }
        }
        html += ">";
        html += await renderJSXToHTML(jsx.props.children);
        html += "</" + jsx.type + ">";
        return html;
      } else if (typeof jsx.type === "function") {
        // Call the component with its props, and turn its returned JSX into HTML.
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToHTML(returnedJsx);
      }
    }
  };
}
```

15. Write your own React useState and useEffect hooks.

```js
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
```

16. Implement a simplified version of Vue reactivity system.

```js
let activeEffect = null;

function reactive(target) {
  const depsMap = new Map();

  return new Proxy(target, {
    get(target, key, receiver) {
      if (!depsMap.has(key)) {
        depsMap.set(key, new Set());
      }
      const dep = depsMap.get(key);
      if (activeEffect) {
        dep.add(activeEffect);
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      const dep = depsMap.get(key);
      if (dep) {
        dep.forEach(effect => effect());
      }
      return result;
    }
  });
}

function effect(fn) {
  activeEffect = fn
  activeEffect()
  activeEffect = null
}

// Usage example
const state = reactive({ count: 0 });
effect(() => {
  console.log('Count is:', state.count);
});
state.count++;
```

17. Check if an object has circular references.

```js
// `JSON.stringify` throws if one attempts to encode an object with circular references.
function hasCircularReference(obj) {
  try {
    JSON.stringify(obj);
    return false;
  } catch (e) {
    return true;
  }
}

// use `WeakSet`
// 1. don’t need to worry about cleaning up the references manually.
// 2. O(1) time complexity.
// 3. specifically designed to store objects.
function hasCircularReference(obj) {
  const seenObjects = new WeakSet();

  function detect(obj) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.has(obj)) {
        return true;
      }
      seenObjects.add(obj);

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (detect(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  return detect(obj);
}
```

18. Parse Server-Sent Events from an API. Write a function that implements the `sseStreamIterator`, which can be used in `for await (const event of sseStreamIterator(apiUrl, requestBody))`.

```js
// https://gist.github.com/simonw/209b46563b520d1681a128c11dd117bc
async function* sseStreamIterator(apiUrl, requestBody) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  // `TextDecoder` is needed to convert the binary data (Uint8Array) into string.
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // `stream: true` keeps that partial character in an internal buffer, not incorrectly decoded.
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r\n\r\n/);
    // the last element which might be an incomplete event is removed
    // Partial data is stored in the buffer and completed with data from the next chunk.
    buffer = events.pop() || '';

    for (const event of events) {
      // could include multiple fields per event like id:, event:, in addition to the data: field.
      const lines = event.split(/\r\n/);
      const parsedEvent = {};

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.slice(6);
          try {
            parsedEvent.data = JSON.parse(dataContent);
          } catch (error) {
            parsedEvent.data = null;
            parsedEvent.data_raw = dataContent;
          }
        } else if (line.includes(': ')) {
          const [key, value] = line.split(': ', 2);
          parsedEvent[key] = value;
        }
      }

      if (Object.keys(parsedEvent).length > 0) {
        yield parsedEvent;
      }
    }
  }
}
```

```js
// TextEncoder and TextDecoder are used to convert between strings and Uint8Arrays.
// TextEncoder only supports UTF-8 encoding, 
// while TextDecoder can support various encodings.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const longMessage = "This is a longer message that we'll process in chunks";
const encodedLong = encoder.encode(longMessage);

// Simulate processing data in chunks (e.g., streaming)
const chunkSize = 10;
for (let i = 0; i < encodedLong.length; i += chunkSize) {
  const chunk = encodedLong.slice(i, i + chunkSize);
  const decodedChunk = decoder.decode(chunk, { stream: true });
  console.log(`Chunk ${i/chunkSize + 1}:`, decodedChunk);
}

// Final chunk (need to call decode without stream option to finish)
decoder.decode(); // Flush the stream
```
