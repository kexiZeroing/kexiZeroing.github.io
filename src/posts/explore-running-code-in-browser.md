---
layout: "../layouts/BlogPost.astro"
title: "Explore running code in browser"
slug: explore-running-code-in-browser
description: ""
added: "Aug 25 2023"
tags: [other]
updatedDate: "Oct 25 2024"
---

## Interactive blog-cells
[blog-cells](https://github.com/rameshvarun/blog-cells) adds interactive code snippets to any blog or webpage. It's worth a try at here.

<p>
<script type="text/notebook-cell" data-autorun="true">
console.log("Hello World!");
</script>
</p>

<p>
<script type="text/notebook-cell">
console.log("Hello World, but not automatic.");
</script>
</p>

<script type="text/notebook-cell" data-autorun="true">
const response = await fetch("https://pokeapi.co/api/v2/pokemon/ditto");
const data = await response.json();
console.log(data);
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/blog-cells@0.4.1/dist/blog-cells.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/blog-cells@0.4.1/dist/blog-cells.js"></script>

## Notes on running code online in browser
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

### CodeSandbox and StackBlitz
**Sandpack** is a component toolkit for creating live-running code editing experiences, powered by the online bundler used on CodeSandbox. https://sandpack.codesandbox.io

**WebContainers** are a browser-based runtime for executing Node.js applications and operating system commands, entirely inside your browser tab. https://webcontainers.io

```jsx
import { Sandpack } from "@codesandbox/sandpack-react";

const SandpackExample = () => {
  const files = {
    "/App.js": `
import React from 'react';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Hello Sandpack!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}
`,
    "/index.js": `
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
`,
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sandpack Example</h1>
      <Sandpack
        options={{
          showNavigator: true,
          editorHeight: 400,
          showTabs: true,
        }}
        files={files}
        theme="dark"
        template="react"
      />
    </div>
  );
};
```

### WebLLM and Pyodide
WebLLM is a high-performance in-browser LLM inference engine, aiming to be the backend of AI-powered web applications and agents. It provides a specialized runtime for the web backend of MLCEngine, leverages WebGPU for local acceleration.

> WebGPU is a new web standard for accelerated graphics and compute. The API enables web developers to use the underlying system's GPU to carry out high-performance computations directly in the browser. WebGPU is the successor to WebGL and provides significantly better performance. Before WebGPU support, ONNX Runtime Web *(Transformers.js uses ONNX Runtime to run models in the browser)* has adopted WebAssembly and WebGL technologies for providing an optimized ONNX model inference runtime for both CPUs and GPUs.

```js
const selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";
const engine = await webllm.CreateMLCEngine(selectedModel);
```

Pyodide is a Python distribution for the browser and Node.js based on WebAssembly. Pyodide makes it possible to install and run Python packages in the browser. Try Pyodide in a [REPL](https://pyodide.org/en/stable/console.html) directly in your browser.

```js
async function main(){
  let pyodide = await loadPyodide();
  console.log(pyodide.runPython(`
      import sys
      sys.version
  `));
  pyodide.runPython("print(1 + 2)");
}
main();
```

[Qwen 2.5 Code Interpreter](https://github.com/cfahlgren1/qwen-2.5-code-interpreter) running locally on your computer. It is a lightweight, offline-compatible code interpreter that allows users to execute code snippets in real-time. (Powered by Qwen, WebLLM, and Pyodide)
