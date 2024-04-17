---
layout: "../layouts/BlogPost.astro"
title: "Intro to Bun"
slug: intro-to-bun
description: ""
added: "Jan 22 2024"
tags: [web]
updatedDate: "Jan 28 2024"
---

Bun is a fast, all-in-one toolkit for running, building, testing, and debugging JavaScript and TypeScript, from a single file to a full-stack application. The goal of Bun is to run most of the world's server-side JavaScript and provide tools to improve performance, reduce complexity, and multiply developer productivity.

- Bun is a fast JavaScript runtime, written in Zig and uses Apple’s JS Core instead of Chrome’s V8.
- Bun is a drop-in replacement for Node.js, faster than Node and Deno.
- Bun can run JavaScript, TypeScript, and JSX/TSX files out of the box.
- Bun is an npm-compatible package manager with familiar commands.
- Bun is a JavaScript bundler with best-in-class performance.
- Bun is a Jest-compatible test runner with support for snapshot testing, mocking, and code coverage.

## Quickstart
```sh
curl -fsSL https://bun.sh/install | bash

bun --version

bun upgrade
```

Run `bun init` to scaffold a new project. Let's implements a simple HTTP server with `Bun.serve`.

```js
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Bun!");
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
```

Visit https://bun.sh/guides to checkout a collection of code samples and walkthroughs for performing common tasks with Bun.

## Runtime
The bun CLI can be used to execute JavaScript/TypeScript files, `package.json` scripts, and executable packages. Bun supports TypeScript and JSX out of the box. Every file is transpiled on the fly by Bun's fast native transpiler before being executed.

```sh
bun run index.js
bun run index.jsx

# You can omit the `run` keyword; it behaves identically.
bun index.ts
bun index.tsx

# To run a file in watch mode.
bun --watch run index.tsx

# Run a `package.json` script
bun run <script>

# To see a list of available scripts
bun run
```

Bun aims for complete Node.js API compatibility. Most npm packages intended for Node.js environments will work with Bun out of the box.

Bun has native support for CommonJS and ES modules. If the target module is an ES Module, `require` returns the module namespace object (equivalent to `import * as`). If the target module is a CommonJS module, `require` returns the `module.exports` object as in Node.js. You can use `import` or `require` in the same file—they both work, all the time.

## HTTP server
To start a high-performance HTTP server with a clean API, the recommended approach is `Bun.serve`.

```js
Bun.serve({
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response("Home page!");
    if (url.pathname === "/blog") return new Response("Blog!");
    return new Response("404!");
  },
});
```

Bun provides a set of optimized APIs for reading and writing files. A `BunFile` represents a lazily-loaded file; initializing it does not actually read the file from disk.

```js
const foo = Bun.file("foo.txt");
foo.size; // number of bytes
foo.type; // MIME type

await foo.text();
await foo.arrayBuffer();

const data = `It was the best of times, it was the worst of times.`;
await Bun.write("output.txt", data);
```

The `import.meta` object is a way for a module to access information about itself. It's part of the JavaScript language, but its contents are not standardized. Each "host" (browser, runtime, etc) is free to implement any properties it wishes on the `import.meta` object.

```js
import.meta.dir;   // => "/path/to/project"
import.meta.file;  // => "file.ts"
import.meta.path;  // => "/path/to/project/file.ts"
import.meta.env;   // An alias to `process.env`
```

## Package Manager
1. If your project has a `package.json`, `bun install` can help you speed up your workflow. Switch from `npm install` to `bun install` in any Node.js project to make your installations up to 25x faster.
2. To add a particular package, run `bun add <pkg-name>`. Use `--dev` to add as a dev dependency.
3. To remove a dependency, run `bun remove <pkg-name>`.
4. Running `bun install` will create a binary lockfile called `bun.lockb` with the resolved versions of each dependency. The binary format makes reading and parsing much faster than JSON- or Yaml-based lockfiles.

All packages downloaded from the registry are stored in a global cache at `~/.bun/install/cache`. They are stored in subdirectories named like `${name}@${version}`, so multiple versions of a package can be cached. The contents of the package only exist in a single location on disk, greatly reducing the amount of disk space dedicated to `node_modules`.

Use `bunx` to auto-install and run packages from npm. It's Bun's equivalent of `npx`. `bunx` is an alias for `bun x`. The `bunx` CLI will be auto-installed when you install bun.

```sh
bunx cowsay "Hello world!"
```

## Bundler
The bundler is a key piece of infrastructure in the JavaScript ecosystem. 
- Reducing HTTP requests.
- Code transforms.

Like the Bun runtime, the bundler supports an array of file types out of the box (`js`, `jsx`, `ts`, `tsx`, `.json`, `.txt`, `.node`). If the bundler encounters an import with an unrecognized extension, it treats the imported file as an external file.

Bun's fast native bundler is now in beta. It can be used via the bun build CLI command or the `Bun.build()` JavaScript API. For each file specified in entrypoints, Bun will generate a new bundle. This bundle will be written to disk in the `./out` directory.

```js
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  minify: true,
  plugins: [ /* ... */ ]
})
```

> Bun's bundler API is inspired heavily by `esbuild`. Migrating to Bun's bundler from `esbuild` should be relatively painless. Bun's bundler does not include a built-in development server or file watcher. It's just a bundler.

## Test Runner
Bun ships with a fast, built-in, Jest-compatible test runner. Define tests with a Jest-like API imported from the built-in `bun:test` module.

```sh
bun test
bun test ./test/specific-file.test.ts

bun test --timeout 20
bun test --watch
```

```js
import { expect, test, describe } from "bun:test";

describe("arithmetic", () => {
  test("2 + 2", () => {
    expect(2 + 2).toBe(4);
  });

  test("2 * 2", () => {
    expect(2 * 2).toBe(4);
  });
});
```

## The Bun Shell
The Bun Shell is a new experimental embedded language and interpreter that allows you to run cross-platform shell scripts in JavaScript & TypeScript.

```js
import { $ } from "bun";

const welcome = await $`echo "Hello World!"`.text();
console.log(welcome); // Hello World!\n

const response = new Response("hello i am a response body");
const result = await $`cat < ${response} | wc -w`.text();
console.log(result); // 6\n
```

## Build an HTTP server using Hono and Bun
Bun is another JavaScript runtime. Hono also works on Bun.

Hono is a server-side lightweight web framework similar to Express but with modern features. It supports a ton of different server runtimes, including Deno, Bun, Cloudflare Workers, Node.js, and more.

```sh
bun create hono my-app

cd my-app
bun install

bun run --hot src/index.ts
```

```js
// https://github.com/honojs/examples
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

const Layout = (props: { children?: any }) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  )
}

const Top = (props: { messages: string[] }) => {
  return (
    <Layout>
      <h1>Hello Hono!</h1>
      <ul>
        {props.messages.map((message) => {
          return <li>{message}!!</li>
        })}
      </ul>
    </Layout>
  )
}

app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }))

app.get('/', (c) => {
  const messages = ['Good Morning', 'Good Evening', 'Good Night']
  const foo = <Top messages={messages} />
  return c.html(foo)
})

const port = parseInt(process.env.PORT!) || 3000
console.log(`Running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch
};
```
