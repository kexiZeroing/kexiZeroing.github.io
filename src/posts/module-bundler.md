---
layout: "../layouts/BlogPost.astro"
title: "Module bundler and code transformation"
slug: module-bundler-and-code-transformation
description: ""
added: "Oct 9 2021"
tags: [code, js]
updatedDate: "Oct 9 2024"
---

The bundler will start from the entry file, and it will try to understand which files it depends on. Then, it will try to understand which files its dependencies depend on. It will keep doing that until it figures out about every module in the application, and how they depend on one another. This understanding of a project is called the **dependency graph**.

```js
const Compiler = require("./compiler");
const options = require("../webpack.config");

new Compiler(options).run();
```

```js
// compiler.js
const fs = require("fs");
const path = require("path");
const { getAST, getDependencies, transform } = require("./parser");

module.exports = class Compiler {
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

  buildModule(filename, isEntry) {
    let ast;
    if (isEntry) {
      ast = getAST(filename);
    } else {
      let absolutePath = path.join(process.cwd(), "./src", filename);
      ast = getAST(absolutePath);
    }

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

            const module = { exports: {} };

            fn(require, module, module.exports);

            return module.exports;
          }

          require('${this.entry}');
        })({${modules}})
    `;

    fs.writeFileSync(outputPath, bundle, "utf-8");
  }
};
```

```js
// parser.js
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAst } = require("@babel/core");

module.exports = {
  getAST: (path) => {
    const content = fs.readFileSync(path, "utf-8");
    // AST explorer: https://astexplorer.net
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
    const { code } = transformFromAst(ast, null, {
      presets: ["@babel/preset-env"],
    });

    return code;
  },
};
```

> Exploring ASTs:
> - Write a custom babel transformation: https://lihautan.com/step-by-step-guide-for-writing-a-babel-transformation
> - Create a Custom ESLint Rule: https://ryankubik.com/blog/eslint-internal-state
> - Babel Plugin Handbook: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
> - Write Code to Rewrite Your Code using jscodeshift: https://www.toptal.com/javascript/write-code-to-rewrite-your-code

> We can think about the *abstract syntax tree* as the “final project” of the front-end of the compiler. It’s the most important part, because its the last thing that the front-end has to show for itself. The technical term for this is called the *intermediate code representation* or the *IR*. An AST is the most common form of IR.

Below is an example of a Webpack plugin: a BannerPlugin. This plugin adds a banner or comment to the top of each generated file. It's simple but demonstrates how Webpack plugins interact with the compilation process.

The `apply` method is Webpack's way of registering a plugin and giving it access to the `compiler` object. Webpack calls `apply` during the initialization phase, before the build process begins, allowing the plugin to set up event hooks and modify the build as necessary.

- `compilation.assets`: It's an object that represents all the files Webpack will emit.
- `compilation.assets['bundle.js'].source()`: Retrieves the actual content of the asset as a string or a buffer.
- `compilation.assets['bundle.js'].size()`: Returns the size of the asset's content in bytes, helping Webpack manage and report asset sizes accurately.

```js
class SimpleBannerPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    // Hook into the 'emit' phase of Webpack's lifecycle
    compiler.hooks.emit.tap("SimpleBannerPlugin", (compilation) => {
      // Iterate over all compiled assets (output files)
      for (const filename in compilation.assets) {
        if (Object.hasOwnProperty.call(compilation.assets, filename)) {
          // Get the original file content
          const originalSource = compilation.assets[filename].source();
          // Create the banner text
          const banner = `/** ${this.options.banner} */\n`;
          // Concatenate the banner with the original content
          const newSource = banner + originalSource;

          // Replace the original asset content with the new content
          compilation.assets[filename] = {
            source: () => newSource,
            size: () => newSource.length,
          };
        }
      }
    });
  }
}

module.exports = SimpleBannerPlugin;

// const SimpleBannerPlugin = require('./SimpleBannerPlugin');
// module.exports = {
//   plugins: [
//     new SimpleBannerPlugin({ banner: 'This is a banner!' })
//   ]
// };
```
