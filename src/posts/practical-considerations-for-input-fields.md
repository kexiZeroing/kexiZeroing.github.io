---
layout: "../layouts/BlogPost.astro"
title: "Practical considerations for Input fields"
slug: practical-considerations-for-input-fields
description: ""
added: "Jun 5 2024"
updatedDate: "Aug 12 2024"
tags: [web]
---

## Dealing with contenteditable elements in Vue

```vue
<template>
  <div contenteditable="true" v-html="modelValue" @input="update"></div>
</template>

<script setup>
import { ref } from 'vue'

const modelValue = ref('')

function update(ev) {
  modelValue.value = ev.target.innerHTML
}
</script>
```

What's the issue here? Whenever the data is updated, the DOM element refreshes with the "new" data, causing the caret to jump back to the beginning of the `contenteditable` div.

A quick fix is to use `blur` event rather than `input`. So if we know there's any text content change happening between the focus shift, it qualifies as a change event. However, sometimes we need the `input` event to detect user's typing. The key here is we only want Vue to re-render when the input stops. `v-once` directive can help us here to skip subsequent re-renders. Additionally, we need to mutate the editable block's content manually.

```vue
<template>
  <div v-once contenteditable="true" v-html="modelValue" @input="update"></div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emits = defineEmits(['update:modelValue'])

function update(ev) {
  if (ev.target.innerHTML !== props.modelValue) {
    this.$emit('update:modelValue', ev.target.innerHTML)
  } 
}
</script>
```

By the way, elements that are made editable, and therefore interactive, by using the `contenteditable` attribute can be focused.

## Long list filter in React

```jsx
const hugeList = Array.from({ length: 30000 }, () => Math.random())

export default function App() {
  const [filter, setFilter] = useState('')

  return (
    <div className="App">
      <form>
        <label>
          Filter: 
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </form>
      <List filter={filter} />
    </div>
  )
}

const List = memo(({ filter }) => (
  <ul>
    {hugeList
      .filter((item) => item.toString().includes(filter))
      .map((i) => (
        <li>{i}</li>
      ))
    }
  </ul>
))
```

What's the issue here? When you type in the filter, it takes a long time to update. This is the problem with synchronous rendering. Let's opt into concurrent rendering. `useDeferredValue` is a React Hook that lets you defer updating a part of the UI, and the timeout is determined by the React scheduler, not the developer. Which means, if the React has some free cycles, it will update the deferred value, if React is too busy rendering other stuff, it not going to update the deferred value.

```jsx
export default function App() {
  const [filter, setFilter] = useState('')
  // Used to defer updating a part of the UI.
  const deferredFilter = useDeferredValue(filter)

  return (
    <div className="App">
      <form>
        <label>
          Filter: 
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </form>
      <List filter={deferredFilter} />
    </div>
  )
}
```

Now we're recomputing the list only when the deferred value changes, so we do it at a more opportune time for performance. To be more specific, during updates, the deferred value will “lag behind” the latest value. In particular, React will first re-render without updating the deferred value, and then try to re-render with the newly received value in the background.

A similar scenario uses `useTransition` hook. Both `useDeferredValue` and `useTransition` hooks are part of React's Concurrent Features and are designed to help manage expensive updates.
- `useTransition`: Primarily for handling state updates that cause expensive re-renders.
- `useDeferredValue`: For deferring the render of less important parts of the UI.

```jsx
// An example written by @asidorenko_
export default function Page() {
  const [tab, setTab] = useState(1)

  return (
    <>
      <div>
        <TabButton onClick={() => setTab(1)}>Tab 1</TabButton>
        <TabButton onClick={() => setTab(2)}>Tab 2</TabButton>
        <TabButton onClick={() => setTab(3)}>Tab 3</TabButton>
      </div>
      { tab === 1 && <Tab1 /> }
      { tab === 2 && <Tab2 /> }
      { tab === 3 && <Tab3 /> }
    </>
  )
}

function SlowComponent() {
  let startTime = performance.now()
  while (performance.now() - startTime < 10)
  return <li>Slow component</li>
}

function Tab2() {
  const items = []
  for (let i = 0; i < 100; i++) {
    items.push(<SlowComponent key={i} />)
  }
  return <ul>{items}</ul>
}

function TabButton({ children, isActive, onClick }) {
  // Used to mark updates as non-urgent.
  const [isPending, startTransition] = useTransition()

  return (
    <button
      className={cn(
        isActive && "text-pink-500",
        isPending && "opacity-50"
      )}
      onClick={() => {
        startTransition(() => {
          onClick()
        })
      }}
    >
      {children}
    </button>
  )
}
```

## Next.js Input search
The search input has a 200ms debounce. After 200ms of inactivity, the form submits, updating the URL state with `?q={search}`. The Server Component reads `searchParams` and queries the database. On form submission, a React transition starts, allowing us to read the pending status with `useFormStatus` to display an inline loading state.

```js
'use client';

import Form from 'next/form';
import { useFormStatus } from 'react-dom';
import { useDebouncedCallback } from 'use-debounce';
import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

export function Search({ query }: { query: string }) {
  let formRef = useRef<HTMLFormElement | null>(null);

  let handleInputChange = useDebouncedCallback((e) => {
    e.preventDefault();
    formRef.current?.requestSubmit();
  }, 200);

  useEffect(() => {
    formRef.current?.querySelector('input')?.focus();
  }, []);

  return (
    <Form
      ref={formRef}
      action="/"
    >
      <label htmlFor="search">
        Search
      </label>
      <Input
        onChange={handleInputChange}
        type="text"
        name="q"
        id="search"
        placeholder="Search..."
        defaultValue={query}
      />
      <LoadingIcon />
    </Form>
  );
}

function LoadingIcon() {
  let { pending } = useFormStatus();

  return pending ? (
    <div>
      <span>Loading...</span>
    </div>
  ) : null;
}
```

## Styling validation status
The `:user-valid` and `:user-invalid` pseudo-class selectors are similar to the existing `:valid` and `:invalid` pseudo-classes. Both match a form control based on whether its current value satisfies its validation constraints. However, the advantage of the new `:user-valid` and `:user-invalid` pseudo-classes is that they match a form control only after a user has significantly interacted with the input.

A form control that is required and empty will match `:invalid` even if a user has not started interacting with the page. However, that same form control won't match `:user-invalid` until the user has changed the input and left it in an invalid state.

> `:user-valid` and `:user-invalid` are available in all three browser engines (Chrome 119+)

```css
input:user-valid {
  border: 2px solid green;
}

input:user-valid + span::before {
  content: "✓";
  color: green;
}

input:user-invalid {
  border: 2px solid red;
}

input:user-invalid + span::before {
  content: "✖";
  color: red;
}
```
