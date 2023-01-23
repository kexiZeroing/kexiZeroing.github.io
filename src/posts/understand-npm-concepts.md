---
layout: "../layouts/BlogPost.astro"
title: "Understand npm concepts"
slug: understand-npm-concepts
description: ""
added: "Dec 14 2022"
tags: [js]
---

### package.json and package-lock.json
`package-lock.json` (called package locks, or lockfiles) is automatically generated for any operations where npm modifies either the `node_modules` tree or `package.json`. This file is intended to be committed into source repositories. The purpose of the `package-lock.json` is to avoid the situation where installing modules from the same `package.json` results in two different installs. `package-lock.json` is a large list of each dependency listed in your `package.json`, the specific version that should be installed, the location (URI) of the module, a hash that verifies the integrity of the module, the list of packages it requires.

1. If you run `npm i` against that `package.json` and `package-lock.json`, the latter will never be updated, even if the `package.json` would be happy with newer versions.
2. If you manually edit your `package.json` to have different ranges and run `npm i` and those ranges aren't compatible with your `package-lock.json`, then the latter will be updated with version that are compatible with your `package.json`.
3. Listed dependencies in `package-lock.json` file have mixed (sha1/sha512) integrity checksum. npm changed the integrity checksum from sha1 to sha512. Only packages published with npm@5 or later will include a sha512 integrity hash.

### npm install and npm ci
`npm install` reads `package.json` to create a list of dependencies and uses `package-lock.json` to inform which versions of these dependencies to install. If a dependency is not in `package-lock.json` it will be added by `npm install`.

`npm ci` (named after **C**ontinuous **I**ntegration) installs dependencies directly from `package-lock.json` and uses `package.json` only to validate that there are no mismatched versions. If any dependencies are missing or have incompatible versions, it will throw an error. It will delete any existing `node_modules` folder to ensure a clean state. It never writes to `package.json` or `package-lock.json`. It does however expect a `package-lock.json` file in your project — if you do not have this file, `npm ci` will not work and you have to use `npm install` instead. (If you are on npm v5 or lower, you can only use `npm install` to install or update dependencies.)

`npm audit` automatically runs when you install a package with `npm install`. It checks direct dependencies and devDependencies, but does not check peerDependencies. Read more about [npm audit: Broken by Design](https://overreacted.io/npm-audit-broken-by-design) by Dan Abramov.

### npm ls
`npm ls` (aliases: list, la, ll) list dependencies that have been installed to `node_modules`. It throws an error for discrepancies between `package.json` and its lock.

- If `depth` is not set, `npm ls` will show only the immediate dependencies of the root project.
- If `--all` is set, it will show all dependencies by default.

```js
const cp = require("child_process");
const verify = () => cp.exec("npm ls", error => {
  if (error) {
    console.error("Dependency mismatch between package.json and lock. Run: npm install");
    throw error;
  }
  console.log("Dependencies verified =)");
});

verify();
```

`npm outdated`, a built-in npm command, will check the registry to see if any installed packages are currently outdated. By default, only the direct dependencies of the root project are shown. Use `--all` to find all outdated meta-dependencies as well.

[depcheck](https://github.com/depcheck/depcheck) check your npm module for unused dependencies. `npx depcheck` (needs node.js >= 10)

### dependencies, devDependencies and peerDependencies
**Dependencies** are required at runtime, like a library that provides functions that you call from your code. If you are deploying your application, dependencies has to be installed, or your app will not work. They are installed transitively (if A depends on B depends on C, npm install on A will install B and C). *Example: lodash,and your project calls some lodash functions*.

**devDependencies** are dependencies you only need during development, like compilers that take your code and compile it into javascript, test frameworks or documentation generators. They are not installed transitively (if A depends on B dev-depends on C, npm install on A will install B only). *Example: grunt, your project uses grunt to build itself*.

**peerDependencies** are dependencies that your project hooks into, or modifies, in the parent project, usually a plugin for some other library. It is just intended to be a check, making sure that the project that will depend on your project has a dependency on the project you hook into. So if you make a plugin C that adds functionality to library B, then someone making a project A will need to have a dependency on B if they have a dependency on C. They are not installed, they are only checked for. *Example: your project adds functionality to grunt and can only be used on projects that use grunt*.

The `npm install` command will install both *devDependencies* and *dependencies*. With the `--production` flag or when the `NODE_ENV` environment variable is set to production `NODE_ENV=production npm install`, npm will not install modules listed in devDependencies.

### URLs as dependencies
See details at https://docs.npmjs.com/cli/v8/configuring-npm/package-json#urls-as-dependencies
1. Git URLs as dependencies
    - git+ssh://git@github.com:myaccount/myprivate.git
    - git+ssh://git@github.com:myaccount/myprivate.git#develop
    - git+https://[username]:[password]@github.com/myaccount/myprivate.git
2. GitHub URLs: refer to GitHub urls as `"foo": "user/foo-project"`
3. Local Paths: You can provide a path to a local directory that contains a package `"bar": "file:../foo/bar"`

### npm and npx
One might install a package locally on a certain project using `npm install some-package`, then we want to execute that package from the command line. Only globally installed packages can be executed by typing their name only. To fix this, you must type the local path `./node_modules/.bin/some-package`.

npx comes bundled with npm version 5.2+. It will check whether the command exists in `$PATH` or in the local project binaries and then execute it. So if you wish to execute the locally installed package, all you need to do is type `npx some-package`. 

Have you ever run into a situation where you want to try some CLI tool, but it’s annoying to have to install a global just to run it once? npx is great for that. It will automatically install a package with that name from the npm registry and invoke it. When it’s done, the installed package won’t be anywhere in the global, so you won’t have to worry about pollution in the long-term. For example, `npx create-react-app my-app` will generate a react app boilerplate within the path the command had run in, and ensures that you always use the latest version of the package without having to upgrade each time you’re about to use it. There’s an [awesome-npx](https://github.com/junosuarez/awesome-npx) repo with examples of things that work great with npx.

npm will cache the packages in the directory `~/.npm/_npx`. The whole point of npx is that you can run the packages without installing them somewhere permanent. So I wouldn't use that cache location for anything. I wouldn't be surprised if cache entries were cleared from time to time. I don't know what algorithm, if any, npx uses for time-based cache invalidation.

### npm init and exec
`npm init <initializer>` can be used to set up a npm package. `initializer` in this case is an npm package named `create-<initializer>`, which will be installed by `npm exec`. The init command is transformed to a corresponding `npm exec` operation like `npm init foo` -> `npm exec create-foo`. Another example is `npm init react-app myapp`, which is same as `npx create-react-app myapp`. If the initializer is omitted (by just calling `npm init`), init will fall back to legacy init behavior. It will ask you a bunch of questions, and then write a `package.json` for you. You can also use `-y/--yes` to skip the questionnaire altogether.

npm 7 introduced the new `npm exec` command which, like npx, provided an easy way to run npm scripts on the fly. If the package is not present in the local project dependencies, `npm exec` installs the required package and its dependencies to a folder in the npm cache. With the introduction of `npm exec`, npx had been rewritten to use `npm exec` under the hood in a backwards compatible way.

### npm logs and cache
You can find the `npm-debug.log` file in your `.npm` directory. To find your `.npm` directory, use `npm config get cache`. **(It is located in ~/.npm so shared accross nodejs versions that nvm installed.)** The default location of the logs directory is a directory named `_logs` inside the npm cache. 

npm stores cache data in an opaque directory in `.npm`, named `_cacache`. `npm cache verify` is used to verify the contents of the cache folder, garbage collecting any unneeded data, and verifying the integrity of the cache index and all cached data.

### npm link
1. Run `npm link` from your `MyModule` directory: this will create a global package `{prefix}/node/{version}/lib/node_modules/<package>` symlinked to the `MyModule` directory.
2. Run `npm link MyModule` from your `MyApp` directory: this will create a `MyModule` folder in `node_modules` symlinked to the globally-installed package and thus to the real location of `MyModule`.
3. Now any changes to `MyModule` will be reflected in `MyApp/node_modules/MyModule/`. Use `npm ls -g --depth=0 --link` to list all the globally linked modules.

### publish npm packages
Learn how to create a new npm package and publish the code to npm by the demo [Building a business card CLI tool](https://whitep4nth3r.com/blog/build-a-business-card-cli-tool). Once your package is published to npm, you can run `npx {your-command}` to execute your script whenever you like.

### npm and pnpm
The very first package manager ever released was npm, back in January 2010. In 2020, GitHub acquired npm, so in principle, npm is now under the stewardship of Microsoft. *(npm should never be capitalized unless it is being displayed in a location that is customarily all-capitals.)*

npm handles the dependencies by splitting the installation process into three phases: `Resolving -> Fetching -> Linking`. Each phase needs to end for the next one to begin.

pnpm was released in 2017. It is a drop-in replacement for npm, so if you have an npm project, you can use pnpm right away. The main problem the creators of pnpm had with npm was the redundant storage of dependencies that were used across projects. 1) The way npm manages the disc space is not efficient. 2) pnpm doesn’t have the blocking stages of installation - the processes run for each of the packages independently.

Traditionally, npm installed dependencies in a flat `node_modules` folder. On the other hand, pnpm manages `node_modules` by using hard linking and symbolic linking to a global on-disk content-addressable store. It results in a nested `node_modules` folder that stores packages in a global store on your home folder (`~/.pnpm-store/`). Every version of a dependency is physically stored in that folder only once, constituting a single source of truth. pnpm identifies the files by a hash id (also called "content integrity" or "checksum") and not by the filename, which means that two same files will have identical hash id and pnpm will determine that there’s no reason for duplication.

<img alt="pnpm" src="https://tva1.sinaimg.cn/large/008vxvgGly1h7aw9ablr4j30vm0u0q5z.jpg" width="700" />

### npm scripts
npm scripts are a set of built-in and custom scripts defined in the `package.json` file. Their goal is to provide a simple way to execute repetitive tasks.

- npm makes all your dependencies' binaries available in the scripts. So you can access them directly as if they were referenced in your PATH. For example, instead of doing `./node_modules/.bin/eslint .`, you can use `eslint .` as the lint script.
- `npm run` is an alias for `npm run-script`, meaning you could also use `npm run-script lint`.
- Built-in scripts can be executed using aliases, making the complete command shorter and easier to remember. For example, `npm run-script test`, `npm run test`, `npm test`, and `npm t` are same to run the test script. `npm run-script start`, `npm run start`, and `npm start` are also same.
- Run `npm run` if you forget what npm scripts are available. This produces a list of scripts, and displays the code that each script runs.
- We can use `&&` to run multiple scripts sequentially. For example, `npm run lint && npm test`.
- When a script finishes with a non-zero exit code, it means an error occurred while running the script, and the execution is terminated.
- Use `npm run <script> --silent` to reduce logs and to prevent the script from throwing an error. This can be helpful when you want to run a script that you know may fail, but you don't want it to throw an error. Maybe in a CI pipeline, you want your whole pipeline to keep running even when the test command fails.
- We can create "pre" and "post" scripts for any of our scripts, and npm will automatically run them in order.
  ```json
  {
    "scripts": {
      "prefoo": "echo prefoo",
      "foo": "echo foo",
      "postfoo": "echo postfoo"
    }
  }
  ```
- You can run **`npm config ls -l` to get a list of the configuration parameters**, and you can use `$npm_config_` prefix (like `$npm_config_editor`) to access them in the scripts. Any key-value pairs we add to our script will be translated into an environment variable with the `npm_config` prefix.
  ```json
  {
    "scripts": {
      "hello": "echo \"Hello $npm_config_firstname\""
    }
  }

  // Output: "Hello Paula"
  npm run hello --firstname=Paula
  ```
- Passing arguments to other npm scripts, we can leverage the `--` separator. e.g. `"pass-flags-to-other-script": "npm run my-script -- --watch"` will pass the `--watch` flag to the `my-script` command.
- One convention that you may have seen is using a prefix and a colon to group scripts, for example `build:dev` and `build:prod`. This can be helpful to create groups of scripts that are easier to identify by their prefixes.