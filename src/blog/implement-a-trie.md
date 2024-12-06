---
title: "Implement a Trie"
description: ""
added: "Sep 19 2024"
tags: [code]
updatedDate: "Sep 21 2024"
---

Trie is a tree-like data structure that stores a dynamic set of strings, typically used to facilitate operations like searching, insertion, and deletion. Tries are particularly useful for tasks that require quick lookups of strings with a common prefix, such as in text autocomplete or in a Router implementation to find the matching paths.

The complexity of creating a trie is O(W*L), where W is the number of words, and L is an average length of the word. Same goes for looking up words later: you perform L steps for each of the W words.

```js
class TrieNode {
  isEndOfWord = false;
  children = new Map();
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, node = this.root) {
    const wordLength = word.length;
    if (wordLength === 0) return;

    for (let idx = 0; idx < wordLength; idx++) {
      let char = word[idx];

      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }

      node = node.children.get(char);
    }

    node.isEndOfWord = true;
  }

  search(word) {
    let currentNode = this.root;

    for (let idx = 0; idx < word.length; idx++) {
      let char = word[idx];
      if (currentNode.children.has(char)) {
        currentNode = currentNode.children.get(char);
      } else {
        return false;
      }
    }

    return currentNode.isEndOfWord;
  }
}
```

We can further enhance its capabilities by extending it to implement a **Trie-based router** for matching URL patterns.

```js
const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

class RouteNode {
  constructor() {
    this.children = new Map();
    this.handler = new Map();
    this.params = [];
  }
}

class Router {
  constructor() {
    this.root = new RouteNode();
  }

  #addRoute(path, method, handler) {
    if (typeof path !== "string" || path[0] !== "/") throw new Error("Malformed path provided.");
    if (typeof handler !== "function") throw new Error("Handler should be a function");
    if (!HTTP_METHODS[method]) throw new Error("Invalid HTTP Method");

    let currentNode = this.root;
    let routeParts = path.split("/").filter(Boolean);
    let dynamicParams = [];

    for (const segment of routeParts) {
      if (segment.includes(" ")) throw new Error("Malformed `path` parameter");

      const isDynamic = segment[0] === ":";
      const key = isDynamic ? ":" : segment.toLowerCase();

      if (isDynamic) {
        dynamicParams.push(segment.substring(1));
      }

      if (!currentNode.children.has(key)) {
        currentNode.children.set(key, new RouteNode());
      }

      currentNode = currentNode.children.get(key);
    }

    currentNode.handler.set(method, handler);
    currentNode.params = dynamicParams;  // store the params on the leaf node
  }

  findRoute(path, method) {
    const indexOfDelimiter = path.indexOf("?");
    let _path, querySegment;

    if (indexOfDelimiter !== -1) {
      _path = path.substring(0, indexOfDelimiter);
      querySegment = path.substring(indexOfDelimiter + 1);
    } else {
      _path = path;
    }

    let segments = _path.split("/").filter(Boolean);
    let currentNode = this.root;
    let extractedParams = [];

    for (let idx = 0; idx < segments.length; idx++) {
      const segment = segments[idx];

      let childNode = currentNode.children.get(segment.toLowerCase());
      if (childNode) {
        currentNode = childNode;
      } else if ((childNode = currentNode.children.get(":"))) {
        extractedParams.push(segment);
        currentNode = childNode;
      } else {
        return null;
      }
    }

    let params = Object.create(null);
    for (let idx = 0; idx < extractedParams.length; idx++) {
      let key = currentNode.params[idx];
      let value = extractedParams[idx];

      params[key] = value;
    }

    let query = querySegment ? this.#parseQueryParams(querySegment) : {};

    // Input: "/users/:userId"
    // Output: { params: { userId: '123' }, handler: <handler_function> }
    return {
      params,
      query,
      handler: currentNode.handler.get(method),
    };
  }

  #parseQueryParams(queryString) {
    if (!queryString) return {};

    const params = {};
    const searchParams = new URLSearchParams(queryString);
    // URLSearchParams objects are iterable
    for (const [key, value] of searchParams) {
      params[key] = decodeURIComponent(value);
    }
    return params;
  }

  get(path, handler) {
    this.#addRoute(path, HTTP_METHODS.GET, handler);
  }

  post(path, handler) {
    this.#addRoute(path, HTTP_METHODS.POST, handler);
  }

  put(path, handler) {
    this.#addRoute(path, HTTP_METHODS.PUT, handler);
  }

  delete(path, handler) {
    this.#addRoute(path, HTTP_METHODS.DELETE, handler);
  }
}
```

```js
const http = require('node:http');
const Router = require('./router');

function run(router, port) {
  http.createServer((req, res) => {
    const route = router.findRoute(req.url, req.method);

    if (route?.handler) {
      req.params = route.params || {};
      req.query = route.query || {};
      route.handler(req, res);
    } else {
      res.writeHead(404).end('Not Found');
    }
  }).listen(port);
}
```