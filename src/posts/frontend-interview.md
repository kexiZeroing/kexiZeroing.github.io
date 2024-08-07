---
layout: "../layouts/BlogPost.astro"
title: "Frontend interview questions"
slug: frontend-interview
description: ""
added: ""
top: true
order: 5
updatedDate: "Aug 5 2024"
---

更全面的准备可以参考:
- https://hzfe.github.io/awesome-interview
- https://github.com/Sunny-117/js-challenges
- https://blog.algomooc.com

---

1. 假设现在有 20 个异步请求需要发送，但由于某些原因，我们必须将同一时刻的并发请求数量控制在 3 个以内。实现一个并发请求函数，要求最大并发数 maxNum，每当有一个请求返回，就留下一个空位，可以增加新的请求。当所有请求完成后，结果按照 urls 里面的顺序依次输出。

> 当同时发送上千个请求时，浏览器会变的明显卡顿，虽然这样发送可以更快的获取数据，但会带来不好的用户体验，所以一个解决方案是给并发添加最大数量限制。如果是 http1.1，浏览器会有默认的并发限制，并不需要我们处理这个问题，比如 Chrome 中并发数量是 6 个，所以这个问题的成立是建立在 http2 的基础上。

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
    for(let i = 0; i < times; i++) {
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

3. Convert a list of objects into a tree.

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

4. Implement `debounce` and `throttle`.
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

5. Implement calling click event listener only once without using `{once: true}`.
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

7. Implement the render function to convert the virtual dom JSON to real DOM.
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

8. Implement the functionality of `lodash.get`.
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

9.  How to add two big integers in js?
```js
function add(A, B) {
  const AL = A.length
  const BL = B.length
  const ML = Math.max(AL, BL)

  let carry = 0, sum = ''

  for (let i = 1; i <= ML; i++) {
    let a = +A.charAt(AL - i)
    let b = +B.charAt(BL - i)

    let t = carry + a + b
    carry = Math.floor(t / 10)
    t %= 10

    sum = (i === ML && carry)
      ? carry * 10 + t + sum
      : t + sum
  }

  return sum
}
```
