---
title: "Frontend interview questions"
description: ""
added: ""
top: true
order: 5
updatedDate: "July 20 2025"
---

1. 假设现在有 20 个异步请求需要发送，但由于某些原因，我们必须将同一时刻的并发请求数量控制在 3 个以内。实现一个并发请求函数，要求最大并发数 maxNum，每当有一个请求返回，就留下一个空位，可以增加新的请求。当所有请求完成后，结果按照 urls 里面的顺序依次输出。

> http2 支持并发请求（单个连接多路复用），但当同时发送上千个请求时，消耗大量内存，浏览器会变的明显卡顿，所以一个解决方案是给并发添加最大数量限制。如果是 http1.1，浏览器会有默认的并发限制，并不需要我们处理这个问题，比如 Chrome 中并发数量是 6 个，所以这个问题的成立是建立在 http2 的基础上。

```js
const concurrencyRequest = (urls, maxNum) => {
  return new Promise((resolve) => {
    if (urls.length === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let count = 0;
    let index = 0;

    async function request() {
      if (index === urls.length) return;
      const i = index; // 保存序号
      const url = urls[i];
      index++;

      try {
        const resp = await fetch(url);
        results[i] = resp;
      } catch (err) {
        results[i] = err;
      } finally {
        count++;
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
      // if it is non-promise value, wrap it
      // if already promise, `Promise.resolve(promises[i])` returns the same Promise
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
function debounce(fn, delay) {
  let timer = null

  return (...args) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
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

4. Implement the `bind` function by yourself.

```js
Function.prototype.myBind = function(context, ...args1) {
  const fn = this;
  
  return function(...args2) {
    return fn.apply(context, [...args1, ...args2]);
  };
};
```

5. Convert a list of objects into a tree.
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

6. Use `setTimeout` to invoke a function multiple times in the fixed interval.
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

7. Implement the functionality of `lodash.get`.
```js
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

8. Implement the render function to convert the virtual dom JSON to real DOM.
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
    if ([string, number].includes(typeof children)) {
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

9. You need to send to the browser is HTML — not a JSON tree. Write a function that turns your JSX to an HTML string. That's what React's built-in `renderToString` does.

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

10. 给定一个 JavaScript 对象，它可能包含嵌套的对象或数组。请检测其中的循环引用，并将所有循环引用的值替换为字符串 "cycle"。

```js
function cycle(obj) {
  const seen = new Set();

  function helper(o) {
    if (typeof o !== 'object' || o === null) return;
    
    seen.add(o);

    for (let key in o) {
      if (typeof o[key] === 'object' && o[key] !== null) {
        if (seen.has(o[key])) {
          o[key] = 'cycle';
          continue;
        } else {
          helper(o[key]);
        }
      }
    }
  }

  helper(obj);
  return obj;
}
```