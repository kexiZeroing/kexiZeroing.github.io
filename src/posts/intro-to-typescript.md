---
layout: "../layouts/BlogPost.astro"
title: "Intro to TypeScript"
slug: intro-to-typescript
description: ""
added: "Jun 12 2022"
tags: [js]
---

1. In terms of programming language, write modern JavaScript. Let TypeScript make sure you can write modern JavaScript.
2. In terms of type system, find ways to make sure type safety and our JavaScript makes sense.
3. Try at https://www.typescriptlang.org/play

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
    "target": "ES5",
    "module": "ES2015"
  }
}
```

At the moment, a `.ts` file will be transpiled to the ES5 version of JavaScript (`target`) and all import statements will be kept in the ES2015 format (`module`) in the output. You can also set the `module` to `CommonJS` as Webpack can also handle the CommonJS module system.

Run `tsc --noEmit` that tells TypeScript that we just want to check types and not create any output files. If everything in our code is all right, `tsc` exits with no error. `tsc --noEmit --watch` will add a `watch` mode so TypeScript reruns type-checking every time you save a file.

> `json` doesn't normally allow comments, but comments are valid in `tsconfig.json`. It's officially supported by TypeScript and VSCode understands it too. `npx tsc --init` command generates the `tsconfig.json` with all the settings commented. What's going on here is [jsonc](https://github.com/microsoft/node-jsonc-parser), or "JSON with JavaScript style comments", a proprietary format used by a bunch of Microsoft products, most notably Typescript and VSCode.

### jsconfig and tsconfig
JavaScript experience is improved when you have a `jsconfig.json` file in your workspace that defines the project context. **`jsconfig.json` is a descendant of `tsconfig.json`**. The presence of `jsconfig.json` file in a directory indicates that the directory is the root of a JavaScript project.

The `exclude` attribute tells the language service what files are not part of your source code (e.g. `node_modules`, `dist`). Alternatively, you can explicitly set the files in your project using the `include` attribute (e.g. `src/**/*`).

Below are `compilerOptions` to configure the JavaScript language support. Do not be confused by `compilerOptions`, since no actual compilation is required for JavaScript. This attribute exists because `jsconfig.json` is a descendant of `tsconfig.json`. See an example at https://github.com/Microsoft/TypeScript-Babel-Starter/blob/master/tsconfig.json

- `target`: This setting changes which JS features are downleveled and which are left intact. Modern browsers support all ES6 features, so `ES6` is a good choice. The values are "es3", "es5", "es6", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "esnext".
- `module`: Specifies the module system when generating module code. The values are "amd", "commonJS", "es2015", "es6", "esnext", "none", "system", "umd".
- `baseUrl`: Lets you set a base directory to resolve non-absolute module names. With `"baseUrl": "."`, it will look for files starting at the same folder as the `jsconfig.json`.
- `paths`: A series of entries which re-map imports to lookup locations relative to the `baseUrl`, e.g. `"@models/*": ["app/models/*"]`.
- `checkJs`: Enable type checking on JavaScript files. This is the equivalent of including `// @ts-check` at the top of all JavaScript files which are included in your project. (Set `allowJs: true` in `tsconfig.json` to tell TypeScript to allow a reference to regular JavaScript files.)

## Basic Static Types
TypeScript brings along static types to the JavaScript language, and those **types are evaluated at compile time**. Static types can help warn you of possible errors without having to run the code.

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

// Built-in Helper Types
// retrieve the return type from the function signature (without run the function)
type User = ReturnType<typeof createUser>
// collect all arguments from a function in a tuple
type Param = Parameters<typeof createUser>
```

In TypeScript, every function has a return type. If we don’t explicitly type or infer, the return type is by default `void`, and `void` is a keyword in JavaScript returning `undefined`.

**Declaration merging for interfaces** means we can declare an interface at separate positions with different properties, and TypeScript combines all declarations and merges them into one.

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

**Generic Types**: Instead of working with a specific type, we work with a parameter that is then substituted for a specific type. Type parameters are denoted within angle brackets at function heads or class declarations.

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

// Partial (each key becomes optional) and Readonly (Object.freeze)
const defaultP: UserPreferences;
const userP: Partial<UserPreferences>;
const specialP: Readonly<UserPreferences>;
```

## Adding Type Check to JavaScript
TypeScript provides code analysis for JavaScript and VS Code gives us TypeScript out of the box (TypeScript language server). With the addition of `//@ts-check` as the very first line in our JavaScript file, TypeScript became active and started to add red lines to code pieces that just don’t make sense.

`JSDoc` is a way to annotate JavaScript code using comments. TypeScript uses this annotations to get more information on our intended types.

```js
// @ts-check
/**
* @param {number} numberOne
* @param {number} numberTwo
* @returns {number}
*/
function addNumbers(numberOne, numberTwo) { return numberOne + numberTwo }

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
