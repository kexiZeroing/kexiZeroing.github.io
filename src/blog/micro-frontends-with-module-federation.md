---
title: "Micro-frontends with Module Federation"
description: ""
added: "Jan 27 2024"
tags: [web]
---

Module Federation provides a solution to the scaling problem by allowing a SPA to be sliced into multiple smaller remote applications that are built independently. It has become more popular in recent years since the addition of the `ModuleFederationPlugin` in Webpack.

```js
// webpack.config.js for a remote app
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'remoteApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
};

// webpack.config.js for a host app
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'hostApp',
      remotes: {
        remoteApp: 'remoteApp@http://localhost:3001/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
};
```

Module Federation introduces three terms for the applications that make up the Module Federation architecture: host, remote and federated modules.

- A **remote** is an application that exposes a federated module that can be fetched over the network at runtime.
- A **host** is an application that consumes federated modules from remote applications at runtime. When you write your host application, you import the module from your remote as though it was part of the build, but at build time, Webpack is aware that this module will only exist at runtime.
- A **federated module** is any valid JavaScript module that is exposed by a remote application with the aim that it will be consumed by a host application. This means that React Components, Angular Components, Services, Application State, Functions, UI Components and more can be shared between applications and updated without the need to redeploy everything.

- https://github.com/module-federation/module-federation-examples
- https://github.com/originjs/vite-plugin-federation
- https://www.youtube.com/watch?v=32_EikGKESk
