---
layout: "../layouts/BlogPost.astro"
title: "A Dockerfile for a NodeJS application"
slug: dockerfile-for-a-nodejs-application
description: ""
added: "Mar 12 2023"
tags: [devops]
updatedDate: "Feb 1 2024"
---

Docker is the most popular container technology tool. It is a tool used for building, running, and deploying containerized applications. An application’s code, libraries, tools, dependencies, and other files are all contained in a Docker image; when a user executes an image, it turns into a container. Docker-compose is a tool that accepts a YAML file that specifies a cross container application and automates the creation and removal of all those containers without the need to write several docker commands for each one.

This is a valid Dockerfile for a NodeJS application. But we can improve it a lot.

```dockerfile
FROM node

COPY . .

RUN npm install

CMD [ "node", "index.js" ]
```

1. Use explicit Docker base image tags. By specifying the `FROM node`, you always build the latest version of the Docker image that has been built by the Node.js Docker working group. The shortcoming of building based on the default node image is that docker image builds are inconsistent. Also, the node Docker image is based on a full-fledged operating system, full of libraries and tools that you may or may not need to run your Node.js application.

```dockerfile
# Pin specific version and reduce image size
FROM node:19.7.0-bullseye-slim
```

2. Set the working directory to provide a dedicated place in the filesystem with your app. By default, the working directory would be the root path (/) but you should set it to something else based on the conventions of your specific language and framework.

```dockerfile
FROM node:19.7.0-bullseye-slim

# Specify working directory other than /
WORKDIR /usr/src/app
```

3. COPY our `package.json` and `package-lock.json` files separate from the source code. Docker images are cached at each layer. When building an image, Docker steps through the instructions in the Dockerfile, executing each in the order specified. As each instruction is examined, Docker looks for an existing image in its cache that it can reuse, rather than creating a new, duplicate image. This way, `RUN npm install` is only re-executed if the `package.json` or `package-lock.json` files have changed.

> For the `ADD` and `COPY` instructions, the contents of each file in the image are examined and a checksum is calculated for each file. Aside from the `ADD` and `COPY` commands, just the command string itself is used to find a match. Once the cache is invalidated, all subsequent Dockerfile commands generate new images and the cache isn’t used.

```dockerfile
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

```dockerfile
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

```dockerfile
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

```dockerfile
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

7. Use a `.dockerignore` file to ensure you are not COPYing unnecessary files into the container image. This helps speed up Docker builds because it ignores files that would have otherwise caused a cache invalidation.

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

### Intro to Kubernetes
Let's say you have an app which you have containerized. So you run a bunch of containers to serve your app to users. But how do you manage these different containers? This is where K8s comes to the rescue. Kubernetes is a container orchestration tool for managing production-ready containerized workloads and services that allows for declarative setup as well as automation.

- **Pods**: A pod is a collection of one or more containers with common storage and network resources, as well as a set of rules for how the containers should be run. It is the smallest deployable unit that Kubernetes allows you to create and manage. Each pod has a unique IP address assigned to it. While you can't ping this IP address from outside the cluster, you can ping from within your Kubernetes cluster.

- **Nodes**: The components (physical computers or virtual machines) that run these applications are known as worker nodes. Worker nodes carry out the tasks that the master node has assigned to them.

- **Cluster**: A cluster is a collection of nodes that are used to run containerized applications. A Kubernetes cluster is made up of a set of master nodes and a number of worker nodes. (`Minikube` is highly suggested for new users who want to start building a Kubernetes cluster.)

- **Deployments**: You would never create individual pods to serve your application. Why? Because that would mean if the traffic suddenly increases, your Pod will run out of resources, and you will face downtime. Instead, you create a bunch of identical pods. If one of these pods goes down or the traffic increases and you need more pods, Kubernetes will bring up more pods. The deployment controller does this management of multiple similar pods when you create a Deployment object.

- **Ingress Controller**: Kubernetes Ingress is an API object that manages external users’ access to services in a Kubernetes cluster by providing routing rules. This external request is frequently made using HTTPS/HTTP. You can easily set up rules for traffic routing with Ingress without having to create a bunch of Load Balancers or expose each service on the node.
