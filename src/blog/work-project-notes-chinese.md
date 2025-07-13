---
title: "Notes on work projects (in Chinese)"
description: ""
added: "Oct 19 2021"
tags: [web]
updatedDate: "Jun 27 2025"
---

### 项目是怎么跑起来的

- 项目里面有很多子项目（`pages/*`），借助 webpack 多⼊⼝配置，打包成多个不同的子项目产出，总体结构来自于一个比较老的模板 https://github.com/vuejs-templates/webpack
- 在 webpack 配置的 entry 里可以看到这些子项目入口，里面列举了所有的入口 js 文件，也可以通过遍历 `src/pages` 得到所有入口。
- 对于每一个 page，都有对应的 `HtmlWebpackPlugin` 指定它的模板，并注入它需要的 chunks （对应每一个 entry 打包出的 js），本地直接通过 `localhost/xx.html` 访问，线上通过配置 nginx 路由映射访问 `try_files $uri /static/xx.html`
- 指定 `chunks` 是因为项目是多 entry 会生成多个编译后的 js 文件，chunks 决定使用哪些 js 文件，如果没有指定默认会全部引用。`inject` 值为 true，表明 chunks js 会被注入到 html 文件的 head 中，以 script defer 标签的形式引入。对于 css, 使用 `mini-css-extract-plugin` 从 bundle 中分离出单独的 css 文件并在 head 中以 link 标签引入。*（extract-text-webpack-plugin 是老版本 webpack 用来提取 css 文件的插件，从 webpack v4 被 mini-css-extract-plugin 替代）*
- 每一个 page 里的 js 文件（入口文件）会创建该子项目的 Vue 实例，指定对应的 component, router, store, 同时会把 `request`, `API`, `i18n` 这些对象挂载在 window 对象上，子组件中不需要单独引用。
- 每一个 page 有对应的 `router` 文件，这是子项目的路由，而且每个路由加载的 component 都是异步获取，在访问该路由时按需加载。
- webpack 打包时（`dist/`）会 emit 出所有 `HtmlWebpackPlugin` 生成的 html 文件（这也是浏览器访问的入口），相对每个 entry 打包出的 js 文件 `js/[name].[chunkhash].js`（对应 output.filename），所有异步加载的组件 js `js/[id].[chunkhash].js`（对应 output.chunkFilename）。这些 chunk 基本来自 vue-router 配置的路由 `component: resolve => require(['@/components/foo'], resolve)`，这样懒加载的组件会生成一个 js 文件。
- `copy-webpack-plugin` 用来把那些已经在项目目录中的文件（比如 `public/` 或 `static/`）拷贝到打包后的产出中，这些文件不需要 build，不需要 webpack 的处理。另外可以使用 `ignore: ["**/file.*", "**/ignored-directory/**"]` 这样的语法忽略一些文件不进行拷贝。
- 图片、音乐、字体等资源的打包处理使用 `url-loader` 结合 `limit` 的设置，如果资源比较大会默认使用 `file-loader` 生成 `img/[name].[hash:7].[ext]` 这样的文件；如果资源小，会自动转成 base64。*（DEPREACTED for v5: please consider migrating to asset modules）*
- `performance` 属性用来设置当打包资源和入口文件超过一定的大小给出警告或报错，可以分别设置它们的上限和哪些文件被检查。具体多大的文件算“过大”，则需要用到 `maxEntrypointSize` 和 `maxAssetSize` 两个参数，单位是 byte。
- 对于代码压缩，使用 `terser-webpack-plugin` 来压缩 JS，webpack 5 自带，但如果需要自定义配置，那么仍需要安装该插件，在 webpack 配置文件里设置 `optimization` 来引用这个插件。`HtmlWebpackPlugin` 里设置 `minify` 可以压缩 HTML，production 模式下是默认是 true（会使用 `html-minifier-terser` 插件去掉空格、注释等），自己传入一个 minify 对象，可以定制化[压缩设置](https://github.com/terser/html-minifier-terser#options-quick-reference)。
- 对于 js 的压缩使用了 `uglifyjs-webpack-plugin`，里面传入 `compress` 定制化[压缩设置](https://github.com/mishoo/UglifyJS#compress-options)。比如有的项目没有 console 输出，可能就是因为这里设置了 `drop_console`。
- 使用 `friendly-errors-webpack-plugin` 简化命令行的输出，可以只显示构建成功、警告、错误的提示，从而优化命令⾏的构建日志。
- webpack 设置请求代理 proxy（其背后使用的是 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)），默认情况下假设前端是 `localhost:3000`，后端是 `localhost:8082`，那么后端通过 `request.getHeader("Host")` 获取的依旧是 `localhost:3000`。如果设置了 `changeOrigin: true`，那么后端才会看到的是 `localhost:8082`, 代理服务器会根据请求的 target 地址修改 Host（这个在浏览器里看请求头是看不到改变的）。如果某个接口 404，一般就是这个路径没有配置代理。
- 路由中加载组件的方式为 `component: () => import('@/views/About.vue')` 可以做到 code-splitting，这样会单独产出一个文件名为 `About.[hash].js` 的 chunk 文件，路由被访问时才会被加载。

### Vue 项目
Vue npm 包有不同的 Vue.js 构建版本，可以在 `node_modules/vue/dist` 中看到它们，大致包括完整版、编译器（编译template）、运行时版本、UMD 版本（通过 `<script>` 标签直接用在浏览器中）、CommonJS 版本（用于很老的打包工具）、ES Module 版本。总的来说，Runtime + Compiler 版本是包含编译代码的，可以把编译过程放在运行时做，如果需要在客户端编译模板 (比如传入一个字符串给 template 选项)，就需要加上编译器的完整版。Runtime 版本不包含编译代码，需要借助 webpack 的 `vue-loader` 事先把 `*.vue` 文件内的模板编译成 `render` 函数，在最终打好的包里实际上是不需要编译器的，只用运行时版本即可。
- Standalone build: includes both the compiler and the runtime.
- Runtime only build: since it doesn't include the compiler, you need to either pre-compiled templates in a compile step, or manually written render functions. The npm package will export this build by default, since when consuming Vue from npm, you will likely be using a compilation step (with Webpack), during which vue-loader will perform the template pre-compilation.

Vue 3 在 2022 年 2 月代替 Vue 2 成为 Vue 的默认版本。
- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) 是 Vite 官方推荐的一个脚手架工具，可以创建基于 Vite 的不同技术栈基础模板。`npm create vite` 可创建一个基于 Vite 的基础空项目。
- [create-vue](https://github.com/vuejs/create-vue) 是 Vue 官方推出的一个脚手架，可以创建基于 Vite 的 Vue 基础模板。`npm init vue@3` 然后根据命令行的提示操作。
- [Vue 3 + SSR + Vite](https://github.com/nuxt-contrib/vue3-ssr-starter) Vue 3 + SSR 使用 Vite 进行开发的模板。
- 如果不习惯 Vite，依然可以使用 [Vue CLI](https://cli.vuejs.org) 作为开发脚手架，它使用的构建工具还是基于 Webpack。使用命令 `vue create hello-vue3` 根据提示创建项目。*(Vue CLI is in Maintenance Mode. For new projects, it is now recommended to use create-vue to scaffold Vite-based projects.)*
- [Volar](https://blog.vuejs.org/posts/volar-1.0.html) 是 Vue 官方推荐的 VSCode 扩展，用以代替 Vue 2 时代的 Vetur 插件。*(Volar extension is deprecated. Use the Vue - Official extension instead.)*

The [Vue Language Tools](https://github.com/vuejs/language-tools) are essential for providing language features such as autocompletion, type checking, and diagnostics when working with Vue’s SFCs. While `Volar` powers the language tools, the official extension for Vue is titled `Vue - Official` now on the VSCode marketplace.

Vue DevTools is designed to enhance the Vue developer experience. There are multiple options to add this tool to your projects by [Vite plugin](https://devtools.vuejs.org/guide/vite-plugin), [Standalone App](https://devtools.vuejs.org/guide/standalone), or Chrome Extension. Note that The v7 version of devtools only supports Vue3. If your application is still using Vue2, please install the v6 version.

### 一些 webpack 的配置
- Webpack 5 boilerplate: https://github.com/taniarascia/webpack-boilerplate
- Create App: https://createapp.dev/webpack
- Webpack articles: https://blog.jakoblind.no/tags/webpack
- Geektime webpack course: https://github.com/cpselvis/geektime-webpack-course

#### filename and chunkFilename
- `filename` 是对应于 entry 里面的输入文件，经过打包后输出文件的名称。`chunkFilename` 指未被列在 entry 中，却又需要被打包出来的 chunk 文件的名称（non-initial chunk files），一般是要懒加载的代码。
- `output.filename` 的输出文件名是 `js/[name].[chunkhash].js`，`[name]` 根据 entry 的配置推断为 index，所以输出为 `index.[chunkhash].js`。`output.chunkFilename` 默认使用 `[id].js`, 会把 `[name]` 替换为 chunk 文件的 id 号。
- By prepending `js/` to the filename in `output.filename`, webpack will write bundled files to a js sub-directory in the `output.path`. This allows you to organize files of a particular type in appropriately named sub-directories.
- `chunkFileName` 不能灵活自定义，但可以通过 `/* webpackChunkName: "foo" */` 这样的 [Magic Comments](https://webpack.js.org/api/module-methods/#magic-comments)，给 import 语句添加注释来命名 chunk。
- `chunkhash` 根据不同的入口文件构建对应的 chunk，生成对应的哈希值，来源于同一个 chunk，则 hash 值就一样。

#### path and publicPath
- `output.path` represents the absolute path for webpack file output in the file system. In other words, `path` is the physical location on disk where webpack will write the bundled files.
- `output.publicPath` represents the path from which bundled files should be accessed by the browser. You can load assets from a custom directory (`/assets/`) or a CDN (`https://cdn.example.com/assets/`). The value of the option is prefixed to every URL created by the runtime or loaders.

#### app, vendor and manifest
In a typical application built with webpack, there are three main types of code:
1. The source code you have written. 自己编写的代码
2. Any third-party library or "vendor" code your source is dependent on. 第三方库和框架
3. A webpack runtime and manifest that conducts the interaction of all modules. 记录了打包后代码模块之间的依赖关系，需要第一个被加载

#### optimization.splitChunks
It is necessary to differentiate between **Code Splitting** and **splitChunks**. Code splitting is a feature native to Webpack, which uses the `import('package')` statement to move certain modules to a new Chunk. SplitChunks is essentially a further splitting of the Chunks produced by code splitting.

> Code splitting also has some drawbacks. There’s a delay between loading the entry point chunk (e.g., the top-level app with the client-side router) and loading the initial page (e.g., home). The way to improve this is by injecting a small script in the head of the HTML, when executed, it preloads the necessary files for the current path by manually adding them to the HTML page as link `rel="preload"`.

After code splitting, many Chunks will be created, and each Chunk will correspond to one ChunkGroup. SplitChunks is essentially splitting Chunk into more Chunks to form a group and to load groups together, for example, under HTTP/2, a Chunk could be split into a group of 20 Chunks for simultaneous loading.

chunks: 'all' | 'initial' | 'async':  
- `all` means both dynamically imported modules and statically imported modules will be selected for optimization.
- `initial` means only statically imported modules; `async` means only dynamically imported modules.

#### resolve
- extensions 数组，在 import 不带文件后缀时，webpack 会自动带上后缀去尝试访问文件是否存在，默认值 `['.js', '.json', '.wasm']`.
- mainFiles 数组，the filename to be used while resolving directories, defaults to `['index']`.
- alias 配置别名，把导入路径映射成一个新的导入路径，比如 `"@": path.join(__dirname, 'src')`.
- modules 数组，tell webpack what directories should be searched when resolving modules, 默认值 `['node_modules']`，即从 node_modules 目录下寻找。

#### css-loader and style-loader
- `css-loader` takes a CSS file and returns the CSS with `@import` and `url(...)` resolved. It doesn't actually do anything with the returned CSS and is not responsible for how CSS is ultimately displayed on the page.
- `style-loader` takes those styles and creates a `<style>` tag in the page's `<head>` element containing those styles. The order of CSS insertion is completely consistent with the import order.
- We often chain the `sass-loader` with the `css-loader` and the `style-loader` to immediately apply all styles to the DOM or the `mini-css-extract-plugin` to extract it into a separate file.

#### load images
Webpack goes through all the `import` and `require` files in your project, and for all those files which have a `.png|.jpg|.gif` extension, it uses as an input to the webpack `file-loader`. For each of these files, the file loader emits the file in the output directory and resolves the correct URL to be referenced. Note that this config only works for webpack 4, and Webpack 5 has deprecated the `file-loader`. If you are using webpack 5 you should change `file-loader` to `asset/resource`.

Webpack 4 also has the concept `url-loader`. It first base64 encodes the file and then inlines it. It will become part of the bundle. That means it will not output a separate file like `file-loader` does. If you are using webpack 5, then `url-loader` is deprecated and instead, you should use `asset/inline`.

> Loaders are transformations that are applied to the source code of a module. When you provide a list of loaders, they are applied from right to left, like `use: ['third-loader', 'second-loader', 'first-loader']`. This makes more sense once you look at a loader as a function that passes its result to the next loader in the chain `third(second(first(source)))`.

#### webpack in development
- `webpack-dev-server` doesn't write any output files after compiling. Instead, it keeps bundle files in memory and serves them as if they were real files mounted at the server's root path.
- `webpack-dev-middleware` is an express-style development middleware that will emit files processed by webpack to a server. This is used in `webpack-dev-server` internally.
- Want to access `webpack-dev-server` from the mobile in local network: run `webpack-dev-server` with `--host 0.0.0.0`, which lets the server listen for requests from the network (all IP addresses on the local machine), not just localhost. But Chrome won't access `http://0.0.0.0:8089` (Safari can open). It's not the IP, it just means it is listening on all the network interfaces, so you can use any IP the host has.

The `DefinePlugin` allows you to create global constants that are replaced at compile time, commonly used to specify environment variables or configuration values that should be available throughout your application during the build process. For example, you might use it to define `process.env.NODE_ENV` as 'production' or 'development' which webpack will literally replace in your code during bundling.

```js
new webpack.DefinePlugin({
  'process.env.NODE_ENV': '"production"',
  'process.env.BUILD_ENV': buildEnv ? `"${buildEnv}"`: '""',
  'process.env.PLATFORM_ENV': platFormEnv ? `"${platFormEnv}"`: '""'
})
```

#### difference between `--watch` and `--hot`
- `webpack --watch`: watch for the file changes and compile again when the source files changes. `webpack-dev-server` uses webpack's watch mode by default.
- `webpack-dev-server --hot`: add the HotModuleReplacementPlugin to the webpack configuration, which will allow you to only reload the component that is changed instead of doing a full page refresh.

  ```js
  watchOptions: {
    ignored: /node_modules/,
    // 监听到变化发生后会等 300ms 再去执行，默认300ms
    aggregateTimeout: 300,
    // 判断文件是否发生变化是通过不停询问系统指定文件有没有变化实现的，默认每秒 1000 次
    poll: 1000,
  }
  ```

#### something related to bundling/tree shaking
1. Every component will get its own scope, and when it imports another module, webpack will check if the required file was already included or not in the bundle.
2. Webpack v5 comes with the latest `terser-webpack-plugin` out of the box. `optimization.minimize` is set to `true` by default, telling webpack to minimize the bundle using the `TerserPlugin`.
3. Tree shaking means that unused modules will not be included in the bundle (The term was popularized by Rollup). In order to take advantage of tree shaking, you must use ES2015 module syntax. Ensure no compilers transform your ES2015 module syntax into CommonJS modules (this is the default behavior of the popular Babel preset `@babel/preset-env`).

    > Webpack do tree-shake only happens when you're using a esmodule, while lodash is not. Alternatively, you can try to use [lodash-es](https://github.com/lodash/lodash/blob/4.17.21-es/package.json) written in ES6.
    > - import cloneDeep from "lodash/cloneDeep"
    > - import { camelCase } from "lodash-es"
    > - import * as _ from "lodash-es"

    ```js
    // babel.config.js
    // keep Babel from transpiling ES6 modules to CommonJS modules
    export default {
      presets: [
        [
          "@babel/preset-env", {
            modules: false
          }
        ]
      ]
    }
    ```

    > [es-toolkit](https://github.com/toss/es-toolkit) is a modern JavaScript utility library that's 2-3 times faster and up to 97% smaller—a major upgrade to lodash.

4. The `sideEffects` property of `package.json` declares whether a module has side effects on import. When side effects are present, unused modules and unused exports may not be tree shaken due to the limitations of static analysis.

#### 打包工具构建时静态分析
```
Critical dependency: the require function is used in a way in which dependencies cannot be statically extracted.
```

这样的 warning，是因为 `require(...)` 是运行时动态行为，它无法静态知道你到底引用了哪个模块，因此构建出的 bundle 不完整或存在不确定性。Webpack 支持懒加载语法 `(resolve) => require(['...'], resolve);`，表示“这段代码用到的模块是异步加载的，请打包成一个 chunk。” 这种语法是 Webpack 的特定实现，并非 ES 的官方标准，构建工具无法完全静态分析，在迁移到 Rspack 或Vite 时容易报错。

> `resolve => require(['...'], resolve)` 其实是 Webpack 兼容 AMD 风格的写法，webpack 看到这是个 `require([], callback)` 就知道你想异步加载模块。

`import()` 是来做“动态模块加载”的语法，构建工具能很好地支持它，每个 `import('./xxx')` 的路径生成一份 chunk 文件，并在需要时异步加载。

#### webpack-bundle-analyzer（检查打包体积）
It will create an interactive treemap visualization of the contents of all your bundles when you build the application. There are two ways to configure webpack bundle analyzer in a webpack project. Either as a plugin or using the command-line interface. 

```js
// Configure the webpack bundle analyzer plugin
// npm install --save-dev webpack-bundle-analyzer
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}
```

- *stat* - This is the "input" size of your files, before any transformations like minification. It is called "stat size" because it's obtained from Webpack's stats object.
- *parsed* - This is the "output" size of your files. If you're using a Webpack plugin such as Uglify, then this value will reflect the minified size of your code.
- *gzip* - This is the size of running the parsed bundles/modules through gzip compression.

#### speed-measure-webpack-plugin（检查打包速度）
See how fast (or not) your plugins and loaders are, so you can optimise your builds. This plugin measures your webpack build speed, giving an output in the terminal.

```js
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

const webpackConfig = smp.wrap({
  plugins: [new MyPlugin(), new MyOtherPlugin()],
});
```

#### TypeScript and Webpack
Webpack is extensible with "loaders" that can be added to handle particular file formats.

1. Install `typescript` and [ts-loader](https://github.com/TypeStrong/ts-loader) as devDependencies.
2. The default behavior of `ts-loader` is to act as a drop-in replacement for the `tsc` command, so it respects the options in `tsconfig.json`.
3. If you want to further optimize the code produced by TSC, use `babel-loader` with `ts-loader`. We need to compile a `.ts` file using `ts-loader` first and then using `babel-loader`.
4. `ts-loader` does not write any file to disk. It compiles TypeScript files and passes the resulting JavaScript to webpack, which happens in memory.

TypeScript doesn't understand `.vue` files - they aren't actually Typescript modules. So it will throw an error when you try to import `Foo.vue`. The solution is `shims-vue.d.ts` in `src` directory. The filename does not seem to be important, as long as it ends with `.d.ts`. TypeScript looks for `.d.ts` files in the same places it looks for your regular `.ts` files. It basically means, "every time you import a module with the name `*.vue`, then treat it as if it had these contents, and the type of `Foo` will be Vue."

```ts
// shims-vue.d.ts
declare module "*.vue" {
  import Vue from 'vue';
  export default Vue;
}
```

If that doesn't help, make sure the module you are trying to import is tracked by TypeScript. It should be covered in your `include` array setting and not be present in the `exclude` array in your `tsconfig.json` file.

```json
{
  "compilerOptions": {
    // ...
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "src/**/*.spec.ts"]
}
```

> Above was created in the days before Vue shipped with TypeScript out of the box. Now the best path to get started is through the official CLI.

#### 配置 babel-loader 选择性编译引入的 sdk 文件
Transpiling is an expensive process and many projects have thousands of lines of code imported in that babel would need to run over. Your `node_modules` should already be runnable without transpiling and there are simple ways to exclude your `node_modules` but transpile any code that needs it.
```js
{
  test: /\.js$/,
  exclude: /node_modules\/(?!(my_main_package\/what_i_need_to_include)\/).*/,
  use: {
    loader: 'babel-loader',
    options: ...
  }
}
```

### 本地 build 与上线 build
1. 使用 [ora](https://www.npmjs.com/package/ora) 做 spinner，提示 building for production...
2. 使用 [rimraf](https://www.npmjs.com/package/rimraf) 删除打包路径下的资源 (`rimraf` command is an alternative to the Linux command `rm -rf`)
3. 调用 `webpack()` 传入配置 `webpack.prod.conf` 和一个回调函数，**webpack stats 对象** 作为回调函数的参数，可以通过它获取到 webpack 打包过程中的信息，使用 `process.stdout.write(stats.toString(...))` 输出到命令行中 (`console.log` in Node is just `process.stdout.write` with formatted output)
4. 使用 [chalk](https://www.npmjs.com/package/chalk) 在命令行中显示一些提示信息。
5. 补充：目前大多数工程都是通过脚手架来创建的，使用脚手架的时候最明显的就是与命令行的交互，[Inquirer.js](https://github.com/SBoudrias/Inquirer.js) 是一组常见的交互式命令行用户界面。[Commander.js](https://github.com/tj/commander.js) 作为 node.js 命令行解决方案，是开发 node cli 的必备技能。

The build job uses Kaniko (a tool for building Docker images in Kubernetes). Its main task is to build a Docker image.
- For master, dev, or tagged commits: builds and pushes the Docker image
- For other branches: builds but doesn't push the image

```sh
prefixOss=`echo ${CI_COMMIT_REF_NAME} | sed -e "s/\_/-/g" -e "s/\//-/g"`

[ -z ${CI_COMMIT_TAG} ] && sed -i -E "s/^  \"version\": \"[0-9\.]+\"/  \"version\": \"0.0.0-${prefixOss}-${CI_COMMIT_SHORT_SHA}\"/g" package.json
```

The above checks if the environment variable `CI_COMMIT_TAG` is empty (meaning it's not a tag build). If that's the case, it uses sed to perform an in-place replacement in the `package.json` file. Specifically, it looks for lines that start with "version": "[0-9\.]+" and replaces them with a new version format `0.0.0-${prefixOss}-${CI_COMMIT_SHORT_SHA}`. This script appears to be adjusting versioning and paths based on the branch or tag being built in a CI/CD pipeline.

> The `s` command is for substitute, to replace text -- the format is `s/[text to select]/[text to replace]/`. For example, `sed 's/target/replacement/g' file.txt` will globally substitute the word `target` with `replacement`.

#### 基于 Docker + Terraform + GitLab CI/CD 的部署
整体目标：通过 GitLab CI/CD 自动构建包含 Terraform 配置的 Docker 镜像，在容器中执行计划（plan）与部署（apply），实现多个项目环境的基础设施部署。

- `Dockerfile.base`：使用阿里云镜像，安装了各种工具 aliyun CLI、terraform、ossutil64、websocat，添加了阿里云的 AK/SK 凭据和配置 profile（方便后续 terraform 操作时访问阿里云资源）。
- `Dockerfile`：基于 `Dockerfile.base` 生成一个新的部署镜像，拷贝了 terraform 配置，对每个环境都做了 `terraform init` 和 `terraform plan`。这里的计划是提前计算好的“基础设施变更内容”，保存下来，后续可以直接 apply。
- `gitlab-ci.yml`：使用 `kaniko` 工具构建镜像，用 Dockerfile 构建出包含所有 Terraform 配置和计划的镜像，并推送到私有仓库，保证部署时拿到同样的镜像和计划。
- Test 阶段：运行刚构建的镜像，执行 `/root/scripts/show_plan.sh`，打印出所有计划内容，即对每个模块用 `terraform show` 展示 plan 文件的内容，确保没有问题。
- Deploy 阶段：部署脚本核心就是 `terraform apply /root/plan/{env}`。在镜像构建阶段就把所有 plan 做好，在部署阶段只需要 apply，可控且快速。

### 登录逻辑
- 二维码登录先使用 websocket 连接，message 中定义不同的 `op` 代表不同的操作，比如 requestlogin 会返回微信生成的二维码（包括 qrcode, ticket, expire_seconds 等）, 扫码成功返回类型是 loginsuccess，并附带 OpenID, UnionID, Name, UserID, Auth 等信息，前端拿到这些信息后可以请求后端登录的 http 接口，拿到 sessionid，并被种在 cookie 里。
- 账密登录，前端使用 [JSEncrypt](http://travistidwell.com/jsencrypt/) 给密码加密并请求后端登录接口，成功的话后端会把 sessionid 种在 cookie 里。

```js
// Node.js 利用多核CPU，每个核心一个工作进程，主进程管理工作进程，负责创建、重启、关闭，
// 工作进程运行实际的业务服务（HTTP/WebSocket等）

// 下面都是在 worker 进程中执行
(messenger) ws op case 'requestlogin':

(messenger) await rainSquare.getQrcode() -> loginId = uuidV4() -> request `${config.HOST.INNER_NODE}/wechat/wxapi/qrcode` with loginid and expire_seconds

(messenger) let { loginid, qrcode, ticket } = results.body;

(messenger) rainSquare.qrcodes[qrcodeInfo.loginid].ws = ws;

(drop) app.use('/wechat/drop', ...)

(drop) pipeMsg: (msg) => {
  // 将消息推送到Redis队列
  // listKey: config.REDIS.KEYS.PIPE_QUEUE
  client.rpush(listKey, JSON.stringify(msg), callback)
}

// 阻塞地从列表中取元素，常用于“任务队列”消费
(pipe) new Consumer(listKey, Handle, config).start() -> this.client.blpop(listKey, 0, ...)

// https://developers.weixin.qq.com/doc/subscription/guide/product/message/Receiving_event_pushes.html
(pipe) handleMessage: MsgType is event -> new WXEvent(this) -> case 'SCAN' -> new EventScan() -> request APIS.SPY_LOGIN with loginid
  
(messenger) app.post('/api/login', ...) -> request APIS.USERINFO -> square.publish(op: 'loginsuccess') -> redis publish

// redis发布订阅
(messenger) square.onMessage and case 'loginsuccess':

(messenger) let ws = this.qrcodes[loginid].ws -> ws.send(msg)

(frontend) case 'loginsuccess' -> Api.pc_web_login with UserID and Auth
```

```
// getQrcode

1. 从 Redis 缓存中获取已有的二维码
2. 检查二维码是否过期 (expire_seconds > now)
3. 检查冷却时间 (cooldown < now)
4. 如果可用直接返回，否则生成新的二维码
5. 设置冷却时间 (防止立即重复使用) 和过期时间
6. 更新二维码池
```

> 常规的扫码登录原理（涉及 PC 端、手机端、服务端）：
> 1. PC 端携带设备信息向服务端发起生成二维码的请求，生成的二维码中封装了 uuid 信息，并且跟 PC 设备信息关联起来，二维码有失效时间。PC 端轮询检查是否已经扫码登录。
> 2. 手机（已经登录过）进行扫码，将手机端登录的信息凭证（token）和二维码 uuid 发送给服务端，此时的手机一定是登录的，不存在没登录的情况。服务端生成一个一次性 token 返回给移动端，用作确认时候的凭证。
> 3. 移动端携带上一步的临时 token 确认登录，服务端校对完成后，会更新二维码状态，并且给 PC 端一个正式的 token，后续 PC 端就是持有这个 token 访问服务端。
> 4. 流程参考 https://github.com/ahu/scan_qrcode_login/blob/master/qr.js

> 常规的密码存储：
> 
> A Rainbow Table is a precomputed table of hashes and their inputs. This allows an attacker to simply look up the hash in the table to find the input. This means that if an attacker gets access to your database, they can simply look up the hashes to find the passwords.
> 
> To protect against this, password hashing algorithms use a salt. A salt is a random string that is added to the password before hashing. This means that even if two users have the same password, their hashes will be different. This makes it impossible for an attacker to use a rainbow table to find the passwords. In fact a common practice is to simply append the salt to the hash. This will make it so that the salt is always available when you need to verify the password.
>
> A great library for generating bcrypt hashes is [bcryptjs](https://github.com/dcodeIO/bcrypt.js) which will generate a random salt for you. This means that you don't need to worry about generating a salt and you can simply store the whole thing as is. Then when the user logs in, you provide the stored hash and the password they provide to bcryptjs's `compare` function will verify the password is correct.

### 微信网页授权
申请公众号/小程序的时候，都有一个 APPID 作为当前账号的标识，OpenID 就是用户在某一公众平台下的标识（用户微信号和公众平台的 APPID 两个数据加密得到的字符串）。如果开发者拥有多个应用，可以通过获取用户基本信息中的 UnionID 来区分用户的唯一性，因为同一用户，在同一微信开放平台下的不同应用，UnionID 应是相同的，代表同一个人，当然前提是各个公众平台需要先绑定到同一个开放平台。OpenID 同一用户同一应用唯一，UnionID 同一用户不同应用唯一，获取用户的 OpenID 是无需用户同意的，获取用户的基本信息则需要用户同意。

向用户发起授权申请，即打开如下页面：
https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect

1. `appid` 是公众号的唯一标识。
2. `redirect_uri` 替换为回调页面地址，用户授权完成后，微信会帮你重定向到该地址，并携带相应的参数如 `code`，回调页面所在域名必须与后台配置一致。在微信公众号请求用户网页授权之前，开发者需要先到公众平台官网中配置授权回调域名。
3. `scope` 根据业务需要选择 `snsapi_base` 或 `snsapi_userinfo`。其中 `snsapi_base` 为静默授权，不弹出授权页面，直接跳转，只能获取用户的 `openid`，而 `snsapi_userinfo` 会弹出授权页面，需要用户同意，但无需关注公众号，可在授权后获取用户的基本信息。（对于已关注公众号的用户，如果用户从公众号的会话或者自定义菜单进入本公众号的网页授权页，即使是 `scope` 为 `snsapi_userinfo`，也是静默授权，用户无感知。）
4. `state` 不是必须的，重定向后会带上 `state` 参数，开发者可以填写 a-zA-Z0-9 的参数值，最多 128 字节。
5. 如果用户同意授权，页面将跳转至 `redirect_uri/?code=CODE&state=STATE`，`code` 作为换取 `access_token` 的票据，每次用户授权带上的 `code` 不一样，`code` 只能使用一次，5分钟未被使用自动过期。
6. 获取 `code` 后，请求 https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code 获取 `access_token` 和 `openid` (未关注公众号时，用户访问公众号的网页，也会产生一个唯一的 openid)。如果 `scope` 为 `snsapi_userinfo` 还会同时获得到 `unionid`。
7. 如果网页授权作用域为 `snsapi_userinfo`，则此时可以请求 https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN 拉取用户信息，比如用户昵称、头像、`unionid` 等，不再返回用户性别及地区信息。
8. 公众号的 `secret` 和获取到的 `access_token` 安全级别都非常高，必须只保存在服务器，不允许传给客户端。后续刷新 `access_token` 以及通过 `access_token` 获取用户信息等步骤，也必须从服务器发起。

> 1. 微信公众平台接口测试帐号申请: https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login
> 2. 某个公众号的关注页面地址为 https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI0NDA2OTc2Nw==#wechat_redirect 其中 biz 字符串是微信公众号标识，在浏览器打开该公众号下的任意一篇文章，查看网页源代码，搜索 `var biz` 这样的关键字即可得到。
> 3. 在微信开发中，JS 接口安全域名和网页授权域名是两个不同的配置项。JS 接口安全域名用于控制哪些域名下的页面可以调用微信的 JS-SDK 接口（如分享、拍照、支付、定位等）。网页授权域名用于控制哪些域名下的页面可以发起微信网页授权，用户授权后，后端可通过 code 换取用户信息（如 openid、nickname 等）。

微信授权也符合通常的 OAuth 流程：  
*You first need to register your app with your provider to get the required credentials. You’ll be asked to define a callback URL or a redirect URI.*
1. Redirect the user to the provider.
2. User is authenticated by the provider.
3. User is redirected back to your server with a secret code.
4. Exchange that secret code for the user’s access token.
5. Use the access token access the user’s data.

### 唤起微信小程序
微信外网页通过小程序链接 URL Scheme，微信内通过微信开放标签，且微信内不会直接拉起小程序，需要手动点击按钮跳转。这是官方提供的一个例子 https://postpay-2g5hm2oxbbb721a4-1258211818.tcloudbaseapp.com/jump-mp.html 可以用手机浏览器查看效果，直接跳转小程序。

- 使用微信开放标签 `<wx-open-launch-weapp>`，提供要跳转小程序的原始 ID 和路径，标签内插入自定义的 html 元素。开放标签会被渲染成一个 iframe，所以外部的样式是不会生效的。另外在开放标签上模拟 click 事件也不生效，即不可以在微信内不通过点击直接跳转小程序。可以监听 `<wx-open-launch-weapp>` 元素的 `launch` 事件，用户点击跳转按钮并对确认弹窗进行操作后触发。
- 通过开放标签 `<wx-open-launch-app>` 唤起 App，提供 AppId 和可选的附加信息。但是 Android 的要求是 App 必须登录过一次（客户端的微信 sdk 跑过）。如果不能跳转，要么就是未安装 App，要么就是场景值不对（这个指的是页面打开方式，比如从公众号菜单栏，收藏等地方打开的页面才可以跳转），但是报错信息无法区分这两种错误。
- 通过[服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-scheme/urlscheme.generate.html)或在小程序管理后台的「工具」入口可以获取打开小程序任意页面的 URL Scheme。适用于从短信、邮件、微信外网页等场景打开小程序。

> 微信小程序相关的仓库，比如 WeUI 组件库、微信小程序示例、computed / watch 扩展等: https://github.com/wechat-miniprogram

国产 APP 各自套壳 Chromium 内核版本，最大的问题就是更新不及时，而且大多被改造过。
- iOS 方面，根据 App Store 审核指南，上架 App Store 的应用不允许使用自己的浏览器内核。如果 app 会浏览网页，则必须使用相应的 WebKit 框架和 WebKit Javascript。
- Android 方面，不限制应用使用自己的浏览器内核。安卓微信之前的浏览器为基于 WebKit 的 X5 浏览器，后为了和小程序的浏览器内核同构，大概 2020-05 从 X5 迁移到 XWeb，官方一般会有内核版本升级体验通告，比如[2023-06 更新](https://developers.weixin.qq.com/community/develop/doc/0002c2167840006af8df3c94256001)：当前安卓微信 XWeb 开发版基于 111 新内核，现网仍基于 107 内核。

vue vite 打包后白屏问题，推测就是 webview 版本太旧了，使用 [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 做兼容。它的内部使用 `@babel/preset-env` 以及 `core-js` 等一系列基础库来进行语法降级和 Polyfill 注入，以解决在旧版浏览器上的兼容性问题。*（默认情况下，Vite 的目标是能够支持原生 ESM script 标签、支持原生 ESM 动态导入 和 import.meta 的浏览器）*

> 1. 当小程序基于 WebView 环境下时，WebView 的 JS 逻辑、DOM 树创建、CSS 解析、样式计算、Layout、Paint 都发生在同一线程，在 WebView 上执行过多的 JS 逻辑可能阻塞渲染，导致界面卡顿（Chrome 的渲染进程是多线程的）。以此为前提，小程序同时考虑了性能与安全，采用了 AppService 和 WebView 的双线程模型。
> 2. 为了进一步优化小程序性能，在 WebView 渲染之外新增了一个渲染引擎 Skyline，拥有更接近原生渲染的性能体验。Skyline 创建了一条渲染线程来负责 Layout, Composite 和 Paint 等渲染任务，并在 AppService 中划出一个独立的上下文，来运行之前 WebView 承担的 JS 逻辑、DOM 树创建等逻辑。

### 课堂业务
```
Lesson(classroomID, lessonID, teacher, allStudents, checkinStudents, presentation)
Presentation(presentationID, slideIndex, content, problems)

1. start lesson
- sql getClassroomId from a universityId
- local presentation json data -> getTitle()
- sql all students(role=1 -> teacher, role=5 -> allStudents)
- API.NEW_LESSON(teacherId, classroomId, presentationTitle) -> get a lessonID

2. upload presentation
- API.NEW_PRESENTATION(presentationContent, teacherId, lessonId)
- parse slides, get content and problem slides

3. connectWS
- sql app_openid, weixin_unionid, user_id... from teacherId
- API.GET_USER_INFO to get Auth
- new WebSocket to send op=hello, userId, role, auth

4. checkin
- API.LESSON_CHECK_IN(studentId, lessonId, source)

5. showPresentation
- get presentation curent slide
- ws send op=showpresentation, lessonId, presentationId, slideId

6. rollcall
- Based on the mode, eligiblePool is checked in students or all students
- Count how many times each student has been called
- Find minimum call count among called students
- Create fair selection pools "neverCalled" and "leastCalled"
- selectionPool is assigned as "neverCalled" first, then "leastCalled"
- Randomly select a student from the selectionPool

7. end lesson
- API.END_LESSON(teacherId, lessonId)
```

### HTTP 请求相关
- 通过 `axios.defaults.headers['xyz'] = 'abc'` 这样的方式添加需要的请求头
- 统一对 query 参数做处理，拼在 url 后面
- 加 csrf token，加业务需要的 header
- 根据不同的错误码做页面跳转

> Some features about Axios:
> 1. Axios automatically converts the data to JSON returned from the server.
> 2. In Axios, HTTP error responses (like 404 or 500) automatically reject the promise, so you can handle them using catch block (`err.response`).
> 3. One of the main selling points of Axios is its wide browser support. Even old browsers like IE11 can run Axios without any issues. This is because it uses `XMLHttpRequest` under the hood. 
> 4. 注意 Axios 遇到 302 的返回：重定向直接被浏览器拦截处理，浏览器 redirect 后，被视为 Axios 发起了跨域请求，所以抛异常。Axios 捕获异常，进入 catch 逻辑。

  ```js
  const handleResponse = (res) => {
    if(res.headers && res.headers['set-auth']) {
      window.Authorization = res.headers['set-auth'];
    }
    
    // 之后根据状态码做不同处理...
  }

  export default {
    get(url, params) {
      // 统一加请求头
      axios.defaults.headers['X-Client'] = 'web';
      if (window.Authorization) {
        axios.defaults.headers['Authorization'] = 'Bearer ' + window.Authorization;
      }

      return axios
        .get(url)
        .then(function(response) {
          return response
        })
        .then(handleResponse)    // 统一处理 redirect, 赋值 location.href 
        .catch(errorResponseGet) // 统一处理错误码 4xx, 5xx
    },

    post(url, params) {
      // ...
    }
  }
  ```

  ```js
  // Show progress of Axios during request
  await axios.get('https://fetch-progress.anthum.com/30kbps/images/sunrise-baseline.jpg', {
    onDownloadProgress: progressEvent => {
      const percentCompleted = Math.floor(progressEvent.loaded / progressEvent.total * 100)
      setProgress(percentCompleted)
    }
  })
  .then(res => {
    console.log("All DONE")
    return res.data
  })
  ```

Use `$fetch`, `useFetch`, or `useAsyncData` in Nuxt: https://masteringnuxt.com/blog/when-to-use-fetch-usefetch-or-useasyncdata-in-nuxt-a-comprehensive-guide

- The `useFetch` composable is the best choice to load initial data once on the server. It prevents extra calls after hydration. By default, `useFetch` block navigation until their requests are done. If we prefer to load data after navigation, we should pass `lazy: true`.
- The `$fetch` is a HTTP client that runs on both the server and the client, powered by `ofetch`. It is more direct for forms or user-triggered actions.
- `$fetch` is the simplest way to make a network request. `useFetch` is wrapper around `$fetch` that fetches data only once in universal rendering.

**Preventing Duplicate Requests:**
1. UI Blocking
  - Disable submit buttons immediately after click
  - Overlay/modal blockers for critical operations
2. Request Debounce: Delay execution until user stops clicking
3. Request `isSubmitting` in progress flag
4. `AbortController` to cancel pending requests if a new one is made

```js
let controller = new AbortController();

async function makeRequest() {
  // Cancel previous request if it exists
  controller.abort();
  controller = new AbortController();
  
  try {
    const response = await fetch('/api/endpoint', {
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was cancelled');
    }
  }
}
```

### Chrome's `--remote-debugging-port=9222` feature
1. Launch Chrome with remote debugging: `google-chrome --remote-debugging-port=9222`. Chrome will start an internal HTTP and WebSocket server on port 9222.
2. Go to `http://localhost:9222/json`, and you'll see JSON metadata for every open tab. Each tab has its own WebSocket debugger endpoint. If you connect to that using a WebSocket client, you can send and receive raw DevTools Protocol commands.
3. Use Node.js with ws to control the tab. Use `webSocketDebuggerUrl` from the JSON to connect `new WebSocket('ws://localhost:9222/devtools/page/...');`.

#### Debugging Node.js with `--inspect-brk`
https://www.builder.io/blog/debug-nodejs

Launch your Node.js process using the `--inspect-brk` flag (`node server.js --inspect-brk`). Now, open up any Edge or Chrome dev tools window and click the little green Node.js logo button. A new instance of DevTools will open and connect to the node process.

### 阿里云 CDN
阿里云 CDN 对于文件是否支持缓存是以 `X-Cache` 头部来确定，缓存时间是以 `X-Swift-CacheTime` 头部来确认。
- `Age` 表示该文件在 CDN 节点上缓存的时间，单位为秒。只有文件存在于节点上 Age 字段才会出现，当文件被刷新后或者文件被清除的首次访问，在此前文件并未缓存，无 Age 头部字段。当 Age 为 0 时，表示节点已有文件的缓存，但由于缓存已过期，本次无法直接使用该缓存，需回源校验。
- `X-Swift-SaveTime` 该文件是在什么时间缓存到 CDN 节点上的。(GMT时间，Greenwich Mean Time Zone)
- `X-Swift-CacheTime` 该文件可以在 CDN 节点上缓存多久，是指文件在 CDN 节点缓存的总时间。通过 `X-Swift-CacheTime – Age` 计算还有多久需要回源刷新。

> 阿里云 CDN 在全球拥有 3200+ 节点。中国内地拥有 2300+ 节点，覆盖 31 个省级区域。
> 1. CDN 节点是指与最终接入用户之间具有较少中间环节的网络节点，对最终接入用户有相对于源站而言更好的响应能力和连接速度。当节点没有缓存用户请求的内容时，节点会返回源站获取资源数据并返回给用户。阿里云 CDN 的源站可以是对象存储OSS、函数计算、自有源站（IP、源站域名）。
> 2. 默认情况下将使用 OSS 的 Bucket 地址作为 HOST 地址（如 `***.oss-cn-hangzhou.aliyuncs.com`）。如果源站 OSS Bucket 绑定了自定义域名（如 `origin.developer.aliyundoc.com`），则需要配置回源 HOST 为自定义域名。
> 3. 加速域名即网站域名、是终端用户实际访问的域名。CNAME 域名是 CDN 生成的，当您在阿里云 CDN 控制台添加加速域名后，系统会为加速域名分配一个 `*.*kunlun*.com` 形式的 CNAME 域名。
> 4. 添加加速域名后，需要在 DNS 解析服务商处，添加一条 CNAME 记录，将加速域名的 DNS 解析记录指向 CNAME 域名，记录生效后该域名所有的请求都将转向 CDN 节点，达到加速效果。CNAME 域名将会解析到具体哪个节点 IP 地址，将由 CDN 的调度系统综合多个条件来决定。

### 日常开发 Tips and Tricks
- The `input` event is fired every time the value of the element changes. This is unlike the `change` event, which only fires when the value is committed, such as by pressing the enter key or selecting a value from a list of options. Note that `onChange` in React behaves like the browser `input` event. *(in React it is idiomatic to use `onChange` instead of `onInput`)*

- The order in which the events are fired: `mousedown` --> `mouseup` --> `click`. When you add a `blur` event, it is actually fired before the `mouseup` event and after the `mousedown` event of the button. Refer to https://codepen.io/mudassir0909/full/qBjvzL

- Reading content with `textContent` is much faster than `innerText` *(`innerText` had the overhead of checking to see if the element was visible or not yet)*. The `insertAdjacentHTML` method is much faster than `innerHTML` because it doesn’t have to destroy the DOM first before inserting.

- The `DOMParser()` constructor creates a new DOMParser object that can be used to parse the text of a document using the `parseFromString()` method. It parses a string containing either HTML or XML, returning an HTMLDocument or an XMLDocument. e.g. `parser.parseFromString("<p>Hello</p>", "text/html")`

- HTML files input change event doesn't fire upon selecting the same file. You can put `this.value = null` at the end of the `onchange` event, which will reset the input's value and trigger the `onchange` event again.

- If we are appending each list item to the DOM as we create it, this is inefficient because the DOM is updated each time we append a new list item. Instead, we can create a document fragment using `document.createDocumentFragment()` and append all of the list items to the fragment. Then, we can append the fragment to the DOM. This way, the DOM is only updated once.

- Vue parent component will wait for its children to mount before it mounts its own template to the DOM. The order should be: parent created -> child created -> child mounted -> parent mouted.

- Sometimes I need to detect whether a click happens inside or outside of a particular element.
  ```js
  window.addEventListener('mousedown', e => {
    // Get the element that was clicked
    const clickedEl = e.target;

    // `el` is the element you're detecting clicks outside of
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
    if (el.contains(clickedEl)) {
      // Clicked inside of `el`
    } else {
      // Clicked outside of `el`
    }
  });
  ```

- Change the style of `:before` pseudo-elements using JS. (It's not possible to directly access pseudo-elements with JS as they're not part of the DOM.)
  ```js
  let style = document.querySelector('.foo').style;
  style.setProperty('--background', 'red');
  ```
  ```css
  .foo::before {
    background: var(--background);
    content: '';
    display: block;
    width: 200px;
    height: 200px;
  }
  ```

- The default behavior of `scrollIntoView()` is that the top of the element will be aligned to the top of the visible area of the scrollable ancestor. If it shifts the complete page, you could either call it with the parameter `false` to indicate that it should aligned to the bottom of the ancestor or just use `scrollTop` instead of `scrollIntoView()`.
  ```js
  let target = document.getElementById("target");
  target.parentNode.scrollTop = target.offsetTop;

  // can also add the css `scroll-behavior: smooth;`
  ```
 
- npmmirror 已内置[支持类似 unpkg cdn 解析能力](https://zhuanlan.zhihu.com/p/633904268)，可以简单理解为访问 unpkg 地址时，在回源服务里面根据 URL 参数，去 npm registry 下载对应的 npm 包，解压后响应对应的文件内容。即只需要遵循约定的 URL 进行访问，即可在页面中加载任意 npm 包里面的文件内容。
  ```
  # 获取目录信息 /${pkg}/${versionOrTag}/files?meta
  https://registry.npmmirror.com/antd/5.5.2/files?meta

  # 获取文件内容 /${pkg}/${versionOrTag}/files/${path}
  https://registry.npmmirror.com/antd/5.5.0/files/lib/index.js

  # 获取入口文件内容 /${pkg}/${versionOrTag}/files
  https://registry.npmmirror.com/antd/latest/files
  ```

- 播放器与字幕的跨域问题：由于加了字幕，但字幕地址是跨域的，所以播放器标签上必须加 `crossorigin="anonymous"` 也就是改变了原来请求视频的方式（no-cors 是 HTML 元素发起请求的默认状态；现在会创建一个状态为 anonymous 的 cors 请求，不发 cookie），此时服务端必须响应 `Access-Control-Allow-Origin` 才可以。『播放器不设置跨域 只给字幕配 cors 响应头』这个方案是不行的，因为必须要先发一个 cors 请求才可以，服务端配置的响应头才有用处。
  1. Add `crossorigin="anonymous"` to the video tag to allow load VTT files from different domains.
  2. Even if your CORS is set correctly on the server, you may need to have your HTML tag label itself as anonymous for the CORS policy to work.
  3. 与 HTML 元素不同的是，Fetch API 的 mode 的默认值是 cors；当你发送一个状态为 no-cors 的跨域请求，会发现返回的 response body 是空，也就是说，虽然请求成功，但仍然无法访问返回的资源。
  4. Unlike classic scripts, module scripts (`<script type="module"`>) require the use of the CORS protocol for cross-origin fetching.

- 针对手机网页的前端开发者调试面板 vConsole (框架无关)
  ```html
  <script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"></script>
  <script>
    // VConsole 默认会挂载到 `window.VConsole` 上
    var vConsole = new window.VConsole();
  </script>
  ```

### iframe 技术方案
用一句话概括 iframe 的作用就是在一个 web 应用中可以独立的运行另一个 web 应用，这个概念和微前端是类似的。采用 iframe 的优点是使用简单、隔离完美、页面上可以摆放多个 iframe 来组合多应用业务。但是缺点也非常明显：
- 路由状态丢失，刷新一下，iframe 的 url 状态就丢失了
- dom 割裂严重，弹窗只能在 iframe 内部展示，无法覆盖全局
- 通信困难，只能通过 postMessage 传递序列化的消息
- 白屏时间长

所以我们需要考虑：
1. iframe 内部的路由变化要体现在浏览器地址栏上
2. 刷新页面时要把当前状态的 url 传递给 iframe
3. 浏览器前进后退符合预期
4. 弹窗全局居中
5. CSP, sandbox 等安全属性
6. 腾讯的无界微前端框架 https://wujie-micro.github.io/doc/

### 桌面端 Electron 的本地构建过程
Electron是一个集成项目，允许开发者使用前端技术开发桌面端应用。其中 **Chromium 基础能力**可以让应用渲染 HTML 页面，执行页面的 JS 脚本，让应用可以在 Cookie 或 LocalStorage 中存取数据。Electron 还继承了 Chromium 的多进程架构，分一个主进程和多个渲染进程，主进程进行核心的调度启动，不同的 GUI 窗口独立渲染，做到进程间的隔离，进程与进程之间实现了 IPC 通信。**Node.js 基础能力**可以让开发者读写本地磁盘的文件，通过 socket 访问网络，创建和控制子进程等。**Electron 内置模块**可以支持创建操作系统的托盘图标，访问操作系统的剪切板，获取屏幕信息，发送系统通知，收集崩溃报告等。

> Node.js（内置 libuv）有自己的消息循环，要想把这个消息循环和应用程序的消息循环合并到一起并不容易。Electron 的做法是创建了一个单独的线程并使用系统调用来轮询 libuv 的 fd (文件描述符)，以获得 libuv 的消息，再把消息交给 GUI 主线程，由主线程的消息循环处理 libuv 的消息。

1. 调用 `greeting()` 方法，根据终端窗口的宽度 `process.stdout.columns` 显示不同样式的问候语。
2. 使用 `Promise.all()` 同时启动主进程和渲染进程的构建，两者分别有自己的 webpack 配置文件 `webpack.main.config` 和 `webpack.renderer.config`
3. 对于渲染进程，使用类似 web 端的 webpack 配置，设置入口文件、产出位置、需要的 loaders 和 plugins，并根据是否为 production 环境补充引入一些 plugin，在 npm 脚本打包的时候可以通过 `cross-env BUILD_ENV=abc` 设置一些环境变量。创建一个 WebpackDevServer，传入 webpack 配置，设置代理，监听某一端口，其实这就是启动一个本地服务，使用浏览器也可以访问构建后的页面，这里只是用 electron 的壳子把它加载进来。对于主进程，也使用了 webpack，设置入口文件用来打包产出。
4. 利用 webpack 编译的 hooks 在构建完成后会打印日志，`logStats()` 函数接收进程名 (Main or Renderer) 和具体输出的内容。
5. 在主进程和渲染进程都构建完成后，即主进程有一个打包后的 `main.js` 且渲染进程本地服务可以访问，这个时候启动 electron，即通常项目的 npm 脚本会执行 `electron .`，这里是通过 Node API，使用 `child_process.spawn()` 的方式启动 electron 并传入需要的参数，然后对 electron 进程的 stdout 和 stderr 监听，打印对应的日志。

#### 桌面端状态持久化存储
Electron doesn't have a built-in way to persist user preferences and other data. [electron-store](https://github.com/sindresorhus/electron-store) handles that for you, so you can focus on building your app. The data is saved in a JSON file in `app.getPath('userData')`.
- `appData`, which by default points to `~/Library/Application Support` on macOS.
- `userData` (storing your app's configuration files), which by default is the appData directory appended with your app's name.

Advantages over `localStorage`:
- `localStorage` only works in the browser process.
- `localStorage` is not very fault tolerant, so if your app encounters an error and quits unexpectedly, you could lose the data.
- `localStorage` only supports persisting strings. This module supports any JSON supported type.
- The API of this module is much nicer. You can set and get nested properties. You can set default initial config.

[vuex-electron](https://github.com/vue-electron/vuex-electron) uses `electron-store` to share your Vuex Store between all processes (including main).

#### Electron 相关记录
1. 如果安装 Electron 遇到问题，可以直接在 https://npmmirror.com/mirrors/electron/ 下载需要的版本，然后保存到本地缓存中 `~/Library/Caches/electron`
2. In the case of an electron app, the `electron` package is bundled as part of the built output. There is no need for your user to get `electron` from npm to use your built app. Therefore it matches well the definition of a `devDependency`. *(When you publish your package, if the consumer project needs other packages to use yours, then these must be listed as `dependencies`.)* For example, VS Code properly lists `electron` as a devDependency only: https://github.com/microsoft/vscode/blob/main/package.json
3. In case you are using an unsupported browser, or if you have other specific needs (for example your application is in Electron), you can use the standalone [Vue devtools](https://devtools.vuejs.org/guide/installation.html#standalone)
4. Blank screen on builds, but works fine on serve. This issue is likely caused when Vue Router is operating in `history` mode. In Electron, it only works in `hash` mode.
  > - 本地开发时是 http 服务，当访问某个地址的时候，其实真实目录下是没有这个文件的，本地服务可以帮助重定向到 `/index.html` 这是一定存在的入口文件，相当于走前端路由。一但打包之后，页面就是静态文件存放在目录中了，Electron 是找不到类似 `/index/page/1/2` 这样的目录的，所以需要使用 `/index.html#page/1/2` 这样的 hash 模式。同样，如果是 Web 项目使用了 history 模式打包，如果不在 nginx 中将全部 url 指向 `./index.html` 的话，也会出现 404 的错误，也就是需要把路由移交给前端去控制。
  > - hash mode 是默认模式，原理是使用 `location.hash` 和 `onhashchange` 事件，利用 `#` 后面的内容不会被发送到服务端实现单页应用。history mode 要手动设置 `mode: 'history'`, 是基于 History API 来实现的，这也是浏览器本身的功能，地址不会被请求到服务端。
5. 关于 Icon 图标，Windows（.ico 文件）和 Mac（.icns 文件）的都是复合格式，包含了多种尺寸和颜色模式，Linux 就是多张 png。注意不要把 png 直接改成 ico，可以使用在线工具转换。如果 Windows 窗口或任务栏图标未更换成功，可能是 ico 文件中缺少小尺寸图标，如缺少 16x16 或 32x32 的图标。
6. 可以通过命令行启动程序，查看打包后的主进程日志，Mac 进入到 `/Applications/Demo.app/Contents/MacOS/` 路径，执行 `./Demo` 启动应用层序。Windows 上打开 Powershell 进入到程序的安装目录，执行 `.\Demo.exe`，如果文件名中有空格，需要用双引号把文件名引起来。
7. 在 Electron 打包后，`__dirname` 在渲染进程中指向的是 app.asar 内部的虚拟路径。渲染进程无法直接访问物理资源路径（如 macOS 的 `xx.app/Contents/Resources/`），但可以在主进程通过 `process.resourcesPath` 获取该路径，以 IPC 的方式传递给渲染进程。
8. Electron 参考项目:
   - https://github.com/liou666/polyglot
   - https://github.com/replit/desktop

#### 展厅项目架构
打包遥控器页面 + 一台 server 端主机 + 一台 client 端主机
```
"winserver": "npm run build:web && cross-env PLATFORM_ENV=server npm run pack:windows",
"winclient": "cross-env PLATFORM_ENV=client npm run pack:windows",
```

**遥控器** 就是常规的页面，一个独立的 SPA 使用 webpack 构建产出放在 `dist/web` 目录下 (打包后在 `path.join(process.resourcesPath, 'app.asar.unpacked', 'web')`)。它要建立 ws 连接，角色是 REMOTE：
- 接收 hello 指令，把 client 5-8 屏加进屏幕列表中
- 接收 guest 指令，获取到嘉宾数据，可以显示主嘉宾
- 接收 scene 指令，激活屏变化，更新当前屏的指令集
- 发送 ws 消息，包括 开启、重启、关闭、选择屏幕、选择指令

**server 端主机**启动一个 ws 服务 (`new WebSocketServer({ port })`)，接收遥控器和 client 端发送过来的消息，如果是 client 端消息，需要转发给遥控器。如果是遥控器通知开启、关闭等，需要通过 `emitter.emit` 传递处理，并且转发给另一台主机 client 端。上下文 context 中保存着当前激活的屏幕和之前激活的屏幕序号。此外，它还启动了一个 express 服务，作为遥控器的 web 服务端，处理页面展示和嘉宾图片上传。

```js
wss.clients.forEach((client) => {
  if (client.role === RemoteClientRoleMap.CLIENT) {
    // ...
    client.send(msg);
  }
})
```

**client 端主机**建立 ws 连接 (`new WebSocket(wssURL)`)，角色是 CLIENT，接收启动、重启、关闭、激活屏幕、指令控制等消息，都会通过 `emitter.emit` 发送给 `ipc-exhibition-hall` 这个 service，它会在主进程的入口文件中被注册上。

**主进程入口**
```js
// 根据安装包配置参数 确定是否是server端
// isServer = process.env.PLATFORM_ENV === 'server';
if (isServer) {
  remoteWSServer.start();
  // 方便发送消息
  global.rain.remoteWSServer = remoteWSServer;
} else {
  global.rain.remoteWSClinet = remoteWSClinet;

  setTimeout(()=>{
    remoteWSClinet.startConnect();
  }, 1000)
}
```

**通信服务 ipc-exhibition-hall 文件**
- 接收开启、重启、关闭等 emitter 的事件，使用 electron 内部的 `app.relaunch`，窗体展示或关闭等方法。
- 接收遥控器激活屏幕、操作指令等，给指定窗体发送 IPC 消息。（给当前屏发送激活消息、给上一屏发送取消激活消息）
- 处理跨屏幕的 IPC 消息，比如学生作答反馈给老师、语音识别结果发送给学生屏幕展示。
- 加载每个屏幕对应的窗体，窗体的 x 坐标由 `width * index` 计算得到，`index` 根据是第几个屏幕配置。

```js
ipcMain.on('teaching-screen-ready', async (event, data) => {
  let index = 1;

  if (config && config.DisplaysEnable) {
    displaysEnable = config.DisplaysEnable;
  }

  if (displaysEnable[DisplaySerialNumber.SIXTH_DISPLAY]) {
    studentWin.show({ index });
    index += 1;
  }
});

// active, launch, restart, close, ExecRemoteCommand...
emitter.on('xxx', (data) => {
  // ...
  if (isServer) {
    exhibitionHallWinMap[activeIndex]?.send('message-from-process', data);
  } else {
    exhibitionHallWinMap[activeIndex]?.send('message-from-process', data);
  }
})
```
