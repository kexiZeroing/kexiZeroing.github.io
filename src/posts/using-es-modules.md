---
layout: "../layouts/BlogPost.astro"
title: "Using ES modules"
slug: using-es-modules
description: ""
added: "Aug 12 2020"
tags: [js]
---

## ES Modules
While Node.js has been using the CommonJS standard for years and there are a number of JavaScript libraries and frameworks that enable module usage, the browser never had a module system. A module system must be first standardized by ECMAScript and then implemented by the browser. The good news is that modern browsers have started to support module functionality natively, and the use of native JavaScript modules is dependent on the *import* and *export* statements. **The import and export statements cannot be used in embedded scripts unless such script has a `type="module"`**.

> [Getting Started with Node.js ESM](https://formidable.com/blog/2021/node-esm-and-exports): In May, 2020, Node.js v12.17.0 made ESM support available to all Node.js applications without experimental flags.
> - The `package.json` file contains a field `"type": "module"`. This will make Node.js interpret all files in the package as ESM files.
> - An imported file name ends with `.mjs`. When migrating your `js` files to `mjs`, change the basic exports (`module.exports`) to the ESM `export` statement and all the `require` to the respective `import` statements.

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

## Import maps
In common module systems, such as CommonJS, or a module bundler like webpack, the import specifier was mapped to a specific file, and users only needed to apply the bare module specifier (usually the package name) in the import statement, and concerns around module resolution were taken care of automatically.

Now many web developers are using JavaScript's native module syntax, but combining it with bare import specifiers, making their code unable to run on the web without per-application, ahead-of-time modification. We'd like to solve that, and bring these benefits to the web.

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
