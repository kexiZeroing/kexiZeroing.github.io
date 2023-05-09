---
layout: "../layouts/BlogPost.astro"
title: "Start a Javascript stack project"
slug: start-js-stack-project
description: ""
added: "June 16 2022"
tags: [web]
updatedDate: "May 9 2023"
---

## Start a modern front-end project
Create `index.js` and `index.html` files within a folder. Assuming that you have node.js installed, go ahead and install `yarn` and run `yarn init` command on your project’s repository. Alternatively, you can use `npm`. After running `yarn init` or `npm init`, just follow the instructions on the CLI and you should end up with a file called `package.json`.

Then let’s bring a web application bundler. We want `parcel` in our project, so install it as a development dependency by running `yarn add parcel-bundler --dev` or `npm install parcel-bundler --save-dev`. Once parcel has been added to our project, we can simply run `parcel index.html` and parcel will serve the file on its built-in development server on port 1234. We can add a `start` script to our `package.json` and simply run `yarn start` or `npm start`.

Let’s move on and add Sass support to our project. To do so using parcel, we run `yarn add sass --dev`. We can create a file called `index.scss`. To make it works, we need to reference it. Go to the `index.js` file and import it using a relative path like `import './index.scss'`.

We need modern javascript and Babel help us with that. We run `yarn add @babel/core @babel/cli @babel/preset-env --dev` and create a `.babelrc` file on the root of the project referencing the preset we are using. Note that babel doesn't do anything out-of-the-box; It’s the Babel plugins that does the work. And from version 7 of Babel, they moved `babel-preset-env` into the main Babel repo, and changed the name from `babel-preset-env` to [@babel/preset-env](https://blog.jakoblind.no/babel-preset-env).

At last, we need a `parcel build index.js` as a `build` script in `package.json` file which will be used for production, and parcel will create a `dist` directory with all assets minified.

> Alternatively, start your app development process with the pre-built solutions: https://vercel.com/templates

### Release helper
- Interactive CLI that bumps version number (with `--commit` `--tag` `--push` by default): https://github.com/antfu/bumpp
- Generic CLI tool to automate versioning and package publishing related tasks: https://github.com/release-it/release-it
- Generate changelogs and release notes from a project's commit messages and metadata: https://github.com/conventional-changelog/conventional-changelog

### browserslist and postcss
The [browserslist](https://github.com/browserslist/browserslist) configuration (either in `package.json` or `.browserslistrc`) uses `caniuse` data (https://caniuse.com/usage-table) for queries to control the outputted JS/CSS so that the emitted code will be compatible with the browsers specified. It will be installed with webpack and used by many popular tools like autoprefixer, babel-preset-env. You can find these tools require `browserslist` in the `package-lock.json` file.

- There is a `defaults` query (`> 0.5%, last 2 versions, Firefox ESR, not dead`), which gives a reasonable configuration for most users.
- If you want to change the default set of browsers, we recommend combining `last 2 versions`, `not dead` with a usage number like `> 0.2%`.
- `last 1 version or > 1%` is equal to `last 1 version, > 1%`. Each line in `.browserslistrc` file is combined with `or` combiner.
- Display target browsers from a browserslist config: https://browsersl.ist/#q=defaults
- Run `npx browserslist` in project directory to see what browsers was selected by your queries.

`PostCSS` is a tool for transforming CSS with JavaScript plugins. It provides features via its extensive plugin ecosystem to help improve the CSS writing experience. Plugins for just about [anything](https://www.postcss.parts). For example:
- [Autoprefixer](https://github.com/postcss/autoprefixer) is one of the many popular PostCSS plugins.
- [postcss-import](https://github.com/postcss/postcss-import) to transform `@import` rules by inlining content. (`postcss-import` is different than the import rule in native CSS. You should avoid the import rule in native CSS, since it can prevent stylesheets from being downloaded concurrently which affects the loading speed and performance.)
- [postcss-preset-env](https://www.npmjs.com/package/postcss-preset-env) lets you convert modern CSS into something most browsers can understand, which is similar to `@babel/preset-env`.
- [cssnano](https://cssnano.co) is a compression tool written on top of the PostCSS ecosystem to compact CSS appropriately.

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({ stage: 1 }),
    require('cssnano'),
  ]
}
```

### module and require in Node.js 
**Node.js treats each JavaScript file as a separate module and encloses the entire code within a function wrapper**: `(function(exports, require, module, __filename, __dirname) {})`. The five parameters — `exports`, `require`, `module`, `__filename`, `__dirname` are available inside each module. Even if you define a global variable in a module using `let` or `const` keywords, the variables are scoped locally to the module rather than being scoped globally.

The `module` parameter refers to the object representing the current module and `exports` is a key of the `module` object which is also an object. `module.exports` is used for defining stuff that can be exported by a module. `exports` parameter and `module.exports` are the same unless you reassign `exports` within your module.

```js
exports.name = 'Alan';
exports.test = function () {};
console.log(module)  // { exports: { name: 'Alan', test: [Function] } }

// exports is a reference and it's no longer same as module.exports if you change the reference
exports = {
  name: 'Bob',
  add: function () {}
}
console.log(exports) // { name: 'Bob', add: [Function] }
console.log(module)  // { exports: { name: 'Alan', test: [Function] } }

module.exports = {
  name: 'Bob',
  add: function () {}
}
console.log(module)  // { exports: { name: 'Bob', add: [Function] } }
```

`require` keyword refers to a function which is used to import all the constructs exported using the `module.exports` from another module. The value returned by the `require` function in module y is equal to the `module.exports` object in the module x. The require function takes in an argument which can be a name or a path. You should provide the name as an argument when you are using the third-party modules or core modules provided by NPM. On the other hand, when you have custom modules defined by you, you should provide the path of the module as the argument.

Modules are cached after the first time they are loaded. This means every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

### Live Reload and Hot Reload
> When a file is edited, the dev server recompiles with the changes, then pushes a notification to the client code in the browser. The app code can then subscribe to "some file changed" notifications, re-import the new version of the code, and swap out the old code for the new code as the app is still running.

**Live Reload** refreshes the entire app when a file changes. For example, if you were four links deep into your navigation and saved a change, live reloading would restart the app and load the app back to the initial route. **Hot Reload** only refreshes the files that were changed without losing the state of the app. (Webpack's **Hot Module Replacement** replaces the modules that have been modified on the fly without reloading the entire page). The advantage of this is that it doesn't lose your app state, e.g. your inputs on your form fields, your currently selected tab.

### Source Map
Once you've compiled and minified your code, normally alongside it will exist a sourceMap file(`file.js.map`). **It helps us with debugging transformed code in its original form**. The bundler will add a source map location comment `//# sourceMappingURL=/path/to/file.js.map` at the end of every generated bundle, which is required to signify to the browser devtools that a source map is available. Another type of source map is inline which has a base64 data URL like `# sourceMappingURL=data:application/json;base64,xxx...`

In development all the source files have associated source maps, but we would not want to ship source maps to our production servers.
- Source maps are usually large; they could be several hundreds of KBs even after compression.
- We may not want to share the original source code of our application with the users.

[source-map-explorer](https://github.com/danvk/source-map-explorer) can be used to analyze and debug space usage through source maps. It shows you a treemap visualization to help you debug where all the code is coming from. Note that use your production builds to inspect bundle size with `source-map-explorer` to ensure you’re previewing optimized code.

```sh
npm install -g source-map-explorer
# Default behavior - write HTML to a temp file and open it in your browser
source-map-explorer bundle.min.js

# Write output in specific formats to a file
source-map-explorer bundle.min.js --html result.html
source-map-explorer bundle.min.js --json result.json

# Get help
source-map-explorer -h
```

<img alt="source-map-explorer" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008i3skNly1gx2pz85jf1j31lf0u07aa.jpg" width="800" />

One more thing, Chrome DevTools parses the [x_google_ignoreList](https://developer.chrome.com/articles/x-google-ignore-list) field in source maps to help improve developer debugging experience (to filter out generated code and let web developers focus only on the code they author.)

```js
/* demo.js.map */
{
  "version": 3,
  "mappings": "AAAAA, ..." 
  "sources": [
    "app.js",
    "components/Button.ts",
    "node_modules/.../framework.js",
    "node_modules/.../library.js",
    ...
  ],
  "x_google_ignoreList": [2, 3],
  ...
}
```

> Learn source maps from Google Chrome Developers
> - What are source maps: https://www.youtube.com/watch?v=FIYkjjFYvoI
> - Using source maps in DevTools: https://www.youtube.com/watch?v=SkUcO4ML5U0

<img alt="source-map-authored" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vOhrAly1hdhsb35qhrj30uq0gqac8.jpg" width="650" />

### What is core-js
`core-js` is the most popular and the most universal polyfill of the JavaScript standard library, which provides support for the latest ECMAScript standard and proposals, from ancient ES5 features to bleeding edge features. It is one of the main reasons why developers can use modern ECMAScript features in their development process each day for many years, but most developers just don't know that they have this possibility because of `core-js` since they use `core-js` indirectly as it's provided by their transpilers or frameworks.

`babel` and `core-js` are tightly integrated: `babel` gives the possibility of optimizing the `core-js` import as much as possible.
  - Using the option `useBuiltIns: usage` with `corejs: 3`, `@babel/preset-env` adds at the top of each file imports of polyfills only for features used in the current and not supported by target environments.
  - Babel 7.4 supports injecting proposals polyfills. By default, `@babel/preset-env` does not inject them, but you can opt-in using the `proposals` flag: `corejs: { version: 3, proposals: true }`.
  - core-js@3: https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md

`core-js` is used by most of the popular websites. We can check it using `window['__core-js_shared__'].versions`, see details at https://github.com/zloirock/core-js/blob/master/docs/2023-02-14-so-whats-next.md

## Debugging Node.js with `--inspect-brk`
https://www.builder.io/blog/debug-nodejs

Launch your Node.js process using the `--inspect-brk` flag (`node server.js --inspect-brk`). Now, open up any Edge or Chrome dev tools window and click the little green Node.js logo button. A new instance of DevTools will open and connect to the node process.

## Set up Prettier and ESLint
1. Install `Prettier` and `ESLint` VSCode plugins and enable `format on save` in settings (execute `save without formatting` command to disable). If you don't see the code formatted automatically on file save then it might be because you have multiple formatters installed in VS Code. Set `Format Document With...` and choose prettier to get it working.
2. We can edit some default settings for prettier in settings (`cmd + ,`, then type prettier)
3. Install eslint and prettier npm packages `npm i -D eslint prettier`. *(ESLint only as an npm package does not provide any editor integration, only the CLI executable.)*
4. Run `eslint --init` to create a `eslintrc.json` (or `.js`, `.yml`) config file after install eslint globally `npm i -g eslint` (otherwise need to run `./node_modules/eslint/bin/eslint.js --init`), pick the following options:
    - To check syntax, find problems, and enforce code style
    - JavaScript modules (import/export)
    - None of these
    - TypeScript: No
    - Browser or Node, as you prefer
    - Use a popular style guide Airbnb
5. Create a config file for Prettier. Note that the VS Code's prettier plugin may inconsistent with prettier npm package in devDependencies that eslint uses, so we use this config file to unify the rules.
    ```js
    // .prettierrc.js
    // refer to https://prettier.io/docs/en/options.html
    module.exports = {
        trailingComma: "es5",
        tabWidth: 2,
        semi: true,
        singleQuote: true,
    };
    ```
6. Install `npm i -D eslint-plugin-prettier eslint-config-prettier`. The first one is used to run prettier as an ESLint rule. The second one is used to to disable ESLint rules that might be conflict with prettier.
7. Then you have to tell ESLint to use Prettier as a plugin and turn off rules that are unnecessary or might conflict with Prettier:
    ```js
    //.eslintrc.js
    module.exports = {
        env: {
            es6: true,
            browser: true,
            es2021: true,
        },
        extends: ['airbnb-base', 'prettier'],
        parserOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
        },
        rules: {
            'prettier/prettier': 'error',
        },
        plugins: ['prettier'],
    };
    ```
8. Add `eslint src` as a lint script which can be run as `npm run lint`, and it shows eslint errors in the Problems tab. Run `npm run lint -- --fix` to fix errors (if not format on save).

### Configure ESLint in an existing project
If you joined a project that uses ESLint to manage its code style, you wanted to match the team’s formatting. You can configure VSCode to use the `eslintrc.json` file in the project’s root dir instead of Prettier.

After the ESLint plugin installed, go to Settings and open the raw JSON settings file (click top-right icon). Add these 4 new lines inside the top-level settings object. The first one turns on ESLint for formatting, and the next 3 make it do the formatting when you hit save. *(You might need to undo this if you switch back to a project that doesn’t use ESLint.)*

```json
"eslint.format.enable": true,
"editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
}
```

### What is Husky
While working on an enterprise development team, it is important that all code linting and unit tests are passing before committing code, especially if you are using some form of continuous integration. **Husky** is a very popular npm package that allows custom scripts to be ran against your repository to prevent bad `git commit` and `git push`, which makes commits of fixing lint errors doesn't happen.

Install husky `npm i -D husky` and have a "husky" section in the `package.json` file to add git hooks.
```json
// package.json
"husky": {
    "hooks": {
        "pre-commit": "npm run lint && npm run test",
        "pre-push": "npm test"
    }
}
```

## When and How to use https for local dev
Most of the time, `http://localhost` does what you need. Browsers treat `http://localhost` in a special way: although it's HTTP, it mostly behaves like an HTTPS site. That's why some APIs that won't work on a deployed HTTP site, will work on `http://localhost`. What this means is that you need to use HTTPS locally only in special cases, like custom hostname, secure cookies across browsers, or using third-party libraries that require HTTPS.

To use HTTPS with your local development site and access `https://localhost`, you need a TLS certificate. But browsers won't consider just any certificate valid: your **certificate needs to be signed by an entity that is trusted by your browser, called a trusted certificate authority (CA)**.

What you need to do is to create a certificate and sign it with a CA that is trusted locally by your device and browser. [mkcert](https://github.com/FiloSottile/mkcert) is a tool that helps you do this in a few commands.

1. Install mkcert `brew install mkcert`
2. Add mkcert to your local root CAs `mkcert -install`
3. Generate a certificate for your site, signed by mkcert `mkcert localhost`
4. Configure your dev server to use HTTPS and the certificate you've created `{PATH/TO/CERTIFICATE-FILENAME}.pem`

> Start your server: `http-server -S -C {PATH/TO/CERTIFICATE-FILENAME}.pem -K {PATH/TO/CERTIFICATE-KEY-FILENAME}.pem`. `-S` runs your server with HTTPS, while `-C` sets the certificate and `-K` sets the key.

Here's how it works:
- If you open your locally running site in your browser using HTTPS, your browser will check the certificate of your local development server.
- Upon seeing that the certificate has been signed by the mkcert-generated certificate authority, the browser checks whether it's registered as a trusted certificate authority.
- mkcert is listed as a trusted authority, so your browser trusts the certificate and creates an HTTPS connection.

## Introducing the Backend For Frontend
We had server-side functionality which we wanted to expose both via our desktop web UI, and via one or more mobile UIs. We often faced a problem in accommodating these new types of user interface, often as we already had a tight coupling between the desktop web UI and our backed services. However the nature of a mobile experience differs from a desktop web experience. In practice, our mobile devices will want to make different calls, fewer calls, and will want to display different (and probably less) data than their desktop counterparts. This means that we need to add additional functionality to our API backend to support our mobile interfaces.

One solution to this problem is that rather than have a general-purpose API backend, instead you have one backend per user experience - or call it a Backend For Frontend (BFF). The BFF is tightly coupled to a specific UI, and will typically be maintained by the same team as the user interface, thereby making it easier to define and adapt the API as the UI requires.

BFFs can be a useful pattern for architectures where there are a number of backend services, as the need to aggregate multiple downstream calls to deliver user functionality increases. In such situations it will be common for a single call in to a BFF to result in multiple downstream calls to microservices (multiple services hold the pieces of information we want).

The other benefit of using a BFF is that the team creating the interface can be much more fluid in thinking about where functionality lives. For example they could decide to push functionality on to the server-side to promote reuse in the future and simplify a native mobile application, or to allow for the faster release of new functionality. This decision is one that can be made by the team in isolation if they own both the mobile application and the BFF - it doesn't require any cross-team coordination.

## React Server Side Rendering
With SSR, you render your JS on the server into HTML. You serve that HTML to your client so it appears to have fast startup. But you still have to wait for your JS to reach the user before anything can be interactive (hydration). After hydration, SSR can't be used again - it's typically only used for initial loads.

1. Browser sends HTTP request to server to load a page.
2. Server receives HTTP request and turns React JSX into HTML markup.
3. Server inserts the markup into a HTML template and sends the HTML response back to the browser.
4. Browser renders the HTML, downloads the client-side JavaScript bundle, and “hydrates” the HTML.

Let’s create a simple React component App. We will render this component on the server-side and hydrate it on the client-side.

```js
// client/components/App/index.js

import React from 'react'
const App = () => (
  <>
    <div>Hello World</div>
    <button onClick={e => alert('Hello You!')}>Say Hello</button>
  </>
);

export default App; 
```

Then create an Express server and define a route that serves an HTML page when a user visits `http://localhost:3000/`.

```js
// server/index.js

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import express from 'express'
import App from '../client/components/App'

const app = express()
const port = 3000
// This is the local static server that serves the client-side bundles.
const cdnHost = `http://localhost:5000`;

app.get('/', (req, res) => {
  // This turns the React component App into an HTML string
  const jsx = ReactDOMServer.renderToString(<App />)
  const clientBundleStyle = `<link rel="stylesheet" href="${cdnHost}/styles/bundle.css">`
  // This loads the JS code to “hydrate” the markup with interactivity.
  const clientBundleScript = `<script src="${cdnHost}/scripts/bundle.js"></script>`

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My SSR App</title>
        ${clientBundleStyle}
      </head>
      <body>
        <div id='ssr-app'>${jsx}</div>
        ${clientBundleScript}
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`)
})
```

In the client-side entry point, we will “hydrate” the React component that was SSR-ed into the root DOM container with the ID "ssr-app".

```js
// ./client/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

ReactDOM.hydrate(<App />, document.getElementById('ssr-app'));
```

Run `npm run dev` in the terminal to spin up the SSR app.
- `dev:client` — This tells webpack to build the client-side code, save the bundle output "in memory", and serve it from http://localhost:8080 (as per `./webpack.client.config.js`).
- `dev:server` — This uses nodemon to monitor any file changes in the working directory (minus `./build`), and [npm-run-all](https://www.npmjs.com/package/npm-run-all) to re-run clear, `build:server`, and `start:server` whenever there are file changes.

```json
"scripts": {
  "clear": "rimraf build",
  "build:server": "webpack --config webpack.server.config.js",
  "start:server": "node build/server/bundle.js",
  "dev:server": "nodemon --ignore build --exec 'run-s clear build:server start:server'",
  "dev:client": "webpack serve --config webpack.client.config.js",
  "dev": "run-p dev:client dev:server"
}
```

## Jamstack
Jamstack is a web architecture and stands for **J**avascript, **A**PIs, and **M**arkup stack. In this architecture, the frontend and the backend are completely separate. All interactions with the backend and third parties are done using APIs. Markup that incorporates Javascript, is pre-built into static assets, served to a client from a CDN, and relies on reusable APIs for its functionalities. **「a Jamstack site is a set of pre-generated static assets served from a CDN」**

> Jamstack is a way of working. It’s not a group of frameworks or services or tied to any particular brands or tech stack. Jamstack is defined by how you build websites, rather than the tools with which you choose to build them.

Jamstack sites have better performance, are easier to secure and scale, and cost a lot less than sites built with traditional architectures (Jamstack hosting providers take care of all of this for you). Pre-building pages ensure that any errors can be detected early enough. Most importantly, Jamstack allows teams to outsource complex services to vendors who provide, maintain, and secure APIs used on their sites. The APIs can provide specific functionality to static sites like payments, authentication, search, image uploads using Paypal, Auth0, Algolia, Cloudinary.

The most common types of Jamstack site build tools include static site generators (SSG) and headless content management systems (CMS). **Static site generators** are build tools that add content to templates and produce static web pages of a site. These generators can be used for Jamstack sites. Some well-known site generators include Hugo, Gatsby, Jekyll, Next.js, etc. 

There are two points in time that you can integrate dynamic content into a Jamsack application:
- **Build time** - During the build process, a Jamstack site can call out to any number of external API services to fetch data to pre-generate static pages. You can think of it like a content cache that applies to all your site’s users.
- **Run time** - This should typically be content that is user specific, needs to update frequently, or is in response to a specific user action. For example, an ecommerce site may have product details populated at build time, but things like the current inventory, shipping options/prices based upon the user’s location, or the user’s shopping cart would all be populated at run time in the browser. As you may notice, in this example, the content on a single page (product details) may be a combination of both pre-rendered (build time) content (i.e. the product name, photo and description) and run time content (i.e. the product inventory and shipping options based on location).

> What type of website are you building? https://whattheframework.netlify.app
> 
> One thing people liked about SPAs is that you could run your website, mobile app, public API, and other clients from the same backend infrastructure. With the pendulum swinging back toward server rendering, you’ll need a web server again.

## Serverless
Your code needs to be hosted on a server. Depending on the size of your code and the amount of users you expect to use your product, you might need many servers. Companies used to have their own facilities and warehouses that held their servers and many still do. But for many, this is not ideal. Servers can be difficult to maintain. Maintaining servers and the buildings that house them can become expensive too. That's where AWS and other cloud providers come in.

Cloud is basically renting out servers and data storage that's owned by someone else (Serverless does not mean there aren't any servers; You still need servers to host and run your code.) Through the cloud provider (AWS, Azure, or Google Cloud), you gain access to resources like storage services, servers, networking, analytics, AI, and more. There are many other benefits: You pay only for what you use. You can easily spin up and use new servers when needed, allowing you to scale quickly. You can deploy applications globally. 

There are different families of cloud services.
- **Infrastructure as a service (IaaS)** - Amazon EC2, Digital Ocean
- **Platform as a service (PaaS)** - Heroku, AWS Elastic Beanstalk
- **Software as a service (SaaS)** - Dropbox, iCloud, Slack
- **Function as a service (FaaS)** - AWS Lambda

### What is "edge compute"?
To solve the latency problem, very smart folks came up with the idea of deploying multiple copies of a program and distributing it around the world. When a user makes a request, it can be handled by the closest copy, thus reducing the distance traveled and the time spent in transit.

- Move things closer to users (like a CDN)
- Do work on servers (like cloud servers/functions)

> Cloud = a server, somewhere; Edge = a server, close to you

With [Netlify Edge Functions](https://edge-functions-examples.netlify.app), you can transform HTTP Requests and Responses, stream server rendered content, and even run full server side rendered applications. And this all happens at the Edge — directly from the worldwide location closest to each user. You can write edge functions using JavaScript or TypeScript, but instead of using Node.js under the hood, they are powered by Deno.
