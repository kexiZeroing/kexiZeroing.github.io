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

## Webpack functionality

1. 初始化参数：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数；
2. 开始编译：用上一步得到的参数初始化 Compiler 对象，加载所有配置的插件，执行对象的 run 方法开始执行编译；
3. 确定入口：根据配置中的 entry 找出所有的入口文件；
4. 编译模块：从入口文件出发，调用所有配置的 Loader 对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；
5. 完成模块编译：在经过第 4 步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；
6. 输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；
7. 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

```js
class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      // 开始编译时的钩子
      run: new SyncHook(),
      // 输出 asset 到 output 目录之前执行 (写入文件之前)
      emit: new SyncHook(),
      // 在 compilation 完成时执行 全部完成编译
      done: new SyncHook(),
    };
    // 保存所有入口模块
    this.entries = new Set();
    // 保存所有依赖模块
    this.modules = new Set();
    // 所有的代码块
    this.chunks = new Set();
    // 存放本次产出的文件
    this.assets = new Set();
  }

  // run 方法启动编译 接受外部传递的callback
  run(callback) {
    // 触发开始编译的钩子
    this.hooks.run.call();
    // 获取入口配置对象
    const entry = this.getEntry();
    // 编译入口文件
    this.buildEntryModule(entry);
    // 将每个 chunk 转化称为单独的文件加入到输出列表 assets 中
    this.exportFile(callback);
  }

  // 将 chunk 加入输出列表中去
  exportFile(callback) {
    const output = this.options.output;
    // 根据 chunks 生成 assets 内容
    this.chunks.forEach((chunk) => {
      const parseFileName = output.filename.replace('[name]', chunk.name);
      // { 'main.js': '生成的字符串代码...' }
      this.assets[parseFileName] = getSourceCode(chunk);
    });
    // 调用 Plugin emit 钩子
    this.hooks.emit.call();
    // 先判断目录是否存在 存在直接写入 不存在则首先创建
    if (!fs.existsSync(output.path)) {
      fs.mkdirSync(output.path);
    }
    // 将 assets 中的内容生成打包文件 写入文件系统中
    Object.keys(this.assets).forEach((fileName) => {
      const filePath = path.join(output.path, fileName);
      fs.writeFileSync(filePath, this.assets[fileName]);
    });
    // 结束之后触发钩子
    this.hooks.done.call();
    callback(null, {
      toJson: () => {
        return {
          entries: this.entries,
          modules: this.modules,
          chunks: this.chunks,
          assets: this.assets,
        };
      },
    });
  }

  buildEntryModule(entry) {
    Object.keys(entry).forEach((entryName) => {
      const entryPath = entry[entryName];
      // 调用 buildModule 实现真正的模块编译逻辑
      const entryObj = this.buildModule(entryName, entryPath);
      this.entries.add(entryObj);
      // 根据当前入口文件和模块的相互依赖关系，组装成为一个个包含当前入口所有依赖模块的chunk
      this.buildUpChunk(entryName, entryObj);
    });
  }

  // 根据入口文件和依赖模块组装chunks
  buildUpChunk(entryName, entryObj) {
    const chunk = {
      name: entryName, // 每一个入口文件作为一个 chunk
      entryModule: entryObj, // entry 编译后的对象
      modules: Array.from(this.modules).filter((i) =>
        i.name.includes(entryName)
      ), // 寻找与当前 entry 有关的所有 module
    };

    this.chunks.add(chunk);
  }

  // 模块编译方法
  buildModule(moduleName, modulePath) {
    // 1. 读取文件原始代码
    const originSourceCode = fs.readFileSync(modulePath, 'utf-8');
    // moduleCode 为修改后的代码
    this.moduleCode = originSourceCode;
    // 2. 调用loader进行处理
    this.handleLoader(modulePath);
    // 3. 调用webpack 进行模块编译 获得最终的 module 对象
    const module = this.handleWebpackCompiler(moduleName, modulePath);
    // 4. 返回对应module
    return module;
  }

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

  // 匹配 loader 处理
  handleLoader(modulePath) {
    const matchLoaders = [];
    // 1. 获取所有传入的loader规则
    const rules = this.options.module.rules;
    rules.forEach((loader) => {
      const testRule = loader.test;
      if (testRule.test(modulePath)) {
        if (loader.loader) {
          // 仅考虑loader { test:/\.js$/g, use:['babel-loader'] }, { test:/\.js$/, loader:'babel-loader' }
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

  // 获取入口文件路径
  getEntry() {
    let entry = Object.create(null);
    const { entry: optionsEntry } = this.options;
    if (typeof entry === 'string') {
      entry['main'] = optionsEntry;
    } else {
      entry = optionsEntry;
    }
    // 将 entry 变成绝对路径
    Object.keys(entry).forEach((key) => {
      const value = entry[key];
      if (!path.isAbsolute(value)) {
        // 转化为绝对路径
        entry[key] = toUnixPath(path.join(this.rootPath, value));
      }
    });
    return entry;
  }
}

function webpack(options) {
  // 初始化参数，从配置文件和 shell 语句中读取并合并参数，并得到最终的配置对象
  // shellOptions 来源于 process.argv
  let finalOptions = {...options, ...shellOptions};

  // 用上一步的配置对象初始化 Compiler 对象
  const compiler = new Compiler(finalOptions);

  // 加载所有在配置文件中配置的插件
  const { plugins } = finalOptions;
  for (let plugin of plugins) {
    plugin.apply(compiler);
  }

  return compiler;
}

// 传入 webpack 配置项
const compiler = webpack(webpackOptions);
// 执行对象的 run 方法开始执行编译
compiler.run();
```
