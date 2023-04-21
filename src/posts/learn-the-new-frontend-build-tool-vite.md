---
layout: "../layouts/BlogPost.astro"
title: "Learn the new frontend build tool Vite"
slug: learn-the-new-frontend-build-tool-vite
description: ""
added: "Jan 29 2022"
tags: [web]
updatedDate: "Mar 22 2023"
---

## Next Generation Frontend Tooling
> When I need multiple different pages and create a React app that needs a backend, my go-to framework is `Next.js`. But sometimes I just want to create a React app, maybe for a demo or to start a project. I used to use `create-react-app` but these days I use `Vite`.

Use [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) to start a Vite project by running `npm init vite@latest`. You can also try Vite online on [StackBlitz](https://vite.new).

Vite consists of two major parts:
- A dev server that serves your source files over native ES modules, with rich built-in features and fast Hot Module Replacement (HMR). It only needs to transform and serve source code on demand, as the browser requests it. When you debug with Vite, just looking at the network tab and every module is a request here because it doesn't concatenate everything.

  > `esbuild`, which is written in Go, 10-100x faster than JavaScript-based bundlers, does the transpile things transforming into plain javascript. It will process and prebundle the dependencies into something works in the browser as native es-module. `vite --force` will ignore the dependency cache and reforce to process all the dependencies.

- A build command that bundles your code with Rollup, pre-configured to output highly optimized static assets for production. (Rollup is a more battle-tested choice in bundling applications)

Once you've built the app, you may test it locally by running `npm run preview` command. It will boot up a local static web server that serves the files from `dist` at `http://localhost:4173`. It's an easy way to check if the production build looks OK in your local environment.

## Webpack and Vite
When you start the app in development, Webpack will bundle all of your code, and start the webpack-dev-server, the Express.js web server which will serve the bundled code. Within the bundled js file contains all modules for the app and need to regenerate the entire file when we change a file for HMR. It can often take an long wait to spin up a dev server, and even with HMR, file edits can take a couple seconds to be reflected in the browser.

Vite doesn't set out to be a new bundler. Rather, it's a pre-configured build environment using the Rollup bundler and a tool for local development. Vite [pre-bundles dependencies](https://vitejs.dev/guide/dep-pre-bundling.html) in development mode using esbuild.

Vite only support ES Modules, and parsing the native ES Modules means it will read the `export` and `import` lines from your code. It will convert those lines into HTTP requests back to the server, where it will again read the `export` and `import` lines and make new requests. Vite also leverages HTTP headers to speed up full page reloads: source code module requests are made conditional via `304 Not Modified`, and dependency module requests are strongly cached via `Cache-Control` header.

<img alt="webpack" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vOhrAly1hc08w7udwkj31a20jmabm.jpg" width="600">

<img alt="vite" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vOhrAly1hc08w9irx0j313w0hwmyf.jpg" width="600">

> Webpack
> - supported modules: ES Modules, CommonJS and AMD Modules
> - dev-server: bundled modules served via webpack-dev-server using Express.js web server
> - production build: webpack
> 
> Vite
> - supported modules: ES Modules
> - dev-server: native ES Modules served via Vite using Koa web server
> - production build: Rollup

## Features

### NPM Dependency Resolving
- Pre-bundle them to improve page loading speed and convert CommonJS / UMD modules to ESM. The pre-bundling step is performed with esbuild.
- Rewrite the imports to valid URLs like `/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd` so that the browser can import them properly.
- Vite caches dependency requests via HTTP headers.

### TypeScript
- Vite supports importing `.ts` files out of the box.
- Only performs transpilation on `.ts` files and does NOT perform type checking. It assumes type checking is taken care of by your IDE and build process.
- Vite uses esbuild to transpile TypeScript into JavaScript which is about 20~30x faster than vanilla `tsc`.

### CSS
- Importing `.css` files will inject its content to the page via a `<style>` tag with HMR support.
- Vite is pre-configured to support CSS `@import` inlining via `postcss-import`.
- Vite does provide built-in support for `.scss`, `.sass`, `.less`, `.stylus` files. There is no need to install Vite-specific plugins for them, but the corresponding pre-processor itself must be installed.

### Static Assets
- Importing a static asset will return the resolved public URL when it is served. For example, imgUrl will be `/img.png` during development, and become `/assets/img.2d8efhg.png` in the production build. `url()` references in CSS are handled the same way.
- Common image, media, and font filetypes are detected as assets automatically.
- If you have assets that are must retain the exact same file name (without hashing) or you simply don't want to have to import an asset first just to get its URL, then you can place the asset in a special `public` directory under your project root. **Assets in this directory will be served at root path `/` during dev, and copied to the root of the dist directory as-is**.

## Configuring Vite
When running vite from the command line, Vite will automatically try to resolve a config file named `vite.config.js` inside project root.

If the config needs to conditionally determine options based on the command (`dev`/`serve` or `build`), it can export a function instead. In Vite's API the `command` value is `serve` during dev (in the cli `vite`, `vite dev`, and `vite serve` are aliases), and `build` when building for production. For a full list of CLI options, run `npx vite --help` in your project.

- Environmental Variables can be obtained from `process.env` as usual.
- `root` is project root directory where `index.html` is located, default is `process.cwd()`.
- `server.port` to specify server port, default is `5173`.
- `server.proxy` to configure custom proxy rules for the dev server.
- `build.outDir` to specify the output directory, default is `dist`.

More about Vite config: https://vitejs.dev/config

## Using Plugins
Vite can be extended using [plugins](https://vitejs.dev/plugins), which are based on Rollup's well-designed plugin interface with a few extra Vite-specific options. To use a plugin, it needs to be added to the `devDependencies` of the project and included in the plugins array in the `vite.config.js` config file. 

Vite aims to provide out-of-the-box support for common web development patterns. A lot of the cases where a plugin would be needed in a Rollup project (https://github.com/rollup/plugins) are already covered in Vite. You can also check out [awesome-vite plugins](https://github.com/vitejs/awesome-vite#plugins) from the community.

## Env Variables
Vite exposes env variables on the special `import.meta.env` object. Some built-in variables are available in all cases like `import.meta.env.MODE`.

Vite uses dotenv (`.env`) to load additional environment variables, and the loaded env variables are also exposed to your client source code via `import.meta.env`. To prevent accidentally leaking env variables to the client, only variables prefixed with `VITE_` are exposed to your Vite-processed code.

## Dynamic Image URL
`import.meta.url` is a native ESM feature that exposes the current module's URL. Combining it with the native [URL constructor](https://developer.mozilla.org/en-US/docs/Web/API/URL), we can obtain the full, resolved URL of a static asset using relative path from a JavaScript module.

```vue
<script setup>
// https://stackoverflow.com/questions/66419471/vue-3-vite-dynamic-image-src
const imageUrl = new URL(`./dir/${name}.png`, import.meta.url).href
</script>

<template>
  <img :src="imageUrl" alt="img" />
</template>
```
