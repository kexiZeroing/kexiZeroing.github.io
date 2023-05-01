---
layout: "../layouts/BlogPost.astro"
title: "A Dockerfile for a NodeJS application"
slug: dockerfile-for-a-nodejs-application
description: ""
added: "Mar 12 2023"
tags: [devops]
updatedDate: "Mar 12 2023"
---

This is a valid Dockerfile for a NodeJS application. But we can improve it a lot.

```
FROM node

COPY . .

RUN npm install

CMD [ "node", "index.js" ]
```

1. Use explicit Docker base image tags. By specifying the `FROM node`, you always build the latest version of the Docker image that has been built by the Node.js Docker working group. The shortcomings of building based on the default node image are:
   - Docker image builds are inconsistent.
   - The node Docker image is based on a full-fledged operating system, full of libraries and tools that you may or may not need to run your Node.js application.

```
# Pin specific version and reduce image size
FROM node:19.7.0-bullseye-slim
```

2. Set the working directory to provide a dedicated place in the filesystem with your app. By default, the working directory would be the root path (/) but you should set it to something else based on the conventions of your specific language and framework.

```
FROM node:19.7.0-bullseye-slim

# Specify working directory other than /
WORKDIR /usr/src/app
```

3. COPY our `package.json` and `package-lock.json` files separate from the source code. Docker images are cached at each layer. When building an image, Docker steps through the instructions in the Dockerfile, executing each in the order specified. As each instruction is examined, Docker looks for an existing image in its cache that it can reuse, rather than creating a new, duplicate image. This way, `RUN npm install` is only re-executed if the `package.json` or `package-lock.json` files have changed.

> For the `ADD` and `COPY` instructions, the contents of each file in the image are examined and a checksum is calculated for each file. Aside from the `ADD` and `COPY` commands, just the command string itself is used to find a match. Once the cache is invalidated, all subsequent Dockerfile commands generate new images and the cache isn’t used.

```
FROM node:19.7.0-bullseye-slim

WORKDIR /usr/src/app

# Copy only files required to install dependencies
COPY package*.json ./

RUN npm install

# Copy remaining source code AFTER installing dependencies. 
COPY ./src/ .

CMD [ "node", "index.js" ]
```

4. By default, Docker runs commands inside the container as root which violates the Principle of Least Privilege when superuser permissions are not strictly required. You want to run the container as an unprivileged user whenever possible. The node images provide the `node` user for such purpose. 

```
FROM node:19.7.0-bullseye-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Use non-root user
# Use --chown on COPY commands to set file permissions
USER node

COPY --chown=node:node ./src/ .

CMD [ "node", "index.js" ]
```

5. Configure the app for production. The `NODE_ENV=production` environment changes how certain utilities behave, increasing performance. Using `npm ci` instead of `npm install` ensures a reproduceable build, and `--only=production` prevents installing needed dev dependencies.

> By default, `npm install` will install all modules listed as dependencies in `package.json`. With the `--production` flag (or when the `NODE_ENV` environment variable is set to `production`), npm will not install modules listed in `devDependencies`. To install all modules listed in both `dependencies` and `devDependencies` when `NODE_ENV` is set to `production`, you can use `--production=false`.

```
FROM node:19.7.0-bullseye-slim

# Set NODE_ENV
ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

# Only install production dependencies
RUN npm ci --only=production

USER node

COPY --chown=node:node ./src/ .

CMD [ "node", "index.js" ]
```

6. Use the EXPOSE instruction. EXPOSE documents to users of the image which port the application expects to be listening on. You will still need to publish the port at runtime, but this makes it clear to end users what to expect.

```
FROM node:19.7.0-bullseye-slim

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

USER node

COPY --chown=node:node ./src/ .

# Indicate expected port
EXPOSE 3000

CMD [ "node", "index.js" ]
```

7. Use a `.dockerignore` file to ensure you are not COPYing unnecessary files into the container image.
   - Skip potentially modified copies of `node_modules/` in the Docker image.
   - It helps speed up Docker builds because it ignores files that would have otherwise caused a cache invalidation.

```
node_modules
.env
/build
/coverage
/.vscode
prisma/sqlite.db
prisma/sqlite.db-journal
Dockerfile
.dockerignore
.git
```

More to read: 
- https://nodejs.org/en/docs/guides/nodejs-docker-webapp
- https://robertcooper.me/post/docker-guide
- https://github.com/sidpalas/devops-directive-docker-course
- https://www.epicweb.dev/tutorials/deploy-web-applications
