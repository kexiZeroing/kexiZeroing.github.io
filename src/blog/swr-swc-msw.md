---
title: "SWR, SWC, and MSW"
description: ""
added: "Oct 25 2023"
tags: [web]
updatedDate: "July 18 2025"
---

SWR, SWC, and MSW, three similar names, are always mentioned in the context of web development, but they are totally different things. In this article, we will learn each of them and where they are used.

## SWR - React Hooks for Data Fetching
The name “SWR” is derived from `stale-while-revalidate`, a cache invalidation strategy. SWR is a strategy to first return the data from cache (stale), then send the fetch request (revalidate), and finally come with the up-to-date data.

`useSWR` accepts a key and a fetcher function. The key is a unique identifier of the request, normally the URL of the API. And the fetcher accepts key as its parameter and returns the data asynchronously. The fetcher can be any asynchronous function, you can use your favourite data-fetching library to handle that part.

```jsx
import useSWR from 'swr'
// you can use the native fetch or tools like Axios
const fetcher = (...args) => fetch(...args).then(res => res.json())
 
function Profile () {
  const { data, error, isLoading } = useSWR('/api/user/123', fetcher)
 
  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
 
  return <div>hello {data.name}!</div>
}
```

When building a web app, you might need to reuse the data in many places of the UI. It is incredibly easy to create reusable data hooks on top of SWR:

```jsx
function useUser (id) {
  const { data, error, isLoading } = useSWR(`/api/user/${id}`, fetcher)
 
  return {
    user: data,
    isLoading,
    isError: error
  }
}

// use it in your components
function Content () {
  const { user, isLoading } = useUser()
  if (isLoading) return <Spinner />
  return <h1>Welcome back, {user.name}</h1>
}
 
function Avatar () {
  const { user, isLoading } = useUser()
  if (isLoading) return <Spinner />
  return <img src={user.avatar} alt={user.name} />
}
```

By adopting this pattern, you can forget about fetching data in the imperative way: start the request, update the loading state, and return the final result. Instead, your code is more declarative: you just need to specify what data is used by the component.

The most beautiful thing is that there will be only 1 request sent to the API, because they use the same SWR key (normally the API URL) and the request is cached and shared automatically. Also, the application now has the ability to refetch the data on user focus or network reconnect.

> If both components mount at the same time and SWR sees both use the same key, SWR only triggers one network request thanks to **deduplication**. If a request is already in progress for that key, SWR won’t send another, instead it reuses the in-flight promise. This deduplication is controlled by the `dedupingInterval` (default: 2000ms), which means: Any requests for the same key within this time window will be deduplicated.

### Automatic Revalidation
1. When you re-focus a page or switch between tabs, SWR automatically revalidates data. This can be useful to immediately synchronize to the latest state. This is helpful for refreshing data in scenarios like stale mobile tabs, or laptops that went to sleep.

2. SWR will give you the option to revalidate on interval. You can enable it by setting a `refreshInterval` value.

3. It's useful to also revalidate when the user is back online. This feature is enabled by default.

### Mutation - Manually revalidate the data
There're 2 ways to use the mutate API to mutate the data, the global mutate API which can mutate any key and the bound mutate API which only can mutate the data of corresponding SWR hook.

When you call `mutate(key)` or just `mutate()` with the bound mutate API without any data, it will trigger a revalidation (mark the data as expired and trigger a refetch) for the resource.

```js
// global mutate
import { useSWRConfig } from "swr"
 
function App() {
  const { mutate } = useSWRConfig()
  mutate(key, data, options)
}
```

```jsx
// bound mutate 
function Profile () {
  const { data, mutate } = useSWR('/api/user', fetcher)
 
  return (
    <div>
      <h1>My name is {data.name}.</h1>
      <button onClick={async () => {
        const newName = data.name.toUpperCase()
        // send a request to the API to update the data
        await requestUpdateUsername(newName)
        // update the local data immediately and revalidate (refetch)
        mutate({ ...data, name: newName })
      }}>Uppercase my name!</button>
    </div>
  )
}
```

SWR also provides `useSWRMutation` as a hook for remote mutations.

```js
import useSWRMutation from 'swr/mutation'
 
async function sendRequest(url, { arg }: { arg: { username: string }}) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg)
  }).then(res => res.json())
}
 
function App() {
  const { trigger, isMutating } = useSWRMutation('/api/user', sendRequest, /* options */)
 
  return (
    <button
      disabled={isMutating}
      onClick={async () => {
        try {
          const result = await trigger({ username: 'johndoe' }, /* options */)
        } catch (e) {
          // error handling
        }
      }}
    >
      Create User
    </button>
  )
}
```

> [swrv](https://github.com/Kong/swrv) is a port of SWR for Vue, a Vue library for data fetching. It supports both Vue2 and Vue3.

## SWC - Rust-based platform for the Web
SWC (stands for Speedy Web Compiler) is a super-fast TypeScript / JavaScript compiler written in Rust, and can be used for both compilation and bundling. SWC is 20x faster than babel on a single-core benchmark, 68x faster than babel on a multicore benchmark. 

> JavaScript can only work on one core at a time. Languages like Go and Rust have multi-threading support built-in, which means they can use multiple CPU cores to parallelize as much work as possible.

```sh
npm i -D @swc/cli @swc/core

# Transpile one file and emit to stdout
npx swc ./file.js
 
# Transpile one file and emit to `output.js`
npx swc ./file.js -o output.js
```

SWC is able to bundle multiple JavaScript or TypeScript files into one. This feature is currently named `spack`. ——This feature will be dropped in v2, in favor of SWC-based bundlers like Parcel, Turbopack, rspack.

SWC is a mature replacement for Babel. Starting with Vite 4, SWC is supported as a modern alternative to Babel. Vite now offers two official plugins for React projects, each with different tradeoffs:
- `@vitejs/plugin-react` is the default Vite plugin for React projects, which uses esbuild and Babel.
- `@vitejs/plugin-react-swc` uses SWC to transform your code.

SWC and esbuild are both fast compilers for JavaScript and TypeScript, but they serve different purposes. **SWC**, written in Rust, is mainly used as a drop-in replacement for Babel, focusing on fast code transformation. **esbuild**, written in Go, is a bundler and transformer known for its speed, and it's often used internally by tools like Vite for dependency pre-bundling.

```js
// npm install @swc/core @swc/cli --save-dev

const { transformFileSync } = require('@swc/core');
const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, 'example.jsx');
const outputFilePath = path.join(__dirname, 'example.js');

const output = transformFileSync(inputFilePath, {
  jsc: {
    parser: {
      syntax: 'ecmascript',
      jsx: true
    },
    transform: {
      react: {
        runtime: 'classic', // use React.createElement
      }
    }
  }
});

fs.writeFileSync(outputFilePath, output.code);
console.log('Transformation complete. Output written to example.js');
```

### Biome - Toolchain of the web
- Biome is a fast formatter that scores 96% compatibility with Prettier.
- Biome is a performant (and pre-configured) linter that features more than 170 rules from ESLint, TypeSCript ESLint, and other sources.
- Biome is designed from the start to be used interactively within an editor. It can format and lint malformed code as you are writing it.

```sh
npx @biomejs/biome init

npx @biomejs/biome format path/to/file
npx @biomejs/biome lint
npx @biomejs/biome check
```

```sh
# https://biomejs.dev/guides/migrate-eslint-prettier
biome migrate eslint --write
biome migrate prettier --write
```

### Oxc - The JavaScript Oxidation Compiler
[Oxc](https://oxc.rs) is building a parser, linter, formatter, transpiler, minifier, resolver ... all written in Rust. This project shares the same philosophies as Biome. JavaScript tooling could be rewritten in a more performant language.

### Rolldown - Fast Rust-based bundler
[Rolldown](https://rolldown.rs) is a Rust-based next-generation bundler with Rollup-compatible API. Oxc acts as foundational layer for Rolldown, providing the necessary building blocks for efficient JavaScript and TypeScript processing.

Rolldown is primary designed to serve as the underlying bundler in Vite, with the goal to replace esbuild and Rollup with one unified build tool. Although designed for Vite, Rolldown is also fully capable of being used as a standalone, general-purpose bundler. It can serve as a drop-in replacement for Rollup in most cases.

> 1. A deep analysis on why bundlers are still needed: https://rolldown.rs/guide/in-depth/why-bundlers
> 
> 2. Try out the Rolldown-powered Vite today by using the [rolldown-vite](https://voidzero.dev/posts/announcing-rolldown-vite) package instead of the default vite package. It is a drop-in replacement, as Rolldown will become the default bundler for Vite in the future.

```json
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

[tsdown](https://tsdown.dev) is built on top of Rolldown. While Rolldown is a powerful and general-purpose tool, tsdown is optimized specifically for building libraries. It includes features like automatic TypeScript declaration generation and multiple output formats.

`tsdown` was heavily inspired by `tsup`, and even incorporates parts of its codebase. While `tsup` is built on top of esbuild, `tsdown` leverages the power of Rolldown to deliver a faster and more powerful bundling experience.

## MSW - API mocking library
Mock Service Worker is an API mocking library for browser and Node.js that uses a Service Worker to intercept requests that actually happened. Developers come to MSW for various reasons: to establish proper testing boundaries, to prototype applications, debug network-related issues, or monitor production traffic.

Mock Service Worker intercepts requests on the network level. It respects the Fetch API specification, which means that the mocked responses you construct are the same responses you would receive when making a fetch call.

```js
// MSW 2.0 new syntax
import { http, HttpResponse } from 'msw'
 
export const handlers = [
  http.get('/resource', () => {
    return HttpResponse.text('Hello world!')
  }),
]
```

With MSW, we no longer need to worry about mocking specific libraries like Axios or the fetch method. It provides a library-agnostic solution, enabling consistent tests regardless of the underlying HTTP library used in our projects.
