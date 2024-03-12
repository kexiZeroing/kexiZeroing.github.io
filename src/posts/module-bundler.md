---
layout: "../layouts/BlogPost.astro"
title: "Module bundler clone"
slug: module-bundler
description: ""
added: "Oct 9 2021"
tags: [code]
updatedDate: "Mar 03 2023"
---

## Basic bundler

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

## Webpack functionality explained by code

```js
// 调用 webpack 进行模块编译
handleWebpackCompiler(moduleName, modulePath) {
  // 将当前模块相对于项目启动根目录计算出相对路径 作为模块ID
  const moduleId = './' + path.posix.relative(this.rootPath, modulePath);
  // 创建模块对象
  const module = {
    id: moduleId,
    dependencies: new Set(), // 该模块所依赖模块绝对路径地址
    name: [moduleName], // 该模块所属的入口文件
  };
  // 调用 babel 分析代码
  // 需要引入 @babel/parser, @babel/traverse, @babel/generator
  // Read more: https://vivaxyblog.github.io/2020/01/05/how-babel-is-built.html
  const ast = parser.parse(this.moduleCode, {
    sourceType: 'module',
  });
  // 深度优先 遍历语法树
  traverse(ast, {
    // 当遇到 require 语句时
    CallExpression: (nodePath) => {
      const node = nodePath.node;
      if (node.callee.name === 'require') {
        // 获得源代码中引入模块相对路径
        const requirePath = node.arguments[0].value;
        // 寻找模块绝对路径 当前模块路径 + require 的相对路径
        const moduleDirName = path.posix.dirname(modulePath);
        const absolutePath = tryExtensions(
          path.posix.join(moduleDirName, requirePath),
          this.options.resolve.extensions,
          requirePath,
          moduleDirName
        );
        // 生成 moduleId - 针对于跟路径的模块ID 添加进入新的依赖模块路径
        const moduleId = './' + path.posix.relative(this.rootPath, absolutePath);
        // 通过 babel 修改源代码中的 require 变成 __webpack_require__ 语句
        node.callee = t.identifier('__webpack_require__');
        // 转化为 ids 的数组
        const alreadyModules = Array.from(this.modules).map((i) => i.id);
        if (!alreadyModules.includes(moduleId)) {
          // 为当前模块添加依赖
          module.dependencies.add(moduleId);
        } else {
          // 已经存在的话 虽然不进行添加进入模块编译 但是仍要更新这个模块依赖的入口
          this.modules.forEach((value) => {
            if (value.id === moduleId) {
              value.name.push(moduleName);
            }
          });
        }
      }
    },
  });

  // 遍历结束根据 AST 生成新的代码
  const { code } = generator(ast);
  // 为当前模块挂载新的生成的代码
  module._source = code;
  // 递归依赖深度遍历 存在依赖模块则加入
  module.dependencies.forEach((dependency) => {
    const depModule = this.buildModule(moduleName, dependency);
    this.modules.add(depModule);
  });
  // 返回当前模块对象
  return module;
}
```

```js
// 匹配 loader 处理
handleLoader(modulePath) {
  const matchLoaders = [];
  // 1. 获取所有传入的loader规则
  const rules = this.options.module.rules;
  rules.forEach((loader) => {
    const testRule = loader.test;
    if (testRule.test(modulePath)) {
      if (loader.loader) {
        // { test:/\.js$/g, use:['babel-loader'] }, { test:/\.js$/, loader:'babel-loader' }
        matchLoaders.push(loader.loader);
      } else {
        matchLoaders.push(...loader.use);
      }
    }
    // 2. 倒序执行loader传入源代码
    for (let i = matchLoaders.length - 1; i >= 0; i--) {
      // require 引入对应 loader
      const loaderFn = require(matchLoaders[i]);
      // 通过 loader 同步处理每一次编译的 moduleCode
      this.moduleCode = loaderFn(this.moduleCode);
    }
  });
}
```
