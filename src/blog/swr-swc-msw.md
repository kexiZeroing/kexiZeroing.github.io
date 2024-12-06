---
title: "SWR, SWC, and MSW"
description: ""
added: "Oct 25 2023"
tags: [web]
updatedDate: "Aug 24 2024"
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

> [swrv](https://github.com/Kong/swrv) is a port of SWR for Vue, a Vue library for data fetching.

### React Query
SWR and React Query (new name: TanStack Query) are the two most popular libraries that can be used to manage data fetching in a React application. SWR is a smaller library that focuses on providing a simple way to fetch and cache data, while React Query is a more comprehensive library that offers a wider range of features.

```jsx
// Standard fetch in useEffect example
function Bookmarks({ category }) {
  const [data, setData] = useState([])
  const [error, setError] = useState()

  useEffect(() => {
    fetch(`${endpoint}/${category}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => setError(e))
  }, [category])

  // Return JSX based on data and error state
}
```

Bugs from the above code:
1. Race Condition. Network responses can arrive in a different order than you sent them. So if you change the `category` from `books` to `movies` and the response for `movies` arrives before the response for `books`, you'll end up with the wrong data in your component. See https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect to know how to fix the `useEffect` race condition.
2. Both data and error are separate state variables, and they don't get reset when `category` changes. If we check for error first, we'll render the error UI with the old message even though we have valid data. If we check data first, we have the same problem if the second request fails.
3. If your app is wrapped in `<React.StrictMode>`, React will intentionally call your effect twice in development mode to help you find bugs like missing cleanup functions.
4. `fetch` doesn't reject on HTTP errors, so you'd have to check for `res.ok` and throw an error yourself.

> Remember about potential race conditions whenever you see an `await`. What else could happen while awaiting? After the await, is the result still relevant?

With React Query, the above code becomes:

```jsx
const useBookmarks = (category) => {
  return useQuery({
    queryKey: ['bookmarks', category],
    queryFn: async () => {
      const response = await fetch(`${endpoint}/${category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      return response.json();
    },
  });
};

const Bookmarks = ({ category }) => {
  const { isLoading, data, error } = useBookmarks(category);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>{category} Bookmarks</h2>
      <ul>
        {data.map((bookmark) => (
          <li key={bookmark.id}>{bookmark.title}</li>
        ))}
      </ul>
    </div>
  );
};
```

```jsx
// besides `useQuery`, there's also `useMutation`
function App() {
  const postQuery = useQuery({
    queryKey: ['post'],
    queryFn: () => fetch(...).then(res => res.json()),
  })

  const newPostMutation = useMutation({
    mutationFn: async (newTitle) => {
      const response = await fetch(...)
      return response.json()
    },
    onSuccess: (data) => {
      // update the cache
      queryClient.invalidateQueries(['post'])
    }
  })

  return (
    <div>
      { postQuery.data.map(post => <div key={post.id}>{post.title}</div>) }
      <button
        disabled={newPostMutation.isLoading}
        onClick={() => newPostMutation.mutate('My new post')}>
        Create new
      </button>
    </div>
  )
}
```

To manage client state in a React app, we have lots of options available, starting from the built-in hooks like `useState` and `useReducer`, all the way up to community maintained solutions like redux or zustand. But what are our options for managing server state in a React app? Historically, there weren't many. That is, until React Query came along.

While React Query goes very well with data fetching, a better way to describe it is as an async state manager that is also acutely aware of the needs of server state. In fact, React Query doesn't fetch any data for you. You provide it a promise (whether from fetch, axios, graphql, etc.), and React Query will then take the data that the promise resolves with and make it available wherever you need it throughout your entire application.

`staleTime` is the duration until a query transitions from fresh to stale. As long as the query is fresh, data will always be read from the cache only - no network request will happen. If the query is stale (which per default is: instantly), **you will still get data from the cache, but a background refetch can happen**.

Stale queries are refetched automatically in the background when:
- Its corresponding component mounts (`refetchOnMount`)
- The window is refocused (`refetchOnWindowFocus`)
- The network is reconnected (`refetchOnReconnect`)
- The query is optionally configured with a refetch interval (`refetchInterval`)

As long as a query is being actively used, the cached data will be kept in memory. What about inactive queries? `gcTime` is the duration until inactive queries will be removed from the cache. This defaults to 5 minutes, which means that if a query is not being used for 5 minutes, the cache for that query will be cleaned up.

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
- `@vitejs/plugin-react-swc` uses SWC to transform your code.

> 1. SWC is a compiler, whereas esbuild is a bundler. SWC has limited bundling capabilities, so if you're looking for something to traverse your code and generate a single file, esbuild is what you want.
> 2. `tsup` is the simplest way to bundle your TypeScript libraries with no config, powered by esbuild. It can bundle anything that's supported by Node.js natively, namely `.js`, `.json`, `.mjs`, and TypeScript `.ts`, `.tsx`.

### JSX transformation with SWC

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

### Oxc - The JavaScript Oxidation Compiler
Oxc is building a parser, linter, formatter, transpiler, minifier, resolver ... all written in Rust. This project shares the same philosophies as Biome. JavaScript tooling could be rewritten in a more performant language.

[Oxlint](https://oxc-project.github.io/docs/guide/usage/linter.html) is a JavaScript linter designed to catch erroneous or useless code without requiring any configurations by default. It is generally available at December 12, 2023.

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
