---
layout: "../layouts/BlogPost.astro"
title: "Intro to TypeScript"
slug: intro-to-typescript
description: ""
added: "Jun 12 2022"
tags: [js]
updatedDate: "July 23 2024"
---

> There is a broad spectrum of what TypeScript can give you. On the one side of this spectrum, we have: writing good old JavaScript, without types or filling the gaps with any, and after the implementation is done — fixing the types. On the other side of the spectrum, we have type-driven development. Read from https://www.aleksandra.codes/fighting-with-ts
>
> TypeScript allows you to write complex yet elegant code. Some TypeScript users love to explore the possibilities of the type system and love to encode logic at type level. This practice is known as type gymnastics. The community also helps users to learn type gymnastics by creating fun and challenges such as [type challenges](https://github.com/type-challenges/type-challenges).
>
> Cheatsheets for experienced React developers getting started with TypeScript: https://react-typescript-cheatsheet.netlify.app
>
> Total TypeScript book: https://github.com/total-typescript/total-typescript-book/tree/main/book-content/chapters

TypeScript is a strongly typed programming language that builds on JavaScript. It is currently developed and maintained by Microsoft as an open source project. TypeScript supports multiple programming paradigms such as functional, generic, imperative, and object-oriented.

Every time you write JavaScript in e.g. VS Code, TypeScript runs behind the curtains and gives you information on built-in APIs. In fact, a lot of people think that they can live without TypeScript because JavaScript support is so fantastic in modern editors. Guess what’s, it has always been TypeScript. *(In VS Code, open a `.ts` file, `Cmd+Shift+P` enter "Select TypeScript Version" to check. If you select "Use Workspace Version", the setting is written to `.vscode/settings.json`.)*

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

> In addition to the base functionality of ES2015/ES6, ES2020 adds support for dynamic imports, and `import.meta` while ES2022 further adds support for top level await. `ESNext` is a dynamic name that refers to whatever the next version is at the time of writing. ESNext features are more correctly called proposals, because, by definition, the specification has not been finalized yet.

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

// String values can also be assigned to an enum.
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

// Inline Annotations
let dog: {
  kind: string;
  weight: number;
};

dog = {
  kind: 'mammal',
  weight: 10,
};

// Union Type (a type can be one of multiple types, type A = X | Y)
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

// `typeof` operator takes any object and extracts the shape of it.
const defaultOrder = {
  x: 1,
  y: {
    a: 'apple',
    b: [1,2]
  }
}
type Order = typeof defaultOrder

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
const cats: Record<string, string | number>
type TodoPreview = Omit<Todo, "description">
type TodoPreview = Pick<Todo, "title" | "completed">
// retrieve the return type from the function signature without run the function
type User = ReturnType<typeof createUser>
// collect all arguments from a function in a tuple
type Param = Parameters<typeof createUser>
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

In TypeScript, every function has a return type. If we don’t explicitly type or infer, the return type is by default `void`, and `void` is a keyword in JavaScript returning `undefined`.

**Declaration merging for interfaces** means we can declare an interface at separate positions with different properties, and TypeScript combines all declarations and merges them into one. You use `declare` to let TypeScript know that the variable exists, even though it's not declared in the code.
```ts
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
```

**Type hierarchy**: TypeScript sets `any` as the default type for any value or parameter that is not explicitly typed or can’t be inferred. You will rarely need to declare something as `any` (**you may need the type `unknown`**, `any` and `unknown` are top types). `null` and `undefined` are bottom values. (nullish values are excluded from all types if the option `strictNullChecks` is active in `tsconfig.json`). The very bottom of the type hierarchy is `never`. `never` doesn’t accept a single value at all and is used for situations that should never occur.

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

// keyof (get object keys of the type)
type GroupProperties = keyof GroupedEvents
```

**Generic Types**: Instead of working with a specific type, we work with a parameter that is then substituted for a specific type. Type parameters are denoted within angle brackets at function heads or class declarations. *[Generics are not scary](https://ts.chibicode.com/generics). They’re like regular function parameters, but instead of values, it deals with types.*

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

### How to use @ts-expect-error
`@ts-expect-error` lets you specify that an error will occur on the next line of the file, which is helpful letting us be sure that an error will occur. If `@ts-expect-error` doesn't find an error, it will source an error itself *(Unused '@ts-expect-error' directive)*.

When you actually want to ignore an error, you'll be tempted to use `@ts-ignore`. It works similarly to `@ts-expect-error`, except for one thing: it won't error if it doesn't find an error.

Sometimes, you'll want to ignore an error that later down the line gets fixed. If you're using `@ts-ignore`, it'll just ignore the fact that the error is gone. But with `@ts-expect-error`, you'll actually get a hint that the directive is now safe to remove. So if you're choosing between them, pick `@ts-expect-error`.

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

How to run ts files from command line? There is [ts-node](https://github.com/TypeStrong/ts-node) that will compile the code and REPL for node.js: `npx ts-node src/foo.ts`. `tsc` writes js to disk. `ts-node` doesn't need to do that and runs ts on the fly.

`ts-node/register` is used for registering the TypeScript compiler (`ts-node`) to handle the compilation of TypeScript files on the fly. When you run a Node.js application written in TypeScript, the TypeScript code needs to be transpiled into JavaScript before it can be executed by the Node.js runtime. The `ts-node/register` module helps simplify this process by allowing you to execute TypeScript files directly without explicitly precompiling them.
