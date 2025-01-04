---
title: "Intro to TypeScript"
description: ""
added: "Jun 12 2022"
tags: [js]
updatedDate: "Dec 28 2024"
---

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

    /*
     * https://github.com/privatenumber/fix-verbatim-module-syntax
     * Fix error: 'SomeType' is a type and must be imported using a type-only import 
     * when 'verbatimModuleSyntax' is enabled.
     */

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
    "declaration": true,
  }
}
```

`strict` option acts as shorthand for enabling several different type checking options, including catching potential `null` or `undefined` issues and stronger checks for function parameters, among others. Without `noUncheckedIndexedAccess` enabled, TS assumes that indexing will always return a valid value, even if the index is out of bounds. This means that we have to handle the possibility of `undefined` values when accessing array or object indices.

`target` tells TS which ES specification you want the transpiled code to support. Whatever you choose for `target` affects the default value of `lib` which in turn tells TS what type definitions to include in your project. Does your code run in the DOM? If yes, set `lib` to `["dom", "dom.iterable", "es2022"]`. If not, set it to `["es2022"]`.

> `target` doesn't polyfill. While target can transpile newer syntaxes into older environments, it won't do the same with API's that don't exist in the target environment.

`module` is a setting with a bunch of different options, which specifies how TS should treat your imports and exports. But really, there are only two modern options. `NodeNext` tells TypeScript that your code will be run by Node.js. And `Preserve` tells TypeScript that an external bundler will handle the bundling (also set `noEmit` to true).

`module: "NodeNext"` also implies `moduleResolution: "NodeNext"`. `NodeNext` is a shorthand for the most up-to-date Node.js module behavior. `module: "Preserve"` implies `moduleResolution: "Bundler"`.

TypeScript has built-in support for transpiling JSX syntax, and the `jsx` option tells TS how to handle JSX syntax. `preserve` means keeps JSX syntax as-is. `react` transforms JSX into `React.createElement` calls *(for React 16 and earlier)*. `react-jsx` transforms JSX into `_jsx` calls, and automatically imports from `react/jsx-runtime` *(for React 17 and later)*.

By default `moduleDetection` set to `auto`, if we don't have any `import` or `export` statements in a `.ts` file, TypeScript treats it as a script. **By adding the `export {}` statement, you're telling TS that the `.ts` is a module**. `moduleDetection: force` will treat all files as modules, and you will need to use `import` and `export` statements to access functions and variables across files.

How does TS know what module system (ESM or CJS) to emit?
1. The way this is decided is via `module`. You can hardcode this by choosing some older options. `module: CommonJS` will always emit CommonJS syntax, and `module: ESNext` will always emit ESM syntax.
2. Using the recommended `module: NodeNext`, we know that a given module might be an ES module or it might be a CJS module, based on its file extension(`mts`, `.cts`) and/or the `type` field in the nearest `package.json` file.

Relative import paths [need explicit file extensions in ES imports](https://www.totaltypescript.com/relative-import-paths-need-explicit-file-extensions-in-ecmascript-imports) when `--moduleResolution` is `node16` or `nodenext`.
1. Most bundlers let you omit the file extension when importing files. But TS rules like `moduleResolution: NodeNext` force you to specify the file extension. This can feel really weird when you're working in `.ts` files, but writing `.js` on your imports. Why do we need to do it? Well, it's the spec. *The Node spec requires that you use `.js` file extensions for all imports and exports.* If you want to go back to the old style, then specify `moduleResolution: Bundler` and bundle your code with a tool like esbuild.
2. `--allowImportingTsExtensions` allows TypeScript files to import each other with a TypeScript-specific extension like `.ts`, `.mts`, or `.tsx`. This flag is only allowed when `--noEmit` is enabled. The expectation here is that your resolver (e.g. your bundler, a runtime, or some other tool) is going to make these imports between `.ts` files work.

How multiple `tsconfig.json` files can be composed together?
1. Your IDE determines which `tsconfig.json` to use by looking for the closest one to the current `.ts` file.
2. When you have multiple `tsconfig.json` files, it's common to have shared settings between them. We can create a new `tsconfig.base.json` file that can be extended from.

```
project
  ├── client
  │   └── tsconfig.json
  ├── server
  │   └── tsconfig.json
  └── tsconfig.json
```

```json
// server/tsconfig.json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib": [
      "es2022"
    ]
  }
}
```

See examples:
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

// https://www.totaltypescript.com/const-type-parameters
const myFunc = <const T extends string[]>(input: T) => {
  return input
}
const result = myFunc(['a', 'b']) // myFunc(['a', 'b'] as const)
type myFuncType = typeof result  // ['a', 'b'], not string[]

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

// Indexed access types
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

// Template literal types can be used to interpolate other types into string types
type PngFile = `${string}.png`;
let myImage: PngFile = "my-image.png";

type ColorShade = 100 | 200 | 300;
type Color = "red" | "blue" | "green";
type ColorPalette = `${Color}-${ColorShade}`;
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

`any` doesn't really fit into our definition of 'wide' and 'narrow' types. It breaks the type system. It's not really a type at all - it's a way of opting out of TypeScript's type checking. Using `any` is rightly considered harmful by most of the community. There are [ESLint rules](https://typescript-eslint.io/rules/no-explicit-any) to prevent its use. *TypeScript's `--noImplicitAny` compiler option prevents an implied `any`, but doesn't prevent `any` from being explicitly used the way this rule does.*

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

> The empty object type `{}` is unique. Instead of representing an empty object, it actually represents anything that isn't `null` or `undefined`. `{}` can accept a number of other types: string, number, boolean, function, symbol, and objects containing properties.
>
> - The only difference between `{}` and `unknown` is that `unknown` contains every single JavaScript value, including `null` and `undefined`.
> - Unlike `{}`, `object` type does not include primitive types.

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

// `keyof` extracts the keys from an object type into a union type
type GroupProperties = keyof GroupedEvents

// grab the keys and values when we don't know the type of an object
type UppercaseAlbumType = keyof typeof albumTypes
type AlbumType = (typeof albumTypes)[keyof typeof albumTypes]

function printUser(user: User) {
  Object.keys(user).forEach((key) => {
    // TS error: type 'string' can't be used to index type 'User'
    console.log(user[key])
    // should be
    console.log(user[key as keyof User])
  })
}
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
  [K in keyof Attributes as `get${Capitalize<K>}`]: () => Attributes[K];
};
```

**Generic Types**: Instead of working with a specific type, we work with a parameter that is then substituted for a specific type. Type parameters are denoted within angle brackets at function heads or class declarations. [Generics are not scary](https://ts.chibicode.com/generics). They’re like regular function parameters, but instead of values, it deals with types.

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

Here is an example from type challenges. It creates a type that transforms each key-value pair in an object T into a string of the format `"<key>: <value>"`. The result is a union of those string values.

```ts
type Excuse<T extends Record<string, string>> = {
  [K in keyof T]: `${K & string}: ${T[K]}`;
}[keyof T];
```

1. The reason for using `${K & string}` instead of `${K}` is to ensure that the key is explicitly treated as a string. This is important when K might be a union of string-like types or symbols, and we only want to generate string-based template literals.
2. The last part `[keyof T]` accesses the values of the object generated by the mapped type. Specifically, this creates a union type of all the string values produced by the mapped type for each key.

### Understanding `infer`
The `infer` keyword is a powerful tool for extracting types from complex structures. It allows you to "infer" a type variable from a more complex type.

```ts
// Extracting the First Element of a Tuple
type FirstElement<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// Extracting the Type of an Array Element
type ElementType<T extends any[]> = T extends (infer E)[] ? E : never;

// Extracting the Return Type of a Function
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

// Extracting the Type of a Property from an Object
type PropertyType<T, K extends keyof T> = T extends { [key in K]: infer P } ? P : never;

type TrimWhitespacePrefix<T> = T extends `${" " | "\t" | "\n"}${infer U}`
  ? TrimWhitespacePrefix<U>
  : T;
```

```ts
// `infer N` extracts a type from the input.
// `extends number` ensures that the extracted type N is a number.
type ToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;

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

### Declaration files
Let's say we have a `.js` file that exports a function, if we try to import this file into a TypeScript file, we'll get an error: *Cannot find module xxx or its corresponding type declarations.* To fix this, we can create a declaration file with the same name as the JavaScript file, but with a `.d.ts` extension.
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
  export type Status = 'ok' | 'failed';
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

How does TypeScript know that `.map` exists on an array, but `.transform` doesn't? TypeScript ships with a bunch of declaration files that describe the JavaScript environment. For example, `map` is defined in `lib.es5.d.ts`, `replaceAll` is in `lib.es2021.string.d.ts`. Looking at the code in `node_modules/typescript/lib`, you'll see dozens of declaration files that describe the JavaScript environment. Another set of declaration files that ship with TypeScript are the DOM types, which are defined in a file called `lib.dom.d.ts`. *The `lib` setting in `tsconfig.json` lets you choose which `.d.ts` files are included in your project. By default, this inherits from the `target` setting.*

```json
{
  "compilerOptions": {
    "target": "es2022",
    // "lib": ["es2022", "dom", "dom.iterable"] is implied
    "skipLibCheck": true,
  }
}
```

Note that skip declaration files in `node_modules`, **it also skips all declaration files.** "Declaration files" sounds like where you put your type declarations. But this is a bad idea. `skipLibCheck` will ignore these files, meaning you won't get type checking on them. Instead, put your types in regular TypeScript files.

> Different browsers support different features. But TypeScript only ships one set of DOM types. So how does it know what to include? TypeScript's policy is that if a feature is supported in two major browsers, it's included in the DOM types.

When you install a library with npm, you're downloading JavaScript to your file system, but not every library bundles `.d.ts` files. The [DefinitelyTyped GitHub repository](https://github.com/DefinitelyTyped/DefinitelyTyped) was built to house high-quality type definitions for numerous popular JavaScript libraries that didn't ship definitions of their own. By installing a package with `@types/*` and your library as a dev dependency, you can add type definitions that TypeScript will be able to use immediately.

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


// 2. Augment the window interface
declare global {
  interface Window {
    __INITIAL_DATA__: InitialData;
  }
}
```

Interfaces in TypeScript have an odd property. When multiple interfaces with the same name in the same scope are created, TypeScript automatically merges them. This is known as declaration merging. This is very different from `type`, which would give you an error if you tried to declare the same type twice.

Another example is to specify an environment variable as a string in the global scope. This will be slightly different than the solution for modifying `window`. Inside of `@types/node` from DefinitelyTyped, the `ProcessEnv` interface is responsible for environment variables. It can be found inside of the `NodeJS` namespace.

```ts
declare namespace NodeJS {
  interface ProcessEnv {
    MY_ENV_VAR: string;   // [key: string]: string;
  }
}
```

### Importing types
With `import type`, only the type information is imported, and the import is removed from the emitted JavaScript.

```ts
// entire line as a type import
import type { Album } from "./album";

// combine runtime imports with type imports
import { type Album, createAlbum } from "./album";
```

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

Btw, you can use [jiti](https://github.com/unjs/jiti) CLI to quickly run any script with TypeScript and native ESM support.

For lightweight support to enable runtime TypeScript in Node.js, you can use the built-in support for [type stripping](https://nodejs.org/api/typescript.html#type-stripping). By default Node.js will execute only files that contain no TypeScript features that require transformation, such as enums or namespaces. Node.js will replace inline type annotations with whitespace, and no type checking is performed. Node 23 will be able to run TypeScript files without any extra configuration *(unflagging `--experimental-strip-types`)*.
- Create an `index.ts` file containing TS syntax. Enums and namespaces are not supported by default.
- Run node `index.ts` with no further flags.
- Node will strip out the types using a version of swc, then run the resulting code.
- Node will not typecheck your files when it runs them.
