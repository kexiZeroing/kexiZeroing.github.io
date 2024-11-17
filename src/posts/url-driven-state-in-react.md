---
layout: "../layouts/BlogPost.astro"
title: "URL-driven state in React"
slug: url-driven-state-in-react
description: ""
added: "Sep 28 2024"
tags: [react, code]
---

This post is my learning notes from the article [How to control a React component with the URL](https://buildui.com/posts/how-to-control-a-react-component-with-the-url).

When you build a searchable table, you may have code below.

```jsx
export default function Home() {
  let [search, setSearch] = useState('');
  let { data, isPlaceholderData } = useQuery({
    queryKey: ['people', search],
    queryFn: async () => {
      let res = await fetch(`/api/people?search=${search}`);
      let data = await res.json();

      return data as Response;
    },
    placeholderData: (previousData) => previousData,
  });

  return (
    <>
      <Input
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Find someone..."
      />
      <Table>...</Table>
    </>
  );
}
```

Since all our state is in React, the search text and table data don't survive page reloads. And this is where the feature request comes in: "Can we make this screen shareable via the URL?" We're using Next.js, so we can grab the router from `useRouter` and the current path from `usePathname`, and call `router.push` to update the URL with the latest search text.

```jsx
export default function Home() {
  let searchParams = useSearchParams(); 
  let [search, setSearch] = useState(searchParams.get('search') ?? ''); 
  
  let { data, isPlaceholderData } = useQuery({
    // ...
  });

  let router = useRouter();
  let pathname = usePathname();

  useEffect(() => {
    if (search) {
      router.push(`${pathname}?search=${search}`);
    }
  }, [pathname, router, search]);

  // ...
}
```

Seems to be working. But we forgot one more thing. The Back and Forward buttons are changing the URL, but they're not updating our React state. The table isn't updating.

It's important to note that the `useState` hook only sets the initial state. When the component reruns due to URL changes, the `useState` call doesn't update the existing state.
- The component will rerun. *(The `useSearchParams` hook is sensitive to URL changes)*
- The URL will change.
- The searchParams will reflect the new URL.
- But the `search` state will not automatically update to reflect the new URL, because `useState` doesn't re-initialize on rerenders.

To fix this, you could add another effect that updates the `search` state when the URL changes:

```jsx
useEffect(() => {
  setSearch(searchParams.get('search') ?? '');
}, [searchParams]);
```

We're heading down a bad road. And the fundamental reason why is that we now have two sources of truth for the search text:
1. The `search` state from React
2. The `?search` query param from the URL

Users can change the URL on their own using the address bar or navigation controls. The `?search` query param is really the source of truth for the search text. We should eliminate the React state from our code, and instead derive the search text from the URL.

Let's delete our React state and derive search from the search params instead. Then, whenever we type into our input, we want it to update the URL instead of setting state.

```jsx
export default function Home() {
  let searchParams = useSearchParams();
  let search = searchParams.get('search') ?? '';
  
  let { data, isPlaceholderData } = useQuery({
    queryKey: ['people', search],
    queryFn: ...
  });

  return (
    <>      
      <Input
        value={search}
        onChange={(e) => {
          let search = e.target.value;
          
          if (search) {
            router.push(`${pathname}?search=${search}`);
          } else { 
            router.push(pathname); 
          }
        }}
      />
      <Table>...</Table>
    </>
  );
}
```

This version of the code works well. No effects, no juggling multiple states to keep them in sync, and no bugs.

Learning how to spot duplicated sources of truth is a big step in leveling up as a React developer. The next time you find yourself fighting a bug that has some confusing `useEffect` code behind it, instead of trying to fix the edge case by adding one more branch of logic or introducing another effect, try this:
- Pause, and take a step back from the details of the effect code
- See if the effect is setting some state
- Check to see whether that state is already represented in some other component or external system, and
- If it is, eliminate it

> STOP using useState, instead put state in URL: https://www.youtube.com/watch?v=ukpgxEemXsk

```js
// client component
"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ProductPage() {
  const searchParams = useSearchParams();
  const selectedColor = searchParams.get('color');
  const selectedSize = searchParams.get('size');

  return {
    // ...
    <Link href={`?color=${selectedColor}&size=${selectedSize}`}> 
  }
}

// server component
export default function ProductPage({ searchParams }) {
  const selectedColor = searchParams.color;
  const selectedSize = searchParams.size;
}
```

More advanced features to note here from the article [Managing Advanced Search Param Filtering in the Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router).

The issue for the search/filter: It all comes down to the way the Next.js router works. We click a category, but the URL does not update until the data fetching is resolved. The router is waiting for the server components to finish rendering on the server before it updates the URL. Since we are relying on the URL to be updated instantly, our implementation logic breaks.

We learn to track the pending state of the search with `useTransition()`, implement a responsive category filter with `useOptimistic()`, and coordinate the search and filter state with a React Context provider. Finally, we switched to using `nuqs` *(a library that provides a type-safe way to manage search params as state in React)* for a more robust solution.
