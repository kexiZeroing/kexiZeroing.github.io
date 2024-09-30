---
layout: "../layouts/BlogPost.astro"
title: "Type challenges solutions"
slug: type-challenges-solutions
description: ""
added: ""
top: true
order: 6
updatedDate: "Sep 30 2024"
---

Implement the built-in `Pick<T, K>` generic without using it. Constructs a type by picking the set of properties K from T.

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = MyPick<Todo, "title" | "completed">;

const todo: TodoPreview = {
  title: "Clean room",
  completed: false,
};

// solution
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
}
```

> Why `extends` is used here instead of `in`?
> - `K extends keyof T`: "K is a type that is assignable to keyof T"
> - `K in keyof T`: "K is each key in keyof T"

Implement the built-in `Readonly<T>` generic without using it. Constructs a type with all properties of T set to `readonly`, meaning the properties of the constructed type cannot be reassigned.

```ts
interface Todo {
  title: string;
  description: string;
}

const todo: MyReadonly<Todo> = {
  title: "Hey",
  description: "foobar",
};

todo.title = "Hello"; // Error: cannot reassign a readonly property
todo.description = "barFoo"; // Error: cannot reassign a readonly property

// solution
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

Given an array, transform to an object type and the key/value must in the given array.

```ts
const tuple = ["tesla", "model 3", "model X", "model Y"] as const;

// expected { tesla: 'tesla', model 3: 'model 3', model X: 'model X', model Y: 'model Y'}
const result: TupleToObject<typeof tuple>;

// solution 1
type TupleToObject<T extends readonly (string | symbol | number)[]> = {
  [P in T[number]]: P
}

// solution 2
// built-in `PropertyKey` represents the data type of a property key.
// It can be a string, a symbol, or a number.
// https://www.totaltypescript.com/concepts/propertykey-type
type TupleToObject<T extends readonly PropertyKey[]> = {
  [P in T[number]]: P
};
```

Implement a generic `First<T>` that takes an Array T and returns it's first element's type.

```ts
type arr1 = ["a", "b", "c"];
type arr2 = [3, 2, 1];

type head1 = First<arr1>; // expected to be 'a'
type head2 = First<arr2>; // expected to be 3

// solution
type First<T extends any[]> = T extends [] ? never : T[0];
```

For given a tuple, you need create a generic `Length`, pick the length of the tuple.

```ts
type tesla = ["tesla", "model 3", "model X", "model Y"];
type teslaLength = Length<tesla>; // expected 4

// solution
type Length<T extends readonly any[]> = T["length"];
```

Implement the built-in `Exclude<T, U>`. Exclude from T those types that are assignable to U.

```ts
type T0 = MyExclude<"a" | "b" | "c", "a">; // expected "b" | "c"
type T1 = MyExclude<"a" | "b" | "c", "a" | "b">; // expected "c"

// solution
type MyExclude<T, U> = T extends U ? never : T;
```

> When you are writing `T extends U` where T is the union, actually what is happening is TypeScript iterates over the union T and applies the condition to each element.

If we have a type which is wrapped type like `Promise`. How we can get a type which is inside the wrapped type? You need to unwrap the type recursively.

```ts
type Example1 = MyAwaited<Promise<string>>; // Type is string
type Example2 = MyAwaited<Promise<Promise<number>>>; // Type is number

// solution
// `infer R` is saying "if T is a Promise, infer the type it contains and call it R".
// `Awaited` is a built-in TypeScript utility type that recursively unwraps Promise types.
type MyAwaited<T> = T extends Promise<infer R> ? Awaited<R> : T;
```

Implement a utils `If` which accepts condition C, a truthy return type T, and a falsy return type F. C is expected to be either `true` or `false` while T and F can be any type.

```ts
type A = If<true, "a", "b">; // expected to be 'a'
type B = If<false, "a", "b">; // expected to be 'b'

// solution
type If<C extends boolean, T, F> = C extends true ? T : F;
// `strictNullChecks: false`
type If<C extends boolean, T, F> = C extends undefined | null 
  ? never
  : (C extends true ? T : F)
```

Implement the `Array.concat` function in the type system. A type takes the two arguments. The output should be a new array that includes inputs in ltr order.

```ts
type Result = Concat<[1], [2]>; // expected to be [1, 2]
// solution
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
```
