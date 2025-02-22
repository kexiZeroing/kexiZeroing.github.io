---
title: "Next.js Forms are different now"
description: ""
added: "Feb 22 2025"
tags: [web, react]
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

## Next.js sever actions and `<Form>` component
Next.js Server Actions is a feature that allows you to run server-side code directly from client components. It is part of Next.js's full-stack framework features, eliminating the need for API routes for basic form handling.

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

// pages/posts.tsx
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
