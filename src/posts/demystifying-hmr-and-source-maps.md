---
layout: "../layouts/BlogPost.astro"
title: "Demystifying HMR and Source Maps"
slug: demystifying-hmr-and-source-maps
description: ""
added: "Aug 24 2024"
tags: [web, code]
---

## Hot Module Replacement
HMR is a feature used in development that enables real-time updates to modules in a running application without requiring a full page reload.

Take webpack as an example, `webpack-dev-server` (WDS) inserts some code in the bundle that we call “WDS client”, because it must tell the client when a file has changed and new code can be loaded. WDS server does this by opening a websocket connection to the WDS client on page load. When the WDS client receives the websocket messages, it tells the HMR runtime to download the new manifest of the new module and the actual code for that module that has changed.

```js
// https://github.com/lmiller1990/build-your-own-vite
// 1. inject client.js code into the bundle
// 2. ws connection between client and server
// 3. server side use `chokidar` to watch the files change and send ws message
// 4. client dynamically import the updated file

// server.js
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";

import express from "express";
import chokidar from "chokidar";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const ws = new WebSocketServer({
  server,
});

let socket;

ws.on("connection", (_socket) => {
  console.log("ws connected...");
  socket = _socket;
});

const watcher = chokidar.watch("src/*.js");

watcher.on("change", (file) => {
  const payload = JSON.stringify({
    type: "file:changed",
    file: `/${file}`,
  });
  socket.send(payload);
});

const hmrMiddleware = async (req, res, next) => {
  // only process js files
  if (!req.url.endsWith(".js")) {
    return next();
  }

  let client = await fs.readFile(path.join(process.cwd(), "client.js"), "utf8");
  let content = await fs.readFile(path.join(process.cwd(), req.url), "utf8");

  // `import.meta` provides information about the current module
  content = `
    ${client}

    hmrClient(import.meta)

    ${content}
  `;

  res.type(".js");  // "application/javascript"
  res.send(content);
};

app.use(hmrMiddleware);
app.use(express.static(process.cwd()));

server.listen(8080, () => console.log("Listening on port 8080"));
```

```js
// client.js
class HotModule {
  file;
  cb;

  constructor(file) {
    this.file = file;
  }

  accept(cb) {
    this.cb = cb;
  }

  handleAccept() {
    if (!this.cb) {
      return;
    }

    import(`${this.file}?t=${Date.now()}`).then((newMod) => {
      this.cb(newMod);
    });
  }
}

window.hotModules ??= new Map();

function hmrClient(mod) {
  const url = new URL(mod.url);
  const hot = new HotModule(url.pathname);

  import.meta.hot = hot;
  window.hotModules.set(url.pathname, hot);
}

if (!window.ws) {
  const ws = new window.WebSocket("ws://localhost:8080");

  ws.addEventListener("message", (msg) => {
    const data = JSON.parse(msg.data);
    const mod = window.hotModules.get(data.file);

    mod.handleAccept();
  });

  window.ws = ws;
}
```

```js
// framework code
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Handle updates
      // console.log(`Handling hot reload accept for ${import.meta.url}`);
    }
  });
}
```

Here's what happens:
1. When you make changes to a file (e.g., src/module.js), the server detects the change.
2. The server sends a WebSocket message to the client.
3. The client receives the message and triggers the `handleAccept` method of the corresponding HotModule.
4. This re-imports the updated module and calls the callback function you provided in `import.meta.hot.accept`. (Only use `import.meta.hot.accept` in development environments, as it won't be available in production builds.)

The manual HMR API is primarily intended for framework and tooling authors. As an end user, HMR is likely already handled for you in the framework specific starter templates. For example, when you create an app via `create-vite`, the selected templates (e.g. using @vitejs/plugin-vue, @vitejs/plugin-react, etc.) would have these pre-configured for you already.

## Source Maps
Compressing the code can make debugging more difficult - The code you write is not the code you run. Source maps remove this problem by mapping your compiled code back to the original code, they can help you quickly find the source of an error.

Once you've compiled and minified your code, normally alongside it will exist a sourceMap file (for example, `example.min.js.map` and `styles.css.map`). The bundler will add a source map location comment `//# sourceMappingURL=/path/to/file.js.map` at the end of every generated bundle, which is required to signify to the browser devtools that a source map is available. Another type of source map is inline which has a base64 data URL like `# sourceMappingURL=data:application/json;base64,xxx...`

Here's an example of a source map:
```js
{
  "version": 3,
  "file": "example.min.js.map",
  "names": ["document","querySelector", ...],
  "sources": ["src/script.ts"],
  "sourcesContent": ["document.querySelector('button')..."],
  "mappings": "AAAAA,SAASC,cAAc,WAAWC, ...",
}
```

The most important part of a source map is the `mappings` field. It uses encoded strings to map lines and locations in the compiled file to the corresponding original file.

```
step 1: Convert base64 (A-Za-z0-9+/) to binary. Ending with 1 means negative
AAKA -> 000000 000000 001010 000000

step 2: Ignore the first and last bits
AAKA -> 0000 0000 0101 0000

step 3: Convert to base 10
AAKA -> 0 0 5 0

The number means: col 0 is mapping to source[0] line 5, col 0

SAAMA -> 9 0 0 6 0
The numbers are relative to the previous mapping. The last extra number maps to `names` field.
It means: col 9 is mapping to source[0] line 5, col 6
```

You can view this mapping using a source map visualizer like [source-map-visualization](https://sokra.github.io/source-map-visualization). For example, the entry `65 -> 2:2` means:
- Generated code: The word `const` starts at position 65 in the compressed content.
- Original code: The word `const` starts at line 2 and column 2 in the original content.

> Source mappings aren't always as complete as you need them to be. For example, a variable can be optimized away during the build process. In this case, when you debug the code, developer tools might not be able to infer and display the actual value.

Source maps support custom extension fields that start with an `x_` prefix. Chrome DevTools parses the `x_google_ignoreList` field in source maps to filter out generated code and let web developers focus only on the code they author.

```js
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
}
```
