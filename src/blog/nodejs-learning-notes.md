---
title: "Node.js learning notes"
description: ""
added: "May 20 2025"
tags: [web]
---

Node.js website (after redesign) has a Learn section added to the site’s main navigation. I spend some time to explore it and write down some notes.

## Getting Started
Building apps that run in the browser is completely different from building a Node.js application. What changes is the ecosystem.
- In the browser, most of the time what you are doing is interacting with the DOM, or other Web Platform APIs. Those do not exist in Node.js. You don't have the `document`, `window` and all the other objects that are provided by the browser.
- In Node.js you control the environment. This means that you can write all the modern ES2015+ JavaScript that your Node.js version supports.
- Node.js supports both the CommonJS and ES module systems, while in the browser, we are starting to see the ES Modules standard being implemented.

Undici is an HTTP client library that powers the fetch API in Node.js. It was written from scratch and does not rely on the built-in HTTP client in Node.js. It includes a number of features that make it a good choice for high-performance applications.

Since Node.js v21, the WebSocket API has been enhanced using the Undici library, introducing a built-in WebSocket client. This simplifies real-time communication for Node.js applications. In Node.js v22.4.0 release, the WebSocket API was marked as stable, indicating it's ready for production use.

But note that Node.js v22 does not provide a built-in native WebSocket server implementation. To create a WebSocket server that accepts incoming connections from web browsers or other clients, one still need to use libraries like `ws` or `socket.io`. This means that while Node.js can now easily connect to WebSocket servers, it still requires external tools to become a WebSocket server.

## TypeScript
When you use Node.js with TypeScript, you'll need type definitions for Node.js APIs. This is available via `@types/node`. These type definitions allow TypeScript to understand Node.js APIs and provide proper type checking and autocompletion. Many popular JavaScript libraries have their type definitions available under the `@types` namespace, maintained by the DefinitelyTyped community.

Since v22.6.0, Node.js has experimental support for some TypeScript syntax via "type stripping". You can write code that's valid TypeScript directly in Node.js without the need to transpile it first. The `--experimental-strip-types` flag tells Node.js to strip the type annotations from the TypeScript code before running it.

In v22.7.0 this experimental support was extended to transform TypeScript-only syntax, like `enums` and `namespace`, with the addition of the `--experimental-transform-types` flag.

From v23.6.0 onwards, type stripping is enabled by default (you can disable it via `--no-experimental-strip-types`), enabling you to run any supported syntax, so running files like the one below with `node file.ts` is supported:

```ts
function foo(bar: number): string {
  return 'hello';
}
```

However, running any code that requires transformations, like the code below still needs the use of `--experimental-transform-types`:

```ts
enum MyEnum {
  A,
  B,
}
console.log(MyEnum.A);
```

Other than the built-in support, you have 2 options: use a runner (which handles much of the complexity for you), or handle it all yourself via transpilation (using the TypeScript compiler `tsc`).

[ts-node](https://github.com/TypeStrong/ts-node) is a TypeScript execution environment for Node.js. It allows you to run TypeScript code directly in Node.js without the need to compile it first. By default, `ts-node` performs type checking unless `--transpileOnly` is enabled.

[tsx](https://github.com/privatenumber/tsx) is another TypeScript execution environment for Node.js. It allows you to run TypeScript code directly in Node.js without the need to compile it first. Note, however, that it does not type check your code. So we recommend to type check your code first with `tsc` and then run it with `tsx` before shipping it.

> `tsx` is a faster version of `ts-node` that is optimized for the CLI. How does `tsx` compare to `ts-node`?
> - `tsx` works out of the box without needing a `tsconfig.json` file, making it easy for beginners.
> - `tsx` can be used without installation (via `npx tsx ./script.ts`) and comes as a single binary with no peer dependencies. `ts-node` requires installation of TypeScript or SWC as peer dependencies.
> - `tsx` uses esbuild for fast compilation and does not perform type checking. `ts-node` uses the TypeScript compiler by default, with an option to use the SWC compiler for faster performance.

## Asynchronous Work
All of the I/O methods in the Node.js standard library provide asynchronous versions, which are non-blocking, and accept callback functions. Some methods also have blocking counterparts, which have names that end with `Sync`.

Let's consider a case where each request to a web server takes 50ms to complete and 45ms of that 50ms is database I/O that can be done asynchronously. Choosing non-blocking asynchronous operations frees up that 45ms per request to handle other requests. This is a significant difference in capacity just by choosing to use non-blocking methods instead of blocking methods.

Node.js provides Promise-based versions of many of its core APIs, especially in cases where asynchronous operations were traditionally handled with callbacks. This makes it easier to work with Node.js APIs and Promises, and reduces the risk of "callback hell."

In addition to Promises, Node.js provides several other mechanisms for scheduling tasks in the event loop.

`queueMicrotask()` is used to schedule a microtask, which is a lightweight task that runs after the currently executing script but before any other I/O events or timers. Similar to Promise callbacks.

`process.nextTick()` is used to schedule a callback to be executed immediately after the current operation completes (before the event loop continues.) Has the highest priority.

`setImmediate()` is used to execute a callback after the current event loop cycle finishes and all I/O events have been processed.

> 1. A `process.nextTick` callback is added to `process.nextTick` queue. A `Promise.then()` callback is added to promises microtask queue. A `setTimeout`, `setImmediate` callback is added to macrotask queue.
> 2. Event loop executes tasks in `process.nextTick` queue first, and then executes promises microtask queue, and then executes macrotask queue.

## Manipulating Files
The `node:fs` module enables interacting with the file system in a way modeled on standard POSIX functions. You can either use the callback APIs or use the promise-based APIs.

> A file descriptor is a way of representing an open file in a computer operating system. It's like a special number that identifies the file, and the operating system uses it to keep track of what's happening to the file. You can use the file descriptor to read, write, move around in the file, and close it. In a runtime like Node.js, the `fs` module abstracts the direct use of file descriptors by providing a more user-friendly API, but it still relies on them behind the scenes to manage file operations.

```js
const fs = require("node:fs/promises");
async function open_file() {
  try {
    const file_handle = await fs.open("test.js", "r", fs.constants.O_RDONLY);
    console.log(file_handle.fd); // Print the value of the file descriptor `fd`
  } catch (err) {
    // i.e. ENOENT error stands for "Error NO ENTry" (File in path doesn't exist)
  }
}
```

Given a path, you can extract information out of it using `dirname` to get the parent folder of a file, `basename` to get the filename part, `extname` to get the file extension.

```js
import path from 'node:path';

const notes = '/users/joe/notes.txt';

path.dirname(notes); // /users/joe
path.basename(notes); // notes.txt
path.extname(notes); // .txt
```

Using `__dirname` and the `path` module ensures that you are referencing the correct path regardless of the current working directory you’re in. `__dirname` represents the absolute path of the directory containing the current JavaScript file. `path.join()` method joins all given path segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.

```js
import fs from 'node:fs/promises';
import path from 'node:path';

try {
  const filePath = path.join(__dirname, 'test.txt');
  const stats = await fs.stat(filePath);
  stats.isFile(); // true
  stats.isDirectory(); // false
  stats.isSymbolicLink(); // false
  stats.size; // 1024000 //= 1MB
} catch (err) {
  console.log(err);
}
```

```js
import fs from 'node:fs';
fs.readFile('/Users/joe/test.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

import fs from 'node:fs/promises';
try {
  const data = await fs.readFile('/Users/joe/test.txt', { encoding: 'utf8' });
  console.log(data);
} catch (err) {
  console.log(err);
}
```

```js
const fs = require('node:fs/promises');
try {
  const content = 'Some content!';
  await fs.writeFile('/Users/joe/test.txt', content);
} catch (err) {
  console.log(err);
}

const fs = require('node:fs/promises');
try {
  const content = 'Some content!';
  await fs.appendFile('/Users/joe/test.txt', content);
} catch (err) {
  console.log(err);
}
```

## Command Line
The usual way to run a Node.js program is to run the globally available `node` command. You can also embed this information into your JavaScript file with a "shebang" line. To use a shebang, your file should have executable permission (`chmod u+x app.js`).

As of Node.js v16, there is a built-in option to automatically restart the application when a file changes. This is useful for development purposes. To use this feature, you need to pass the `--watch` flag to Node.js.

The `process` core module of Node.js provides the `env` property which hosts all the environment variables that were set at the moment the process was started.

```js
// USER_ID=239482 USER_KEY=foobar node app.js

console.log(process.env.USER_ID); // "239482"
console.log(process.env.USER_KEY); // "foobar"
```

Node.js v20 introduced experimental support for `.env` files. You can use the `--env-file` flag to specify an environment file when running your Node.js application.

Node.js since v7 provides the `readline` module to get input from a readable stream such as the `process.stdin` stream, which during the execution of a Node.js program is the terminal input, one line at a time.
