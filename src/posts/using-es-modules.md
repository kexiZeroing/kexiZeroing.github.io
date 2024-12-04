---
layout: "../layouts/BlogPost.astro"
title: "Using ES modules"
slug: using-es-modules
description: ""
added: "Aug 12 2020"
tags: [js]
updatedDate: "Nov 24 2024"
---

## ES Modules
While Node.js has been using the CommonJS standard for years and there are a number of JavaScript libraries and frameworks that enable module usage, the browser never had a module system. A module system must be first standardized by ECMAScript and then implemented by the browser. The good news is that modern browsers have started to support module functionality natively, and the use of native JavaScript modules is dependent on the *import* and *export* statements. **The import and export statements cannot be used in embedded scripts unless such script has a `type="module"`**.

> History of module formats:
> 1. **AMD (Asynchronous Module Definition):** This is primarily considered a browser-specific module format. Its key feature is asynchronous module loading, with modules wrapped in a `define()` call. It requires a dedicated loader to run, with RequireJS being the most commonly used one back in the day.
> 2. **CJS (CommonJS):** This is the most common module format in the Node.js environment and was originally the only natively supported format in Node.js. It uses `module` and `exports` fetching modules synchronously.
> 3. **UMD (Universal Module Definition):** Since AMD and CJS are incompatible with each other, but developers wanted a single codebase to work in both browser and Node.js, UMD was created. UMD wraps the module in an IIFE and includes logic to check for `define`, `module`, and other variables for compatibility. With a `.umd.js` extension, just try to put it in a `<script src=...` tag and see if it works.

### Exporting module features
The first thing you need to do to get access to module features is export them. This is done using the `export` statement. The easiest way to use it is to place it in front of any items you want exported out of the module. A more convenient way of exporting all the items is to use a single `export` statement at the end of your module file, followed by a comma-separated list of the features you want to export wrapped in curly braces. You can **export functions, var, let, const, and classes**. They need to be top-level items; you can't use export inside a function.

```javascript
export const name = 'square';

export function draw(ctx, length, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, length, length);
}

export class Square {}

export { name, draw, reportArea, reportPerimeter };
```

A module can also "relay" values exported from other modules without the hassle of writing two separate import/export statements. This is often useful when creating a single module concentrating various exports from various modules (usually called a "barrel module").

```js
export { default as function1, function2 } from "bar.js";
// Which is comparable to a combination of import and export
import { default as function1, function2 } from "bar.js";
export { function1, function2 };

// Barrel file is a module that only re-export other modules
export { x } from "mod";
export { x as v } from "mod";
export * as ns from "mod";
```

There is also `export * from "mod"`, although there's no `import * from "mod"`. This re-exports all named exports from `mod` as the named exports of the current module, but the default export of mod is not re-exported.

### Importing features into script
Once you've exported some features out of your module, you need to import them into your script to be able to use them. Use the `import` statement, followed by a comma-separated list of the features you want to import **wrapped in curly braces**, followed by the keyword `from`, followed by the path to the module file. Once you've imported the features into your script, you can use them just like they were defined inside the same file.

```javascript
import { name, draw, reportArea, reportPerimeter } from './modules/square.js';

import { Square } from './modules/square.js';
```

```javascript
// ** imports are references, not values **

// module.js
export let thing = 'initial';

setTimeout(() => {
  thing = 'changed';
}, 500);

// main.js
import { thing as importedThing } from './module.js';
// ESM imports are asynchronous, which also allows for top-level await
const module = await import('./module.js');
let { thing } = await import('./module.js');

setTimeout(() => {
  console.log(importedThing); // "changed"
  console.log(module.thing); // "changed"
  console.log(thing); // "initial"
}, 1000);
```

### Default exports and renaming
The other type of export called the default export — this is designed to make it easy to have a default function provided by a module. Note that **the lack of curly braces both in export and import statements**. This is because there is only one default export allowed per module. **A default export can be imported with any name**.

```javascript
export default myDefault;
// export anonymous function
export default function() {}

import myDefault from './modules/square.js';
// the above line is shorthand for
import { default as myDefault } from './modules/square.js';

// import the default export and non-default export by name
import React, { Component } from 'react'
```

Inside the `import` and `export` statement's curly braces, you can use the keyword `as` along with a new feature name, to change the identifying name you will use inside the module. It arguably makes more sense to leave your module code alone, and make the changes in the imports. This especially makes sense when you are importing from third party modules that you don't have any control over.

```javascript
// inside module.js
export {
  function1 as newFunctionName,
  function2 as anotherNewFunctionName
};

// inside main.js
import { newFunctionName, anotherNewFunctionName } from './modules/module.js';

// inside module.js
export { function1, function2 };

// inside main.js
import { function1 as newFunctionName, function2 as anotherNewFunctionName } from './modules/module.js';

// import as members of an object Module
import * as Square from './modules/square.js';

Square.draw();
Square.reportArea();
```

### Applying the module to HTML
Now we just need to apply the JavaScript module to our HTML page. This is very similar to how we apply a regular script to a page. You need to **include `type="module"` in the `<script>` element to declare this script as a module**. You can only use `import` and `export` statements inside modules; not regular scripts. Note that **modules use strict mode automatically**. JavaScript module scripts are **deferred by default** (`<script defer>`). This means the download for the module can happen in parallel with HTML parsing and the execuation is after the DOM is loaded.

If a browser does not support modules, we need to use a combination of `type="module"` and `nomodule` attribute. 
- In modern browsers that support module scripts, the script element with the `nomodule` attribute will be ignored, and the script element with a type of `module` will be fetched and evaluated as a module script. 
- Older browser will ignore the script element with a type of `module`, as that is an unknown script type for them, but they will have no problem fetching and evaluating the other script as a classic script, ignoring the `nomodule` attribute.

```html
<script type="module" src="main.js"></script>
<script nomodule src="fallback.js"></script>
```

### Dynamic module loading
This allows you to dynamically load modules only when they are needed, rather than having to load everything up front. You can call `import()` as a function, passing it the path to the module as a parameter. **It returns a promise**, which fulfills with a module object giving you access to that object's exports.

```javascript
import('./modules/square.js').then((Module) => {
  let square1 = new Module.Square();  // access member in module object
  square1.draw();
  square1.reportArea();
})
```

### Import Attributes
The Import Attributes proposal, formerly known as Import Assertions, adds an inline syntax for module import statements to pass on more information alongside the module specifier. The initial application for such attributes will be to support additional types of modules in a common way across JavaScript environments, starting with JSON modules.

```js
// Executes JS if it responds with a JavaScript MIME type (e.g. `text/javascript`)
import data from 'https://evil.com/data.json';
```

File extensions can’t be used to make a module type determination because they aren’t a reliable indicator of content type on the web. On the web, there is a widespread [mismatch between file extension and the HTTP Content Type header](https://github.com/tc39/proposal-import-attributes/blob/master/content-type-vs-file-extension.md).

When a developer wants to import a JSON module, they must use an import assertion to specify that it’s supposed to be JSON. The import will fail if the MIME type received from the network doesn’t match the expected type.

```js
// https://github.com/tc39/proposal-import-attributes
// Status: Stage 3
import json from "./foo.json" with { type: "json" };

// dynamic import
import("foo.json", { with: { type: "json" } })
```

### Import maps
In common module systems, such as CommonJS, or a module bundler like webpack, the import specifier was mapped to a specific file, and users only needed to apply the bare module specifier (usually the package name) in the import statement, and concerns around module resolution were taken care of automatically.

Now many web developers are using JavaScript's native module syntax, but combining it with bare import specifiers, making their code unable to run on the web without per-application, ahead-of-time modification. We'd like to solve that, and bring these benefits to the web.

When importing modules in scripts, if you don't use the `type="importmap"` feature, then each module must be imported using a module specifier that is either an absolute or relative URL.

```js
import { name as squareName, draw } from "./shapes/square.js";
import { name as circleName } from "https://example.com/shapes/circle.js";

// import from CDN, and no need for a build step
// https://www.skypack.dev
import React from "https://cdn.skypack.dev/react";

// esm.sh is a modern CDN that allows you to import es6 modules from a URL
// No build tools needed
import Module from "https://esm.sh/PKG@SEMVER[/PATH]";
```

[This proposal](https://github.com/WICG/import-maps) allows control over what URLs get fetched by JavaScript `import` statements. This allows "bare import specifiers", such as `import moment from "moment"`, to work. The mechanism for doing this is via an *import map* which can be used to control the resolution of module specifiers generally.

Today, `import moment from "moment"` throws, as such bare specifiers are reserved *(specifier needs to start with the character `/`, `./`, `../`)*. By supplying the browser with the following import map, the above would act as if you had written `import moment from "/node_modules/moment/src/moment.js"`.

```html
<script type="importmap">
{
  "imports": {
    "moment": "/node_modules/moment/src/moment.js",
  }
}
</script>
```

> A valid module specifier map is a JSON object that each value must be either a valid absolute URL or a valid URL string that starts with "/", "./", or "../".

*Update at 2023-03-28:* [JavaScript import maps are now supported cross-browser](https://web.dev/import-maps-in-all-modern-browsers). A modern way to use ES modules is with the `<script type="importmap">` tag. This tag allows you to define a mapping of external module names to their corresponding URLs, which makes it easier to include and use external modules in your code.

### Importing a frontend Javascript library without a build system
It's a hard problem now to take an NPM library and figure out how to download it and use it from a `<script>` tag without needing to involve some sort of convoluted build system.

Read: https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library

## Getting started with Node.js ESM
In May, 2020, Node.js v12.17.0 made ESM support available to all Node.js applications without experimental flags. Read more at https://formidable.com/blog/2021/node-esm-and-exports

The `package.json` file contains a field `"type": "module"` (defaults to CommonJS when not set). This will make Node.js interpret all files in the package as ESM files. When migrating to `mjs`, change the `module.exports` to the ESM `export` statement and all the `require` to the respective `import` statements.

> CJS is the default; you have to opt-in to ESM mode. You can opt-in to ESM mode by renaming your script from `.js` to `.mjs`. Alternately, you can set `"type": "module"` in package.json, and then you can opt-out of ESM by renaming scripts from `.js` to `.cjs`.

### ESM and CJS are completely different
Since the dawn of Node, Node modules were written as CommonJS modules. We use `require()` to import them. When implementing a module for other people to use, we can define `exports`, either "named exports" by setting `module.exports.foo = 'bar'` or a "default export" by setting `module.exports = 'baz'`.

ESM changes a bunch of stuff in JavaScript. Switching the default from CJS to ESM would be a big break in backwards compatibility. Three guidelines for library authors to follow if they need to support CJS and ESM:

1. Provide a CJS version of your library. This ensures that your library can work in older versions of Node. *ESM scripts can import CJS scripts, but only by using the "default import” syntax `import _ from 'lodash'`, not the "named import" syntax `import { shuffle } from 'lodash'`.*
   
2. Provide a thin ESM wrapper for your CJS named exports. It’s easy to write an ESM wrapper for CJS libraries, but it’s not possible to write a CJS wrapper for ESM libraries.
   ```js
   // esm/wrapper.js
   import cjsModule from '../index.js';
   export const foo = cjsModule.foo; 
   ```

3. Add an `exports` map to your `package.json`. Be aware that adding an `exports` map is always a "semver major" breaking change. By default, your users can reach into your package and `require()` any script they want, even files that you intended to be internal. The `exports` map ensures that users can only require/import the entry points that you deliberately expose.
   ```json
   "exports": {
      "require": "./index.js",
      "import": "./esm/wrapper.js"
   }
   ```

**Updates for Node.js 22:** Support for require()ing ESM graphs is now enabled through experimental flag. We intend to enable it by default in the future to allow package authors to publish ESM-only packages while maintaining support for CJS users, and help the ecosystem migrate to ESM incrementally.

```js
// Define a module in a file named 'math-utils.mjs'
export function square(x) {
  return x ** 2;
}

// main.js - ​Synchronously require the ES module in a CommonJS file
// $ node --experimental-require-module main.js
const mathUtils = require('./math-utils.mjs');
​
console.log(mathUtils.square(2));
```

Node 23 was released on Oct 2024 that you can now `require()` files that use ESM (import/export), which lets you import an ES Module in CommonJS and have it just work. Previously, if you wanted to use a “module” from your CommonJS file, you would need to do use dynamic import `await import('some/module/file.mjs')` and you can’t just put this at the top of your file.

> Update: In the release of version 22.12.0, it is now no longer behind a flag on v22.x. Users can check `process.features.require_module` to see whether `require(esm)` is enabled in the current Node.js instance.

Other highlights in Node 23:
- The `--experimental-strip-types` flag provides “initial TypeScript support” by stripping type annotations from .ts files, allowing them to run without transforming TypeScript-specific syntax.
- Stabilized task runner lets you execute `package.json` scripts by using `node --run`, instead of needing to use npm, Yarn, or Bun.
