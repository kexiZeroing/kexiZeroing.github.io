---
title: "React 19 and Next.js Forms have both changed"
description: ""
added: "Feb 22 2025"
tags: [web, react]
updatedDate: "Jun 30 2025"
---

## React 19 `useActionState` and `useFormStatus`
React 19 has a built-in mechanism for handling forms called "actions". Below is an example from [Shruti Kapoor's video](https://www.youtube.com/watch?v=ExZUdkfu-KE) shows how to convert a form from React 18 to React 19.

- There’s no need to add `event.preventDefault` because that’s handled for us by React.
- The `action` is automatically treated as a transition.
- We can hook into the pending state of this action using `useFormStatus`.
- React manages errors and race conditions to ensure our form’s state is always correct.

```js
// React 18
function App() {
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState("");

  const handleChange = (event) => {
    setName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsPending(true);
    setTimeout(() => {
      // call API
      setIsPending(false);
    }, [1000]);
  };

  return (
    <form>
      <input type="text" name="name" onChange={handleChange} />
      { isPending ? <p>{"Loading"}</p> : <p> Hello in React 18 {name}</p> }
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
    </form>
  );
}
```

```js
// React 19
function RenderName({ name }) {
  // https://react.dev/reference/react-dom/hooks/useFormStatus
  // `useFormStatus` will only return status information for a parent <form>
  const { pending } = useFormStatus();
  return <div>{pending ? "Loading" : `Hello in React 19 ${name}` }</div>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      Update
    </button>
  );
}

function App() {
  // https://react.dev/reference/react/useActionState
  // You pass `useActionState` an existing form action function as well as an initial state,
  // and it returns a new action that you use in your form, along with the latest form state.
  // The latest form state is also passed to the function that you provided.
  const [state, formAction] = useActionState(submitFormAction, { name: "" });

  return (
    <form action={formAction}>
      <input type="text" name="inputName" />
      <RenderName name={state?.name} />
      <SubmitButton /> 
    </form>
  );
}

// actions.js
'use server';

export const submitFormAction = async (previousState, formData) => {
  const name = formData.get("name");
  await new Promise((res) => setTimeout(res, 1000));
  return { ...previousState, name: name };
};
```

There is another example from React Conf 2024 displaying a message box, which is progressively enhanced with React 19 features. **The main functionality of the form works without JavaScript**.

```js
// https://www.youtube.com/watch?v=X9cw4VczYVg
export default function MessageInput({ userId }) {
  const [state, submitMessageAction] = useActionState(submitMessage, {
    success: false,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error, state.timestamp]);

  return (
    <>
      <form action={submitMessageAction} className="flex flex-col gap-2 p-6">
        <input
          autoComplete="off"
          required
          minLength={1}
          name="content"
          className="italic outline-none"
          placeholder="Type a message..."
        />
        <input type="hidden" name="userId" value={userId} />
        {/* get pending status using `useFormStatus()` inside the button component */}
        <SubmitButton>Send</SubmitButton>
      </form>
    </>
  );
}

export async function submitMessage(_prevState, formData) {
  // z.object({
  //   content: z.string().min(1, {
  //     message: 'Content must be at least 1 characters long',
  //   }),
  //   createdById: z.string().uuid({
  //     message: 'Invalid user ID',
  //   }),
  // });
  const result = messageSchema.safeParse({
    content: formData.get('content'),
    createdById: formData.get('userId'),
  });

  if (!result.success) {
    return {
      error: 'Invalid message!',
      success: false,
      timestamp: new Date(),
    };
  }

  await prisma.message.create({
    data: result.data,
  });

  revalidatePath('/');

  return {
    success: true,
  };
}
```

### `useOptimistic` use case
This hook lets you update the UI immediately in response to an action, before the server responds. You pass to it the current state you want to manage, and a (optional) function to update the optimistic state. It returns you the optimistic state (which you use for immediate rendering), and a function to update it.

```js
'use server'

type Todo = {
  todo: string
}

export async function addTodo(newTodo: string): Promise<Todo> {
  // Simulating server delay
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return {
    todo: newTodo + ' test',
  }
}
```

```js
'use client'

import { useOptimistic, useState, useRef } from 'react'
import { addTodo } from './actions'

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const [optimisticTodos, addOptimisticTodo] = useOptimistic<Todo[], string>(
    todos,
    (state, newTodo) => [...state, { todo: newTodo }]
  )

  const formAction = async (formData: FormData) => {
    const todo = formData.get('todo') as string
    addOptimisticTodo(todo)
    formRef.current?.reset()

    try {
      const result = await addTodo(todo)
      setTodos((prevTodos) => [...prevTodos, { todo: result.todo }])
    } catch (error) {
      console.error('Error adding todo:', error)
      // Optionally, you could remove the optimistic update here if the server request fails
    }
  }

  return (
    <div>
      {optimisticTodos.map((m, i) => (
        <div key={i}>{m.todo}</div>
      ))}
      <form action={formAction} ref={formRef}>
        <input type='text' name='todo' />
        <button type='submit'>Send</button>
      </form>
    </div>
  )
}
```

The optimistic updater function is just for calculating what the UI should look like immediately. The server action (often wrapped in `useTransition`) does the actual work of making that change permanent. If the server action fails, the optimistic update gets thrown away and the UI reverts to the real state. If it succeeds, the optimistic state should match the new real state, so there's no visual change when they swap.

```js
const [optimisticCategories, setOptimisticCategories] = useOptimistic(searchParams.getAll('category'))

startTransition(() => {
  setOptimisticCategories(newCategories) // Optimistic (temporary)
  router.push(`?${params.toString()}`)   // Real update (URL change)
});
```

1. When `useOptimistic` is called without an `updateFn` (second parameter), it defaults to a simple replacement function.
2. `setOptimisticCategories(newCategories)` immediately updates the local state and re-renders the component with the new `optimisticCategories` value.
3. `optimisticCategories` temporarily overrides what the URL actually says. Users see their click immediately, even though the URL is still updating.
4. Meanwhile, `router.push()` updates the URL and triggers any server-side filtering, but the UI doesn't wait for this to complete.

### React 19 `cache` hook
`cache` is only for use with React Server Components, and lets you cache the result of a data fetch or computation.

```js
const cachedFetchReport = cache(fetchReport);

function WeatherReport({city}) {
  const report = cachedFetchReport(city);
  // ...
}

function App() {
  const city = "Los Angeles";
  return (
    <>
      <WeatherReport city={city} />
      <WeatherReport city={city} />
    </>
  );
}
```

In this case the second instance of `WeatherReport` will be able to skip duplicate work and read from the same cache as the first `WeatherReport`. `cache` is recommended for memoizing data fetches, unlike `useMemo` which should only be used for computations.

> - Use `cache` in Server Components to memoize work that can be shared across components.
> - Use `useMemo` for caching a expensive computation in a Client Component across renders.
> - Use `memo` to prevent a component re-rendering if its props are unchanged.

## Next.js sever actions and `<Form>` component
Next.js Server Actions is a feature that allows you to run server-side code directly from client components. It is part of Next.js's full-stack framework features, eliminating the need for API routes for basic form handling.

<img alt="next-server-actions-1" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/next-server-actions-1.png" width="600">

<img alt="next-server-actions-2" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/next-server-actions-2.png" width="600">
<br>

```ts
// contact-form.tsx
import { submitFormAction } from "./action";

export default function ContactForm() {
  return (
    <form action={submitFormAction}>
      <input type="email" name="email" />
      <button type="submit">Submit</button>
    </form>
  );
}

// action.ts
"use server";

export async function submitFormAction(formData: FormData) {
  const email = formData.get("email");
  console.log(email);
}
```

`useActionState` helps you deal with loading and error states.

```ts
// contact-form.tsx
const [state, action, isLoading] = useActionState(submitFormAction, {
  email: "",
});

return (
  <form action={action}>
    <input type="email" name="email" />
    {isLoading ? "Loading..." : null}
    <button type="submit">Submit</button>
  </form>
)

// action.ts
export async function submitFormAction(previousState: string, formData: FormData) {
  await new Promise((res) => setTimeout(res, 1000));
  const email = formData.get("email");
  return email;
}
```

The Next.js `<Form>` component extends the HTML `<form>` element to provide prefetching of loading UI, client-side navigation on submission, and progressive enhancement. The behavior of the `<Form>` component depends on whether the `action` prop is passed a string or function.

- When action is a function (Server Action), `<Form>` behaves like a React form, executing the action when the form is submitted.
- When action is a string, the `<Form>` behaves like a native HTML form that uses a GET method. The form data is encoded into the URL as search params, and when the form is submitted, it navigates to the specified URL. In addition, Next.js performs a client-side navigation instead of a full page reload when the form is submitted.

```ts
import Form from 'next/form'

export default function SearchForm() {
  return (
    // The url will be `/posts?title=xxx`
    <Form action="/posts">
      <input type="text" name="title" />
      <button type="submit">Search</button>
    </Form>
  )
}

// posts/page.tsx
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const title = (await searchParams).title || '';
  const res = await fetch(`/api/posts?title=${title}`);
  const posts = await res.json();

  return <div>...</div>;
}
```
