---
layout: "../layouts/BlogPost.astro"
title: "Run MySQL locally and query it with Express"
slug: run-mysql-locally-and-query-it-with-express
description: ""
added: "Aug 7 2024"
tags: [code]
---

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
