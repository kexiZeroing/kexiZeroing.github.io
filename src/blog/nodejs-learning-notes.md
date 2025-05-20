---
title: "Node.js learning notes"
description: ""
added: "May 20 2025"
tags: [web]
---

Node.js website (after redesign) has a Learn section added to the site’s main navigation. I spend some time to explore it and write down some notes.

## Getting started
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
