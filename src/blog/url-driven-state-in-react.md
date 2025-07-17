---
title: "URL-driven state in React"
description: ""
added: "Sep 28 2024"
tags: [react]
updatedDate: "July 17 2025"
---

This post is my learning notes from the article [How to control a React component with the URL](https://buildui.com/posts/how-to-control-a-react-component-with-the-url) written by Sam Selikoff. You can also [watch the video](https://www.youtube.com/watch?v=fYqMPvPvVAc) from the author.

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

```js
"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ProductPage() {
  const searchParams = useSearchParams();
  const selectedColor = searchParams.get('color');
  const selectedSize = searchParams.get('size');

  return {
    // options to choose from ...
    <Link href={`?color=${color}&size=${selectedSize}`}>{ color }</Link>
    <Link href={`?color=${selectedColor}&size=${size}`}>{ size }</Link>
  }
}

// changing to server component also works
// `searchParams` prop is a promise in the new Next version
export default function ProductPage({ searchParams }) {
  const selectedColor = searchParams.color;
  const selectedSize = searchParams.size;
}
```

### Summary of different ways to store state in the URL

```js
// Vanilla JS
const params = new URLSearchParams(window.location.search);
params.set("theme", "dark");
window.history.replaceState({}, "", "?" + params.toString());
```

```js
// React Router
import { useSearchParams } from "react-router-dom";

function Example() {
  const [searchParams, setSearchParams] = useSearchParams();
  const updateParam = () => {
    setSearchParams({ filter: "active" });
  };

  return (
    <div>
      <button onClick={updateParam}>Set Filter</button>
      <p>Current Filter: {searchParams.get("filter")}</p>
    </div>
  );
}
```

```js
// nuqs (type-safety)
// https://nuqs.47ng.com/
import { useQueryState } from "nuqs";

function Example() {
  const [filter, setFilter] = useQueryState("filter", { defaultValue: "all" });
  const updateParam = () => {
    setFilter("active");
  };

  return (
    <div>
      <button onClick={updateParam}>Set Filter</button>
      <p>Current Filter: {filter}</p>
    </div>
  );
}
```

By default, `nuqs` will update search params:
1. On the client only (not sending requests to the server),
2. by replacing the current history entry,
3. and without scrolling to the top of the page.

Search params are strings by default, but you might want to use numbers, booleans, Dates, objects, arrays, or even custom types. This is where parsers come in.

```js
useQueryState('int', parseAsInteger.withDefault(0))

useQueryState('bool', parseAsBoolean.withDefault(false))

const [pageIndex] = useQueryState('page', parseAsIndex.withDefault(0))

const [state, setState] = useQueryState(
  'foo',
  parseAsString.withOptions({ history: 'push' })
)

setState('foo', { scroll: true })
```