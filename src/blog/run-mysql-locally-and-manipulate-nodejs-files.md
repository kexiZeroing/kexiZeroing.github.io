---
title: "Run MySQL locally and some Node.js operations"
description: ""
added: "Aug 7 2024"
tags: [code]
updatedDate: "Sep 24 2024"
---

## Run MySQL locally and query it with Express
This is a text version of Tejas Kumar's video, ["How to run MySQL locally and query it with Express"](https://www.youtube.com/watch?v=lnmldUslD1U).

```sh
# allowing MySQL to start without a root password
docker run -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 3306:3306 mysql:latest
# docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag

docker ps
# start an interactive bash shell session in the running Docker container
docker exec -it ba76bef03590 bash -l
```

```sh
[root@ba76bef03590 /]# mysql

mysql> SHOW DATABASES;
mysql> CREATE DATABASE todos;
mysql> USE todos;

mysql> CREATE TABLE todos (
  id INT NOT NULL AUTO_INCREMENT,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id)
);

mysql> SHOW TABLES;

mysql> INSERT INTO todos (label) VALUES ('Walk the dog');
mysql> INSERT INTO todos (label) VALUES ('Wash the car');

mysql> SELECT * FROM todos;
```

```sh
mkdir hello-prisma
cd hello-prisma

npm init -y
npm install prisma
npx prisma init
```

```js
// Set the DATABASE_URL in the `.env` file to point to your existing database.
DATABASE_URL="mysql://root:@localhost:3306/todos"

// Set the provider of the datasource block in `prisma/schema.prisma` to match your database.
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

```sh
# Turn your database schema into a Prisma schema.
npx prisma db pull

# Generate Prisma Client. You can then start querying your database.
npx prisma generate
```

```js
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const client = new PrismaClient();

app.use(express.json());

app.get("/todos", async (req, res) => {
  const todos = await client.todos.findMany();
  res.json(todos);
});

app.get("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const todo = await client.todos.findUnique({
    where: { id: parseInt(id) },
  });
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).json({ error: "Todo not found" });
  }
});

app.post("/todos", async (req, res) => {
  const { label } = req.body;
  const newTodo = await client.todos.create({
    data: { label },
  });
  res.status(201).json(newTodo);
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
```

## Manipulate Node.js files
The `node:fs` module enables interacting with the file system in a way modeled on standard POSIX functions. You can either use the callback APIs or use the promise-based APIs.

> A file descriptor is a way of representing an open file in a computer operating system. It's like a special number that identifies the file, and the operating system uses it to keep track of what's happening to the file. You can use the file descriptor to read, write, move around in the file, and close it. In a runtime like Node.js, the `fs` module abstracts the direct use of file descriptors by providing a more user-friendly API, but it still relies on them behind the scenes to manage file operations.

```js
const fs = require("node:fs/promises");
async function open_file() {
  try {
    const file_handle = await fs.open("test.js", "r", fs.constants.O_RDONLY);
    console.log(file_handle.fd); // Print the value of the file descriptor `fd`
  } catch (err) {
    // i.e. ENOENT error stands for "Error NO ENTry" (File in path doesn't exist)
  }
}
```

Using `__dirname` and the `path` module ensures that you are referencing the correct path regardless of the current working directory you’re in. `__dirname` represents the absolute path of the directory containing the current JavaScript file. `path.join()` method joins all given path segments together using the platform-specific separator as a delimiter, then normalizes the resulting path.

```js
import fs from 'node:fs/promises';
import path from 'node:path';

try {
  const filePath = path.join(__dirname, 'test.txt');
  const stats = await fs.stat(filePath);
  stats.isFile(); // true
  stats.isDirectory(); // false
  stats.isSymbolicLink(); // false
  stats.size; // 1024000 //= 1MB
} catch (err) {
  console.log(err);
}
```

```js
import fs from 'node:fs';
fs.readFile('/Users/joe/test.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

import fs from 'node:fs/promises';
try {
  const data = await fs.readFile('/Users/joe/test.txt', { encoding: 'utf8' });
  console.log(data);
} catch (err) {
  console.log(err);
}
```

```js
const fs = require('node:fs/promises');
try {
  const content = 'Some content!';
  await fs.writeFile('/Users/joe/test.txt', content);
} catch (err) {
  console.log(err);
}

const fs = require('node:fs/promises');
try {
  const content = 'Some content!';
  await fs.appendFile('/Users/joe/test.txt', content);
} catch (err) {
  console.log(err);
}
```

## Memory Usage in Node.js (V8)
- RSS (Resident Set Size): Total memory allocated for the Node.js process, including all parts of the memory: code, stack, and heap.
- Heap Total: Memory allocated for JavaScript objects. This is the total size of the allocated heap.
- Heap Used: Memory actually used by the JavaScript objects. This shows how much of the heap is currently in use.
- External: Memory used by C++ objects that are linked to JavaScript objects. This memory is managed outside the V8 heap.
- Array Buffers: Memory allocated for ArrayBuffer objects, which are used to store fixed-length binary data.

```js
console.log('Initial Memory Usage:', process.memoryUsage());

setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`RSS: ${memoryUsage.rss}`);
}, 1000);

// Initial Memory Usage: {
//   rss: 38502400,
//   heapTotal: 4702208,
//   heapUsed: 2559000,
//   external: 1089863,
//   arrayBuffers: 10515
// }
```
