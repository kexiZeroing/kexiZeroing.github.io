---
layout: "../layouts/BlogPost.astro"
title: "Notes on work projects (in Chinese)"
slug: work-project-notes-chinese
description: ""
added: "Oct 19 2021"
tags: [web]
updatedDate: "July 15 2023"
---

### 项目是怎么跑起来的

- 项目里面有很多子项目（`pages/*`），借助 webpack 多⼊⼝配置，打包成多个不同的子项目产出，总体结构借鉴 http://vuejs-templates.github.io/webpack
- 在 webpack 配置的 entry 里可以看到这些子项目入口（列举出所有的入口 js 文件，或者通过遍历 `src/pages` 得到所有入口），entry 的 base 路径可以由 context 字段指定。
- 对于每一个 page，都有对应的 `HtmlWebpackPlugin` 指定它的模板，并注入它需要的 chunks （对应每一个 entry 打包出的 js），本地直接通过 `localhost/xx.html` 访问，线上通过配置 nginx 路由映射访问 `try_files $uri /static/xx.html`
- 指定 `chunks` 是因为项目是多 entry 会生成多个编译后的 js 文件，chunks 决定使用哪些 js 文件，如果没有指定默认会全部引用。`inject` 值为 true，表明 chunks js 会被注入到 html 文件的 body 底部（默认是在 head 中以 script defer 标签的形式引入）。对于 css, 使用 `mini-css-extract-plugin` 从 bundle 中分离出单独的 css 文件并在 head 中以 link 标签引入。*（extract-text-webpack-plugin 是老版本 webpack 用来提取 css 文件的插件，从 webpack v4 被 mini-css-extract-plugin 替代）*
- 每一个 page 里的 js 文件（入口文件）会创建该子项目的 Vue 实例，指定对应的 component, router, store, 同时会把 `jQuery`, `request`, `API`, `i18n` 这些对象挂载在 window 对象上，子组件中不需要单独引用。
- 每一个 page 有对应的 `router` 文件，这是子项目的路由，而且每个路由加载的 component 都是异步获取，在访问该路由时按需加载。（注意 Vue Router 3 和 Vue 2 是配套的，Vue Router 4 和 Vue 3 是配套的）
- webpack 打包时（`dist/`）会 emit 出所有 `HtmlWebpackPlugin` 生成的 html 文件（这也是浏览器访问的入口），相对每个 entry 打包出的 js 文件 `js/[name].[chunkhash].js`（对应 output.filename），所有异步加载的组件 js `js/[id].[chunkhash].js`（对应 output.chunkFilename）。这些 chunk 基本来自 vue-router 配置的路由 `component: resolve => require(['@/components/foo'], resolve)`，这样懒加载的组件会生成一个 js 文件。
- `copy-webpack-plugin` 用来把那些已经在项目目录中的文件（比如 `public/` 或 `static/`）拷贝到打包后的产出中，这些文件不需要 build，不需要 webpack 的处理。另外可以使用 `ignore: ["**/file.*", "**/ignored-directory/**"]` 这样的语法忽略一些文件不进行拷贝。
- 图片、音乐、字体等资源的打包处理使用 `url-loader` 结合 `limit` 的设置，如果资源比较大会默认使用 `file-loader` 生成 `img/[name].[hash:7].[ext]` 这样的文件；如果资源小，会自动转成 base64。*（DEPREACTED for v5: please consider migrating to asset modules）*
- `performance` 属性用来设置当打包资源和入口文件超过一定的大小给出的提示，可以分别设置它们的上限和哪些文件被检查。
- 对于代码压缩，使用 `terser-webpack-plugin` 来压缩 JS，webpack 5 自带，但如果需要自定义配置，那么仍需要安装该插件，在 webpack 配置文件里设置 `optimization` 来引用这个插件。`HtmlWebpackPlugin` 里设置 `minify` 可以压缩 HTML，production 模式下是默认是 true（会使用 `html-minifier-terser` 插件去掉空格、注释等），自己传入一个 minify 对象，可以定制化[压缩设置](https://github.com/terser/html-minifier-terser#options-quick-reference)。
- 对于 js 的压缩使用了 `uglifyjs-webpack-plugin`，里面传入 `compress` 定制化[压缩设置](https://github.com/mishoo/UglifyJS#compress-options)。比如有的项目没有 console 输出，可能就是因为这里设置了 `drop_console`。
- 使用 `friendly-errors-webpack-plugin` 简化命令行的输出，可以只显示构建成功、警告、错误的提示，从而优化命令⾏的构建日志。
- webpack 设置请求代理 proxy，默认情况下假设前端是 `localhost:3000`，后端是 `localhost:8082`，那么后端通过 `request.getHeader("Host")` 获取的依旧是 `localhost:3000`。如果设置了 `changeOrigin: true`，那么后端才会看到的是 `localhost:8082`, 代理服务器会根据请求的 target 地址修改 Host（这个在浏览器里看请求头是看不到改变的）。如果某个接口 404，一般就是这个路径没有配置代理。

### Vue 项目
Vue npm 包有不同的 Vue.js 构建版本，可以在 `node_modules/vue/dist` 中看到它们，大致包括完整版、编译器（编译template）、运行时版本、UMD 版本（通过 `<script>` 标签直接用在浏览器中）、CommonJS 版本（用于很老的打包工具）、ES Module 版本（有两个，分别用于现代打包工具和浏览器 `<script type="module">` 引入）。总的来说，Runtime + Compiler 版本是包含编译代码的，可以把编译过程放在运行时做，如果需要在客户端编译模板 (比如传入一个字符串给 template 选项)，就需要加上编译器的完整版。Runtime 版本不包含编译代码，需要借助 webpack 的 `vue-loader` 事先把 `*.vue` 文件内的模板编译成 `render` 函数，在最终打好的包里实际上是不需要编译器的，只用运行时版本即可。

```js
// 需要编译器
new Vue({
  template: '<div>{{ hi }}</div>'
})

// 不需要编译器
new Vue({
  render (h) {
    return h('div', this.hi)
  }
})
```

```js
// https://github.com/logue/vite-vue2-ts-starter/blob/master/src/router.ts
{
  path: '/about',
  name: 'About',
  // route level code-splitting
  // this generates a separate chunk (About.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import('@/views/AboutView.vue'),
}
```

Vue 3 在 2022 年 2 月代替 Vue 2 成为 Vue 的默认版本，在 [npm 版本页面](https://www.npmjs.com/package/vue?activeTab=versions) 可以看到当前已使用 3.2.x 作为默认 latest 版本。如果还要用 Vue 2 ，需要手动指定 `legacy` 版本才能安装到 Vue 2。更多关于 Vue 的发布更新可以看 https://blog.vuejs.org

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) 是 Vite 官方推荐的一个脚手架工具，可以创建基于 Vite 的不同技术栈基础模板。`npm create vite` 可创建一个基于 Vite 的基础空项目。
- [create-vue](https://github.com/vuejs/create-vue) 是 Vue 官方推出的一个脚手架，可以创建基于 Vite 的 Vue 基础模板。`npm init vue@3` 然后根据命令行的提示操作。
- [create-preset](https://github.com/awesome-starter/create-preset) 是 Awesome Starter 的 CLI 脚手架，提供快速创建预设项目的能力。`npm create preset` 选择 vue 技术栈进入，选择 vue3-ts-vite 创建一个基于 Vite + Vue 3 + TypeScript 的项目启动模板。
- 如果不习惯 Vite ，依然可以使用 [Vue CLI](https://cli.vuejs.org) 作为开发脚手架，它使用的构建工具还是基于 Webpack。使用 create 命令 `vue create hello-vue3` 根据提示创建项目。*(Vue CLI is in Maintenance Mode. For new projects, it is now recommended to use create-vue to scaffold Vite-based projects.)*
- [Volar](https://blog.vuejs.org/posts/volar-1.0.html) 是 Vue 官方推荐的 VSCode 扩展 *(the official IDE/TS tooling support for Vue)*，用以代替 Vue 2 时代的 Vetur 插件。

```js
// Check the version of vue.js at runtime
import { version } from 'vue'
console.log(version)
```

### 一些 webpack 的配置
- Webpack 5 Crash Course: https://www.youtube.com/watch?v=IZGNcSuwBZs
- Webpack 5 boilerplate: https://github.com/taniarascia/webpack-boilerplate
- Create App: https://createapp.dev/webpack
- 玩转 webpack: https://github.com/cpselvis/geektime-webpack-course

#### filename and chunkFilename
- `filename` 是对应于 entry 里面的输入文件，经过打包后输出文件的名称。`chunkFilename` 指未被列在 entry 中，却又需要被打包出来的 chunk 文件的名称（non-initial chunk files），一般是要懒加载的代码。
- `output.filename` 的输出文件名是 `js/[name].[chunkhash].js`，`[name]` 根据 entry 的配置推断为 index，所以输出为 `index.[chunkhash].js`。`output.chunkFilename` 默认使用 `[id].js`, 会把 `[name]` 替换为 chunk 文件的 id 号。
- By prepending `js/` to the filename in `output.filename`, webpack will write bundled files to a js sub-directory in the `output.path`. This allows you to organize files of a particular type in appropriately named sub-directories.
- `chunkFileName` 不能灵活自定义，可以通过 `/* webpackChunkName: "foo" */` 这样的 [Magic Comments](https://webpack.js.org/api/module-methods/#magic-comments)，给 import 语句添加注释来命名 chunk。
- `chunkhash` 根据不同的入口文件构建对应的 chunk，生成对应的哈希值，来源于同一个 chunk，则 hash 值就一样。

> 生成 chunks
> 1. webpack 先将 entry 中对应的 module 都生成一个新的 chunk
> 2. 遍历 module 的依赖列表，将依赖的 module 也加入到 chunk 中
> 3. 如果一个依赖 module 是动态引入的模块，那么就会根据这个 module 创建一个 新的 chunk，继续遍历依赖
> 4. 重复上面的过程，直至得到所有的 chunks

#### path and publicPath
- `output.path` represents the absolute path for webpack file output in the file system. In other words, `path` is the physical location on disk where webpack will write the bundled files.
- `output.publicPath` represents the path from which bundled files should be accessed by the browser. You can load assets from a custom directory (`/assets/`) or a CDN (`https://cdn.example.com/assets/`). The value of the option is prefixed to every URL created by the runtime or loaders.

#### resolve
- extensions 数组，在 import 不带文件后缀时，webpack 会自动带上后缀去尝试访问文件是否存在，默认值 `['.js', '.json', '.wasm']`
- mainFiles 设置解析目录时要使用的文件名，默认值 `['index']`
- alias 配置别名，把导入路径映射成一个新的导入路径，比如 `"@": path.join(__dirname, 'src')`
- modules 数组，tell webpack what directories should be searched when resolving modules, 默认值 `['node_modules']`，即从 node_modules 目录下寻找。

#### css-loader and style-loader
- `css-loader` takes a CSS file and returns the CSS with `@import` and `url(...)` resolved. It doesn't actually do anything with the returned CSS.
- `style-loader` takes those styles and creates a `<style>` tag in the page's `<head>` element containing those styles.
- We often chain the `sass-loader` with the `css-loader` and the `style-loader` to immediately apply all styles to the DOM or the `mini-css-extract-plugin` to extract it into a separate file.

#### load images
Webpack goes through all the `import` and `require` files in your project, and for all those files which have a `.png|.jpg|.gif` extension, it uses as an input to the webpack `file-loader`. For each of these files, the file loader emits the file in the output directory and resolves the correct URL to be referenced. Note that this config only works for webpack 4, and Webpack 5 has deprecated the `file-loader`. If you are using webpack 5 you should change `file-loader` to `asset/resource`.

By default, `file-loader` renames each file it process to a filename with random characters. Then it puts the file in the root of the output folder. We can change both the file name of the processed files and the output folder. We do that in an `options` section.
```js
module: {
  rules: [
    {
      test: /\.png$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]', // keeps the original file names
        outputPath: 'images'  // outputs all processed files in a subfolder called images
      }
    }
  ]
}
```

Webpack 4 also has the concept `url-loader`. It first base64 encodes the file and then inlines it. It will become part of the bundle. That means it will not output a separate file like `file-loader` does. If you are using webpack 5, then `url-loader` is deprecated and instead, you should use `asset/inline`.

> Loaders are transformations that are applied to the source code of a module. When you provide a list of loaders, they are applied from right to left, like `use: ['third-loader', 'second-loader', 'first-loader']`. This makes more sense once you look at a loader as a function that passes its result to the next loader in the chain `third(second(first(source)))`.

#### webpack in development
- `webpack-dev-server` doesn't write any output files after compiling. Instead, it keeps bundle files in memory and serves them as if they were real files mounted at the server's root path. `webpack-dev-middleware` is an express-style development middleware that will emit files processed by webpack to a server. This is used in `webpack-dev-server` internally.
- Want to access `webpack-dev-server` from the mobile in local network: run `webpack-dev-server` with `--host 0.0.0.0`, which lets the server listen for requests from the network (all IP addresses on the local machine), not just localhost. But Chrome won't access `http://0.0.0.0:8089` (Safari can open). It's not the IP, it just means it is listening on all the network interfaces, so you can use any IP the host has.

#### HMR (Hot Module Replacement) 
With `hot` flag, it sets `webpack-dev-server` in hot mode. If we don’t use this it does a full refresh of the page instead of hot module replacement. It also automatically adds the plugin `HotModuleReplacementPlugin`, which adds the “HMR runtime” into your bundle.

`webpack-dev-server` (WDS) also inserts some code in the bundle that we call “WDS client”, because it must tell the client when a file has changed and new code can be loaded. WDS server does this by opening a websocket connection to the WDS client on page load. When the WDS client receives the websocket messages, it tells the HMR runtime to download the new manifest of the new module and the actual code for that module that has changed. Read more at https://blog.jakoblind.no/webpack-hmr

#### webpack-bundle-analyzer
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

#### TypeScript and Webpack
Webpack is extensible with "loaders" that can be added to handle particular file formats.

1. Install `typescript` and [ts-loader](https://github.com/TypeStrong/ts-loader) as devDependencies.
2. The default behavior of `ts-loader` is to act as a drop-in replacement for the `tsc` command, so it respects the options in `tsconfig.json`.
3. If you want to further optimize the code produced by TSC, use `babel-loader` with `ts-loader`. We need to compile a `.ts` file using `ts-loader` first and then using `babel-loader`.
4. `ts-loader` does not write any file to disk. It compiles TypeScript files and passes the resulting JavaScript to webpack, which happens in memory.

But TypeScript still isn't happy. It doesn't know anything about Webpack, and obviously doesn't understand `.vue` files - they aren't actually Typescript modules. What should TypeScript do with something that isn’t a JS or TS module? Throwing an error! Could not find module.

So it will throw an error when you try to import `Foo.vue`. The solution is `shims-vue.d.ts` in `src` directory. The filename does not seem to be important, as long as it ends with `.d.ts`. TypeScript looks for `.d.ts` files in the same places it looks for your regular `.ts` files. It basically means, "every time you import a module with the name `*.vue`, then treat it as if it had these contents, and the type of `Foo` will be Vue.".

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

#### Bundling your library with Webpack
So far everything should be the same as bundling an application, and here comes the different part – we need to expose exports from the entry point through `output.library` option.

- As a library author, we want it to be compatible in different environments. `type: 'umd'` exposes your library under all the module definitions, allowing it to work with CommonJS, AMD, and as global variable.
- If your library uses dependencies like `lodash`, we'd prefer to treat it as a peer dependency. This can be done using the `externals` configuration, which means the library expects it to be available in the consumer's environment.
- Also add the path to your generated bundle as the package's `main` field in the `package.json`.

```js
output: {
  filename: "library-starter.js",
  path: path.resolve(__dirname, "dist"),
  library: {
    name: 'MyLibrary', // Specify a name for the library.
    type: 'umd',       // Configure how the library will be exposed.
    export: 'default', // Access without using `.default` 
  },
  globalObject: "this"  // To make UMD build available on both browsers and Node.js, 
},
```

### 本地 build 与上线 build
1. 公共组件库 C 需要先 build，再 `npm link` 映射到全局的 node_modules，然后被其他项目 `npm link C` 引用。(关于 `npm link` 的使用场景可以看看 https://github.com/atian25/blog/issues/17)
2. 项目 A 的上线脚本中会先进入组件库 C，执行 `npm build` 和 `npm link`，之后再进入项目 A 本身，执行 `npm link C`，`npm build` 等项目本身的构建。
3. 项目 C 会在本地构建（静态资源传七牛），远程仓库中包括 `server-static` 存放 build 后的静态文件，它的上线脚本里并不含构建过程，只是在拷贝仓库中的 `server-static` 目录。因为源文件中会有对组件库的引用 `import foo from 'C/dist/foo.js`，本地 build 时组件库已经被打包进去。

### 本地 build 脚本
1. 使用 [ora](https://www.npmjs.com/package/ora) 做 spinner，提示 building for production...
2. 使用 [rimraf](https://www.npmjs.com/package/rimraf) 删除打包路径下的资源 (`rimraf` command is an alternative to the Linux command `rm -rf`)
3. 调用 `webpack()` 传入配置 `webpack.prod.conf` 和一个回调函数，**webpack stats 对象** 作为回调函数的参数，可以通过它获取到 webpack 打包过程中的信息，使用 `process.stdout.write(stats.toString(...))` 输出到命令行中 (`console.log` in Node is just `process.stdout.write` with formatted output)
4. 使用 [chalk](https://www.npmjs.com/package/chalk) 在命令行中显示一些提示信息。
5. 补充：目前大多数工程都是通过脚手架来创建的，使用脚手架的时候最明显的就是与命令行的交互，[Inquirer.js](https://github.com/SBoudrias/Inquirer.js) 是一组常见的交互式命令行用户界面。[Commander.js](https://github.com/tj/commander.js) 作为 node.js 命令行解决方案，是开发 node cli 的必备技能。

### 后端模板
有些 url 请求是后端直出页面返回 html，通过类似 `render_to_response(template, data)` 的方法，将数据打到模板 html 中，模板里会引用 `xx/static/js` 路径下的 js 文件，这些 js 使用 require 框架，导入需要的其他 js 文件或 tpl 模板，再结合业务逻辑使用 underscore 的 template 方法（`_.template(xx)`）可以将 tpl 渲染为 html，然后被 jquery `.html()` 方法插入到 DOM 中。

- 请求 `/web?old=1` 后端会返回 html 扫码登录页面，这里面有一个 `/static/vue/login.js?_dt=xxxxx`，里面有登录和加载网页版首页的逻辑，这样就会展示出 h5 中的页面，其中的 iframe 可以嵌套任意 pc 或 h5 中的页面（只要有路由支持），这个 iframe 的链接自然也可以被单独访问。
- h5 发起的第一次页面请求是走服务器，后端返回一个模板 html，这里面有一个 app 元素是 Vue 挂载的地方，前端通过一个老的 vue router API `router.start(App, 'app')` 创建 vue 实例并进行挂载（https://github.com/vuejs/vue-router/blob/1.0/docs/en/api/start.md），这之后才会被前端路由接管。而且这个 html 只能在手机端访问（根据 ua），否则会跳到 web 端的逻辑。

```py
# urls.py
urlpatterns = [
  url(r'^v/index', foo.index),
  url(r'^web', foo.web),
]

# views.py
# def index(request):
return render_to_response('foo/vue_index.html', context)

# def web(request):
return render_to_response('foo/login.html', context)

# import scripts in above template html
<script>
var isInIframe = window.frames.length !== parent.frames.length;
var ua = window.navigator.userAgent;
      
if (!isInIframe && !ua.toLowerCase().match(/micromessenger|android|iphone/i)) {
  window.location.href = '/web/?next=' + window.location.pathname;
} 
</script>
<script src="https://cdn.example.com/assets/login.js"></script>
```

### 登录逻辑
- 二维码登录先使用 websocket 连接，message 中定义不同的 `op` 代表不同的操作，比如 requestlogin 会返回微信生成的二维码（包括 qrcode, ticket, expire_seconds 等）, 扫码成功返回类型是 loginsuccess，并附带 OpenID, UnionID, Name, UserID, Auth 等信息，前端拿到这些信息后可以请求后端登录的 http 接口，拿到 sessionid，并被种在 cookie 里。
- 账密登录，前端使用 [JSEncrypt](http://travistidwell.com/jsencrypt/) 给密码加密并请求后端登录接口，成功的话后端会把 sessionid 种在 cookie 里。

> 常规的扫码登录原理（涉及 PC 端、手机端、服务端）：
> 1. PC 端携带设备信息向服务端发起生成二维码的请求，生成的二维码中封装了 uuid 信息，并且跟 PC 设备信息关联起来，二维码有失效时间。PC 端轮询检查是否已经扫码登录。
> 2. 手机（已经登录过）进行扫码，将手机端登录的信息凭证（token）和二维码 uuid 发送给服务端，此时的手机一定是登录的，不存在没登录的情况。服务端生成一个一次性 token 返回给移动端，用作确认时候的凭证。
> 3. 移动端携带上一步的临时 token 确认登录，服务端校对完成后，会更新二维码状态，并且给 PC 端一个正式的 token ，后续 PC 端就是持有这个 token 访问服务端。

> 常规的密码存储：
> 
> 如果直接对密码进行散列后存储，那么黑客可以对一个已知密码进行散列，然后通过对比散列值可以知道使用特定密码的用户有哪些。密码加盐可以一定程度上解决这一问题，salt 值是由系统随机生成的，并且只有系统知道，即便两个用户使用了同一个密码，由于系统为它们生成的 salt 值不同，他们的散列值也是不同的。将 salt 值和用户密码连接到一起，对连接后的值进行散列，把这个散列值和它对应的 salt 值都要存到数据库中，用于登录时校验匹配。比如项目中可以使用 [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)，它会将 salt 和哈希后的密码拼到一起存到数据库。

### 微信网页授权
申请公众号/小程序的时候，都有一个 APPID 作为当前账号的标识，OpenID 就是用户在某一公众平台下的标识（用户微信号和公众平台的 APPID 两个数据加密得到的字符串）。如果开发者拥有多个应用，可以通过获取用户基本信息中的 UnionID 来区分用户的唯一性，因为同一用户，在同一微信开放平台下的不同应用，UnionID 应是相同的，代表同一个人，当然前提是各个公众平台需要先绑定到同一个开放平台。OpenID 同一用户同一应用唯一，UnionID 同一用户不同应用唯一，获取用户的 OpenID 是无需用户同意的，获取用户的基本信息则需要用户同意。

向用户发起授权申请，即打开如下页面：
https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect

1. `appid` 是公众号的唯一标识。
2. `redirect_uri` 替换为回调页面地址，用户授权完成后，微信会帮你重定向到该地址，并携带相应的参数如 `code`，回调页面所在域名必须与后台配置一致。
3. `scope` 根据业务需要选择 `snsapi_base` 或 `snsapi_userinfo`。其中 `snsapi_base` 为静默授权，不弹出授权页面，直接跳转，只能获取用户的 `openid`，而 `snsapi_userinfo` 会弹出授权页面，需要用户同意，但无需关注公众号，可在授权后获取用户的基本信息。
4. `state` 不是必须的，重定向后会带上 `state` 参数，开发者可以填写 a-zA-Z0-9 的参数值，最多 128 字节。
5. 如果用户同意授权，页面将跳转至 `redirect_uri/?code=CODE&state=STATE`，`code` 作为换取 `access_token` 的票据，每次用户授权带上的 `code` 不一样。
6. 获取 `code` 后，请求 https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code 获取 `access_token` 和 `openid` (未关注公众号时，用户访问公众号的网页，也会产生一个唯一的 openid)。
7. 如果网页授权作用域为 `snsapi_userinfo`，则此时可以请求 https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN 拉取用户信息。
8. 公众号的 `secret` 和获取到的 `access_token` 安全级别都非常高，必须只保存在服务器，不允许传给客户端。后续刷新 `access_token` 以及通过 `access_token` 获取用户信息等步骤，也必须从服务器发起。

> 微信公众平台接口测试帐号申请: https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login

某个公众号的关注页面地址为 https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI0NDA2OTc2Nw==#wechat_redirect 其中 biz 字符串是微信公众号标识，在浏览器打开该公众号下的任意一篇文章，查看网页源代码，搜索 `var biz` 这样的关键字即可得到。

### 唤起微信小程序
微信外网页通过小程序链接 URL Scheme，微信内通过微信开放标签，且微信内不会直接拉起小程序，需要手动点击按钮跳转。这是官方提供的一个例子 https://postpay-2g5hm2oxbbb721a4-1258211818.tcloudbaseapp.com/jump-mp.html 可以用手机浏览器查看效果，直接跳转小程序。

- 使用微信开放标签 `<wx-open-launch-weapp>`，提供要跳转小程序的原始 ID 和路径，标签内插入自定义的 html 元素。开放标签会被渲染成一个 iframe，所以外部的样式是不会生效的。另外在开放标签上模拟 click 事件也不生效，即不可以在微信内不通过点击直接跳转小程序。可以监听 `<wx-open-launch-weapp>` 元素的 `launch` 事件，用户点击跳转按钮并对确认弹窗进行操作后触发。
- 通过[服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-scheme/urlscheme.generate.html)或在小程序管理后台的「工具」入口可以获取打开小程序任意页面的 URL Scheme。适用于从短信、邮件、微信外网页等场景打开小程序。

> 微信小程序相关的仓库，比如 WeUI 组件库、微信小程序示例、computed / watch 扩展等: https://github.com/wechat-miniprogram

国产 APP 各自套壳 Chromium 内核版本，最大的问题就是更新不及时，而且大多被改造过。
- iOS 方面，根据 App Store 审核指南，上架 App Store 的应用不允许使用自己的浏览器内核。如果 app 会浏览网页，则必须使用相应的 WebKit 框架和 WebKit Javascript。
- Android 方面，不限制应用使用自己的浏览器内核。安卓微信之前的浏览器为基于 WebKit 的 X5 浏览器，后为了和小程序的浏览器内核同构，大概 2020-05 从 X5 迁移到 XWeb，内核版本主要为 Chromium 78 和 Chromium 86（[2023-06 更新](https://developers.weixin.qq.com/community/develop/doc/0002c2167840006af8df3c94256001)：当前安卓微信 XWeb 开发版基于 111 新内核，现网仍基于 107 内核）。

### HTTP 请求相关
首先明确一个认识，很多同学以为 GET 的请求数据在 URL 中，而 POST 不是，所以以为 POST 更安全。不是这样的，整个请求的 HTTP URL PATH 会全部封装在 HTTP 的协议头中。只要是 HTTPS，就是安全的。所谓的 POST 更安全，只能说明该同学并不理解 HTTP 协议。使用规范的方式，可以大大减少跨团队的沟能成本。最差的情况下，也是需要做到“读写分离”的，就是说，至少要有两个动词，GET 表示是读操作，POST 表示是写操作。

1. 使用 vue-resource
- [vue-resource](https://github.com/pagekit/vue-resource) 是一个轻量级的用于处理 HTTP 请求的插件，通过 `Vue.use` 使用自定义的插件。
- 全局对象使用 `Vue.http.get()`，在一个组件内使用 `this.$http.get()`
- 可以定义 inteceptor 在请求发送前和接收响应前做一些处理，比如设置业务相关的请求头、添加 CSRF token、请求加 loading 状态、query 参数加时间戳等。

  ```js
  Vue.http.interceptors.push((request, next) => {
    // 请求发送前的处理逻辑（比如判断传入的 request.no_loading 是否显示 loading）
    // if (request.method === 'GET') {...}
    // if (request.method === 'POST') {...}
    next((response) => {
      // 请求结果返回给 successCallback 或 errorCallback 之前，根据 `response.ok` 或 `response.status` 加一些处理逻辑 
      // ...
      return response
    })
  });
  ```

2. 自己对 axios 封装
- 通过 `axios.defaults.headers['xyz'] = 'abc'` 这样的方式添加需要的请求头
- 统一对 query 参数做处理，拼在 url 后面
- 加 csrf token，加业务需要的 header
- 根据不同的错误码做页面跳转

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

### API 版本和 URI 连字符
API 版本可以放在两个地方: 在 url 中指定 API 的版本，例如 https://example.com/api/v1，这样不同版本的协议解析可以放在不同的服务器上，不用考虑协议兼容性，开发方便，升级也不受影响。另一种是放在 HTTP header 中，url 显得干净，符合 RESTful 惯例，毕竟版本号不属于资源的属性。缺点是需要解析头部，判断返回。

URI 中尽量使用连字符 `-` 代替下划线 `_` 的使用，连字符用来分割 URI 中出现的单词，提高 URI 的可读性。下划线会和链接的样式冲突重叠。URI 是对大小写敏感的，为了避免歧义，我们尽量用小写字符。但主机名（Host）和协议名（Scheme）对大小写是不敏感的。

### 静态资源文件上传七牛
使用 [Qiniu](https://www.npmjs.com/package/qiniu) 作为 webpack 打包过程中的一个插件负责静态文件上传，可以使用 [qiniu-upload-plugin](https://github.com/mengsixing/qiniu-upload-plugin)，将 webpack 打包出来的 assets 上传到七牛云。

```js
// build 脚本使用自定义的 QiniuPlugin
const publicPath = 'https://x.y.z/';
const assetsSubDirectory = 'a/b/';
webpackConfig.output.publicPath = publicPath + assetsSubDirectory;

webpackConfig.plugins.push(
  new QiniuPlugin({
    publicPath: publicPath,
    assetsSubDirectory: assetsSubDirectory,
    accessKey: '...',
    secretKey: '...',
    bucket: 'xxx',
    zone: 'Zone_z1',
  })
)
```

### 前端监控体系搭建
https://github.com/miracle90/monitor  
https://github.com/LianjiaTech/fee

### 开发自己的调试工具
https://kentcdodds.com/blog/make-your-own-dev-tools  
https://app-dev-tools.netlify.app

### 日常开发 Tips and Tricks
- The `input` event is fired every time the value of the element changes. This is unlike the `change` event, which only fires when the value is committed, such as by pressing the enter key or selecting a value from a list of options.

- The order in which the events are fired: `mousedown` --> `mouseup` --> `click`. When you add a `blur` event, it is actually fired before the `mouseup` event and after the `mousedown` event of the button. Refer to https://codepen.io/mudassir0909/full/qBjvzL

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

### 桌面端 Electron 的本地构建过程
Electron是一个集成项目，允许开发者使用前端技术开发桌面端应用。其中 **Chromium 基础能力**可以让应用渲染 HTML 页面，执行页面的 JS 脚本，让应用可以在 Cookie 或 LocalStorage 中存取数据。Electron 还继承了 Chromium 的多进程架构，分一个主进程和多个渲染进程，主进程进行核心的调度启动，不同的 GUI 窗口独立渲染，做到进程间的隔离，进程与进程之间实现了 IPC 通信。**Node.js 基础能力**可以让开发者读写本地磁盘的文件，通过 socket 访问网络，创建和控制子进程等。**Electron 内置模块**可以支持创建操作系统的托盘图标，访问操作系统的剪切板，获取屏幕信息，发送系统通知，收集崩溃报告等。

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
4. Vite + Electron 项目参考：https://github.com/liou666/polyglot
