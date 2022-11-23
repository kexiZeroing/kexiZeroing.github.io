---
layout: "../layouts/BlogPost.astro"
title: "Node-Sass troubleshooting"
slug: node-sass-troubleshooting
description: ""
added: "Nov 23 2022"
tags: [web]
---

Node-sass is a library that allows binding for Node.js to LibSass, the C version of Sass's stylesheet preprocessor. It compiles `.scss` files to CSS with speed and automatically through connected middleware.

> LibSass is written in C++, it’s easy to embed LibSass within other programming languages and provide a native-feeling API. Calling out to LibSass via the C++ API is very fast, which means LibSass is substantially faster in JavaScript than Dart Sass-compiled-to-JS.

node-sass 的安装过程大致是先下载 node-sass 包，安装时根据 node 版本和 node-sass 版本拉取对应的 `binding.node` 编译器（sass 的编译比较特殊，需要下载对应版本的编译器才能编译）。如果能拉下 `binding.node` 就算安装成功，如果找不到对应的 `binding.node` 就算失败了，然后就会尝试本地 build，需要 python 环境。

node-sass 的 install 和 postinstall 会分别执行 `scripts/install.js` 和 `scripts/build.js`，在脚本里面可以找到安装过程会失败的原因： 
- 如果没有设置 `SASS_BINARY_SITE`，默认会从 Github 下载 `binding.node`，这里涉及国内的网络问题。解决办法就是使用国内镜像或者给 npm 设置代理，可以参考[这篇文章](https://juejin.cn/post/6946530710324772878)。脚本的具体执行可以看 `lib/extensions.js` 中的 `getBinaryUrl()` 和 `getBinaryName()` 函数。
- 从 GitHub 下载 `binding.node` 还有一种导致失败的原因是 node 版本（`process.versions.modules`）、node-sass 版本（`package.json` 里的 `version`）、操作系统环境（`process.platform` 和 `process.arch`）不匹配，所以下载地址在 GitHub Releases 中不存在，会返回 404。
- 下载保存的路径是由 `SASS_BINARY_PATH` 设置的，决定是否需要下载 `binding.node`、设置保存路径、决定是否需要本地 build 都会用到这个路径，细节可以看 `getBinaryPath()` 函数，它的默认路径是在 `vendor` 下面，然后拼上操作系统相关的标识，可以这样找到本地保存的 `binding.node` 文件。
- 如果有 `binding.node` 但是编译失败，一般就是当前环境和 `binding.node` 不兼容，需要降级 Node 版本，或者尝试 rebuild node-sass 重新下载，报错来源可以在 `lib/errors.js` 看到。node 和 node-sass 的版本兼容可以看 [Node version support policy](https://github.com/sass/node-sass#node-version-support-policy)

> `node-gyp` is a tool which compiles Node.js Addons. Node.js Addons are native Node.js Modules, written in C or C++, which therefore need to be compiled on your machine. After they are compiled, their functionality can be accessed via `require()`, just as any other Node.js Module. `node-gyp` expects Python ≥v3.6, not Python v2.x. (If you’re not a Python developer, you might not realize that Python v.3 isn’t backward-compatible with its previous major version.)

Note that [LibSass is Deprecated](https://sass-lang.com/blog/libsass-is-deprecated). It’s time to officially declare that LibSass and the packages built on top of it, including Node Sass, are deprecated. We no longer recommend LibSass for new Sass projects. Use Dart Sass instead. If you’re a user of Node Sass, migrating to Dart Sass is straightforward: **just replace `node-sass` in your `package.json` file with `sass`. Both packages expose the same JavaScript API**.
