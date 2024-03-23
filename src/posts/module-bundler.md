---
layout: "../layouts/BlogPost.astro"
title: "Module bundler clone"
slug: module-bundler
description: ""
added: "Oct 9 2021"
tags: [code]
updatedDate: "Mar 23 2024"
---

The bundler will start from the entry file, and it will try to understand which files it depends on. Then, it will try to understand which files its dependencies depend on. It will keep doing that until it figures out about every module in the application, and how they depend on one another. This understanding of a project is called the **dependency graph**.

```js
// https://www.youtube.com/watch?v=Gc9-7PBqOC8
const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

let ID = 0;

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');

  // AST explorer: https://astexplorer.net
  // @babel/parser, @babel/traverse, @babel/generator
  // Read more: https://vivaxyblog.github.io/2020/01/05/how-babel-is-built.html
  const ast = babylon.parse(content, {
    sourceType: 'module',
  });

  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ['@babel/preset-env'],
  });

  return {
    id,
    filename,
    dependencies,
    code,
  }
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);
  const queue = [mainAsset];

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
    asset.mapping = {};
    
    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = createAsset(absolutePath);
      asset.mapping[relativePath] = child.id;
      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = '';

  graph.forEach(mod => {
    modules += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });

  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(relativePath) {
          return require(mapping[relativePath]);
        }
        const module = { exports: {} };

        fn(localRequire, module, module.exports);
        return module.exports;
      }
      require(0);
    })({${modules}});
  `;

  return result;
}

const graph = createGraph('entry.js');
const res = bundle(graph);

console.log(res);
```

```js
// example of a modules parameter
{
  0: [
    function(require, module, exports) {
      var _name = require('./name.js')
      exports.default = 'hello' + _name.name
    },
    {
      "./name.js": 1
    }
  ],
  1: [
    function(require, module, exports) {
      var name = exports.name = 'world'
    },
    {}
  ]
}
```
