---
layout: "../layouts/BlogPost.astro"
title: "Frontend interview questions"
slug: frontend-interview
description: ""
added: ""
top: true
order: 5
updatedDate: "Apr 7 2024"
---

更全面的准备可以参考:
- https://hzfe.github.io/awesome-interview
- https://github.com/Sunny-117/js-challenges
- https://github.com/lydiahallie/advanced-web-dev-quiz

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

2. Implement `Promise.all` by yourself.
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

// Also implement `Promise.resolve` and `Promise.reject`
Promise._resolve = function (value) {
  if (value instanceof Promise) {
    return value;
  } else {
    return new Promise((resolve, reject) => {
      resolve(value);
    });
  }
};

Promise._reject = function (reason) {
  return new Promise((resolve, reject) => reject(reason));
}
```

3. Implement calling click event listener only once without using `{once: true}`.
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

4. Use setTimeout to invoke a function multiple times in the fixed interval.
```js
function repeat(func, times, ms, immediate) {
  let count = 0;

  function inner(...args) {
    count++;  
    if (count === 1 && immediate) {
      func.call(null, ...args);
    }
    if (count >= times) {
      return;
    }
    setTimeout(() => {
      inner.call(null, ...args);
      func.call(null, ...args);
    }, ms);
  }
  
  return inner;
}

// test
const repeatFunc = repeat(console.log, 4, 3000, true);
repeatFunc("hello"); 
```

5. Implement the render function to convert the virtual dom JSON to real DOM.
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

6. How to add two big integers in js?
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

```js
const max = BigInt(Number.MAX_SAFE_INTEGER);
const two = 2n;
const result = max + two;
```
