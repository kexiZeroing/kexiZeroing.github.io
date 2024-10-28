---
layout: "../layouts/BlogPost.astro"
title: "Module bundler and code transformation"
slug: module-bundler-and-code-transformation
description: ""
added: "Oct 9 2021"
tags: [code, js]
updatedDate: "Oct 28 2024"
---

## Write your own module bundler
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
      // Converted to absolute: '/your/project/src/xx.js'
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

  // example of modules
  // {
  //   'src/math.js': function(require, module, exports) {
  //     exports.add = function(a, b) {
  //       return a + b;
  //     };
  //   },
  //   'src/logger.js': function(require, module, exports) {
  //     exports.log = function(message) {
  //       console.log(`[Logger]: ${message}`);
  //     };
  //   },
  //   'src/index.js': function(require, module, exports) {
  //     const math = require('./math.js');
  //     const logger = require('./logger.js');

  //     logger.log(math.add(2, 3));
  //   },
  // }
};
```

```js
// parser.js
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAstSync } = require("@babel/core");

module.exports = {
  // AST explorer: https://astexplorer.net
  getAST: (path) => {
    const content = fs.readFileSync(path, "utf-8");
    // 1. Babel parser generates AST
    // 2. `sourceType` indicates the mode the code should be parsed in
    // Files with ES6 imports and exports are considered "module" and are otherwise "script".
    return parser.parse(content, {
      sourceType: "module",
    });
  },
  getDependencies: (ast) => {
    const dependencies = [];
    traverse(ast, {
      // target particular node types in the Syntax Tree
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

> Exploring ASTs:
> - Write a custom babel transformation: https://lihautan.com/step-by-step-guide-for-writing-a-babel-transformation
> - Create a Custom ESLint Rule: https://ryankubik.com/blog/eslint-internal-state
> - Babel Plugin Handbook: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
> - Write Code to Rewrite Your Code using jscodeshift: https://www.toptal.com/javascript/write-code-to-rewrite-your-code

> We can think about the *abstract syntax tree* as the “final project” of the front-end of the compiler. It’s the most important part, because its the last thing that the front-end has to show for itself. The technical term for this is called the *intermediate code representation* or the *IR*. An AST is the most common form of IR.

## Write a Webpack loader
A loader is a function that accepts a source code and returns a transformed source code.

```js
// A custom webpack loader that turns MP3 files into interactive audio players
const path = require('path')

module.exports = function (source) {
  // webpack exposes an absolute path to the imported module
  // "/User/admin/audio.mp3" (this.resourcePath) -> "audio.mp3"
  const filename = path.basename(this.resourcePath)

  const assetInfo = { sourceFilename: filename }
  // emit a file to the build directory
  this.emitFile(filename, source, null, assetInfo)

  return `
    import React from 'react'
    export default function Player(props) {
      return <audio controls src="${filename}" />
    }
  `
}
```

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mp3$/,
        use: ['babel-loader', 'mp3-loader'],
      },
    ],
  },
  resolveLoader: {
    alias: {
      'mp3-loader': path.resolve(__dirname, 'src/mp3-loader.js'),
    },
  },
}
```

## Write a Webpack plugin
Among the two most important resources while developing plugins are the `compiler` and `compilation` objects. 

The `compiler` object represents the fully configured Webpack environment. When applying a plugin to the Webpack environment, the plugin will receive a reference to this compiler. Use the compiler to access the main Webpack environment.

The `compilation` object represents a single build of versioned assets. A new compilation will be created each time a file change is detected, thus generating a new set of compiled assets. A compilation surfaces information about the present state of module resources, compiled assets, changed files, and watched dependencies.

The `apply` method is Webpack's way of registering a plugin and giving it access to the `compiler` object. Webpack calls `apply` during the initialization phase, before the build process begins, allowing the plugin to set up event hooks and modify the build as necessary.

```js
function HelloWorldPlugin(options) {
  // Setup the plugin instance with options...
}

HelloWorldPlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', function() {
    console.log('Hello World!'); 
  });
};

module.exports = HelloWorldPlugin;
```

Here's an example of a plugin that adds a banner to the top of each generated file. It's simple but demonstrates how Webpack plugins interact with the compilation process.

- `compiler.hooks.emit`: This is one of the last hooks that runs in the compilation lifecycle. It fires right before Webpack writes output files to disk.
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

    // Example of other common hooks:
    // Runs at the beginning of the compilation
    compiler.hooks.compile.tap('SimpleBannerPlugin', () => {
      console.log('Compilation starting...');
    });

    // Runs after compilation is done
    compiler.hooks.done.tap('SimpleBannerPlugin', () => {
      console.log('Compilation finished!');
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
