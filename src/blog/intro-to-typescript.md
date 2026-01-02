---
title: "Intro to TypeScript"
description: ""
added: "Jun 12 2022"
tags: [js]
updatedDate: "Aug 10 2025"
---

TypeScript is a strongly typed programming language that builds on JavaScript. It is currently developed and maintained by Microsoft as an open source project. TypeScript supports multiple programming paradigms such as functional, generic, imperative, and object-oriented.

Every time you write JavaScript in e.g. VS Code, TypeScript runs behind the curtains and gives you information on built-in APIs. In fact, a lot of people think that they can live without TypeScript because JavaScript support is so fantastic in modern editors. Guess what’s, it has always been TypeScript. _In VS Code, open a `.ts` file, `Cmd+Shift+P` enter "Select TypeScript Version" to check. There is a "Use VS Code's Version" and "Use Workspace Version" (this is from node_modules)._

> Even if you don't write your code in `.ts` files, you're probably using TypeScript. That's because TypeScript is the IntelliSense engine. Even if you're not using VSCode, if your editor gives you code completion, parameter info, quick info, member lists, etc. while writing JS code, you are almost certainly running the TypeScript language service.

## Setting up TypeScript

To start off, the TypeScript compiler will need to be installed in order to convert TypeScript files into JavaScript files. To do this, TypeScript can either be installed globally or only available at the project level.

Run `tsc --noEmit` that tells TypeScript that we just want to check types and not create any output files. If everything in our code is all right, `tsc` exits with no error. `tsc --noEmit --watch` will add a `watch` mode so TypeScript reruns type-checking every time you save a file.

A `tsconfig.json` file is used to configure TypeScript project settings. The `tsconfig.json` file should be put in the project's root directory. You can run the `tsc --init` to generate a `tsconfig.json` file with some default options set and a bunch of other options commented out. In order to transpile the TypeScript code to JavaScript, the `tsc` command needs to be run. Running `tsc` will have the TypeScript compiler search for the `tsconfig.json` file which will determine the project's root directory as well as which options to use when compiling the TypeScript.

```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "verbatimModuleSyntax": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",

    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,

    /* If transpiling with TypeScript: */
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,

    /* If NOT transpiling with TypeScript: */
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "noEmit": true,

    // keep the JSX as part of the output to be further consumed by another transform step.
    // "jsx": "preserve",

    /* If your code runs in the DOM: */
    "lib": ["es2022", "dom", "dom.iterable"],
    /* If your code doesn't run in the DOM: */
    "lib": ["es2022"],

    /* If you're building for a library: */
    // Ts will automatically generate .d.ts files alongside your compiled JS files.
    "declaration": true
  }
}
```

`strict` option acts as shorthand for enabling several different type checking options, including catching potential `null` or `undefined` issues and stronger checks for function parameters, among others. Without `noUncheckedIndexedAccess` enabled, TS assumes that indexing will always return a valid value, even if the index is out of bounds. This means that we have to handle the possibility of `undefined` values when accessing array or object indices.

`target` tells TS which ES specification you want the transpiled code to support. `target` doesn't polyfill. `lib` tells TS what type definitions to include in your project. If you don’t specify it explicitly, TypeScript will choose a default set of libraries based on your `target`. Basically, set `lib` to `["dom", "dom.iterable", "es2022"]` if your code run in the DOM, and set it to `["es2022"]` if not.

`module` is a setting with a bunch of different options, which specifies how TS should treat your imports and exports. But really, there are only two modern options. `NodeNext` tells TypeScript that your code will be run by Node.js. And `Preserve` tells TypeScript that an external bundler will handle the bundling (also set `noEmit` to true).

> How does TS know what module system (ESM or CJS) to emit?
>
> 1. The way this is decided is via `module`. You can hardcode this by choosing some older options. `module: CommonJS` will always emit CommonJS syntax, and `module: ESNext` will always emit ESM syntax.
> 2. Using the recommended `module: NodeNext`, we know that a given module might be an ES module or it might be a CJS module, based on its file extension(`mts`, `.cts`) and/or the `type` field in the nearest `package.json` file.

`module: "NodeNext"` also implies `moduleResolution: "NodeNext"`. `NodeNext` is a shorthand for the most up-to-date Node.js module behavior. `module: "Preserve"` implies `moduleResolution: "Bundler"`.

TypeScript has built-in support for transpiling `.tsx` files, and the `jsx` option tells TS how to handle JSX syntax. `preserve` means keeps JSX syntax as-is so it can be passed to different tools like Babel for further transformations. `react` transforms JSX into `React.createElement` calls _(for React 16 and earlier)_. `react-jsx` transforms JSX into `_jsx` calls, and automatically imports from `react/jsx-runtime` _(for React 17 and later)_.

By default `moduleDetection` set to `auto`, if we don't have any `import` or `export` statements in a `.ts` file, TypeScript treats it as a script. **By adding the `export {}` statement, you're telling TS that the `.ts` is a module**. `moduleDetection: force` will treat all files as modules, and you will need to use `import` and `export` statements to access functions and variables across files.

Relative import paths [need explicit file extensions in ES imports](https://www.totaltypescript.com/relative-import-paths-need-explicit-file-extensions-in-ecmascript-imports) when `--moduleResolution` is `node16` or `nodenext` _(currently identical to `node16`)_.

1. Most bundlers let you omit the file extension when importing files. But TS rules like `moduleResolution: NodeNext` force you to specify the file extension. This can feel really weird when you're working in `.ts` files, but writing `.js` on your imports. Why do we need to do it? Well, it's the spec. **The Node spec requires that you use `.js` file extensions for all ESM imports and exports. By default, TypeScript does not change the specifiers of imported modules.** If you want to go back to the old style, then specify `moduleResolution: Bundler` and bundle your code with a tool like esbuild.
2. TypeScript doesn’t modify import specifiers during emit: the relationship between an import specifier and a file on disk is host-defined, and TypeScript is not a host.
3. `--allowImportingTsExtensions` allows TypeScript files to import each other with a TypeScript-specific extension like `.ts`, `.mts`, or `.tsx`. This flag is only allowed when `--noEmit` is enabled. The expectation here is that your resolver (e.g. your bundler, a runtime, or some other tool) is going to make these imports between `.ts` files work.

```js
// @moduleResolution: node16
// @rootDir: src
// @outDir: dist
// @Filename: src/math.mts
export function add(a: number, b: number) {
  return a + b;
}
// @Filename: src/main.mts
import { add } from "./math.mjs";
add(1, 2);
```

Since TypeScript 5.0, `verbatimModuleSyntax` is the recommended way to enforce `import type`. When it is set to true, any imports or exports without a `type` modifier are left around. Anything that uses the `type` modifier is dropped entirely. You may get the message when enabling `verbatimModuleSyntax` (as expected): _'SomeType' is a type and must be imported using a type-only import._

```ts
// Erased away entirely
import type { A } from "a";
// Rewritten to `import { b } from "bcd";`
import { b, type c, type d } from "bcd";
// Rewritten to `import {} from "xyz";`
import { type xyz } from "xyz";
```

How multiple `tsconfig.json` files can be composed together?

1. Your IDE determines which `tsconfig.json` to use by looking for the closest one to the current `.ts` file.
2. When you have multiple `tsconfig.json` files, it's common to have shared settings between them. We can create a new `tsconfig.base.json` file that can be extended from.

See examples:

- https://github.com/vuejs/tsconfig/blob/main/tsconfig.json
- https://www.totaltypescript.com/tsconfig-cheat-sheet
- https://deno.com/blog/intro-to-tsconfig
- https://github.com/tsconfig/bases

> `json` doesn't normally allow comments, but comments are valid in `tsconfig.json`. It's officially supported by TypeScript, and VSCode understands it too. What's going on here is [jsonc](https://github.com/microsoft/node-jsonc-parser), or "JSON with Comments", a proprietary format used by a bunch of Microsoft products, most notably Typescript and VSCode. For example, VS Code’s `settings.json` file is actually `settings.jsonc`.
>
> JSON5 is a superset of JSON that makes JSON more human-friendly, not just comments but also relaxed rules for quoting. It's also a subset of ES5, so valid JSON5 files will always be valid ES5.
>
> They’re both formats/specs (and usually implemented as libraries) that extend standard JSON for developer convenience.

By the way, `jsconfig.json` is a descendant of `tsconfig.json`. The presence of `jsconfig.json` file in a directory indicates that the directory is the root of a JavaScript project.

When you first introduce TypeScript into the build chain process, use the "allowJs" compiler option, which permits `.ts` files to coexist with existing JavaScript files. As TypeScript will fall back to a type of "any" for a variable when it cannot infer the type from JavaScript files, it is recommended to disable "noImplicitAny" in your compiler options at the beginning of the migration.

## Structural typing

TypeScript uses structural typing. This system is different than the type system employed by some other popular languages you may have used (e.g. Java, C#, etc.)

The idea behind structural typing is that two types are compatible if their members are compatible. For example, in C# or Java, two classes named `MyPoint` and `YourPoint`, both with public `int` properties x and y, are not interchangeable, even though they are identical. But in a structural type system, the fact that these types have different names is irrelevant. Because they have the same members with the same types, they are identical.

```ts
type X = {
  a: string;
};
type Y = {
  a: string;
};
const x: X = { a: "a" };
const y: Y = x; // Valid
```

```ts
type X = {
  a: string;
};
const y = { a: "a", b: "b" };
const x: X = y; // Valid because structural typing
const w: X = { a: "a", b: "b" }; // Invalid because excess property checking
```

```ts
interface Something<T> {
  name: string;
}
let x: Something<number>;
let y: Something<string>;
// Why is A<string> assignable to A<number> for interface A<T>?
x = y;

// `Something<T>` doesn't use `T` in any member,
// it doesn't matter what type `T` is.
```

## Basic Static Types

TypeScript brings along static types to the JavaScript language. **TypeScript's types don't exist at runtime.** They're only used to help you catch errors at compile time.

```ts
let isAwesome: boolean = true;
let name: string = "Chris";
let decimalNumber: number = 42;
let whoKnows: any = 1;

// Array types can be written in two ways
let myPetFamily: string[] = ["rocket", "fluffly", "harry"];
let myPetFamily: Array<string> = ["rocket", "fluffly", "harry"];

// A tuple is an array that contains a fixed number of elements with associated types.
let myFavoriteTuple: [string, number, boolean];
myFavoriteTuple = ["chair", 20, true];

// Tuple types can’t be inferred. If we use type inference directly on a tuple,
// we will get the wider array type
let tuple = ["Stefan", 38]; // type is (string | number)[]

/*
An enum is a way to associate names to a constant value.
Enums are useful when you want to have a set of distinct values that have a descriptive name associated with it.
By default, enums are assigned numbers that start at 0 and increase by 1 for each member of the enum.
*/
enum Sizes {
  Small,
  Medium,
  Large,
}
Sizes.Small; // 0
Sizes.Medium; // 1
Sizes.Large; // 2

// The first value can be set to a value other than 0
enum Sizes {
  Small = 1,
  Medium,
  Large,
}
Sizes.Small; // 1
Sizes.Medium; // 2
Sizes.Large; // 3

// String values can also be assigned to an enum
enum ThemeColors {
  Primary = "primary",
  Secondary = "secondary",
  Dark = "dark",
  DarkSecondary = "darkSecondary",
}

// An object marked "as const" accomplishes the same thing
const status = {
  pending: 0,
  shipped: 1,
  delivered: 2,
  error: 3,
} as const;
```

```js
// How numeric enums transpile
// `Object.keys` call on an enum will return both the keys and the values.
var AlbumStatus;
(function (AlbumStatus) {
  AlbumStatus[(AlbumStatus["NewRelease"] = 0)] = "NewRelease";
  AlbumStatus[(AlbumStatus["OnSale"] = 1)] = "OnSale";
  AlbumStatus[(AlbumStatus["StaffPick"] = 2)] = "StaffPick";
})(AlbumStatus || (AlbumStatus = {}));

// How string enums transpile
var AlbumStatus;
(function (AlbumStatus) {
  AlbumStatus["NewRelease"] = "NEW_RELEASE";
  AlbumStatus["OnSale"] = "ON_SALE";
  AlbumStatus["StaffPick"] = "STAFF_PICK";
})(AlbumStatus || (AlbumStatus = {}));
```

> String enums and numeric enums behave differently when used as types:
>
> - Numeric enums are open to a plain number. (either `NumEnum.A` or `0` is ok)
> - String enums are closed, you can only assign their declared enum members. (`StrEnum.A` is ok, `"A"` is error)
>
> All other types in TypeScript are compared structurally, meaning that two types are considered the same if they have the same structure. But string enums are compared based on their name (nominally), not their structure.

Fortunately, you don't have to specify types absolutely everywhere in your code because TypeScript has **Type Inference**. Type inference is what the TypeScript compiler uses to automatically determine types. TypeScript can infer types during variable initialization, when default parameter values are set, and while determining function return values.

## Type Annotation

When the Type Inference system is not enough, you will need to declare types on variables.

```ts
// Use interface to put together multiple type annotations
interface Animal {
  kind: string;
  weight: number;
  color?: string; // optional property
}

// Type Alias
// `interface` and `type` are compatible here, because their shape is the same.
type Animal = {
  kind: string;
  weight: number;
  color?: string;
};

// Union Type (a type can be one of multiple types, type A = X | Y)
// Narrow down the types of values: typeof, truthiness, instanceof...
function validateUsername(username: string | null): boolean {
  if (typeof username === "string") {
    return username.length > 5;
  }

  return false;
}

const handleResponse = (response: APIResponse) => {
  // response.data: Property 'data' does not exist on type 'APIResponse'.
  if ("data" in response) {
    return response.data.id;
  }
};

// Intersection Type (a type is the combination of all listed types, type A = X & Y)
type Student = {
  id: string;
  age: number;
};
type Employee = {
  companyId: string;
};
let person: Student & Employee;

// Interfaces using `extends` are faster than type intersections (can cache)

declare function handleRequest(url: string, method: "GET" | "POST"): void;
// Error: Argument of type 'string' is not assignable to parameter of type '"GET" | "POST"'.
// req.method is inferred to be string
const req = { url: "https://example.com", method: "GET" };
handleRequest(req.url, req.method);

// fix:
const req = { url: "https://example.com", method: "GET" as "GET" };
// or
const req = { url: "https://example.com", method: "GET" } as const;
```

**Summary of Type vs Interface:**
https://www.totaltypescript.com/type-vs-interface-which-should-you-use

- Interfaces can't express unions or mapped types, only represent object types. Type aliases can express any type.
- Interfaces can use `extends`, types can't. (`interface extends` is better for catching errors and for performance)
- When you're working with objects that inherit from each other, use interfaces. `extends` makes TypeScript's type checker run slightly faster than using `&`.
- Interfaces with the same name in the same scope merge their declarations. This is very different from `type`, which would give you an error if you tried to declare the same type twice.
- Type aliases have an implicit index signature of `Record<PropertyKey, unknown>`, but interfaces don't.

> The `PropertyKey` type is a global type that represents the set of all possible keys that can be used on an object, including string, number, and symbol. You can find its type definition inside of TypeScript's ES5 type definitions file: `declare type PropertyKey = string | number | symbol;`.

```ts
// `typeof` operator allows you to extract a type from a value.
// It is not the same as the `typeof` operator used at runtime
const albumSales = {
  "Kind of Blue": 500,
  "A Love Supreme": 100,
  "Mingus Ah Um": 300,
};
type AlbumSalesType = typeof albumSales;
// type AlbumSalesType = {
//    "Kind of Blue": number;
//    "A Love Supreme": number;
//    "Mingus Ah Um": number;
// }

// Runtime typeof
typeof albumSales; // "object"

// Built-in Helper Types
const fieldsToUpdate: Partial<Todo>;
const todo: Readonly<Todo>;
// same as `ReadonlyArray<string>`
const readOnlyGenres: readonly string[] = ["rock", "pop", "country"];
type TodoPreview = Omit<Todo, "description">;
type TodoPreview = Pick<Todo, "title" | "completed">;

// The `as const` assertion made the entire object deeply read-only,
// including all nested properties. (js `Object.freeze` only at the first level)
const albumAttributes = {
  status: "on-sale",
} as const;

// Derive types from functions
function sellAlbum(album: Album, price: number, quantity: number) {
  return price * quantity;
}
// extracts the parameters from a given function type and returns them as a tuple
type SellAlbumParams = Parameters<typeof sellAlbum>; // [album: Album, price: number, quantity: number]
// retrieve the return type from the function signature without run the function
type SellAlbumReturn = ReturnType<typeof sellAlbum>; // number
// unwrap the Promise type and provide the type of the resolved value
type User = Awaited<ReturnType<typeof fetchUser>>;

type CustomAwaited<T> = T extends Promise<infer U> ? U : T;

// Indexed access types
type AlbumTitle = Album["title"];
type AlbumPropertyTypes = Album["title" | "isSingle" | "releaseYear"];
type AlbumPropertyTypes = Album[keyof Album];

// Index signatures for dynamic keys
interface AlbumAwards {
  [iCanBeAnything: string]: boolean;
}
// more concise way
const albumAwards: Record<string, boolean> = {};

// Template literal types can be used to interpolate other types into string types
type PngFile = `${string}.png`;
let myImage: PngFile = "my-image.png";

type Headers = {
  Authorization: `Bearer ${string}`;
};

type ColorShade = 100 | 200 | 300;
type Color = "red" | "blue" | "green";
type ColorPalette = `${Color}-${ColorShade}`;

// "name:Bill" -> { key: "name", value: "Bill" }
type KeyValueSplitter<T extends string> = T extends `${infer K}:${infer V}`
  ? { key: K; value: V }
  : never;

// { key: "name", value: "Bill" } -> "name:Bill"
type KVJoin<T extends Record<string, string>> = {
  [K in keyof T]: `${K}:${T[K]}`;
}[keyof T];

// The 'string & {}' trick (loose autocomplete)
type ModelNames = "a" | "b" | "c" | (string & {});
const model: ModelNames = "a"; // autocomplete and can pass in any string
```

`Omit` and `Pick` have some odd behaviour when used with union types. They are not distributive. This means that when you use them with a union type, they don't operate individually on each union member.

```ts
type MusicProduct = Album | CollectorEdition | DigitalRelease;

type MusicProductWithoutId = Omit<MusicProduct, "id">;

// Expected:
type MusicProductWithoutId =
  | Omit<Album, "id">
  | Omit<CollectorEdition, "id">
  | Omit<DigitalRelease, "id">;

// Actual:
type MusicProductWithoutId = {
  title: string;
};

// Solution to fix: make our own distributive version of Omit
type DistributiveOmit<T, K extends keyof T> = T extends any
  ? Omit<T, K>
  : never;
```

> For orginal `Pick<T, K extends keyof T>`, when `T` is a union, `keyof T` does not mean “all keys from all members” — it means the intersection of keys present in every member of the union.
>
> **Distributivity rule:** In `T extends U ? X : Y`, if `T` is a naked type parameter and `T` is a union, TypeScript applies the conditional separately to each union member and unions the results.

It's worth noting the similarities between `Exclude/Extract` and `Omit/Pick`. A common mistake is to think that you can `Pick` from a union, or use `Exclude` on an object.

```ts
// Exclude/Extract - union (members)
// Omit/Pick - object (properties)
Exclude<"a" | 1, string>;
Extract<"a" | 1, string>;
Omit<UserObj, "id">;
Pick<UserObj, "id">;
```

> `Exclude<T, U>` isn't the same as `T & not U`. `Exclude` is a type alias whose only effect is to filter unions. For example, `Exclude<string, "hello">` just means `string`. It doesn't mean "any string except "hello"", because `string` is not a union, and thus no filtering occurs.

Every function has a return type. If we don’t explicitly type or infer, the return type is by default `void`, and `void` is a keyword in JavaScript returning `undefined`. If the function is asynchronous, its return type must be a Promise, e.g. `Promise<number>` means that our function must return a Promise that resolves to a number.

When you're working with React and TypeScript, you may ask how do I figure out the type of a component's props? How do I get all the types that a div or span accepts? The answer is in a single place: `ComponentProps`.

```tsx
// https://www.totaltypescript.com/react-component-props-type-helper
import { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button">;
// "button" | "submit" | "reset" | undefined
type ButtonPropsType = ButtonProps["type"];

type MyDivProps = ComponentProps<"div"> & {
  myProp: string;
};

type MyCompProps = ComponentProps<typeof MyComp>;
```

**Type hierarchy**: TypeScript sets `any` as the default type for any value or parameter that is not explicitly typed or can’t be inferred. You will rarely need to declare something as `any` (**you may need the type `unknown`**, which is a safe type). `null` and `undefined` are bottom values. (nullish values are excluded from all types if the option `strictNullChecks` is active in `tsconfig.json`). The very bottom of the type hierarchy is `never`. `never` doesn’t accept a single value at all _(only assignable to itself)_ and is used for situations that should never occur. You cannot assign anything to `never`, except for `never` itself. However, you can assign `never` to anything.

> With `strictNullChecks` enabled, `null` and `undefined` are treated as distinct types that are separate from other types. Regular types like `string` or `number` do not automatically include `null` or `undefined`. This forces you to handle potential null/undefined cases before using values.

`any` doesn't really fit into our definition of 'wide' and 'narrow' types. It's not really a type at all - it's a way of opting out of TypeScript's type checking. By marking a variable as `any`, you're telling the compiler to ignore any type errors that might occur. Using `any` is considered harmful by most of the community.

When you don’t specify a type, and TypeScript can’t infer it from context, the compiler will typically default to `any`. You usually want to avoid this. Use the compiler flag `noImplicitAny` to flag any implicit `any` as an error.

```
                    unknown
       /        /     |      \       \       \
      /        /      |       \       \       \
{ a: string } string number boolean null undefined
       |        |       |       |
       |      'wow'    123     true
       |        |       |       |
       \________\_______\_______\____/______/
                    never
```

The empty object type `{}` is unique. Instead of representing an empty object, it actually represents anything that isn't `null` or `undefined`. `{}` can accept a number of other types: string, number, boolean, function, symbol, and objects containing properties. The only difference between `{}` and `unknown` is that `unknown` contains every single JavaScript value, including `null` and `undefined`.

**Value Types**: We can narrow down primitive types to values.

```ts
// Type is string, because the value can change.
let conference = 'conference';
// Type is 'conference', because the value can't change anymore.
const conf = 'conference';

type TechEvent = {
  title: string,
  kind: 'webinar' | 'conference' | 'meetup'
}
function getEvent(event: TechEvent) {...}

const abc = {
  title: 'abc',
  kind: 'conference'
}
// error here: types of `abc` and TechEvent are incompatible
// the property `kind` in `abc` will not be inferred as 'conference' but as string
getEvent(abc);

// fix 1 (add type annotation)
const abc: TechEvent = {
  title: 'abc',
  kind: 'conference'
}

// fix 2 (type cast to the value type)
const abc = {
  title: 'abc',
  kind: 'conference' as 'conference'
}

// fix 3 (assign a primitive value to a const so fixate its value type)
const abc = {
  title: 'abc',
  kind: 'conference' as const
}

// fix 4 (inline the object, no way that `kind` could be changed)
getEvent({
  title: 'abc',
  kind: 'conference'
})

// `keyof` extracts the keys from an object type into a union type
type GroupProperties = keyof GroupedEvents

// grab the keys and values when we don't know the type of an object
type UppercaseAlbumType = keyof typeof albumTypes
type AlbumType = (typeof albumTypes)[keyof typeof albumTypes]

function printUser(user: User) {
  Object.keys(user).forEach((key) => {
    // TS error: type 'string' can't be used to index type 'User'
    console.log(user[key])
  })
}

// `Object.keys()` returns string[], not Array<keyof T>
// fix 1
console.log(user[key as keyof User])

// fix 2
Object.keys(user) as Array<keyof User>
```

The `as` assertion is a way to tell TypeScript that you know more about a value than it does. It's a way to override TS type inference and tell it to treat a value as a different type. Another assertion we can use is the non-null assertion, which is specified by using the `!` operator. It tells TS to remove any `null` or `undefined` types from the variable.

```ts
const searchParams = new URLSearchParams(window.location.search);
const id = searchParams.get("id"); // string | null

const id = searchParams.get("id") as string;

const x = "Heroes" as number; // Error: 'string' is not assignable to type 'number'
const x = "Heroes" as unknown as number; // this works
// `as unknown as X` is a convenient way to lie to TS

searchParams.get("id")!; // same as `searchParams.get("id") as string`
console.log(user.profile!.bio);
```

```ts
// used a lot when working with the DOM
const myInput = document.getElementById("my_input") as HTMLInputElement;
```

**Mapped types** allow you to create a new object type based on an existing type by iterating over its keys and values. This can be let you be extremely expressive when creating new object types. For key remapping, `as` allows us to remap the key while keeping the original key accessible in the loop.

```ts
type Nullable<T> = {
  [K in keyof T]?: T[K] | null;
};

// `as` keyword to remap the key
type AlbumWithUppercaseKeys = {
  [K in keyof Album as Uppercase<K>]: Album[K];
};

type AttributeGetters = {
  [K in keyof T as `get${Capitalize<K>}`]: () => T[K];
};
```

**Generic Types**: Instead of working with a specific type, we work with a parameter that is then substituted for a specific type. Type parameters are denoted within angle brackets at function heads or class declarations. [Generics are not scary](https://ts.chibicode.com/generics). They’re like regular function parameters, but instead of values, it deals with types. _Generics are erased during compilation._

```ts
type ResourceStatus<TContent> =
  | {
      status: "available";
      content: TContent;
    }
  | {
      status: "unavailable";
      reason: string;
    };

type StreamingPlaylist = ResourceStatus<{
  id: number;
  name: string;
  tracks: string[];
}>;

// Generic functions
function identity<T>(arg: T): T {...}

const removeId = <TObj extends { id: unknown }>(obj: TObj) => {
  const { id, ...rest } = obj;
  return rest;
};

// Set constraints on type parameters
type HasId = {
  id: number;
};
type ResourceStatus<TContent extends HasId, TMetadata extends object = {}> = ...

type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// Conditional types
type ToArray<T> = T extends any[] ? T : T[];
```

### Understanding `infer`

The `infer` keyword is a powerful tool for extracting types from complex structures. It allows you to "infer" a type variable from a more complex type.

```ts
// Extracting the First Element of a Tuple
type FirstElement<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// Extracting the Type of an Array Element
type ElementType<T extends any[]> = T extends (infer E)[] ? E : never;

// Extracting the Return Type of a Function
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : never;

// Extracting the Type of a Property from an Object
type PropertyType<T, K extends keyof T> = T extends { [key in K]: infer P }
  ? P
  : never;

type TrimWhitespacePrefix<T> = T extends `${" " | "\t" | "\n"}${infer U}`
  ? TrimWhitespacePrefix<U>
  : T;
```

```ts
// `infer N` extracts a type from the input.
// `extends number` ensures that the extracted type N is a number.
type ToNumber<S extends string> = S extends `${infer N extends number}`
  ? N
  : never;

type Example1 = ToNumber<"123">; // 123 (number type)
type Example2 = ToNumber<"abc">; // never
```

> `infer N extends number` declares a type variable N inferred from the input, constrained to number.

### Clarifying the `satisfies` operator

We could try to catch the `bleu` typo below by using a type annotation, but we’d lose the information about each property.

```ts
type Colors = "red" | "green" | "blue";
type RGB = [red: number, green: number, blue: number];

const palette: Record<Colors, string | RGB> = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255],
  // ~~~~ The typo is correctly detected
};

// But we now have an error here - 'palette.red' "could" be a string
const redComponent = palette.red.at(0);
```

The `satisfies` operator lets us validate that the type of an expression matches some type, without changing the resulting type of that expression.

```ts
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255],
  // ~~~~ The typo is also caught
} satisfies Record<Colors, string | RGB>;

// Both of these methods are still accessible
const redComponent = palette.red.at(0);
const greenNormalized = palette.green.toUpperCase();
```

When you use a colon, the type BEATS the value. When you use `satisfies`, the value BEATS the type. It infers the narrowest possible type, not the wider type you specify.

```ts
const routes: Record<string, {}> = {
  "/": {},
  "/users": {},
  "/admin/users": {},
};

// No error
routes.awdkjanwdkjn;

const routes = {
  "/": {},
  "/users": {},
  "/admin/users": {},
} satisfies Record<string, {}>;

// Property 'awdkjanwdkjn' does not exist on type
// '{ "/": {}; "/users": {}; "/admin/users": {}; }'
routes.awdkjanwdkjn;
```

> - Use `as` when you want to tell TypeScript that you know more than it does.
> - Use `satisfies` when you want to make sure a value is checked without changing the inference on that value.
> - The rest of the time, use variable annotations.

### Declaration files

Let's say we have a `.js` file that exports a function, if we try to import this file into a TypeScript file, we'll get an error: _Cannot find module xxx or its corresponding type declarations._ To fix this, we can create a declaration file with the same name as the JavaScript file, but with a `.d.ts` extension.

1. TypeScript doesn't allow us to include any implementation code inside a declaration file.
2. Describing JavaScript files by hand can be error-prone - and not usually recommended.

The `declare` keyword can be used to define values which don't have an implementation. It defines the value within the scope it's currently in. `declare global` lets you add things to the global scope.

```ts
declare const MY_CONSTANT: number;
declare function myFunction(): void;
declare const DEBUG: {
  getState: () => {
    id: string;
  };
};

declare global {
  const ALBUM_API: {
    searchAlbums(query: string): Promise<Album[]>;
  };
}

// declare types for a module
declare module "duration-utils" {
  export type Status = "ok" | "failed";
  export interface MyType {
    name: string;
    status: Status;
  }
  export type List = MyType[];
  export function formatDuration(seconds: number): string;
}
export {}; // Adding an export turns this .d.ts file into a module

// png.d.ts: declare types for non-JavaScript files
declare module "*.png" {
  const png: string;

  export default png;
}
```

How does TypeScript know that `.map` exists on an array, but `.transform` doesn't? TypeScript ships with a bunch of declaration files that describe the JavaScript environment. For example, `map` is defined in `lib.es5.d.ts`, `replaceAll` is in `lib.es2021.string.d.ts`. Looking at the code in `node_modules/typescript/lib`, you'll see dozens of declaration files that describe the JavaScript environment. Another set of declaration files that ship with TypeScript are the DOM types, which are defined in a file called `lib.dom.d.ts`. The `lib` setting in `tsconfig.json` lets you choose which `.d.ts` files are included in your project. _`lib: ["es2022"]` does include the features from earlier ECMAScript versions like ES5, ES2015, ES2021, etc._

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "dom", "dom.iterable"],
    "skipLibCheck": true
  }
}
```

The "lib" in `skipLibCheck` refers to any `.d.ts` file. In other words, there is no distinction made between `.d.ts` files which are "yours" (say, in your files list) and "not yours" (say, in `node_modules/@types`). `skipLibCheck` will ignore all these files, meaning you won't get type checking on them. Instead, so put your types in regular TypeScript files.

When you install a library with npm, you're downloading JavaScript to your file system, but not every library bundles `.d.ts` files. The [DefinitelyTyped GitHub repository](https://github.com/DefinitelyTyped/DefinitelyTyped) was built to house high-quality type definitions for numerous popular JavaScript libraries that didn't ship definitions of their own. By **installing a package with `@types/*`** as a dev dependency, you can add type definitions that TypeScript will be able to use immediately.

```sh
# For an npm package "foo", typings for it will be at "@types/foo".
npm install --save-dev @types/node

# Types for a scoped package "@foo/bar" should go in "@types/foo__bar",
# remove the @ and add double-underscore after the scope.
npm install --save-dev @types/babel__preset-env
```

### Declaring global variables

There are two options for modifying the global scope in TypeScript: using `declare global` or creating a `.d.ts` declaration file. For example, if you try to access `window.__INITIAL_DATA__` in a TypeScript file, the compiler will produce a type error because it can't find a definition of the `__INITIAL_DATA__` property anywhere.

```ts
// Example comes from https://mariusschulz.com/blog/declaring-global-variables-in-typescript
type InitialData = {
  userID: string;
};

// 1. Declare a global variable using the `declare var` syntax
// declare a global variable in the global scope
declare global {
  var __INITIAL_DATA__: InitialData;
}

// or create a `globals.d.ts` file
declare var __INITIAL_DATA__: InitialData;

// 2. Augment the window interface using "declaration merging" feature
declare global {
  interface Window {
    __INITIAL_DATA__: InitialData;
  }
}
```

Another example is to specify an environment variable as a string in the global scope. This will be slightly different than the solution for modifying `window`. In the `@types/node` package provided by DefinitelyTyped, there is a `NodeJS` namespace, which includes the `ProcessEnv` interface. This interface defines the shape of `process.env` and is where you can add custom environment variable types. _(`NodeJS.Global`, `NodeJS.ProcessEnv`, `NodeJS.Process`, etc)_

```ts
declare namespace NodeJS {
  interface ProcessEnv {
    MY_ENV_VAR: string; // [key: string]: string;
  }
}
```

### How to use @ts-expect-error

`@ts-expect-error` lets you specify that an error will occur on the next line of the file, which is helpful letting us be sure that an error will occur. If `@ts-expect-error` doesn't find an error, it will source an error itself: _Unused '@ts-expect-error' directive_.

When you actually want to ignore an error, you'll be tempted to use `@ts-ignore`. It works similarly to `@ts-expect-error`, except for one thing: it won't error if it doesn't find an error.

Sometimes, you'll want to ignore an error that later down the line gets fixed. If you're using `@ts-ignore`, it'll just ignore the fact that the error is gone. But with `@ts-expect-error`, you'll actually get a hint that the directive is now safe to remove. So if you're choosing between them, pick `@ts-expect-error`.

The `@ts-nocheck` directive will completely remove type checking for a file. To use it, add the directive at the top of your file.

### Classes differences between TS and ES6

TypeScript supports access modifiers to control property and method visibility. JavaScript traditionally has no access modifiers, but ES2022 introduced private fields with `#`.

In TS, when you declare constructor parameters with an access modifier (`public`, `private`, `protected`, or `readonly`), it automatically creates and initializes a class property for you.

```ts
constructor(private readonly httpService: HttpService) {}

// it is equivalent to writing this in a plain ES6 class:
class MyClass {
  constructor(httpService) {
    this.httpService = httpService;
  }
```

TypeScript allows classes to implement interfaces.

```ts
interface Printable {
  print(): void;
}

class Document implements Printable {
  print(): void {
    console.log("Printing document...");
  }
}
```

## Building the Validation Schema with Zod

[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema declaration and validation library. With Zod, you declare a validator once and Zod will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.

> TypeScript ensures type safety during development and the build process, while Zod validates untrusted data at runtime. TypeScript is enough for internal functions, controlled components; Anything from external sources (APIs, user input) should use Zod.

```js
import { z } from "zod";

// creating a schema for strings
const mySchema = z.string();

// parsing
mySchema.parse("tuna"); // => "tuna"
mySchema.parse(12); // => throws ZodError

// "safe" parsing (doesn't throw error if validation fails)
mySchema.safeParse("tuna"); // => { success: true; data: "tuna" }
mySchema.safeParse(12); // => { success: false; error: ZodError }

const userSchema = z.object({
  username: z.string(),
});

userSchema.parse({ username: "Ludwig" });

// extract the inferred type
type User = z.infer<typeof userSchema>;
// { username: string }
```

Sometimes you don't trust the data entering your app. For those cases, you should use Zod. Let’s build a schema for a form.

```js
const formSchema = z
  .object({
    username: z.string().min(1, "Username is required").max(100),
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must have more than 8 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  // Zod lets you provide custom validation logic via refinements.
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"], // path of error
    message: "Passwords do not match",
  });

// We can use this type to tell `react-hook-form` what our data should look like.
type FormSchemaType = z.infer<typeof formSchema>;
```

Zod Mini variant was introduced with the release of Zod 4. Use `import * as z from "zod/mini"` to import it. Zod Mini implements the exact same functionality as zod, but using a functional, tree-shakable API. If you're coming from zod, this means you generally will use functions in place of methods.

> [Valibot](https://github.com/fabian-hiller/valibot) is very similar to Zod, helping you validate data easily using a schema. The biggest difference is the modular design and the ability to reduce the bundle size to a minimum.
>
> [ArkType](https://github.com/arktypeio/arktype) is a TypeScript-first runtime validation library designed to offer concise, composable, and powerful type definitions with zero dependencies, optimized from editor to runtime.

<br>
<img alt="izod-and-arktype" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/zod-and-arktype.png" width="600">

## Adding Type Check to JavaScript

TypeScript provides code analysis for JavaScript and VS Code gives us TypeScript out of the box (TypeScript language server). With the addition of `//@ts-check` as the very first line in our JavaScript file, TypeScript became active and started to add red lines to code pieces that just don’t make sense.

[JSDoc](https://deno.com/blog/document-javascript-package) is a way to annotate JavaScript code using comments. JSDoc comments are any block comments that begin with `/**` and end with `*/` that precede a block of code. The comments can span multiple lines. Each line should start with `*` and should be indented by one space. JSDoc supports a variety of tags that can be used to provide additional information about your symbols, such as `@param` for parameters, `@returns` for the return value, or `@typeParam` for type parameters. TypeScript uses this annotations to get more information on our intended types.

> It is also the TypeScript language service that is used to interpret JSDoc comments. That is why the TypeScript CHANGELOG often includes notes about JSDoc features. It also the reason your JSDoc-related IntelliSense can be governed by a `tsconfig.json` file and you can run `tsc` on a project typed with JSDoc comments.

```js
// @ts-check
/**
 * @param {number} numberOne
 * @param {number} numberTwo
 * @returns {number}
 */
function addNumbers(numberOne, numberTwo) {
  return numberOne + numberTwo;
}

/**
 * @typedef {Object} ShipStorage
 * @property {number} max
 * @property {string[]} items
 */

/** @type ShipStorage */
const storage = {
  max: 10,
  items: [],
};

/**
 * @param {ShipStorage} storage
 */
function doStuff(storage) {}
```
