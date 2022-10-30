---
layout: "../layouts/BlogPost.astro"
title: "Module bundler clone"
slug: module-bundler
description: ""
added: "Oct 9 2021"
tags: [code]
---

```js
// filename: circle.js
const PI = 3.141;
export default function area(radius) {
  return PI * radius * radius;
}

// filename: square.js
export default function area(side) {
  return side * side;
}

// filename: app.js
import squareArea from './square';
import circleArea from './circle';
console.log('Area of square', squareArea(5));
console.log('Area of circle', circleArea(5));

// webpack-bundle.js
// `module map` is a dictionary that maps the module name to the module itself, which is wrapped in a function.
const modules = {
  'circle.js': function(exports, require) {
    const PI = 3.141;
    exports.default = function area(radius) {
      return PI * radius * radius;
    }
  },
  'square.js': function(exports, require) {
    exports.default = function area(side) {
      return side * side;
    }
  },
  'app.js': function(exports, require) {
    const squareArea = require('square.js').default;
    const circleArea = require('circle.js').default;
    console.log('Area of square: ', squareArea(5))
    console.log('Area of circle', circleArea(5))
  }
}

// `require` function takes in the module name and returns the exported interface from a module (which is cached).
function webpackStart({ modules, entry }) {
  const moduleCache = {};

  const require = moduleName => {
    if (moduleCache[moduleName]) {
      return moduleCache[moduleName];
    }
    const exports = {};
    moduleCache[moduleName] = exports;
    modules[moduleName](exports, require);

    return moduleCache[moduleName];
  };

  // require the entry module to start
  require(entry);
}

// a function that glues everything together
webpackStart({
  modules,
  entry: 'app.js'
});

// import duplicates?
// When you import a module, the code in the file is executed once, then the resulting exports are cached.
// Webpack is smart enough to not execute module's full source code every time you import it.
```