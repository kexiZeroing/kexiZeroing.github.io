---
layout: "../layouts/BlogPost.astro"
title: "Notes on work projects (in Chinese)"
slug: work-project-notes-chinese
description: ""
added: "Oct 19 2021"
---

### 项目是怎么跑起来的

- 项目里面有很多子项目（`pages/*`），借助 webpack 打包成多个不同的子项目产出，总体结构借鉴 http://vuejs-templates.github.io/webpack
- 在 webpack 配置的 entry 里可以看到这些子项目入口（列举出所有的入口 js 文件，或者通过遍历 `src/pages` 得到所有入口），entry 的 base 路径可以由 context 字段指定。
- 对于每一个 page，都有对应的 `HtmlWebpackPlugin` 指定它的模板，并注入它需要的 chunks （对应每一个 entry 打包出的 js），本地直接通过 `localhost/xx.html` 访问，线上通过配置 nginx 路由映射访问 `try_files $uri /static/xx.html`
- 指定 `chunks` 是因为项目是多 entry 会生成多个编译后的 js 文件，chunks 决定使用哪些 js 文件，如果没有指定默认会全部引用。`inject` 值为 true，表明 chunks js 会被注入到 html 文件的 body 底部（默认是在 head 中以 script defer 标签的形式引入）。对于 css, 使用 `mini-css-extract-plugin` 插件产出的 css 文件会在 head 中以 link 标签引入。
- 每一个 page 里的 js 文件（入口文件）会创建该子项目的 Vue 实例，指定对应的 component, router, store, 同时会把 `jQuery`, `request`, `API`, `i18n` 这些对象挂载在 window 对象上，子组件中不需要单独引用。
- 每一个 page 有对应的 `router` 文件，这是子项目的路由，而且每个路由加载的 component 都是异步获取，在访问该路由时按需加载。
- webpack 打包时（`dist/`）会 emit 出所有 `HtmlWebpackPlugin` 生成的 html 文件（这也是浏览器访问的入口），相对每个 entry 打包出的 js 文件（filename, `js/[name].[chunkhash].js`），所有异步加载的组件 js（chunkFilename, `js/[id].[chunkhash].js'`）
- 图片、音乐、字体等资源的打包处理使用 `url-loader` 结合 `limit` 的设置，生成 `img/[name].[hash:7].[ext]` 这样的文件。
- `performance` 属性用来设置当打包资源和入口文件超过一定的大小给出的提示，可以分别设置它们的上限和哪些文件被检查。
- production 情况下，`minify` 选项是默认存在的（会使用 `html-minifier-terser` 插件去掉空格、注释等），如果想定制化选项，可以自己传 minify 对象，它不会和默认选项合并在一起。
- webpack 设置请求代理 proxy，默认情况下假设前端是 `localhost:3000`，后端是 `localhost:8082`，那么后端通过 `request.getHeader("Host")` 获取的依旧是 `localhost:3000`。如果设置了 `changeOrigin: true`，那么后端才会看到的是 `localhost:8082`, 代理服务器会根据请求的 target 地址修改 Host（这个在浏览器里看请求头是看不到改变的）。如果某个接口 404，一般就是这个路径没有配置代理。

### 一些 webpack 配置
- Webpack 5 Crash Course: https://www.youtube.com/watch?v=IZGNcSuwBZs
- Webpack 5 boilerplate: https://github.com/taniarascia/webpack-boilerplate

### 本地 build 与上线 build
1. 公共组件库 C 需要先 build，再 `npm link` 映射到全局的 node_modules，然后被其他项目 `npm link C` 引用。
2. 项目 A 的上线脚本中会先进入组件库 C，执行 `npm build` 和 `npm link`，之后再进入项目 A 本身，执行 `npm link C`，`npm build` 等项目本身的构建。
3. 项目 C 会在本地构建（静态资源传七牛），远程仓库中包括 `server-static` 存放 build 后的静态文件，它的上线脚本里并不含构建过程，只是在拷贝仓库中的 `server-static` 目录。因为源文件中会有对组件库的引用 `import foo from 'C/dist/foo.js`，本地 build 时组件库已经被打包进去。

### 本地 build 脚本
1. 使用 [ora](https://www.npmjs.com/package/ora) 做 spinner，提示 building for production...
2. 使用 [rimraf](https://www.npmjs.com/package/rimraf) 删除打包路径下的资源 (`rimraf` command is an alternative to the Linux command `rm -rf`)
3. 调用 `webpack()` 传入配置 `webpack.prod.conf` 和一个回调函数，**webpack stats 对象** 作为回调函数的参数，可以通过它获取到 webpack 打包过程中的信息，使用 `process.stdout.write(stats.toString(...))` 输出到命令行中 (`console.log` in Node is just `process.stdout.write` with formatted output)
4. 使用 [chalk](https://www.npmjs.com/package/chalk) 在命令行中显示一些提示信息。
5. 补充：目前大多数工程都是通过脚手架来创建的，使用脚手架的时候最明显的就是与命令行的交互，[Inquirer.js](https://github.com/SBoudrias/Inquirer.js) 是一组常见的交互式命令行用户界面。

### 后端模板
有些 url 请求是后端直出页面返回 html，通过类似 `render_to_response(template, data)` 的方法，将数据打到模板 html 中，模板里会引用 `xx/static/js` 路径下的 js 文件，这些 js 使用 require 框架，导入需要的其他 js 文件或 tpl 模板，再结合业务逻辑使用 underscore 的 template 方法（`_.template(xx)`）可以将 tpl 渲染为 html，然后被 jquery `.html()` 方法插入到 DOM 中。

- 请求 `/web?old=1` 后端会返回 html 扫码登录页面，这里面有一个 `/static/vue/login.js?_dt=xxxxx`，里面有登录和加载网页版首页的逻辑，这样就会展示出 h5 中的页面，其中的 iframe 可以嵌套任意 pc 或 h5 中的页面（只要有路由支持），这个 iframe 的链接自然也可以被单独访问。
- h5 发起的第一次页面请求是走服务器，后端返回一个模板 html，这里面有一个 app 元素是 Vue 挂载的地方，前端通过一个老的 vue router API `router.start(App, 'app')` 创建 vue 实例并进行挂载（https://github.com/vuejs/vue-router/blob/1.0/docs/en/api/start.md），这之后才会被前端路由接管。而且这个 html 只能在手机端访问（根据 ua），否则会跳到 web 端的逻辑。

```py
# urls.py
from xxx import v_views as foo

# django syntax
urlpatterns = [
  url(r'^v/index', foo.index),
  url(r'^web', foo.web),
]

# view.py
response = render_to_response('bar/baz.html', context)

# Import FE scripts in templates/bar/baz.html
# <script src="/static/qux.js?_dt={{timestamp}}"></script>
```

```js
// qux.js
var isInIframe = window.frames.length !== parent.frames.length;
var ua = window.navigator.userAgent;
      
if (!isInIframe && !ua.toLowerCase().match(/micromessenger|android|iphone/i)) {
  window.location.href = '/web/?next=' + window.location.pathname;
} 
```

### 登录逻辑
- 二维码登录使用 websocket 连接，message 中定义不同的 `op` 代表不同的操作，比如 requestlogin 会返回微信生成的二维码(ticket), 扫码成功返回类型是 loginsuccess，并附带 OpenID, UnionID, Name, UserID, Auth 等信息，前端拿到这些信息可以请求后端登录接口，拿到 sessionid，并被种在 cookie 里。
- 账密登录，前端使用 [JSEncrypt](http://travistidwell.com/jsencrypt/) 给密码加密并请求后端登录接口，成功的话后端会把 sessionid 种在 cookie 里。

> 常规的扫码登录原理（涉及 PC 端、手机端、服务端）：
> 1. PC 端携带设备信息向服务端发起生成二维码的请求，生成的二维码中封装了 uuid 信息，并且跟 PC 设备信息关联起来，二维码有失效时间。PC 端轮询检查是否已经扫码登录。
> 2. 手机（已经登录过）进行扫码，将手机端登录的信息凭证（token）和二维码 uuid 发送给服务端，此时的手机一定是登录的，不存在没登录的情况。服务端生成一个一次性 token 返回给移动端，用作确认时候的凭证。
> 3. 移动端携带上一步的临时 token 确认登录，服务端校对完成后，会更新二维码状态，并且给 PC 端一个正式的 token ，后续 PC 端就是持有这个 token 访问服务端。

> 常规的密码存储：
> 
> 如果直接对密码进行散列后存储，那么黑客可以对一个已知密码进行散列，然后通过对比散列值可以知道使用特定密码的用户有哪些。密码加盐可以一定程度上解决这一问题，salt 值是由系统随机生成的，并且只有系统知道，即便两个用户使用了同一个密码，由于系统为它们生成的 salt 值不同，他们的散列值也是不同的。将 salt 值和用户密码连接到一起，对连接后的值进行散列，把这个散列值和它对应的 salt 值都要存到数据库中，用于登录时校验匹配。

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

### 唤起微信小程序
微信外网页通过小程序链接 URL Scheme，微信内通过微信开放标签，且微信内不会直接拉起小程序，需要手动点击按钮跳转。这是官方提供的一个例子 https://postpay-2g5hm2oxbbb721a4-1258211818.tcloudbaseapp.com/jump-mp.html 可以用手机浏览器查看效果，直接跳转小程序。

- 使用微信开放标签 `<wx-open-launch-weapp>`，提供要跳转小程序的原始 ID 和路径，标签内插入自定义的 html 元素。开放标签会被渲染成一个 iframe，所以外部的样式是不会生效的。另外在开放标签上模拟 click 事件也不生效，即不可以在微信内不通过点击直接跳转小程序。可以监听 `<wx-open-launch-weapp>` 元素的 `launch` 事件，用户点击跳转按钮并对确认弹窗进行操作后触发。
- 通过[服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/url-scheme/urlscheme.generate.html)或在小程序管理后台的「工具」入口可以获取打开小程序任意页面的 URL Scheme。适用于从短信、邮件、微信外网页等场景打开小程序。

> 微信小程序相关的仓库，比如 WeUI 组件库、微信小程序示例、computed / watch 扩展等: https://github.com/wechat-miniprogram

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
- 统一对 query 参数做处理
- 加 csrf token，加业务 header
- 根据不同的错误码做页面跳转

  ```js
  export default {
    get(url, params) {
      // 统一加请求头，处理 queryString 等
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

### 桌面端 Electron 的本地构建过程
1. 调用 `greeting()` 方法，根据终端窗口的宽度 `process.stdout.columns` 显示不同样式的问候语。
2. 使用 `Promise.all()` 同时启动主进程和渲染进程的构建，两者分别有自己的 webpack 配置文件 `webpack.main.config` 和 `webpack.renderer.config`
3. 对于渲染进程，使用类似 web 端的 webpack 配置，设置入口文件、产出位置、需要的 loaders 和 plugins，并根据是否为 production 环境补充引入一些 plugin，在 npm 脚本打包的时候可以通过 `cross-env BUILD_ENV=abc` 设置一些环境变量。创建一个 WebpackDevServer，传入 webpack 配置，设置代理，监听某一端口，其实这就是启动一个本地服务，使用浏览器也可以访问构建后的页面，这里只是用 electron 的壳子把它加载进来。对于主进程，也使用了 webpack，设置入口文件用来打包产出。
4. 利用 webpack 编译的 hooks 在构建完成后会打印日志，`logStats()` 函数接收进程名 (Main or Renderer) 和具体输出的内容。
5. 在主进程和渲染进程都构建完成后，即主进程有一个打包后的 `main.js` 且渲染进程本地服务可以访问，这个时候启动 electron，即通常项目的 npm 脚本会执行 `electron .`，这里是通过 Node API，使用 `child_process.spawn()` 的方式启动 electron 并传入需要的参数，然后对 electron 进程的 stdout 和 stderr 监听，打印对应的日志。

### 桌面端状态持久化存储
Electron doesn't have a built-in way to persist user preferences and other data. [electron-store](https://github.com/sindresorhus/electron-store) handles that for you, so you can focus on building your app. The data is saved in a JSON file in `app.getPath('userData')`.
- `appData`, which by default points to `~/Library/Application Support` on macOS.
- `userData` (storing your app's configuration files), which by default is the appData directory appended with your app's name.

Advantages over `localStorage`:
- `localStorage` only works in the browser process.
- `localStorage` is not very fault tolerant, so if your app encounters an error and quits unexpectedly, you could lose the data.
- `localStorage` only supports persisting strings. This module supports any JSON supported type.
- The API of this module is much nicer. You can set and get nested properties. You can set default initial config.
