---
title: "How common web development tools work under the hood"
description: ""
added: "May 4 2025"
tags: [web, code]
updatedDate: "May 10 2025"
---

## TOC
- [TOC](#toc)
- [Compile Vue SFC to JS](#compile-vue-sfc-to-js)
- [Vite dev server](#vite-dev-server)
- [React Server Components](#react-server-components)
- [React Suspense](#react-suspense)
- [Simple bundler](#simple-bundler)
- [Hot Module Replacement](#hot-module-replacement)
- [Source Maps](#source-maps)

## Compile Vue SFC to JS
High level compilation process: 
Parse SFC to blocks -> Compile each block (script, style, template) -> Combine all blocks

- https://jinjiang.dev/slides/understanding-vue-compiler
- https://github.com/Jinjiang/vue-simple-compiler
- https://www.npmjs.com/package/@vue/compiler-sfc
- https://play.vuejs.org

```js
import { parse, compileScript, compileTemplate, rewriteDefault } from 'vue/compiler-sfc'

function compileSFC(source) {
  const { descriptor } = parse(source)
  const { script, template, styles } = descriptor
  
  let code = ''
  let cssCode = ''
  
  if (script) {
    const scriptBlock = compileScript(descriptor, {
      id: 'component'
    })
    
    const scriptCode = rewriteDefault(
      scriptBlock.content,
      '_sfc_main'
    )
    code += scriptCode + '\n'
  }
  
  if (template) {
    const templateResult = compileTemplate({
      source: template.content,
      id: 'component'
    })
    
    code += `\n${templateResult.code}\n`
    code += `_sfc_main.render = render\n`
  }
  
  if (styles.length) {
    cssCode = styles.map(style => {
      // You might want to process CSS with postcss or other tools here
      return style.content
    }).join('\n')
    
    code += `
      // Inject styles
      const style = document.createElement('style')
      style.textContent = ${JSON.stringify(cssCode)}
      document.head.appendChild(style)
    `
  }
  
  code += '\nexport default _sfc_main\n'
  
  return {
    js: code,
    css: cssCode
  }
}
```

```js
// Example usage
const sfc = `
<template>
  <div class="greeting">{{ message }}</div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>

<style>
.greeting {
  color: blue;
  font-size: 24px;
}
</style>
`

const result = compileSFC(sfc)

// The result:
{
  js: '\n' +
    'const _sfc_main = {\n' +
    '  data() {\n' +
    '    return {\n' +
    "      message: 'Hello Vue!'\n" +
    '    }\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    '\n' +
    'import { toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"\n' +
    '\n' +
    'const _hoisted_1 = { class: "greeting" }\n' +
    '\n' +
    'export function render(_ctx, _cache) {\n' +
    '  return (_openBlock(), _createElementBlock("div", _hoisted_1, _toDisplayString(_ctx.message), 1 /* TEXT */))\n' +
    '}\n' +
    '_sfc_main.render = render\n' +
    '\n' +
    '      // Inject styles\n' +
    "      const style = document.createElement('style')\n" +
    '      style.textContent = "\\n.greeting {\\n  color: blue;\\n  font-size: 24px;\\n}\\n"\n' +
    '      document.head.appendChild(style)\n' +
    '    \n' +
    'export default _sfc_main\n',
  css: '\n.greeting {\n  color: blue;\n  font-size: 24px;\n}\n'
}
```

## Vite dev server
Key points:
- Vite pre-bundles dependencies using esbuild.
- Vite serves source code over native ESM. This is essentially letting the browser take over part of the job of a bundler: Vite only needs to transform and serve source code on demand, as the browser requests it.

```js
import MagicString from 'magic-string';
import { init, parse as parseEsModule } from 'es-module-lexer';
import { buildSync, transformSync } from 'esbuild';

// transform import statements 
// Key point: relative module specifiers must start with ./, ../, or /
// import xx from 'xx' -> import xx from '/@module/xx'
async function parseBareImport(code) {
  await init;
  const parseResult = parseEsModule(code);
  const s = new MagicString(code);

  parseResult[0].forEach((item) => {
    // item.n represents the imported module name
    // item.s and item.e are the start and end indices of the module name
    if (item.n && item.n[0] !== "." && item.n[0] !== "/") {
      // import React from 'react' -> import React from '/@module/react'
      s.overwrite(item.s, item.e, `/@module/${item.n}`);
    } else {
      // for css file, use '?import' to differentiate import statement and link tag
      s.overwrite(item.s, item.e, `${item.n}?import`);
    }
  });

  return s.toString();
}

app.use(async function (req, res) {
  if (/\.js(\?|$)(?!x)/.test(req.url)) {
    let js = fs.readFileSync(path.join(__dirname, removeQuery(req.url)), "utf-8");
    const jsCode = await parseBareImport(js);

    res.setHeader("Content-Type", "application/javascript");
    res.statusCode = 200;
    res.end(jsCode);
    return;
  }

  if (/\.jsx(\?|$)/.test(req.url)) {
    const jsxContent = fs.readFileSync(path.join(__dirname, removeQuery(req.url)), "utf-8");
    const transformed = transformSync(jsxContent, {
      loader: "jsx",
      format: "esm",
      target: "esnext",
    });
    const jsCode = await parseBareImport(transformed.code);

    res.setHeader("Content-Type", "application/javascript");
    res.statusCode = 200;
    res.end(jsCode);
    return;
  }

  if (/^\/@module\//.test(req.url)) {
    let pkg = req.url.slice(9);  // the length of "/@module/"
    let pkgJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "node_modules", pkg, "package.json"), "utf8")
    );
    let entry = pkgJson.module || pkgJson.main;
    let outfile = path.join(__dirname, `esbuild/${pkg}.js`);

    buildSync({
      entryPoints: [path.join(__dirname, "node_modules", pkg, entry)],
      format: "esm",
      bundle: true,
      outfile,
    });

    let js = fs.readFileSync(outfile, "utf8");
    res.setHeader("Content-Type", "application/javascript");
    res.statusCode = 200;
    res.end(js);
    return;
  }
})
```

## React Server Components
- https://github.com/bholmesdev/simple-rsc
- https://www.youtube.com/watch?v=F83wMYl9GWM&t=496s

## React Suspense
React Suspense operates on a "throw and catch" pattern:
1. Components "throw" Promises when data isn't ready.
2. Suspense boundaries "catch" these Promises.
3. Fallback UI is shown while waiting.
4. Re-rendering is triggered when the Promise resolves.

```js
const createResource = (somethingReturnsPromise: () => Promise<any>) => {
  let status = 'pending';
  let result;
  let suspender = somethingReturnsPromise().then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    }
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    }
  };
}

const userDataResource = createResource(() => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name: 'John' }), 1000);
  });
});

function Profile() {  
  // This line will throw a promise if data isn't ready
  const userData = userDataResource.read();
  
  return `<div>Hello, ${userData.name}!</div>`;
}

// Simplified renderer acting as a Suspense boundary
function render(Component) {
  try {
    // Try to render the component
    const result = Component();
    // Simulate DOM update
    document.body.innerHTML = result;
  } catch (thrown) {
    if (thrown instanceof Promise) {
      // Render fallback
      document.body.innerHTML = '<div>Loading...</div>';
      // Wait for promise to resolve
      thrown.then(() => {
        // Schedule re-render after resolution
        render(Component);
      });
    } else {
      // Real error, let it bubble up
      throw thrown;
    }
  }
}

render(Profile);
```

## Simple bundler
Summary of the bundling process:
1. Read the entry file content and parse it into an AST using Babel parser.
2. Traverse the AST to find all import declarations, extract the dependencies, and build a dependency graph.
3. Transform the AST of each module, converting modern JavaScript to more compatible code via `@babel/preset-env`.
4. Generate a self-executing function bundle that contains all modules, implements a custom require function, and initiates execution from the entry point.
5. Write the final bundled code to the specified output path.

```js
// parser.js
const fs = require("node:fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAstSync } = require("@babel/core");

module.exports = {
  getAST: (path) => {
    const content = fs.readFileSync(path, "utf-8");
    // `sourceType` indicates the mode the code should be parsed in
    // files with ES6 imports and exports are considered "module" and are otherwise "script".
    return parser.parse(content, {
      sourceType: "module",
    });
  },
  getDependencies: (ast) => {
    const dependencies = [];
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        dependencies.push(node.source.value);
      },
    });
    return dependencies;
  },
  transform: (ast) => {
    const { code } = transformFromAstSync(ast, null, {
      presets: ["@babel/preset-env"],
    });
    return code;
  },
};
```

```js
class Compiler {
  constructor(options) {
    const { entry, output } = options;
    this.entry = entry;
    this.output = output;
    this.modules = [];
  }

  run() {
    const entryModule = this.buildModule(this.entry, true);

    this.modules.push(entryModule);
    this.modules.map((_module) => {
      _module.dependencies.map((dependency) => {
        this.modules.push(this.buildModule(dependency));
      });
    });

    this.emitFiles();
  }

  buildModule(filename, isEntry = false) {
    let modulePath;
    if (isEntry) {
      // resolve means to get the full path of the module
      // path.join(basePath, `${filename}.js`)
      modulePath = this.resolveModule(filename);
    } else {
      modulePath = this.resolveModule(filename, path.join(process.cwd(), 'src'));
    }

    const ast = getAST(modulePath);
    return {
      filename,
      dependencies: getDependencies(ast),
      transformCode: transform(ast),
    };
  }
  
  emitFiles() {
    const outputPath = path.join(this.output.path, this.output.filename);
    let modules = "";
    this.modules.map((_module) => {
      modules += `'${_module.filename}': function (require, module, exports) { ${_module.transformCode} },`;
    });

    const bundle = `
      (function(modules) {
        function require(fileName) {
          const fn = modules[fileName];

          const module = { exports : {} };

          fn(require, module, module.exports);

          return module.exports;
        }

        require('${this.entry}');
      })({${modules}})
    `;

    fs.writeFileSync(outputPath, bundle, "utf-8");
  }
};

// (function(modules) {
//   function require(fileName) {
//     const fn = modules[fileName];
//     const module = { exports : {} };
//     fn(require, module, module.exports);
//     return module.exports;
//   }

//   require('index.js');
// })({
//   'index.js': function (require, module, exports) { 
//     const { sayHello } = require('greeting.js');
//     sayHello('World');
//   },
//   'greeting.js': function (require, module, exports) { 
//     function sayHello(name) {
//       console.log(`Hello, ${name}!`);
//     }
//     module.exports = { sayHello };
//   },
// })
```

## Hot Module Replacement
Summary of the HMR Implementation:
1. The server uses chokidar to watch JavaScript files in the src directory for changes.
2. When a file changes, the server sends a WebSocket message to connected clients with information about which file changed.
3. The server middleware intercepts JavaScript file requests and injects HMR client code along with the original content, enabling each module to be hot-reloadable.
4. The client maintains a registry that maps file paths to their corresponding HotModule instances.
5. When modules opt-in to HMR by calling `import.meta.hot.accept()`, they register a callback function that will be called when the module is updated.
6. When the client receives a change notification, it finds the affected module in the registry and dynamically imports the new version of the module, then passes the new module to the registered callback.

```js
// server.js
const watcher = chokidar.watch("src/*.js");

watcher.on("change", (file) => {
  const payload = JSON.stringify({
    type: "file:changed",
    file: `/${file}`,
  });
  socket.send(payload);
});

const hmrMiddleware = async (req, res, next) => {
  let client = await fs.readFile(path.join(process.cwd(), "client.js"), "utf8");
  let content = await fs.readFile(path.join(process.cwd(), req.url), "utf8");

  // `import.meta` provides information about the current module
  content = `
    ${client}
    hmrClient(import.meta);
    ${content}
  `;

  res.header("Content-Type", "text/javascript");
  res.send(content);
};
```

```js
// client.js
class HotModule {
  constructor(file) {
    this.file = file;
  }

  accept(cb) {
    this.cb = cb;
  }

  handleAccept() {
    if (!this.cb) {
      return;
    }

    import(`${this.file}?t=${Date.now()}`).then((newMod) => {
      // apply the update without a full reload
      this.cb(newMod);
    });
  }
}

// Modules register themselves as "hot" (capable of being updated)
window.hotModules ??= new Map();

function hmrClient(mod) {
  const url = new URL(mod.url);
  const hot = new HotModule(url.pathname);

  import.meta.hot = hot;
  window.hotModules.set(url.pathname, hot);
}

const ws = new window.WebSocket("ws://localhost:8080");

ws.addEventListener("message", (msg) => {
  const data = JSON.parse(msg.data);
  const mod = window.hotModules.get(data.file);

  mod.handleAccept();
});
```

```js
// included in each module that enables it to be hot-reloadable
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // handle updates here
    }
  });
}
```

## Source Maps
Once you've compiled and minified your code, normally alongside it will exist a sourceMap file. The bundler will add a source map location comment `//# sourceMappingURL=/path/to/file.js.map` at the end of every generated bundle, which is required to signify to the browser devtools that a source map is available. Another type of source map is inline which has a base64 data URL like `# sourceMappingURL=data:application/json;base64,xxx...`

Here's an example of a source map:
```js
{
  "version": 3,
  "file": "example.min.js.map",
  "names": ["document", "querySelector", ...],
  "sources": ["src/script.ts"],
  "sourcesContent": ["document.querySelector('button')..."],
  "mappings": "AAAAA,SAASC,cAAc,WAAWC, ...",
}
```

The most important part of a source map is the `mappings` field. It uses encoded strings to map lines and locations in the compiled file to the corresponding original file. Below example is from https://www.youtube.com/watch?v=oVcv3QZiXNM

```
step 1: Convert base64 (A-Za-z0-9+/) to binary. Ending with 1 means negative
AAKA -> 000000 000000 001010 000000

step 2: Ignore the first and last bits
AAKA -> 0000 0000 0101 0000

step 3: Convert to base 10
AAKA -> 0 0 5 0

The number means: col 0 is mapping to source[0] line 5, col 0. (zero-based) 

SAAMA
-> 010010 000000 000000 001100 000000
-> 1001 0000 0000 0110 0000
-> 9 0 0 6 0

The numbers are relative to the previous mapping. The last extra number maps to `names` field.
-> +9 0 0 +6 0
-> 9 0 5 6 0
It means: col 9 is mapping to source[0] line 5, col 6, and its original name is `names[0]`

gBAAUA
-> 100000 000001 000000 000000 010100 000000 
When byte starts with 1, drop first bits and join 5-bit pieces in reverse.
-> 000010000 0000 0000 1010 0000
-> +16 0 0 +10 0
-> 25 0 5 16 0
It means: col 25 is mapping to source[0] line 5, col 16

CAIF
-> 000010 000000 001000 000101
-> 0001 0000 0100 -0010
-> +1 0 +4 -2
-> 26 0 9 14
It means: col 26 is mapping to source[0] line 9, col 14
```

<img alt="how source maps work" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/source-map-under-the-hood.png" width="600" />
