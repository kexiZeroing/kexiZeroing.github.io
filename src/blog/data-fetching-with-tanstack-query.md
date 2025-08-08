---
title: "Data Fetching with TanStack Query"
description: ""
added: "Aug 24 2024"
tags: [react]
updatedDate: "July 18 2025"
---

## Background story

```jsx
// common fetch in useEffect example
function Bookmarks({ category }) {
  const [data, setData] = useState([])
  const [error, setError] = useState()

  useEffect(() => {
    fetch(`${endpoint}/${category}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => setError(e))
  }, [category])
}
```

Bugs from the above code:
1. Race Condition. Network responses can arrive in a different order than you sent them. So if you change the `category` from `books` to `movies` and the response for `movies` arrives before the response for `books`, you'll end up with the wrong data in your component. You need to cancel or deactivate the previous request in cleanup function to fix it, check https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect for details.
2. Both data and error are separate state variables, and they don't get reset when `category` changes. If we check for error first, we'll render the error UI with the old message even though we have valid data. If we check data first, we have the same problem if the second request fails.
3. If your app is wrapped in `<React.StrictMode>`, React will intentionally call your effect twice in development mode to help you find bugs like missing cleanup functions.
4. `fetch` doesn't reject on HTTP errors, so you'd have to check for `res.ok` and throw an error yourself.

If you're going to fetch in `useEffect()`, you should at least make sure that you're handling:
- Loading states
- Error handling (rejections & HTTP error codes)
- Race conditions & cancellation

```js
export default function useQuery(url) {
  const [data, setData] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let active = true

    const handleFetch = async () => {
      setData(null)
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(url)
        if (!active) {
          return 
        }
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`)
        }
        const json = await res.json()

        setData(json)
        setIsLoading(false)
      } catch (e) {
        setError(e.message)
        setIsLoading(false)
      }
    }

    handleFetch()

    return () => {
      active = false
    }
  }, [url])

  return { data, isLoading, error }
}
```

> `useEffect` callback cannot be async. React expects `useEffect(() => {})` to return nothing or a cleanup function — not a Promise. So if you need `await`, you must define an inner async function and call it inside the effect.

In reality, we still need to think about:
1. For every component that needs the same data, we have to refetch it.
2. It's possible that while fetching to the same endpoint, one request could fail while the other succeeds.
3. If our state is moved to "global", we've just introduced a small, in-memory cache. Since we've introduced a cache, we also need to introduce a way to invalidate it.
4. Context often becomes confusing over time. A component subscribed to QueryContext will re-render whenever anything changes – even if the change isn't related to the url it cares about.
5. We're treating asynchronous state as if it were synchronous state.

That's [why React Query](https://ui.dev/c/query/why-react-query) was created. With React Query, the above `Bookmarks` example code becomes:

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

## Intro to TanStack Query
TanStack Query (formerly known as React Query) is often described as the missing data-fetching library for web applications. It makes fetching, caching, synchronizing and updating server state in your web applications a breeze.

To manage client state in a React app, we have lots of options available, starting from the built-in hooks like `useState` and `useReducer`, all the way up to community maintained solutions like redux or zustand. But what are our options for managing server state in a React app? Historically, there weren't many. That is, until React Query came along.

A better way to describe React Query is as an async state manager that is also acutely aware of the needs of server state. In fact, React Query doesn't fetch any data for you. You provide it a promise (whether from fetch, axios, graphql, etc.), and React Query will then take the data that the promise resolves with and make it available wherever you need it throughout your entire application.

> A common mistake people do is try to combine useEffect and useQuery. useQuery already handles the state for you. If you're using a useEffect to somehow manage what you get from useQuery, you're doing it wrong.

## TanStack Query details
The library operates on well-chosen defaults. `staleTime` is the duration until a query transitions from fresh to stale. As long as the query is fresh, data will always be read from the cache only - no network request will happen. If the query is stale (which per default is: instantly), **you will still get data from the cache, but a background refetch can happen**. 

As long as a query is being actively used, the cached data will be kept in memory. What about inactive queries? A query becomes inactive when there are no active observers (i.e. no components are using it anymore). `gcTime` is the duration until inactive queries will be removed from the cache. This defaults to 5 minutes, which means that 5 minutes after a query becomes inactive, its cached data will be removed.

> - `staleTime`: How long before data is considered stale, when should revalidation happen? (default: 0)
> - `gcTime`: How long before inactive data is garbage collected, when should the cache be cleared? (default: 5 minutes)

```jsx
function TodoList() {
  // This query is "active" because the component is using it
  const { data } = useQuery({
    queryKey: ['todos'],
    gcTime: 1000 * 60 * 5 // 5 minutes
  })
  return <div>{data.map(...)}</div>
}

// When TodoList unmounts (user navigates away), the query becomes "inactive"
// If user doesn't come back to TodoList within 5 minutes (gcTime),
// the data is removed from cache
// If they return within 5 minutes, the cached data is still there!
```

If you see a refetch that you are not expecting, it is likely because you went to a different browser tab, and then came back to your app. React Query is doing a `refetchOnWindowFocus`, and data on the screen will be updated if something has changed on the server in the meantime.

For most queries, it's usually sufficient to check for the `isPending` state, then the `isError` state, then finally, assume that the data is available and render the successful state.
- `isPending` or `status === 'pending'`: If there's no cached data and no query attempt was finished yet.
- `isFetching` is true whenever the `queryFn` is executing, which includes initial pending as well as background refetches.
- `isLoading` is true whenever the query is currently fetching for the first time. It's the same as `isFetching && isPending`.

The `enabled` option is a very powerful one that can be used in Dependent Queries—queries depend on previous ones to finish before they can execute. To achieve this, it's as easy as using the `enabled` option to tell a query when it is ready to run.

```js
export const useContactDetails = (contactId: string | undefined) =>
  useQuery({
    queryKey: ["contacts", contactId],
    queryFn: () => getContact(contactId!),
    enabled: !!contactId,
  });
```

> When `enabled` is false: If the query does not have cached data, then the query will start in the `status === 'pending'` and `fetchStatus === 'idle'` state. The query will not automatically fetch on mount.

Query keys are reactive. When a key changes, React Query knows it needs fresh data. You don't manually trigger refetches, you just change the key, and React Query handles the rest. Your UI becomes a reflection of your query keys. *(I don't think I have ever passed a variable to the `queryFn` that was not part of the `queryKey`)*

The QueryKey you pass to `useQuery` gets hashed deterministically into a QueryHash, and `useQuery` will only get notified about changes to that Query.

> React Query will re-run the `select` function in two cases:
> 1. When data changes.
> 2. When the select function itself changes.

```js
function TodoList({ filter }) {
  const queryClient = useQueryClient();
  
  const { data } = useQuery({
    queryKey: ["todos", filter],
    queryFn: () => fetchTodos(filter),
    // we can pre-fill the newly created cache entry with `initialData`.
    // `initialData` goes straight to the cache.
    initialData: () => {
      return queryClient.getQueryData(['todos', 'all']);
    },
    // `placeholderData` is not persisted to the cache
    placeholderData: (previousData) => previousData,
    // Transform or select a part of the data returned by the query function
    // only re-render if this result changes
    select: (data) => { ... },
    // Refetch every 5 seconds
    refetchInterval: 5000,
  });
}
```

When using suspense mode, `status` states and `error` objects are not needed and are then replaced by usage of the Suspense and ErrorBoundary. `data` is guaranteed to be defined.

```js
import { useSuspenseQuery } from '@tanstack/react-query';

function SuspendedComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ['dataKey'],
    queryFn: fetchData
  });

  return <p>{data}</p>;
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SuspendedComponent />
    </Suspense>
  );
}
```

```jsx
// besides `useQuery`, there's also `useMutation`
function App() {
  const postQuery = useQuery({
    queryKey: ['post'],
    queryFn: () => fetch(...).then(res => res.json()),
  })

  // const queryClient = useQueryClient()
  const newPostMutation = useMutation({
    mutationFn: async (newTitle) => {
      const response = await fetch(...)
      return response.json()
    },
    onSuccess: (data) => {
      // update the cache
      queryClient.invalidateQueries({ queryKey: ['post'] })
    },
    onError: () => {
      // roll back the optimistic update
    },
    onSettled: () => {
      // always run this, regardless of success or error
    },
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

```js
// pagination example
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: getUsers,
  initialPageParam: 1,
  // fetch('/api/users?cursor=0')
  // { data: [...], nextCursor: 3}
  // fetch('/api/users?cursor=3')
  // { data: [...], nextCursor: 6}
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```

> [Pinia Colada](https://pinia-colada.esm.dev) is the smart data fetching layer for Vue.js. You don't even need to learn Pinia to use Pinia Colada because it exposes its own composables. 
> 
> Pinia Colada shares similarities with TanStack Query and has adapted some of its APIs for easier migration. However, Pinia Colada is tailored specifically for Vue, resulting in a lighter library with better and official integrations like Data Loaders. If you're familiar with TanStack Query, you'll find Pinia Colada intuitive and easy to use. The size of Pinia Colada is much smaller.