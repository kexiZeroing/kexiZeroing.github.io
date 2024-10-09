---
layout: "../layouts/BlogPost.astro"
title: "Type challenges solutions"
slug: type-challenges-solutions
description: ""
added: ""
top: true
order: 6
updatedDate: "Oct 9 2024"
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

Implement a generic `MyReadonly2<T, K>` which takes two type arguments T and K. K specify the set of properties of T that should set to readonly. When K is not provided, it should make all properties readonly, just like the normal `Readonly<T>`.

```ts
// step 1. intersection of both types
type MyReadonly2<T, K> = Omit<T, K> & { readonly [P in K]: T[P] };

// step 2. set a constraint on K
type MyReadonly2<T, K extends keyof T> = Omit<T, K> & { readonly [P in K]: T[P] };

// step 3. when K is not set at all (K to be “all the keys from T”)
type MyReadonly2<T, K extends keyof T = keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P];
};
```

Implement a generic `DeepReadonly<T>` which makes every parameter of an object and its sub-objects readonly recursively.

```ts
type X = {
  x: {
    a: 1;
    b: "hi";
  };
  y: "hey";
};

type Expected = {
  readonly x: {
    readonly a: 1;
    readonly b: "hi";
  };
  readonly y: "hey";
};

// solution
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends string | number | boolean | Function 
    ? T[P] 
    : DeepReadonly<T[P]>
}

// or
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};
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

Implement a generic `Last<T>` that takes an Array T and returns it's last element's type.

```ts
type arr = ["a", "b", "c"];
type tail = Last<arr>; // expected to be 'c'

// solution
// It is a hint to use **variadic tuple types**; we have an array and we need to work with its elements.
// https://fettblog.eu/variadic-tuple-types-preview/
type Last<T extends any[]> = T extends [...infer X, infer L] ? L : never;
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

Implement the JavaScript `Array.concat` function in the type system. A type takes the two arguments. The output should be a new array that includes inputs in ltr order.

```ts
type Result = Concat<[1], [2]>; // expected to be [1, 2]
// solution
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
```

Implement the JavaScript `Array.includes` function in the type system. A type takes the two arguments. The output should be a boolean true or false.

```ts
// expected to be `false`
type isFruit = Includes<['apple', 'banana', 'orange'], 'dog'> // expected to be `false`

// solution
type Includes<T extends unknown[], U> = U extends T[number] ? true : false;
```

Implement the generic version of `Array.push` and `Array.unshift()`.

```ts
type Result = Push<[1, 2], "3">;  // [1, 2, '3']
type Result = Unshift<[1, 2], 0>; // [0, 1, 2]

// solution
type Push<T extends unknown[], U> = [...T, U];
type Unshift<T extends unknown[], U> = [U, ...T];
```

Implement a generic `Pop<T>` that takes an Array T and returns an Array without it's last element.

```ts
type arr = ["a", "b", "c", "d"];
type arr1 = Pop<arr>; // expected to be ['a', 'b', 'c']

// solution
type Pop<T extends any[]> = T extends [...infer H, infer T] ? H : never;
```

Implement the built-in `Parameters<T>` generic without using it.

```ts
const foo = (arg1: string, arg2: number): void => {...}
type FunctionParamsType = MyParameters<typeof foo> // expected [string, number]

// solution
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;
```

Implement the built-in `ReturnType<T>` generic without using it.

```ts
const fn = (v: boolean) => {
  if (v) return 1;
  else return 2;
};
type a = MyReturnType<typeof fn>; // should be "1 | 2"

// solution
type MyReturnType<T> = T extends (...args: any[]) => infer P ? P : never
```

Implement the built-in `Omit<T, K>` generic without using it. Constructs a type by picking all properties from T and then removing K.

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = MyOmit<Todo, "description" | "title">;

const todo: TodoPreview = {
  completed: false,
};

// solution
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types
// 1. a mapped type can create new object types: type Options<T> = { [P in keyof T]: T[P] };
// 2. re-map keys (`as`) in mapped types to create new keys, or filter out keys
// 3. filter out keys by producing never
type MyOmit<T, K> = { [P in keyof T as P extends K ? never : P]: T[P] };
```

Implement a generic `TupleToUnion<T>` which covers the values of a tuple to its values union.

```ts
type Arr = ['1', 2, boolean]
type Test = TupleToUnion<Arr> // expected '1' | 2 | boolean

// solution
// lookup types: looks like an element access, but are written as types
type TupleToUnion<T> = T extends unknown[] ? T[number] : never
```

Type the function `PromiseAll` that accepts an array of `PromiseLike` objects. The returning value should be `Promise<T>` where T is the resolved result array.

```ts
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise<string>((resolve, reject) => {
  setTimeout(resolve, 100, "foo");
});

// expected to be `Promise<[number, number, string]>`
const p = Promise.all([promise1, promise2, promise3] as const);

// solution
// step 1. the function that returns Promise<T>
declare function PromiseAll<T>(values: T): Promise<T>;

// step 2. `values` is an array and has a readonly modifier 
declare function PromiseAll<T extends unknown[]>(
  values: readonly [...T],
): Promise<T>;

// step 3. unwrap the type from Promise inside the `values`
declare function PromiseAll<T extends unknown[]>(
  values: readonly [...T],
): Promise<{ [P in keyof T]: T[P] extends Promise<infer R> ? R : T[P] }>;
```
