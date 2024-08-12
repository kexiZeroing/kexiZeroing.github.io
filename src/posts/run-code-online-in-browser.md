---
layout: "../layouts/BlogPost.astro"
title: "Notes on running code online in browser"
slug: notes-on-running-code-online-in-browser
description: ""
added: "Aug 12 2024"
tags: [web, code]
---

Online code editors allow developers to prototype and experiment without the need for a full development environment.

JSX isn't natively understood by browsers, so we need to transform it into regular JavaScript. This is typically done using Babel. In this case, we're using `@babel/standalone`, which is a browser version of Babel.

> If you're using Babel in production, you should normally not use `@babel/standalone`. Instead, you should use a build system running on Node.js, such as Webpack, Rollup, or Parcel, to transpile your JS ahead of time.

```js
import { transform } from '@babel/standalone';

const babelTransform = (code) => {
  return transform(code, {
    presets: ['react', 'typescript'],
  }).code;
};

const jsxCode = `
  const App = () => {
    return <h1>Hello, World!</h1>;
  };
`;

const compiledCode = babelTransform(jsxCode);
console.log(compiledCode);
```

Monaco Editor can provide a rich editing experience for the JSX code.

```js
import * as monaco from 'https://esm.sh/monaco-editor@0.30.1';

const editor = monaco.editor.create(document.getElementById('editor'), {
  value: `const App = () => {
    return <h1>Hello, World!</h1>;
    };`,
  language: 'javascript',
  theme: 'vs-dark'
});
```

To prevent the main thread from being blocked during code compilation, which could cause the UI to feel sluggish, we can use a Web Worker:

```js
// compiler.worker.js
self.addEventListener('message', async ({ data }) => {
  const compiledCode = babelTransform(data);
  self.postMessage(compiledCode);
});

// main.js
const compilerWorker = new Worker('compiler.worker.js');

compilerWorker.postMessage(jsxCode);

compilerWorker.addEventListener('message', ({ data }) => {
  // data contains the compiled code
  console.log('Compiled code:', data);
});
```

To support third-party module imports, we can use import maps. This allows us to specify module paths for the browser:

```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0"
  }
}
</script>
```

To handle local module imports in the browser, we can use `URL.createObjectURL` to generate temporary URL files:

```js
const moduleCode = `
  export const greeting = "Hello, World!";
`;

const compiledModuleCode = babelTransform(moduleCode);

const moduleURL = URL.createObjectURL(
  new Blob([compiledModuleCode], { type: 'application/javascript' })
);

// Now you can import this module using:
// import { greeting } from moduleURL;
```

To tie everything together, we need to automatically transform our import statements to use the URLs we've created. We can do this with a custom Babel plugin:

> The plugin is defined as an object with a `visitor` property. The `ImportDeclaration` method will be called for every import declaration in the code being transformed. The `path` parameter represents the current path being traversed in the Abstract Syntax Tree (AST).

```js
import { transform } from '@babel/core';

const transformImportSourcePlugin = {
  visitor: {
    ImportDeclaration(path) {
      // Transform the import source to a URL
      path.node.source.value = getModuleURL(path.node.source.value);
    }
  }
};

const babelTransformWithPlugin = (code) => {
  return transform(code, {
    presets: ['react', 'typescript'],
    plugins: [transformImportSourcePlugin]
  }).code;
};
```
