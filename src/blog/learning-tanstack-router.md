---
title: "Learning notes about TanStack Router"
description: ""
added: "Feb 23 2025"
tags: [web]
---

TanStack Router is a fully-featured client-side JavaScript framework designed for application routing. It offers a robust navigation system with support for nested layouts and efficient data loading capabilities at every point in the route tree. Best of all, It ensures type safety throughout the entire process.

## File-based routing
File-based routing is the preferred and recommended way to configure TanStack Router. You can define your routes using a series of files and directories that represent the route hierarchy of your application.

- While directories have long been used to represent route hierarchy, file-based routing introduces an additional concept of using the `.` character in the file-name to denote a route nesting. (e.g. `posts.index.tsx` and `posts.$postId.tsx`)
- Dynamic path params are denoted by the `$` character in the filename. 
- Non-path routes (without requiring a matching path in the URL) are denoted by the `_` prefix in the filename. (e.g. `_app.a.tsx`)
- Non-nested routes can be created by suffixing a parent file route segment with a `_` and are used to un-nest a route from it's parents and render its own component tree. (e.g. `posts_.$postId.edit.tsx`)

### Use file-based routing with Vite

```js
// vite.config.ts
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    viteReact(),
    // ...
  ],
})
```

### Create a router
The `router` instance is the core brains of TanStack Router and is responsible for managing the route tree, matching routes, and coordinating navigations and route transitions. The Router constructor requires a `routeTree` option. If you used file-based routing, then it's likely your generated route tree file was created at the default `src/routeTree.gen.ts` location.

```js
// src/main.tsx
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

```js
// about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return <div>About</div>
}
```

## Data loading
When loading a page for your app, it's ideal if all of the page's async requirements are fetched and fulfilled as early as possible. The router is the best place to coordinate these async dependencies as it's usually the only place in your app that knows where users are headed before content is rendered.

TanStack Router provides a built-in SWR caching layer for route loaders that is keyed on the dependencies of a route:
- The route's fully parsed pathname, e.g. `/posts/1` vs `/posts/2`
- Any additional dependencies provided by the `loaderDeps` option, e.g. `loaderDeps: ({ search: { pageIndex, pageSize } }) => ({ pageIndex, pageSize })`

To control router dependencies and "freshness", there are options to control the keying and caching behavior of your route loaders.
1. `loaderDeps` is a function that supplies you the search params for a router and returns an object of dependencies for use in your `loader` function. When these deps changed from navigation to navigation, it will cause the route to reload regardless of `staleTime`.
2. `staleTime` is the milliseconds that a route's data should be considered fresh when attempting to load. By default, `staleTime` is set to 0, meaning that the route's data will always be considered stale and will always be reloaded in the background when the route is matched and navigated to.
3. `gcTime` is the milliseconds that a route's data should be kept in the cache before being garbage collected. By default, `gcTime` is set to 30 minutes, meaning that any route data that has not been accessed in 30 minutes will be garbage collected and removed from the cache.
4. `router.invalidate()` will force all active routes to reload their loaders immediately and mark every cached route's data as stale.

```js
// routes/posts.$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params: { postId } }) => fetchPostById(postId),
})
```

```js
// /routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({
      offset,
      limit,
    }),
  component: PostsComponent,
})
```

By default, TanStack Router will show a pending component for loaders that take longer than 1 second to resolve. When the pending time threshold is exceeded, the router will render the `pendingComponent` option of the route, if configured.

## Preloading
Preloading in TanStack Router is a way to load a route before the user actually navigates to it. This is useful for routes that are likely to be visited by the user next.

By default, preloaded data is considered fresh for 30 seconds. This means if a route is preloaded, then preloaded again within 30 seconds, the second preload will be ignored. This prevents unnecessary preloads from happening too frequently. When a route is loaded normally, the standard `staleTime` is used. Preloading will start after 50ms of the user hovering or touching a `<Link>` component. You can change this delay by setting the `defaultPreloadDelay` option on your router.

- Preloading by **"intent"** works by using hover and touch start events on `<Link>` components to preload the dependencies for the destination route.
- Preloading by **"viewport"** works by using the Intersection Observer API to preload the dependencies for the destination route when the `<Link>` component is in the viewport.
- Preloading by **"render"** works by preloading the dependencies for the destination route as soon as the `<Link>` component is rendered in the DOM.

```js
import { createRouter } from '@tanstack/react-router'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
```
