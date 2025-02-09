---
title: "Type challenges solutions"
description: ""
added: ""
top: true
order: 6
updatedDate: "Dec 14 2024"
---

## Type challenges
> TypeScript allows you to write complex yet elegant code. Some TypeScript users love to explore the possibilities of the type system and love to encode logic at type level. This practice is known as type gymnastics. The community also helps users to learn type gymnastics by creating fun and challenges such as [type challenges](https://github.com/type-challenges/type-challenges).
>
> Note that some features are primarily useful when building libraries. App dev TS is and should be very different from lib dev TS.

Implement the built-in `Pick<T, K>` generic without using it. Constructs a type by picking the set of properties K from T.

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

// expected type: { title: string; completed: boolean; }
type TodoPreview = MyPick<Todo, "title" | "completed">;

// solution
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
}
```

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
// It is a hint to use variadic tuple types: https://fettblog.eu/variadic-tuple-types-preview
type Last<T extends any[]> = T extends [...infer X, infer L] ? L : never;
```

```ts
type MyType<T> = T extends infer R ? R : never;
type T1 = MyType<{b: string}> // T1 is { b: string; }
type MyType2<T> = T extends R2 ? R2 : never; // error, R2 undeclared
```
> With `infer`, the compiler ensures that you have declared all type variables explicitly. Here we declare a new type variable R in `MyType`. Without `infer`, the compiler does not introduce an additional type variable R2 that is to be inferred. If R2 has not been declared, it will result in a compile error. **Note that `infer` is only used within the `extends` clause of a conditional type.**

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

// expected type: { completed: boolean; }
type TodoPreview = MyOmit<Todo, "description" | "title">;

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

Implement `TrimLeft<T>` which takes an exact string type and returns a new string with the whitespace beginning removed.

```ts
type trimmed = TrimLeft<"  Hello World  ">; // expected to be 'Hello World  '

// solution
type TrimLeft<S> = S extends `${" " | "\n" | "\t"}${infer T}` ? TrimLeft<T> : S;
```

Implement the type `ReplaceFirst<T, S, R>` which will replace the first occurrence of S in a tuple T with R. If no such S exists in T, the result should be T.

```ts
type replaced = ReplaceFirst<["A", "B", "C"], "C", "D">;
// expected to be ['A', 'B', 'D']

// solution
// splitting the T to infer the first Item in the list and infer the Rest
type ReplaceFirst<T extends readonly unknown[], S, R> = T extends [
  infer FI,
  ...infer Rest,
]
  ? FI extends S
    ? [R, ...Rest]
    : [FI, ...ReplaceFirst<Rest, S, R>]
  : T;
```

Convert a string to CamelCase.

```ts
type camelCased = CamelCase<"foo-bar-baz">; // expected "fooBarBaz"

// solution
type CamelCase<S> = S extends `${infer H}-${infer T}`
  ? T extends Capitalize<T>
    ? `${H}-${CamelCase<T>}`
    : `${H}${CamelCase<Capitalize<T>>}`
  : S;
```

Convert a string to kebab-case.

```ts
type kebabCase = KebabCase<"FooBarBaz">; // expected "foo-bar-baz"

// solution
// step 1. start from inferring to get the first character and the tail
type KebabCase<S> = S extends `${infer C}${infer T}` ? never : S;

// step 2. have / don't have the capitalized tail
type KebabCase<S> = S extends `${infer C}${infer T}`
  ? T extends Uncapitalize<T>
    ? `${Uncapitalize<C>}${KebabCase<T>}`
    : `${Uncapitalize<C>}-${KebabCase<T>}`
  : S;
```

Implement a type that adds a new field to the interface. The output should be an object with the new field.

```ts
type Test = { id: "1" };
type Result = AppendToObject<Test, "value", 4>; // expected to be { id: '1', value: 4 }

// solution
type AppendToObject<T, U extends string, V> = {
  [P in keyof T | U]: P extends keyof T ? T[P] : V;
};
```

For given function type `Fn` and any type A, create a generic type which will take `Fn` as the first argument, A as the second, and will produce function type G which will be the same as `Fn` but with appended argument A as a last one.

```ts
type Fn = (a: number, b: string) => number;
// expected be (a: number, b: string, x: boolean) => number
type Result = AppendArgument<Fn, boolean>;

// solution
type AppendArgument<Fn, A> = Fn extends (...args: infer P) => infer R
  ? (...args: [...P, A]) => R
  : never;
```

Merge two types into a new type. Keys of the second type overrides keys of the first type.

```ts
type Foo = {
  a: number;
  b: string;
};

type Bar = {
  b: number;
};

type merged = Merge<Foo, Bar>; // expected { a: number; b: number }

// solution
type Merge<F, S> = {
  [P in keyof F | keyof S]: P extends keyof S
    ? S[P]
    : P extends keyof F
    ? F[P]
    : never;
};
```

Implement the `StringToUnion` type. Type take string argument. The output should be a union of input letters.

```ts
type Test = "123";
type Result = StringToUnion<Test>; // expected to be "1" | "2" | "3"

// solution
type StringToUnion<T extends string> = T extends `${infer C}${infer T}`
  ? C | StringToUnion<T>
  : never;
```

Get an Object that is the difference between two types.

```ts
type Foo = {
  name: string;
  age: string;
};

type Bar = {
  name: string;
  age: string;
  gender: number;
};

type test = Diff<Foo, Bar>; // expected { gender: number }

// solution
type Diff<O, O1> = {
  [P in keyof O | keyof O1 as Exclude<P, keyof O & keyof O1>]: P extends keyof O
    ? O[P]
    : P extends keyof O1
    ? O1[P]
    : never;
};
```

Implement the `Absolute` type. A type that take string, number or bigint. The output should be a positive number string.

```ts
type Test = -100;
type Result = Absolute<Test>; // expected to be "100"

// solution
// convert it to string and remove the “-” sign
type Absolute<T extends number | string | bigint> = `${T}` extends `-${infer N}`
  ? N
  : `${T}`;
```

Implement `any` function in the type system. A type takes the array and returns true if any element of the array is true. If the array is empty, return false.

```ts
type Sample1 = AnyOf<[1, "", false, [], {}]>; // expected to be true
type Sample2 = AnyOf<[0, "", false, [], {}]>; // expected to be false

// solution
type Falsy = 0 | "" | false | [] | { [P in any]: never };

type AnyOf<T extends readonly any[]> = T extends [infer H, ...infer T]
  ? H extends Falsy
    ? AnyOf<T>
    : true
  : false;
```

Implement `EndsWith<T, U>` which takes two exact string types and returns whether T ends with U.

```ts
type R0 = EndsWith<"abc", "bc">; // true
type R1 = EndsWith<"abc", "d">; // false

// solution
type EndsWith<T extends string, U extends string> = T extends `${any}${U}`
  ? true
  : false;
```

Implement the type version of `Array.lastIndexOf`. `LastIndexOf<T, U>` takes an Array T, any U and returns the index of the last U in Array T.

```ts
type Res1 = LastIndexOf<[1, 2, 3, 2, 1], 2>; // 3
type Res2 = LastIndexOf<[0, 0, 0], 2>; // -1

// solution
// Check from the right if it is equal to the item we are looking for
type LastIndexOf<T, U> = T extends [...infer R, infer I]
  ? Equal<I, U> extends true
    ? R["length"]
    : LastIndexOf<R, U>
  : -1;
```

Implement a type `Zip<T, U>`, T and U must be Tuple.

```ts
// expected to be [[1, true], [2, false]]
type R = Zip<[1, 2], [true, false]>;

// solution
// step 1. if both tuples have the item and the tail - we can zip them together
type Zip<T, U> = T extends [infer TI, ...infer TT]
  ? U extends [infer UI, ...infer UT]
    ? [TI, UI]
    : never
  : never;

// step 2. recursive way of zipping the tail until it’s gone
type Zip<T, U> = T extends [infer TI, ...infer TT]
  ? U extends [infer UI, ...infer UT]
    ? [[TI, UI], ...Zip<TT, UT>]
    : []
  : [];
```

Implement the type `Without<T, U>`, which takes an array T, number or array U and returns an array without the elements of U.

```ts
type Res = Without<[1, 2], 1>; // expected to be [2]
type Res1 = Without<[1, 2, 4, 1, 5], [1, 2]>; // expected to be [4, 5]

// solution
// step 1. when U specified as a primitive type
type Without<T, U> = T extends [infer H, ...infer T]
  ? H extends U
    ? [...Without<T, U>]
    : [H, ...Without<T, U>]
  : [];

// step 2. if U is a tuple of numbers
type Without<T, U> = T extends [infer H, ...infer T]
  ? H extends (U extends number[] ? U[number] : U)
    ? [...Without<T, U>]
    : [H, ...Without<T, U>]
  : [];
```

Implement the type `Unique<T>`, which takes an array T, returns the array T without repeated values.

```ts
type Res = Unique<[1, 1, 2, 2, 3, 3]>; // expected to be [1, 2, 3]
type Res1 = Unique<[1, "a", 2, "b", 2, "a"]>; // expected to be [1, "a", 2, "b"]

// solution
// If T is present in other part of the tuple, T is the duplicate and we need to skip it,
// otherwise, we add it to the result.
type Unique<T> = T extends [...infer H, infer T]
  ? T extends H[number]
    ? [...Unique<H>]
    : [...Unique<H>, T]
  : [];
```

## Total TypeScript's TypeScript Generics Workshop

```ts
const returnWhatIPassIn = <T>(param: T) => param;

const returnWhatIPassIn = <T extends string>(param: T) => param;

const returnBothOfWhatIPassIn = <T1, T2>(params: { a: T1; b: T2 }) => {
  return {
    first: params.a,
    second: params.b,
  };
};

export class Component<TProps> {
  constructor(props: TProps) {
    this.props = props;
  }
  
  private props: TProps;

  getProps = () => this.props;
}

export const createSet = <T = string>() => {
  return new Set<T>();
};

const sum = <T>(array: readonly T[], mapper: (item: T) => number): number =>
  array.reduce((acc, item) => acc + mapper(item), 0);

// There are three type signature for `reduce`, which are called function overload.
// reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T): T;

// reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T, initialValue: T): T;

// reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U, initialValue: U): U;

// Here the U type is being inferred from the initial value, 
// which we can see when hovering over the `.reduce()` in our code.
const obj = array.reduce<Record<string, { name: string }>>((accum, item) => {
  accum[item.name] = item;
  return accum;
}, {});

// fetchData infer the `Promise<TData>`
const fetchData = async <TData>(url: string) => {
  let data: TData = await fetch(url).then((response) => response.json());

  return data;
};

const typedObjectKeys = <TObject extends object>(obj: TObject) => {
  return Object.keys(obj) as Array<keyof TObject>;
};
// The second solution is to have the generic only represent the keys.
const typedObjectKeys = <TKey extends string>(obj: Record<TKey, any>) => {
  return Object.keys(obj) as Array<TKey>;
};

// When directly returning a value, it infers the literal type.
const returnsValueOnly = <T>(t: T) => {
  return t;
};
const result = returnsValueOnly("a");
// const result: "a"

// When returning an object or array, it defaults to the broader type.
const returnsValueInAnObject = <T1>(t: T1) => {
  return {
    t,
  };
};
const result2 = returnsValueInAnObject("abc");
// const result2: { t: string }

// However, we can use constraints to guide TS towards the desired literal type inference.
const returnsValueInAnObjectWithConstraint = <T1 extends string>(t: T1) => {
  return {
    t,
  };
};
const result3 = returnsValueInAnObjectWithConstraint("abc");
// const result3: { t: "abc" }

export function remapPerson<Key extends keyof Person>(
  key: Key,
  value: Person[Key],
) {
  if (key === "birthdate") {
    return new Date() as Person[Key];
  }

  return value;
}

const obj = {
  a: 1,
  b: "some-string",
  c: true,
};

const getValue = <TObj>(obj: TObj, key: keyof TObj) => {
  return obj[key];
};
// => string | number| boolean

const getValue = <TObj, TKey extends keyof TObj>(obj: TObj, key: TKey) => {
  return obj[key];
};

const numberResult = getValue(obj, "a");  // number
const stringResult = getValue(obj, "b"); // string
const booleanResult = getValue(obj, "c"); // boolean
```
