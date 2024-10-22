---
layout: "../layouts/BlogPost.astro"
title: "Intro to TypeScript"
slug: intro-to-typescript
description: ""
added: "Jun 12 2022"
tags: [js]
updatedDate: "Oct 22 2024"
---

> There is a broad spectrum of what TypeScript can give you. On the one side of this spectrum, we have: writing good old JavaScript, without types or filling the gaps with any, and after the implementation is done — fixing the types. On the other side of the spectrum, we have type-driven development. Read from https://www.aleksandra.codes/fighting-with-ts
>
> TypeScript allows you to write complex yet elegant code. Some TypeScript users love to explore the possibilities of the type system and love to encode logic at type level. This practice is known as type gymnastics. The community also helps users to learn type gymnastics by creating fun and challenges such as [type challenges](https://github.com/type-challenges/type-challenges).
>
> [create-typescript-app](https://github.com/JoshuaKGoldberg/create-typescript-app) is a one-stop-shop solution to set up a new repository with comprehensive, configurable, opinionated TypeScript tooling.

TypeScript is a strongly typed programming language that builds on JavaScript. It is currently developed and maintained by Microsoft as an open source project. TypeScript supports multiple programming paradigms such as functional, generic, imperative, and object-oriented.

Every time you write JavaScript in e.g. VS Code, TypeScript runs behind the curtains and gives you information on built-in APIs. In fact, a lot of people think that they can live without TypeScript because JavaScript support is so fantastic in modern editors. Guess what’s, it has always been TypeScript. *In VS Code, open a `.ts` file, `Cmd+Shift+P` enter "Select TypeScript Version" to check. There is a "Use VS Code's Version" and "Use Workspace Version" (this is from node_modules).*

## Setting up TypeScript
To start off, the TypeScript compiler will need to be installed in order to convert TypeScript files into JavaScript files. To do this, TypeScript can either be installed globally or only available at the project level.

```sh
# use npm
npm install --global typescript
npm install --save-dev typescript

# use yarn
yarn global add typescript
yarn add --dev typescript
```

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
    /* If transpiling with TypeScript: */
    "moduleResolution": "NodeNext",
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,
    /* If NOT transpiling with TypeScript: */
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "noEmit": true,
    // keep the JSX as part of the output to be further consumed by another transform step.
    // "jsx": "preserve",
    /* If your code runs in the DOM: */
    /* "dom" and "dom.iterable" give you types for window, document etc. */
    "lib": ["es2022", "dom", "dom.iterable"],
    /* If your code doesn't run in the DOM: */
    "lib": ["es2022"],
    /* If you're building for a library: */
    "declaration": true,
  }
}
```

`target` tells TS which ES specification you want the transpiled code to support. Whatever you choose for `target` affects the default value of `lib` which in turn tells TS what type definitions to include in your project. If you need any extra polyfill in your project, `lib` is how to make TS happy about it. For example, you need to support IE11 but also you would like to use promises. IE11 supports ES5, but promises is an ES6 feature. You import a promises polyfill, but TS is still giving an error. Now you just need to tell TypeScript that your code will target ES5 (`"target": "es5"`) and it's safe to use promises in the codebase: `"lib": ["dom", "es5", "es2015.promise"]`.

`module` is a setting with a bunch of different options. But really, there are only two modern options. `NodeNext` tells TypeScript that your code will be run by Node.js. And `Preserve` tells TypeScript that an external bundler will handle the bundling.

1. In `ESNext` you aren’t allowed to write `import Foo = require("foo")` because we assume there is no `require`. **`module: "ESNext"` is required with `moduleResolution: "bundler"`**. In `NodeNext`, we know that a given module might be an ES module or it might be a CJS module, based on its file extension(`mjs`, `.cjs`) and/or the `type` field in the nearest`package.json` file.
2. Relative import paths [need explicit file extensions in ES imports](https://www.totaltypescript.com/relative-import-paths-need-explicit-file-extensions-in-ecmascript-imports) when `--moduleResolution` is `node16` or `nodenext`. (The Node spec requires that you use `.js` file extensions for all imports and exports.)
3. `--allowImportingTsExtensions` allows TypeScript files to import each other with a TypeScript-specific extension like `.ts`, `.mts`, or `.tsx`. This flag is only allowed when `--noEmit` is enabled. The expectation here is that your resolver (e.g. your bundler, a runtime, or some other tool) is going to make these imports between `.ts` files work.

> Most bundlers let you omit the file extension when importing files. But TS rules like `moduleResolution: NodeNext` force you to specify the file extension. This can feel really weird when you're working in `.ts` files, but writing `.js` on your imports. Why do we need to do it? Well, it's the spec. It's how it was designed. TS is forcing you to do the right thing. But if you want to go back to the old style, then specify `moduleResolution: Bundler` and bundle your code with a tool like esbuild. ——Matt Pocock

See examples:
- https://github.com/Microsoft/TypeScript-Babel-Starter/blob/master/tsconfig.json
- https://github.com/vuejs/tsconfig/blob/main/tsconfig.json
- https://www.totaltypescript.com/tsconfig-cheat-sheet
- https://deno.com/blog/intro-to-tsconfig

Run `tsc --noEmit` that tells TypeScript that we just want to check types and not create any output files. If everything in our code is all right, `tsc` exits with no error. `tsc --noEmit --watch` will add a `watch` mode so TypeScript reruns type-checking every time you save a file.

> `json` doesn't normally allow comments, but comments are valid in `tsconfig.json`. It's officially supported by TypeScript and VSCode understands it too. What's going on here is [jsonc](https://github.com/microsoft/node-jsonc-parser), or "JSON with JavaScript style comments", a proprietary format used by a bunch of Microsoft products, most notably Typescript and VSCode.

By the way, `jsconfig.json` is a descendant of `tsconfig.json`. The presence of `jsconfig.json` file in a directory indicates that the directory is the root of a JavaScript project.

## Basic Static Types
TypeScript brings along static types to the JavaScript language. **TypeScript's types don't exist at runtime.** They're only used to help you catch errors at compile time.

[ts-reset](https://www.totaltypescript.com/ts-reset) from Total TypeScript is a 'CSS reset' for TypeScript, improving types for common JavaScript API's. For example, `.json()` and `JSON.parse` return unknown, `.filter(Boolean)` behaves exactly how you expect.

```ts
let isAwesome: boolean = true;
let name: string = 'Chris';
let decimalNumber: number = 42;
let whoKnows: any = 1;

// Array types can be written in two ways
let myPetFamily: string[] = ['rocket', 'fluffly', 'harry'];
let myPetFamily: Array<string> = ['rocket', 'fluffly', 'harry'];

// A tuple is an array that contains a fixed number of elements with associated types.
let myFavoriteTuple: [string, number, boolean];
myFavoriteTuple = ['chair', 20, true];

// Tuple types can’t be inferred. If we use type inference directly on a tuple, 
// we will get the wider array type
let tuple = ['Stefan', 38];  // type is (string | number)[]

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
Sizes.Small;   // 0
Sizes.Medium;  // 1
Sizes.Large;   // 2

// The first value can be set to a value other than 0
enum Sizes {
  Small = 1,
  Medium,
  Large,
}
Sizes.Small;   // 1
Sizes.Medium;  // 2
Sizes.Large;   // 3

// String values can also be assigned to an enum
enum ThemeColors {
  Primary = 'primary',
  Secondary = 'secondary',
  Dark = 'dark',
  DarkSecondary = 'darkSecondary',
}

// Real-world examples of Typescript enums
enum LogLevel {
  ERROR,
  WARNING,
  INFO,
  DEBUG
}

enum HTTPStatus {
  OK = 200,
  Redirect = 301,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500,
}
```

```js
// How numeric enums transpile
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

let dog: Animal;
dog = {
  kind: 'mammal',
  weight: 10,
};

// Type Alias
// `interface` and `type` are compatible here, because their shape (structure) is the same.
type Animal = {
  kind: string;
  weight: number;
  color?: string;
};
let dog: Animal;

// Union Type (a type can be one of multiple types, type A = X | Y)
// Narrow down the types of values: typeof, truthiness, instanceof...
const sayHappyBirthday = (name: string | null) => {
  if (name === null) {
    console.log('Happy birthday!');
  } else {
    console.log(`Happy birthday ${name}!`);
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

// Interfaces are faster than type intersections.
// Merge incompatible types
interface User1 {
  age: number;
};
type User2 = {
  age: string;
};

type User = User1 & User2;  // => never
interface User extends User1 {  // raise an error 
  age: string;
}

// `typeof` operator takes any object and extracts the shape of it.
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

function createUser(name: string, role: 'admin' | 'maintenance') {
  return {
    name,
    role,
    createdAt: new Date()
  }
}

const user = createUser('Stefan', 'admin')
type User = typeof user

// Built-in Helper Types (https://www.typescriptlang.org/docs/handbook/utility-types.html)
const fieldsToUpdate: Partial<Todo>
const todo: Readonly<Todo>
const readOnlyGenres: readonly string[] = ["rock", "pop", "country"]
// The `as const` assertion made the entire object deeply read-only,
// including all nested properties. (js `Object.freeze` only at the first level)
const albumAttributes = {
  status: "on-sale",
} as const;
const cats: Record<string, string | number>
type TodoPreview = Omit<Todo, "description">
type TodoPreview = Pick<Todo, "title" | "completed">

// Derive types from functions
function sellAlbum(album: Album, price: number, quantity: number) {
  return price * quantity
}
// extracts the parameters from a given function type and returns them as a tuple
type SellAlbumParams = Parameters<typeof sellAlbum>  // [album: Album, price: number, quantity: number]
// retrieve the return type from the function signature without run the function
type SellAlbumReturn = ReturnType<typeof sellAlbum>  // number
// unwrap the Promise type and provide the type of the resolved value
type User = Awaited<ReturnType<typeof fetchUser>>

// Idexed access types
type AlbumTitle = Album["title"];
type AlbumPropertyTypes = Album["title" | "isSingle" | "releaseYear"];
type AlbumPropertyTypes = Album[keyof Album];
// Index signatures for dynamic keys
interface AlbumAwards {
  [iCanBeAnything: string]: boolean;
}
const albumAwards: {
  [index: string]: boolean;
} = {};
// more concise way
const albumAwards: Record<string, boolean> = {};
```

It's worth noting the similarities between `Exclude/Extract` and `Omit/Pick`. A common mistake is to think that you can `Pick` from a union, or use `Exclude` on an object.

```ts
// Exclude/Extract - union (members)
// Omit/Pick - object (properties)
Exclude<'a' | 1, string>
Extract<'a' | 1, string>
Omit<UserObj, 'id'>
Pick<UserObj, 'id'>
```

```ts
// built-in Omit and Pick are not distributive over union types
type A = { a: string; c: boolean, d: number };
type B = { b: number; c: boolean, d: number };
type Union = A | B;

type NonDistributive = Omit<Union, 'c'>; // { d: number; }

type DistributiveOmit<T, K extends PropertyKey> = T extends any
  ? Omit<T, K>
  : never;

type Distributive = DistributiveOmit<Union, 'c'>; // Omit<A, "c"> | Omit<B, "c">
```

```tsx
// https://www.totaltypescript.com/react-component-props-type-helper
import { ComponentProps } from "react"

type ButtonProps = ComponentProps<"button">
// "button" | "submit" | "reset" | undefined
type ButtonPropsType = ButtonProps["type"]

type MyDivProps = ComponentProps<"div"> & {
  myProp: string
}

type MyCompProps = ComponentProps<typeof MyComp>
```

In TypeScript, every function has a return type. If we don’t explicitly type or infer, the return type is by default `void`, and `void` is a keyword in JavaScript returning `undefined`. If the function is asynchronous, its return type must be a Promise, e.g. `Promise<number>` means that our function must return a Promise that resolves to a number.

```ts
async function fetchData(): Promise<number> {
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();

  return data;
}

// const data = await fetchData();
// type test = Expect<Equal<typeof data, number>>;
```

**Type hierarchy**: TypeScript sets `any` as the default type for any value or parameter that is not explicitly typed or can’t be inferred. You will rarely need to declare something as `any` (**you may need the type `unknown`**, which is a safe type). `null` and `undefined` are bottom values. (nullish values are excluded from all types if the option `strictNullChecks` is active in `tsconfig.json`). The very bottom of the type hierarchy is `never`. `never` doesn’t accept a single value at all and is used for situations that should never occur.

`any` doesn't really fit into our definition of 'wide' and 'narrow' types. It breaks the type system. It's not really a type at all - it's a way of opting out of TypeScript's type checking.

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

> The empty object type `{}` is unique. Instead of representing an empty object, it actually represents anything that isn't `null` or `undefined`. This means that it can accept a number of other types: string, number, boolean, function, symbol, and objects containing properties.

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

// Dynamically update types
// lookup type
type EventKind = TechEvent['kind']

// mapped type (keys to be generated automatically and mapped to a TechEvent list)
type GroupedEvents = {
  [Kind in EventKind]: TechEvent[]
}

// `keyof` extracts the keys from an object type into a union type
type GroupProperties = keyof GroupedEvents

// grab the keys and values when we don't know the type of an object
type UppercaseAlbumType = keyof typeof albumTypes
type AlbumType = (typeof albumTypes)[keyof typeof albumTypes]
```

The `as` assertion is a way to tell TypeScript that you know more about a value than it does. It's a way to override TS type inference and tell it to treat a value as a different type. Another assertion we can use is the non-null assertion, which is specified by using the `!` operator. It tells TS to remove any `null` or `undefined` types from the variable.

```ts
const searchParams = new URLSearchParams(window.location.search)
const id = searchParams.get("id") // string | null

const id = searchParams.get("id") as string;
const albumSales = "Heroes" as unknown as number;
const obj = {} as { a: number; b: number };
searchParams.get("id")!;
console.log(user.profile!.bio);
```

**Generic Types**: Instead of working with a specific type, we work with a parameter that is then substituted for a specific type. Type parameters are denoted within angle brackets at function heads or class declarations. *[Generics are not scary](https://ts.chibicode.com/generics). They’re like regular function parameters, but instead of values, it deals with types.*

You can pass types, as well as values, to functions. To tell whether a function can receive a type argument, hover it and check whether it has any angle brackets.

```ts
// Type as the parameter
const fillArray = <T>(len: number, elem: T) => {
  return new Array<T>(len).fill(elem);
};
const newArray = fillArray<string>(3, 'hi');

// Generic constraints (boundaries)
type URLObject = {
  [k: string]: URL
}
function loadFile<Formats extends URLObject>(fileFormats: Formats, format: keyof Formats)
```

### Clarifying the `satisfies` operator
We could try to catch the `bleu` typo below by using a type annotation, but we’d lose the information about each property.

```ts
type Colors = "red" | "green" | "blue";
type RGB = [red: number, green: number, blue: number];

const palette: Record<Colors, string | RGB> = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255]
//~~~~ The typo is correctly detected
};

// But we now have an error here - 'palette.red' "could" be a string
const redComponent = palette.red.at(0);
```

The `satisfies` operator lets us validate that the type of an expression matches some type, without changing the resulting type of that expression.

```ts
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255]
//~~~~ The typo is also caught
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

> The takeaway here:
> - Use `as` when you want to tell TypeScript that you know more than it does.
> - Use `satisfies` when you want to make sure a value is checked without changing the inference on that value.
> - The rest of the time, use variable annotations.

### Declaring global variables
If you try to access `window.__INITIAL_DATA__` in a TypeScript file, the compiler will produce a type error because it can't find a definition of the `__INITIAL_DATA__` property anywhere.

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


// 2. Augment the window interface
declare global {
  interface Window {
    __INITIAL_DATA__: InitialData;
  }
}
```

Interfaces in TypeScript have an odd property. When multiple interfaces with the same name in the same scope are created, TypeScript automatically merges them. This is known as declaration merging. This is very different from `type`, which would give you an error if you tried to declare the same type twice.

### How to use @ts-expect-error
`@ts-expect-error` lets you specify that an error will occur on the next line of the file, which is helpful letting us be sure that an error will occur. If `@ts-expect-error` doesn't find an error, it will source an error itself: *Unused '@ts-expect-error' directive*.

When you actually want to ignore an error, you'll be tempted to use `@ts-ignore`. It works similarly to `@ts-expect-error`, except for one thing: it won't error if it doesn't find an error.

Sometimes, you'll want to ignore an error that later down the line gets fixed. If you're using `@ts-ignore`, it'll just ignore the fact that the error is gone. But with `@ts-expect-error`, you'll actually get a hint that the directive is now safe to remove. So if you're choosing between them, pick `@ts-expect-error`.

Finally, The `@ts-nocheck` directive will completely remove type checking for a file. To use it, add the directive at the top of your file.

## Building the Validation Schema with Zod
[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema declaration and validation library. With Zod, you declare a validator once and Zod will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.

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

const User = z.object({
  username: z.string(),
});

User.parse({ username: "Ludwig" });

// extract the inferred type
type User = z.infer<typeof User>;
// { username: string }
```

Sometimes you don't trust the data entering your app. For those cases, you should use Zod. Let’s build a schema for a form.

```js
const formSchema = z
  .object({
    username: z.string().min(1, "Username is required").max(100),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
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

> [Valibot](https://github.com/fabian-hiller/valibot) is very similar to Zod, helping you validate data easily using a schema. The biggest difference is the modular design and the ability to reduce the bundle size to a minimum.
>
> JSON Schema is a declarative language for defining structure and constraints for JSON data.
> - Zod to JSON Schema: https://github.com/StefanTerdell/zod-to-json-schema
> - JSON Schema to Zod: https://github.com/StefanTerdell/json-schema-to-zod

## Adding Type Check to JavaScript
TypeScript provides code analysis for JavaScript and VS Code gives us TypeScript out of the box (TypeScript language server). With the addition of `//@ts-check` as the very first line in our JavaScript file, TypeScript became active and started to add red lines to code pieces that just don’t make sense.

[JSDoc](https://deno.com/blog/document-javascript-package) is a way to annotate JavaScript code using comments. JSDoc comments are any block comments that begin with `/**` and end with `*/` that precede a block of code. The comments can span multiple lines. Each line should start with `*` and should be indented by one space. JSDoc supports a variety of tags that can be used to provide additional information about your symbols, such as `@param` for parameters, `@returns` for the return value, or `@typeParam` for type parameters. TypeScript uses this annotations to get more information on our intended types.

```js
// @ts-check
/**
 * @param {number} numberOne
 * @param {number} numberTwo
 * @returns {number}
 */
function addNumbers(numberOne, numberTwo) {
  return numberOne + numberTwo
}

/**
 * @typedef {Object} ShipStorage 
 * @property {number} max
 * @property {string[]} items 
 */

/** @type ShipStorage */
const storage = {
  max: 10,
  items: []
}

/**
 * @param {ShipStorage} storage
 */
function doStuff(storage) {}
```

## Set up a Node server with TypeScript in 2024

```sh
# install dev dependencies
npm i -D typescript ts-node @types/node

# initialize TypeScript
npx tsc --init
```

```json
{
  "name": "my-node-app",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "dev": "node --env-file=.env --watch -r ts-node/register src/index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "devDependencies": {
    "@types/node": "^20.11.17",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.6.0"
  }
}
```

> Make sure you’re using Node >=20.6 — it’s required for some of the flags used in this setup. The `--watch` flag was added in Node v18.11.0. The `--env-file` flag was added in Node v20.6.0.

How to run ts files from command line? There is [ts-node](https://github.com/TypeStrong/ts-node) that will compile the code and REPL for node.js: `npx ts-node src/foo.ts`. `tsc` writes js to disk. `ts-node` doesn't need to do that and runs ts on the fly. But it's not typechecking your code. So we recommend to type check your code first with `tsc` and then run it with `ts-node` before shipping it.

> Run JS/TS file on Node.js using Vite's resolvers and transformers: `npx vite-node index.ts`. [vite-node](https://www.npmjs.com/package/vite-node) is the engine that powers Vitest and Nuxt 3 Dev SSR. It supports ESM & TypeScript out of the box.