---
title: "Node.js learning notes"
description: ""
added: "May 20 2025"
tags: [js]
updatedDate: "July 17 2025"
---

Node.js website (after redesign) has a Learn section added to the site’s main navigation. I spend some time to explore it and other sources I came across along the way.

## Getting Started

Node.js thrives on an event-driven architecture, making it ideal for real-time I/O.

Building apps that run in the browser is completely different from building a Node.js application. What changes is the ecosystem.

- In the browser, most of the time what you are doing is interacting with the DOM, or other Web Platform APIs. Those do not exist in Node.js. You don't have the `document`, `window` and all the other objects that are provided by the browser.
- In Node.js you control the environment. This means that you can write all the modern ES2015+ JavaScript that your Node.js version supports.
- Node.js supports both the CommonJS and ES module systems, while in the browser, we are starting to see the ES Modules standard being implemented.

Remember when every project needed axios, node-fetch, or similar libraries for HTTP requests? Those days are over. Node.js now includes the fetch API natively. Starting in Node.js 18, `fetch` is a global function, identical to the browser implementation. [Undici](https://undici.nodejs.org) is an HTTP client library that powers the fetch API in Node.js. It was written from scratch and does not rely on the built-in HTTP client in Node.js. It includes a number of features that make it a good choice for high-performance applications.

> Undici means eleven in Italian _(1.1 -> 11 -> Eleven -> Undici)_. Undici is a replacement for `http.request` because we could not improve `http.request` without breaking everybody.

Since Node.js v21, the WebSocket API has been enhanced using the Undici library, introducing a built-in WebSocket client. This simplifies real-time communication for Node.js applications. In Node.js v22.4.0 release, the WebSocket API was marked as stable, indicating it's ready for production use.

But note that Node.js v22 does not provide a built-in native WebSocket server implementation. To create a WebSocket server that accepts incoming connections from web browsers or other clients, one still need to use libraries like `ws` or `socket.io`. This means that while Node.js can now easily connect to WebSocket servers, it still requires external tools to become a WebSocket server.

## TypeScript

When you use Node.js with TypeScript, you'll need type definitions for Node.js APIs. This is available via `@types/node`. These type definitions allow TypeScript to understand Node.js APIs and provide proper type checking and autocompletion. Many popular JavaScript libraries have their type definitions available under the `@types` namespace, maintained by the DefinitelyTyped community.

Since v22.6.0, Node.js has experimental support for some TypeScript syntax via "type stripping". You can write code that's valid TypeScript directly in Node.js without the need to transpile it first. The `--experimental-strip-types` flag tells Node.js to strip the type annotations from the TypeScript code before running it.

In v22.7.0 this experimental support was extended to transform TypeScript-only syntax, like `enums` and `namespace`, with the addition of the `--experimental-transform-types` flag.

From v23.6.0 onwards, type stripping is enabled by default (you can disable it via `--no-experimental-strip-types`), enabling you to run any supported syntax, so running files like the one below with `node file.ts` is supported:

```ts
function foo(bar: number): string {
  return "hello";
}
```

> Update on 2025/07/04: Type Stripping support in upstream Node v22. This backport means the Node LTS will be able to run `*.ts` directly. No need to opt-in with a flag. No noisy console warning. It just works.

Other than the built-in support, you have 2 options: use a runner (which handles much of the complexity for you), or handle it all yourself via transpilation (using the TypeScript compiler `tsc`).

[ts-node](https://github.com/TypeStrong/ts-node) is a TypeScript execution environment for Node.js. It allows you to run TypeScript code directly in Node.js without the need to compile it first. By default, `ts-node` performs type checking unless `--transpileOnly` is enabled.

[tsx](https://github.com/privatenumber/tsx) is another TypeScript execution environment for Node.js. It allows you to run TypeScript code directly in Node.js without the need to compile it first. Note, however, that it does not type check your code. So we recommend to type check your code first with `tsc` and then run it with `tsx` before shipping it.

> `tsx` is a faster version of `ts-node` that is optimized for the CLI. How does `tsx` compare to `ts-node`?
>
> - `tsx` works out of the box without needing a `tsconfig.json` file, making it easy for beginners.
> - `tsx` can be used without installation (via `npx tsx ./script.ts`) and comes as a single binary with no peer dependencies. `ts-node` requires installation of TypeScript or SWC as peer dependencies.
> - `tsx` uses esbuild for fast compilation and does not perform type checking. `ts-node` uses the TypeScript compiler by default, with an option to use the SWC compiler for faster performance.

## Asynchronous Work

All of the I/O methods in the Node.js standard library provide asynchronous versions, which are non-blocking, and accept callback functions. Some methods also have blocking counterparts, which have names that end with `Sync`.

Let's consider a case where each request to a web server takes 50ms to complete and 45ms of that 50ms is database I/O that can be done asynchronously. Choosing non-blocking asynchronous operations frees up that 45ms per request to handle other requests. This is a significant difference in capacity just by choosing to use non-blocking methods instead of blocking methods.

Node.js provides Promise-based versions of many of its core APIs, especially in cases where asynchronous operations were traditionally handled with callbacks. This makes it easier to work with Node.js APIs and Promises, and reduces the risk of "callback hell."

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
import path from "node:path";

const notes = "/users/joe/notes.txt";

path.dirname(notes); // /users/joe
path.basename(notes); // notes.txt
path.extname(notes); // .txt
```

Using `__dirname` and the `path` module ensures that you are referencing the correct path regardless of the current working directory you’re in. `__dirname` represents the absolute path of the directory containing the current JavaScript file. `path.join()` method joins all given path segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("import.meta.url:", import.meta.url);
// --> file:///home/users/projects/example.js
console.log("__filename:", __filename);
// --> /home/users/projects/example.js
console.log("__dirname:", __dirname);
// --> /home/users/projects
console.log("directory path:", fileURLToPath(new URL(".", import.meta.url)));
// --> /home/users/projects
```

```js
import fs from "node:fs/promises";
import path from "node:path";

try {
  const filePath = path.join(__dirname, "test.txt");
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
import fs from "node:fs";
fs.readFile("/Users/joe/test.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

import fs from "node:fs/promises";
try {
  const data = await fs.readFile("/Users/joe/test.txt", { encoding: "utf8" });
  console.log(data);
} catch (err) {
  console.log(err);
}
```

```js
const fs = require("node:fs/promises");
try {
  const content = "Some content!";
  await fs.writeFile("/Users/joe/test.txt", content);
} catch (err) {
  console.log(err);
}

const fs = require("node:fs/promises");
try {
  const content = "Some content!";
  await fs.appendFile("/Users/joe/test.txt", content);
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

Node.js v20 introduced experimental support for `.env` files. You can use the `--env-file` flag to specify an environment file when running your Node.js application. _(The `--watch` flag eliminates the need for nodemon, while `--env-file` removes the dependency on dotenv.)_

```json
"scripts": {
   "dev": "node --watch --env-file=.env app.js",
   "test": "node --test --watch",
   "start": "node app.js"
 }
```

## Modules

1. CJS is the default; you have to opt-in to ESM mode. You can opt-in to ESM mode by renaming your script from `.js` to `.mjs`. Alternately, you can set `"type": "module"` in package.json, and then you can opt-out of ESM by renaming scripts from `.js` to `.cjs`.
2. "exports" can be advisable over "main" because it prevents external access to internal code (users are not depending on things they shouldn't). If you don't need that, "main" is simpler and may be a better option for you.
3. When using "exports" in `package.json`, it is generally a good idea to include `"./package.json": "./package.json"` so that it can be imported.

### CJS `module` and `require`

CommonJS treats each JavaScript file as a separate module and encloses the entire code within a function wrapper: `(function(exports, require, module, __filename, __dirname) {})`. The five parameters `exports`, `require`, `module`, `__filename`, `__dirname` are available inside each module. Even if you define a global variable in a module using `let` or `const` keywords, the variables are scoped locally to the module rather than being scoped globally.

The `module` parameter refers to the object representing the current module and `exports` is a key of the `module` object which is also an object. `module.exports` is used for defining stuff that can be exported by a module. `exports` parameter and `module.exports` are the same unless you reassign `exports` within your module.

```js
exports.name = "Alan";
exports.test = function() {};
console.log(module); // { exports: { name: 'Alan', test: [Function] } }

// exports is a reference and it's no longer same as module.exports if you change the reference
exports = {
  name: "Bob",
  add: function() {},
};
console.log(exports); // { name: 'Bob', add: [Function] }
console.log(module); // { exports: { name: 'Alan', test: [Function] } }
```

`require` keyword refers to a function which is used to import all the constructs exported using the `module.exports` from another module. The value returned by the `require` function in module y is equal to the `module.exports` object in the module x. The require function takes in an argument which can be a name or a path. You should provide the name as an argument when you are using the third-party modules or core modules provided by NPM. On the other hand, when you have custom modules defined by you, you should provide the path of the module as the argument.

CommonJS has limitations—no static analysis, no tree-shaking, and it doesn't align with browser standards.

### Requiring ESM in Node.js

The capability to `require()` ESM modules in Node.js marks an incredible milestone. This feature allows packages to be published as ESM-only while still being consumable by CJS codebases with minimal modifications.

Node 23 was released on Oct 2024 that you can now `require()` files that use ESM (import/export), which lets you import an ES Module in CommonJS and have it just work. Previously, if you wanted to use a “module” from your CommonJS file, you would need to do use dynamic import `await import('some/module/file.mjs')` and you can’t just put this at the top of your file.

> Update: In the release of version 22.12.0, it is now no longer behind a flag on v22.x. Users can check `process.features.require_module` to see whether `require(esm)` is enabled in the current Node.js instance.

```js
// Define a module in a file named 'math-utils.mjs'
export function square(x) {
  return x ** 2;
}

// main.js - ​Synchronously require the ES module in a CommonJS file
const mathUtils = require('./math-utils.mjs');
​
console.log(mathUtils.square(2));
```

## Streams

Streams process data in chunks, significantly reducing memory usage. All streams in Node.js inherit from the `EventEmitter` class, allowing them to emit events at various stages of data processing. These streams can be readable, writable, or both.

`Readable` is the class that we use to sequentially read a source of data. Typical examples of Readable streams in Node.js API are `fs.ReadStream` when reading files, `http.IncomingMessage` (i.e. `req`) when reading HTTP requests, and `process.stdin` when reading from the standard input.

`Writable` streams are useful for creating files, uploading data, or any task that involves sequentially outputting data. **While readable streams provide the source of data, writable streams act as the destination for your data.** `http.ServerResponse` (i.e. `res`) is a writable stream. Typical examples of writable streams in the Node.js API are `fs.WriteStream`, `process.stdout`, and `process.stderr`.

When working with streams, we usually want to read from a source and write to a destination, possibly needing some transformation of the data in between. The `.pipe()` method concatenates one readable stream to a writable (or transform) stream. In most cases, it is recommended to use the `pipeline()` method. This is a safer and more robust way to pipe streams together, handling errors and cleanup automatically.

Async iterators are recommended as the standard way of interfacing with the Streams API. In Node.js, all readable streams are asynchronous iterables. This means you can use the `for await...of` syntax to loop through the stream's data as it becomes available, handling each piece of data with the efficiency and simplicity of asynchronous code.

```js
import fs from "fs";
import { pipeline } from "stream/promises";

// Read the current file and output its contents in uppercase letters
await pipeline(
  fs.createReadStream(import.meta.filename),
  async function*(source) {
    for await (const chunk of source) {
      yield chunk.toString().toUpperCase();
    }
  },
  process.stdout,
);

// try {
//   await pipeline(
//     sourceStream,
//     transform1,
//     transform2,
//     destinationStream
//   );
// } catch (err) { }

// Without pipeline, you would need to write:

// sourceStream
//   .pipe(transform1)
//   .pipe(transform2)
//   .pipe(destinationStream)
//   .on('error', (err) => { });
```

## Memory

Memory for JavaScript objects, arrays, and functions is allocated in the heap. The size of the heap is not fixed, and exceeding the available memory can result in an "out-of-memory" error, causing your application to crash.

V8's memory management is based on the generational hypothesis, the idea that most objects die young. Therefore, it separates the heap into generations to optimize garbage collection:

- **New Space**: This is where new, short-lived objects are allocated. Objects here are expected to "die young", so garbage collection occurs frequently, allowing memory to be reclaimed quickly.
- **Old Space**: Objects that survive multiple garbage collection cycles in the New Space are promoted to the Old Space. These are usually long-lived objects, such as user sessions, cache data, or persistent state. Because these objects tend to last longer, garbage collection in this space occurs less often but is more resource-intensive.

Node.js offers several command-line flags to fine-tune memory-related settings, allowing you to optimize memory usage in your application.

`--max-old-space-size` sets a limit on the size of the Old Space in the V8 heap, where long-lived objects are stored. If your application uses a significant amount of memory, you might need to adjust this limit. For example, `node --max-old-space-size=4096 app.js` sets the Old Space size to 4096 MB (4 GB), which is particularly useful if your application is handling a large amount of persistent data, like caching or user session information.

`--max-semi-space-size` controls the size of the New Space in the V8 heap. New Space is where newly created objects are allocated and garbage collected frequently. Increasing this size can reduce the frequency of minor garbage collection cycles.

The `process.memoryUsage()` method provides insights into how much memory your Node.js process is using. By monitoring these values over time, you can identify if memory usage is increasing unexpectedly.

- RSS (Resident Set Size): Total memory allocated for the Node.js process, including all parts of the memory: code, stack, and heap.
- Heap Total: Memory allocated for JavaScript objects. This is the total size of the allocated heap.
- Heap Used: Memory actually used by the JavaScript objects. This shows how much of the heap is currently in use.
- External: Memory used by C++ objects that are linked to JavaScript objects. This memory is managed outside the V8 heap.
- Array Buffers: Memory allocated for ArrayBuffer objects, which are used to store fixed-length binary data.

```js
console.log("Initial Memory Usage:", process.memoryUsage());

setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`RSS: ${memoryUsage.rss}`);
}, 1000);

// Initial Memory Usage: {
//   rss: 38502400,
//   heapTotal: 4702208,
//   heapUsed: 2559000,
//   external: 1089863,
//   arrayBuffers: 10515
// }
```
