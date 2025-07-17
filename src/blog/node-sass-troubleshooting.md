---
title: "Node-Sass troubleshooting"
description: ""
added: "Nov 23 2022"
tags: [web]
updatedDate: "Feb 13 2023"
---

## Node-Sass installation
Node-sass is a Node.js tool that uses LibSass to compile SASS into CSS. LibSass is written in C++, it’s easy to embed LibSass within other programming languages and provide a native-feeling API. Calling out to LibSass via the C++ API is very fast, which means LibSass is substantially faster in JavaScript than Dart Sass-compiled-to-JS.

node-sass 是一个让 Node.js 可以使用 LibSass（Sass 的 C 语言实现）来编译 scss 文件的工具。node-sass 的安装过程大致是先下载 node-sass 包，安装时根据 node 版本和 node-sass 版本拉取对应的 `binding.node` 编译器（sass 的编译比较特殊，需要下载对应版本的编译器才能编译）。如果能拉下 `binding.node` 就算安装成功，如果找不到对应的 `binding.node` 就算失败了，然后就会尝试本地 build，需要 python 环境。

node-sass 的 install 和 postinstall 会分别执行 `scripts/install.js` 和 `scripts/build.js`，在脚本里面可以找到安装过程会失败的原因： 
- 如果没有设置 `SASS_BINARY_SITE`，默认会从 Github 下载 `binding.node`，这里涉及国内的网络问题。解决办法就是使用国内镜像或者给 npm 设置代理，可以参考[这篇文章](https://juejin.cn/post/6946530710324772878)。脚本的具体执行可以看 `lib/extensions.js` 中的 `getBinaryUrl()` 和 `getBinaryName()` 函数。
- 从 GitHub 下载 `binding.node` 还有一种导致失败的原因是 node 版本（`process.versions.modules`）、node-sass 版本（`package.json` 里的 `version`）、操作系统环境（`process.platform` 和 `process.arch`）不匹配，所以下载地址在 GitHub Releases 中不存在，会返回 404。
- 下载保存的路径是由 `SASS_BINARY_PATH` 设置的，决定是否需要下载 `binding.node`、设置保存路径、决定是否需要本地 build 都会用到这个路径，细节可以看 `getBinaryPath()` 函数，它的默认路径是在 `vendor` 下面，然后拼上操作系统相关的标识，可以这样找到本地保存的 `binding.node` 文件。
- 如果有 `binding.node` 但是编译失败，一般就是当前环境和 `binding.node` 不兼容，需要降级 Node 版本，或者尝试 rebuild node-sass 重新下载，报错来源可以在 `lib/errors.js` 看到。node 和 node-sass 的版本兼容可以看 [Node version support policy](https://github.com/sass/node-sass#node-version-support-policy)

> `node-gyp` *("gyp" is short for "generate your projects")* is a tool which compiles Node.js Addons. Node.js Addons are native Node.js Modules, written in C or C++, which therefore need to be compiled on your machine. After they are compiled, their functionality can be accessed via `require()`, just as any other Node.js Module. `node-gyp` expects Python ≥v3.6, not Python v2.x.
>
> The filename extension of the compiled addon binary is `.node`. The `require()` function is written to look for files with the `.node` file extension and initialize those as dynamically-linked libraries. You should also be aware that these are binary modules, so loading them is a lot like just running a standard executable file (Think `.exe` file if you are familiar with Windows). Like native executables they are a lot more dependent on the particulars of your system and also potentially a security risk.

## Migrate from Node-Sass to Sass
Note that [LibSass is Deprecated](https://sass-lang.com/blog/libsass-is-deprecated). It’s time to officially declare that LibSass and the packages built on top of it, including Node Sass, are deprecated. We no longer recommend LibSass for new Sass projects. Use Dart Sass instead. If you’re a user of Node Sass, migrating to Dart Sass is straightforward: **just replace `node-sass` in your `package.json` file with `sass`. Both packages expose the same JavaScript API**.

Run Node with the `--trace-warnings` flag. Check the stacktrace for hints of packages you're using. For example, `NODE_OPTIONS="--trace-warnings" npm run build`. Once you identify a package, check if the error has been fixed upstream, and after updating, you may no longer see the error or warnings.

## Webpack and sass-loader
Sass is a popular choice for styling websites and it has two syntaxes. The older syntax is known as SASS (with `.sass` extention). Instead of brackets and semicolons, it uses the indentation of lines to specify blocks. The most commonly used is SCSS (with `.scss` extention). SCSS is a superset of CSS syntax, so every valid CSS is a valid SCSS as well.

`sass-loader` is a loader for Webpack for compiling SCSS/Sass files. It requires you to install either Dart Sass or Node Sass, which allows you to choose which Sass implementation to use. By default the loader resolve the implementation based on your dependencies. Just add required implementation to `package.json` (`sass` or `node-sass` package) and install dependencies. From `sass-loader` 9.x, it firstly uses `sass` and you don't need any configuration. 

```js
// sass-loader source code
function getDefaultSassImplementation() {
  let sassImplPkg = "sass";

  try {
    require.resolve("sass");
  } catch (error) {
    try {
      require.resolve("node-sass");

      sassImplPkg = "node-sass";
    } catch (ignoreError) {
      sassImplPkg = "sass";
    }
  }

  return require(sassImplPkg);
}
```

> `require.resolve` uses the internal `require()` machinery to look up the location of a module, but rather than loading the module, just returns the resolved filename.

Beware the situation when `node-sass` and `sass` were installed. In order to avoid this situation you can use the `implementation` option. It either accepts `sass` (Dart Sass) or `node-sass` as a module.

```json
// In sass-loader source code, 
// `options.implementation` from webpack config has the higher priority
// than the above function `getDefaultSassImplementation()`
{
  test: /\.s[ac]ss$/i,
  use: [
    "style-loader",
    "css-loader",
    {
      loader: "sass-loader",
      options: {
        // Prefer `dart-sass`
        implementation: require("sass"),
      },
    },
  ],
}
```
