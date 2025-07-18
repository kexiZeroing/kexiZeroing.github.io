---
title: "Run MySQL locally and use Prisma"
description: ""
added: "Aug 7 2024"
tags: [web, code]
updatedDate: "May 20 2025"
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
# If you want to run PostgreSQL on Docker
# https://masteringpostgres.com/articles/how-to-install-postgresql
docker run --name my-postgres-name -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:17
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
npm install prisma @prisma/client
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

## Use Prisma in Next.js

```
Next.js Server(server components, server actions, API route) <--> ORM (Prisma) <--> Database
```

Running `npx prisma init --datasource-provider sqlite` creates a new prisma directory with a `schema.prisma` file. You're now ready to model your data.

```
# This is your Prisma schema file

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}
```

```
1. one-to-many relationship

model User {
  id     Int     @id @default(autoincrement())
  posts  Post[]
}

model Post {
  id        Int    @id @default(autoincrement())
  author    User   @relation(fields: [authorId], references: [id])
  authorId  Int
}

Note: "author" will not become a column in the database.
The way to read this is that "authorId" field references the "id" field on the User model.
```

```
2. many-to-many relationship

model User {
  id     Int     @id @default(autoincrement())
  posts  Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  authors  User[]
}
```

```
3. one-to-one relationship
model User {
  id     Int      @id @default(autoincrement())
  post   Post?
}

model Post {
  id        Int   @id @default(autoincrement())
  author    User  @relation(fields: [authorId], references: [id])
  authorId  Int   @unique
}
```

Prisma ORM is not your database. Running `npx prisma db push` first time will create SQLite database `dev.db` that in sync with your schema. `npx prisma studio` shows you a UI what's in the database, and you can manually add a record there.

Now that we have a database with some initial data, we can set up Prisma Client and connect it to our database. For [Next.js integration](https://www.prisma.io/docs/guides/nextjs), add a `lib/prisma.ts` file which creates a Prisma Client (`@prisma/client`) and attaches it to the global object.

```js
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

> When working with a framework like Next.js, it is important to use a singleton pattern for the Prisma Client instance. Otherwise, you may run into issues with hot reloading and multiple instances of the Prisma Client in development mode.

```js
import prisma from '@/lib/prisma'

export default async function Home() {
  const posts = await prisma.post.findMany();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

```js
// more CRUD
const posts = await prisma.post.findMany({
  where: {
    published: true,
    title: {
      contains: "First"
    }
  },
  orderBy: {
    createdAt: "desc"
  },
  select: {
    id: true,
    title: true,
  },
  // offset pagination (e.g. get page 2, each page has 10 posts)
  take: 10,
  skip: 10,
});

const user = await prisma.user.findUnique({
  where: {
    email: "test@gmail.com"
  },
  include: {
    posts: true
  }
})
```
