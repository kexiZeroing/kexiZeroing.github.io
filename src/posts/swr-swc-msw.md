---
layout: "../layouts/BlogPost.astro"
title: "SWR, SWC, and MSW"
slug: swr-swc-msw
description: ""
added: "Oct 25 2023"
tags: [web]
---

SWR, SWC, and MSW, three similar names, are always mentioned in the context of web development, but they are totally different things. In this article, we will learn each of them and where they are used.

## SWR - React Hooks for Data Fetching
The name “SWR” is derived from `stale-while-revalidate`, a HTTP cache invalidation strategy. SWR is created by the same team behind Next.js. 

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

### Automatic Revalidation
- When you re-focus a page or switch between tabs, SWR automatically revalidates data.
- SWR will give you the option to automatically refetch data on interval.
- It's useful to also revalidate when the user is back online.

### Mutation - manually revalidate the data
There're 2 ways to use the mutate API to mutate the data, the global mutate API which can mutate any key and the bound mutate API which only can mutate the data of corresponding SWR hook.

When you call `mutate(key)` (or just `mutate()` with the bound mutate API) without any data, it will trigger a revalidation (mark the data as expired and trigger a refetch) for the resource.

```jsx
// an example of bound mutate 
function Profile () {
  const { data, mutate } = useSWR('/api/user', fetcher)
 
  return (
    <div>
      <h1>My name is {data.name}.</h1>
      <button onClick={async () => {
        const newName = data.name.toUpperCase()
        await requestUpdateUsername(newName)
        // update the local data immediately and revalidate (refetch)
        mutate({ ...data, name: newName })
      }}>Uppercase my name!</button>
    </div>
  )
}
```

SWR and React Query (new name: TanStack Query) are the two most popular libraries that can be used to manage data fetching in a React application. SWR is a smaller library that focuses on providing a simple way to fetch and cache data, while React Query is a more comprehensive library that offers a wider range of features.

## SWC - Rust-based platform for the Web
SWC (stands for Speedy Web Compiler) is a super-fast TypeScript / JavaScript compiler written in Rust, and can be used for both compilation and bundling. SWC is 20x faster than babel on a single-core benchmark, 68x faster than babel on a multicore benchmark. 

```sh
npm i -D @swc/cli @swc/core

# Transpile one file and emit to stdout
npx swc ./file.js
 
# Transpile one file and emit to `output.js`
npx swc ./file.js -o output.js
```

SWC is able to bundle multiple JavaScript or TypeScript files into one. This feature is currently named `spack`. ——This feature is still under construction. Also, the main author of SWC works for Turbopack by Vercel, so this feature is not a something that will be actively developed.

SWC is now a mature replacement for Babel, which was used in Vite 3.0. Vite 4.0 adds support for SWC. From Vite 4, two plugins are available for React projects with different tradeoffs.
- `@vitejs/plugin-react` is the default Vite plugin for React projects, which uses esbuild and Babel.
- `@vitejs/plugin-react-swc` uses SWC to transform your code. *(SWC is a compiler, whereas esbuild is a bundler)*

> SWC is a compiler, whereas esbuild is a bundler. SWC has limited bundling capabilities, so if you're looking for something to traverse your code and generate a single file, esbuild is what you want. The Next.js Compiler, written in Rust using SWC, allows Next.js to transform and minify your JavaScript code for production.

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