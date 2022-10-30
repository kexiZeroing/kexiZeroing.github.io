---
layout: "../layouts/BlogPost.astro"
title: "Start a Javascript stack project"
slug: start-js-stack-project
description: ""
added: "June 16 2022"
tags: [web]
---

## Start a modern front-end project
Create `index.js` and `index.html` files within a folder. Assuming that you have node.js installed, go ahead and install `yarn` and run `yarn init` command on your project’s repository. Alternatively, you can use `npm`. After running `yarn init` or `npm init`, just follow the instructions on the CLI and you should end up with a file called `package.json`.

> `npm init <initializer>` can be used to set up a npm package. `initializer` in this case is an npm package named `create-<initializer>`, which will be installed by `npm-exec`. The init command is transformed to a corresponding `npm exec` operation like `npm init foo` -> `npm exec create-foo`. Another example is `npm init react-app myapp`, which is same as `npx create-react-app myapp`. If the initializer is omitted (by just calling `npm init`), init will fall back to legacy init behavior. It will ask you a bunch of questions, and then write a `package.json` for you. You can also use `-y/--yes` to skip the questionnaire altogether.

Then let’s bring a web application bundler. We want `parcel` in our project, so install it as a development dependency by running `yarn add parcel-bundler --dev` or `npm install parcel-bundler --save-dev`. Once parcel has been added to our project, we can simply run `parcel index.html` and parcel will serve the file on its built-in development server on port 1234. We can add a `start` script to our `package.json` and simply run `yarn start` or `npm start`.

> WebPack, Rollup, and Parcel are all bundlers available in the JavaScript community but not fast enough because they are built with JavaScript. There is a new bundler [esbuild](https://esbuild.github.io/) written in Go that works faster than other bundlers.

Let’s move on and add Sass support to our project. To do so using parcel, we run `yarn add node-sass --dev`. We can create a file called `index.scss`. To make it works, we need to reference it. Go to the `index.js` file and import it using a relative path like `import './index.scss'`.

> Sass has two syntaxes. The older syntax is known as SASS (with `.sass` extention). Instead of brackets and semicolons, it uses the indentation of lines to specify blocks. The most commonly used is SCSS (with `.scss` extention). SCSS is a superset of CSS syntax, so every valid CSS is a valid SCSS as well. 

We need modern javascript and babel help us with that. We run `yarn add @babel/core @babel/cli @babel/preset-env --dev` and create a `.babelrc` file on the root of the project referencing the preset we are using.

> From version 7 of Babel, they moved `babel-preset-env` into the main Babel repo, and they changed the name from `babel-preset-env` to [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env).

At last, we need a `parcel build index.js` as a `build` script in `package.json` file which will be used for production, and parcel will create a `dist` directory with all assets minified.

### npm and npx
One might install a package locally on a certain project using `npm install some-package`, then we want to execute that package from the command line. Only globally installed packages can be executed by typing their name only (local installs  at `./node_modules/.bin`; global installs at `/usr/local/bin`). To fix this, you must type the local path `./node_modules/.bin/some-package`.

npx comes bundled with npm version 5.2+. It will check whether the command exists in `$PATH` or in the local project binaries and then execute it. So if you wish to execute the locally installed package, all you need to do is type `npx some-package`. 

Have you ever run into a situation where you want to try some CLI tool, but it’s annoying to have to install a global just to run it once? npx is great for that. It will automatically install a package with that name from the npm registry and invoke it. When it’s done, the installed package won’t be anywhere in the global, so you won’t have to worry about pollution in the long-term. For example, `npx create-react-app my-app` will generate a react app boilerplate within the path the command had run in, and ensures that you always use the latest version of the package without having to upgrade each time you’re about to use it.

There’s an [awesome-npx](https://github.com/junosuarez/awesome-npx) repo with examples of things that work great with npx.

### package.json and package-lock.json
`package-lock.json` (called package locks, or lockfiles) is automatically generated for any operations where npm modifies either the `node_modules` tree or `package.json`. This file is intended to be committed into source repositories. The purpose of the `package-lock.json` is to avoid the situation where installing modules from the same `package.json` results in two different installs. `package-lock.json` is a large list of each dependency listed in your `package.json`, the specific version that should be installed, the location (URI) of the module, a hash that verifies the integrity of the module, the list of packages it requires.

1. If you have a `package.json` and you run `npm i`, we generate a `package-lock.json` from it.
2. If you run `npm i` against that `package.json` and `package-lock.json`, the latter will never be updated, even if the `package.json` would be happy with newer versions.
3. If you manually edit your `package.json` to have different ranges and run `npm i` and those ranges aren't compatible with your `package-lock.json`, then the latter will be updated with version that are compatible with your `package.json`.

> - `npm ls` (aliases: list, la, ll) list dependencies that have been installed to `node_modules`.
> - [depcheck](https://github.com/depcheck/depcheck) check your npm module for unused dependencies. `npx depcheck` (needs node.js >= 10)
> - [npm-check-updates](https://github.com/raineorshine/npm-check-updates) find the latest versions of your package dependencies, ignoring specified versions.
> - [npm-graph](https://npmgraph.js.org) is a tool for exploring NPM modules and dependencies.
> - Interactive CLI that bumps version number (with `--commit` `--tag` `--push` by default): https://github.com/antfu/bumpp
> - Generic CLI tool to automate versioning and package publishing related tasks: https://github.com/release-it/release-it

### npm and pnpm
The very first package manager ever released was npm, back in January 2010. In 2020, GitHub acquired npm, so in principle, npm is now under the stewardship of Microsoft. *(npm should never be capitalized unless it is being displayed in a location that is customarily all-capitals.)*

npm handles the dependencies by splitting the installation process into three phases. Each phase needs to end for the next one to begin.
1. **Resolving**, when the package manager is checking all the project’s dependencies (and their sub-dependencies) listed in the `package.json` file, finds a version that satisfies the version specifier (for instance, `^1.0.0` would install any future minor/patch versions) and creates the file `package-lock.json`.
2. **Fetch**, when the package manager takes the list of resolved dependencies and fetches all the packages from the package registry.
3. **Linking**, when the package manager writes all the dependencies into the project’s `node_modules` folder.

pnpm was released in 2017. It is a drop-in replacement for npm, so if you have an npm project, you can use pnpm right away. The main problem the creators of pnpm had with npm was the redundant storage of dependencies that were used across projects. 1) The way npm manages the disc space is not efficient. 2) pnpm doesn’t have the blocking stages of installation - the processes run for each of the packages independently.

Traditionally, npm installed dependencies in a flat `node_modules` folder. On the other hand, pnpm manages `node_modules` by using hard linking and symbolic linking to a global on-disk content-addressable store. It results in a nested `node_modules` folder that stores packages in a global store on your home folder (`~/.pnpm-store/`). Every version of a dependency is physically stored in that folder only once, constituting a single source of truth. pnpm identifies the files by a hash id (also called "content integrity" or "checksum") and not by the filename, which means that two same files will have identical hash id and pnpm will determine that there’s no reason for duplication.

<img alt="pnpm" src="https://tva1.sinaimg.cn/large/008vxvgGly1h7aw9ablr4j30vm0u0q5z.jpg" width="700" />

### npm install and npm ci
- `npm install` reads `package.json` to create a list of dependencies and uses `package-lock.json` to inform which versions of these dependencies to install. If a dependency is not in `package-lock.json` it will be added by `npm install`.

- `npm ci` (named after **C**ontinuous **I**ntegration) installs dependencies directly from `package-lock.json` and uses `package.json` only to validate that there are no mismatched versions. If any dependencies are missing or have incompatible versions, it will throw an error. It will delete any existing `node_modules` folder to ensure a clean state. It never writes to `package.json` or `package-lock.json`. It does however expect a `package-lock.json` file in your project — if you do not have this file, `npm ci` will not work and you have to use `npm install` instead. (If you are on npm v5 or lower, you can only use `npm install` to install or update dependencies.)

- `npm audit` automatically runs when you install a package with `npm install`. It checks direct dependencies and devDependencies, but does not check peerDependencies. Read more about [npm audit: Broken by Design](https://overreacted.io/npm-audit-broken-by-design) by Dan Abramov.

### dependencies, devDependencies and peerDependencies
**Dependencies** are required at runtime, like a library that provides functions that you call from your code. If you are deploying your application, dependencies has to be installed, or your app will not work. They are installed transitively (if A depends on B depends on C, npm install on A will install B and C). *Example: lodash,and your project calls some lodash functions*.

**devDependencies** are dependencies you only need during development, like compilers that take your code and compile it into javascript, test frameworks or documentation generators. They are not installed transitively (if A depends on B dev-depends on C, npm install on A will install B only). *Example: grunt, your project uses grunt to build itself*.

**peerDependencies** are dependencies that your project hooks into, or modifies, in the parent project, usually a plugin for some other library. It is just intended to be a check, making sure that the project that will depend on your project has a dependency on the project you hook into. So if you make a plugin C that adds functionality to library B, then someone making a project A will need to have a dependency on B if they have a dependency on C. They are not installed, they are only checked for. *Example: your project adds functionality to grunt and can only be used on projects that use grunt*.

The `npm install` command will install both *devDependencies* and *dependencies*. With the `--production` flag (or when the `NODE_ENV` environment variable is set to production), npm will not install modules listed in *devDependencies*.

### URLs as dependencies
See details at https://docs.npmjs.com/cli/v8/configuring-npm/package-json#urls-as-dependencies
1. Git URLs as dependencies
    - git+ssh://git@github.com:myaccount/myprivate.git
    - git+ssh://git@github.com:myaccount/myprivate.git#develop
    - git+https://[username]:[password]@github.com/myaccount/myprivate.git
2. GitHub URLs: refer to GitHub urls as `"foo": "user/foo-project"`
3. Local Paths: You can provide a path to a local directory that contains a package `"bar": "file:../foo/bar"`

### npm overrides enable you to control your dependencies' dependencies
If you need to make specific changes to dependencies of your dependencies, for example replacing the version of a dependency with a known security issue. Overrides (with npm v8.3+) provide a way to replace a package in your dependency tree with another version, or another package entirely.
- `"overrides": { "foo": "1.0.0" }` to make sure the package `foo` is always installed as version `1.0.0`.
- `"overrides": { "bar@2.0.0": {"foo": "1.0.0"} }` to override `foo` to `1.0.0`, but only when it's a child (or grandchild, or great grandchild) of `bar@2.0.0`.
- `"overrides": { "foo": "https://registry.yarnpkg.com/xxx.tgz" }` to resolve to a different package.
- `"overrides": { "foo": "file:./libs/bar" }` to make nested dependencies point to your own local package.

Delete `package-lock.json` and `node_modules` and force the next npm install to have the version you intend to have. You can check if adding `overrides` to your `package.json` did change your nested dependencies by going into `node_modules/foo/package.json`.

### npm link
1. Run `npm link` from your `MyModule` directory: this will create a global package `{prefix}/node/{version}/lib/node_modules/<package>` symlinked to the `MyModule` directory.
2. Run `npm link MyModule` from your `MyApp` directory: this will create a `MyModule` folder in `node_modules` symlinked to the globally-installed package and thus to the real location of `MyModule`.
3. Now any changes to `MyModule` will be reflected in `MyApp/node_modules/MyModule/`. Use `npm ls -g --depth=0 --link` to list all the globally linked modules.

### publish npm packages
Learn how to create a new npm package and publish the code to npm by the demo [Building a business card CLI tool](https://whitep4nth3r.com/blog/build-a-business-card-cli-tool). Once your package is published to npm, you can run `npx {your-command}` to execute your script whenever you like.

### npm scripts
Npm scripts are a set of built-in and custom scripts defined in the `package.json` file. Their goal is to provide a simple way to execute repetitive tasks.

- npm makes all your dependencies' binaries available in the scripts. So you can access them directly as if they were referenced in your PATH.
    ```json
    // Instead of doing this:
    "scripts": {
        "lint": "./node_modules/.bin/eslint ."
    }

    // You can do this:
    "scripts": {
        "lint": "eslint ."
    }
    ```
- `npm run` is an alias for `npm run-script`, meaning you could also use `npm run-script lint`.
- Built-in scripts can be executed using aliases, making the complete command shorter and easier to remember. For example, `npm run-script test`, `npm run test`, `npm test`, and `npm t` are same to run the test script. `npm run-script start`, `npm run start`, and `npm start` are also same.
- Run `npm run` if you forget what npm scripts are available. This produces a list of scripts, and displays the code that each script runs.
- To run multiple scripts sequentially, we use `&&`. For example, `npm run lint && npm test`.
- When a script finishes with a non-zero exit code, it means an error occurred while running the script, and the execution is terminated.
- Use `npm run <script> --silent` to reduce logs and to prevent the script from throwing an error. This can be helpful when you want to run a script that you know may fail, but you don't want it to throw an error. Maybe in a CI pipeline, you want your whole pipeline to keep running even when the test command fails. If we don't want to get an error when the script doesn't exists, we can use `npm run <script> --if-present`.
- We can create "pre" and "post" scripts for any of our scripts, and NPM will automatically run them in order.
    ```json
    {
        "name": "npm-lifecycle-example",
        "scripts": {
            "prefoo": "echo prefoo",
            "foo": "echo foo",
            "postfoo": "echo postfoo"
        }
    }
    ```
- You can run `npm config ls -l` to get a list of the configuration parameters, and you can use `$npm_config_` prefix (like `$npm_config_editor`) to access them in the scripts. Any key-value pairs we add to our script will be translated into an environment variable with the `npm_config` prefix.
    ```json
    "scripts": {
        "hello": "echo \"Hello $npm_config_firstname\""
    }

    // Output: "Hello Paula"
    npm run hello --firstname=Paula
    ```
- Passing arguments to other NPM scripts, we can leverage the `--` separator. e.g. `"pass-flags-to-other-script": "npm run my-script -- --watch"` will pass the `--watch` flag to the `my-script` command.
- One convention that you may have seen is using a prefix and a colon to group scripts, for example `build:dev` and `build:prod`. This can be helpful to create groups of scripts that are easier to identify by their prefixes.

### browserslist
The [browserslist](https://github.com/browserslist/browserslist) configuration (either in `package.json` or `.browserslistrc`) uses `caniuse` data (https://caniuse.com/usage-table) for queries to control the outputted JS/CSS so that the emitted code will be compatible with the browsers specified. It will be installed with webpack and used by many popular tools like autoprefixer, babel-preset-env. You can find these tools require `browserslist` in the `package-lock.json` file.

- There is a `defaults` query (`> 0.5%, last 2 versions, Firefox ESR, not dead`), which gives a reasonable configuration for most users.
- If you want to change the default set of browsers, we recommend combining `last 2 versions`, `not dead` with a usage number like `> 0.2%`.
- `last 1 version or > 1%` is equal to `last 1 version, > 1%`. Each line in `.browserslistrc` file is combined with `or` combiner.
- Run `npx browserslist` in project directory to see what browsers was selected by your queries.
- `PostCSS` is a tool for transforming CSS with JavaScript plugins. It provides features via its extensive plugin ecosystem to help improve the CSS writing experience. Plugins for just about [anything](https://www.postcss.parts). For example:
  - [Autoprefixer](https://github.com/postcss/autoprefixer) is one of the many popular PostCSS plugins.
  - [postcss-preset-env](https://www.npmjs.com/package/postcss-preset-env) lets you convert modern CSS into something most browsers can understand, which is similar to `@babel/preset-env`.
  - [cssnano](https://cssnano.co) is a compression tool written on top of the PostCSS ecosystem to compact CSS appropriately.

### jsconfig.json
JavaScript experience is improved when you have a `jsconfig.json` file in your workspace that defines the project context. **`jsconfig.json` is a descendant of `tsconfig.json`**. The presence of `jsconfig.json` file in a directory indicates that the directory is the root of a JavaScript project.

The `exclude` attribute tells the language service what files are not part of your source code (e.g. `node_modules`, `dist`). Alternatively, you can explicitly set the files in your project using the `include` attribute (e.g. `src/**/*`).

Below are `compilerOptions` to configure the JavaScript language support. Do not be confused by `compilerOptions`, since no actual compilation is required for JavaScript. This attribute exists because `jsconfig.json` is a descendant of `tsconfig.json`. See an example at https://github.com/Microsoft/TypeScript-Babel-Starter/blob/master/tsconfig.json

- `target`: This setting changes which JS features are downleveled and which are left intact. Modern browsers support all ES6 features, so `ES6` is a good choice. The values are "es3", "es5", "es6", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "esnext".
- `module`: Specifies the module system when generating module code. The values are "amd", "commonJS", "es2015", "es6", "esnext", "none", "system", "umd".
- `baseUrl`: Lets you set a base directory to resolve non-absolute module names. With `"baseUrl": "."`, it will look for files starting at the same folder as the `jsconfig.json`.
- `paths`: A series of entries which re-map imports to lookup locations relative to the `baseUrl`, e.g. `"@models/*": ["app/models/*"]`.
- `checkJs`: Enable type checking on JavaScript files. This is the equivalent of including `// @ts-check` at the top of all JavaScript files which are included in your project. (Set `allowJs: true` in `tsconfig.json` to tell TypeScript to allow a reference to regular JavaScript files.)

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

<img alt="source-map-explorer" src="https://tva1.sinaimg.cn/large/008i3skNly1gx2pz85jf1j31lf0u07aa.jpg" width="800" />

## Set up Prettier and ESLint
1. Install `Prettier` and `ESLint` plugins and enable `format on save` in settings (execute `save without formatting` command to disable). If you don't see the code formatted automatically on file save then it might be because you have multiple formatters installed in VS Code. Set `Format Document With...` and choose prettier to get it working.
2. We can edit some default settings for prettier in settings (`cmd + ,`, then type prettier)
3. Install eslint and prettier npm packages `npm i -D eslint prettier`.
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

## Jamstack
Jamstack is a web architecture and stands for **J**avascript, **A**PIs, and **M**arkup stack. In this architecture, the frontend and the backend are completely separate. All interactions with the backend and third parties are done using APIs. Markup that incorporates Javascript, is pre-built into static assets, served to a client from a CDN, and relies on reusable APIs for its functionalities. **「a Jamstack site is a set of pre-generated static assets served from a CDN」**

> Jamstack is a way of working. It’s not a group of frameworks or services or tied to any particular brands or tech stack. Jamstack is defined by how you build websites, rather than the tools with which you choose to build them.

Jamstack sites have better performance, are easier to secure and scale, and cost a lot less than sites built with traditional architectures (Jamstack hosting providers take care of all of this for you). Pre-building pages ensure that any errors can be detected early enough. Most importantly, Jamstack allows teams to outsource complex services to vendors who provide, maintain, and secure APIs used on their sites. The APIs can provide specific functionality to static sites like payments, authentication, search, image uploads using Paypal, Auth0, Algolia, Cloudinary.

The most common types of Jamstack site build tools include static site generators (SSG) and headless content management systems (CMS). **Static site generators** are build tools that add content to templates and produce static web pages of a site. These generators can be used for Jamstack sites. Some well-known site generators include Hugo, Gatsby, Jekyll, Next.js, etc. 

There are two points in time that you can integrate dynamic content into a Jamsack application:
- **Build time** - During the build process, a Jamstack site can call out to any number of external API services to fetch data to pre-generate static pages. You can think of it like a content cache that applies to all your site’s users.
- **Run time** - This should typically be content that is user specific, needs to update frequently, or is in response to a specific user action. For example, an ecommerce site may have product details populated at build time, but things like the current inventory, shipping options/prices based upon the user’s location, or the user’s shopping cart would all be populated at run time in the browser. As you may notice, in this example, the content on a single page (product details) may be a combination of both pre-rendered (build time) content (i.e. the product name, photo and description) and run time content (i.e. the product inventory and shipping options based on location).

> What type of website are you building? https://whattheframework.netlify.app

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

## Web Hosting and Domain registration
Domain registrants (GoDaddy, Hover, Google Domains, Amazon Route 53...) are for registering domain names. If you want `itiscool.com`, you’re going to have to buy it, and domain registrants are companies that help you do that. Just because you own a domain doesn’t mean it will do anything. It’s likely that you will see a “coming soon” page after buying a domain name.

To host a website at your new domain, you’ll need to configure the DNS of your new domain to point at a server connected to the internet. Web hosting services give you that server. You’ll need to know a little bit about the website you intend to host when making that choice. Will it be a WordPress site? Or a Python/Go/Node site? That means your host will need to support those technologies.

- WP Engine is a web host that focuses specifically on WordPress.
- Media Temple has WordPress-specific hosting, but has a wider range of services from very small and budget friendly to huge and white-glove.
- Netlify does static site hosting, which is great for things like static site generators and JAMstack sites.
- Digital Ocean has their own way of talking about hosting. They call their servers Droplets, which are kind of like virtual machines with extra features.
- Heroku calls themselves a “Cloud Application Platform.” It is great for hosting apps with a ready-to-use backend for server languages like Node, Ruby, Java, and Python.
- Amazon Web Services (AWS) is a whole suite of products with specialized hosting focuses. Microsoft Azure and Google Cloud are similar.

Should you bundle your domain registrar and web host into one if a company offers both? It’s mighty handy. The host will also do things like configuring the DNS for you to be all set up for their hosting and you probably don’t even have to think about it. But say the day comes where you just don’t like that host anymore. You want to move hosts. The problem is that they aren’t just your host, but your domain registrant, too. You’re going to leave both of them.

What about assets hosting? Your web host can host assets and that’s fine for the small sites. One major reason people go with an asset host (probably more commonly referred to as a CDN) is for a speed boost. Asset hosts are also servers, just like your web host’s web server. Not only do those assets get delivered to people looking at your site super fast, but your web server is relieved of that burden.
