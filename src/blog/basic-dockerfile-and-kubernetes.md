---
title: "A basic Dockerfile and intro to Kubernetes"
description: ""
added: "Mar 12 2023"
tags: [devops]
updatedDate: "Mar 21 2025"
---

## Docker concepts
Docker is the most popular container technology tool. It is a tool used for building, running, and deploying containerized applications. An application’s code, libraries, tools, dependencies, and other files are all contained in a Docker image; when a user executes an image, it turns into a container.

Docker Engine is the core product of Docker, including its daemon (dockerd) as well as its CLI (docker).
- Docker Daemon is the background service running on the host that manages building, running and distributing Docker containers. The daemon is the process that runs in the operating system which clients talk to.
- Docker Client is the command line tool that allows the user to interact with the daemon.
- Docker desktop is using a Linux virtual machine behind the scenes for running regular docker daemon. Docker Desktop can be used either on it’s own or as a complementary tool to the CLI.

The build context is the set of files and directories that are accessible to the Docker engine when building an image. When you run a `docker build` command, Docker sends the content of the specified context directory (and its subdirectories) to the Docker daemon. This context forms the scope within which the `COPY` and `ADD` instructions operate.

Docker-compose is a tool that accepts a YAML file that specifies a cross container application and automates the creation and removal of all those containers without the need to write several docker commands for each one.

> 1. An image is a logical grouping of layers plus metadata about what to do when creating a container and how to assemble the layers. Part of that metadata is that each layer knows its parent's ID. When you docker run an image, docker creates a container: it unpacks all the layers in the correct order, creating a new "root" file system separate from the host.
> 2. A layer is a change on an image, or an intermediate image. Every command you specify (FROM, RUN, COPY, etc.) in your Dockerfile causes the previous image to change, thus creating a new layer. If you make a change to your Dockerfile, docker will rebuild only the layer that was changed and the ones after that. This is called layer caching.

Note that during `docker build`, `RUN` commands actually execute and `CMD` is stored in the image's config layer as part of the image manifest. During `docker run`, only the `CMD` command runs. All the `RUN` commands have already been executed and their results are "baked into" the image.

### A Dockerfile for a NodeJS application
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
>
> In addition to copying local files and directories from the build context (which `COPY` supports), `ADD` handles URL references and extract archives. For most use cases, `COPY` is the better choice due to its simplicity and security.

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

> About pattern matching of the ignored file, `*/temp` will match `a/temp` and `b/temp` but not `temp` or `a/b/temp` from the root directory. To match 2 levels deep only, you need to write `*/*/temp` and for arbitrary levels, use `**` it will match any number of directory including zero, eg: `**/temp` matches `temp`, `a/temp` and `a/b/temp`.

**Kaniko** is a tool that enables building container images from a Dockerfile inside a Kubernetes cluster (runs in a containerized environment like a CI/CD pipeline) without requiring a Docker daemon. Kaniko builds container images by parsing the Dockerfile and executing each command within a container isolated from the host environment. Instead of using a Docker daemon, Kaniko simulates the Docker builder by providing its own implementations of Docker commands like ADD, COPY, RUN, etc.

1. You gather all your blocks (your source code) and decide how to arrange them using instructions (your Dockerfile). You tell a magical builder (Kaniko) how to build your toy house using these instructions, without needing the usual building tools (Docker).
2. This packed version (a Docker image) can be sent to a special storage box (the container registry) so anyone can use it later. You told the builder (Kaniko) in step 1 where to store the house once it's packed.
3. Now, you have to make sure that when the kids want to play with your house in the playground (your servers or Kubernetes), they are using the right version. So, you update the playground instructions (Terraform configuration) with the newest version of your house.
4. The playground helpers (Terraform) read the updated plan you prepared. Terraform will actually deploy it, which means they replace the old toy house with the new one.

### Docker Multi-stage builds
Most of the time, we COPY files from the host to the container image. However, you can also COPY files straight from other images `COPY --from=<image>`. Every FROM instruction defines a stage.

- The order of stages in the Dockerfile matters - it's impossible to `COPY --from` a stage defined below the current stage.
- The `AS` aliases are optional - if you don't name your stages, they still can be referred to by their sequence number.
- Separating build and runtime environments can reduce image size, improve security, and make build scripts cleaner.

```dockerfile
# https://labs.iximiuz.com/tutorials/docker-multi-stage-builds
# Build stage
FROM node:lts-slim AS build

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*
COPY --from=build /app/dist .
```

### Deploy Next.js app with Docker
Next.js can be deployed to any hosting provider that supports Docker containers. You can use this approach when deploying to container orchestrators such as Kubernetes or when running inside a container in any cloud provider.

To add support for Docker to an existing project, just copy the [Dockerfile](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) into the root of the project.

### Minimal pattern for building and deploying a custom site using GitHub Actions and GitHub Page

```yaml
name: Publish site

on:
  push:
  workflow_dispatch:

permissions:
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build the site
      run: |
        mkdir _site
        echo '<h1>Hello, world!</h1>' > _site/index.html
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Anything that goes in that `_site/` directory will be published to the GitHub Pages site. [github.com/simonw/minimal-github-pages-from-actions](https://github.com/simonw/minimal-github-pages-from-actions) is an example repository that uses this exact YAML configuration.

## Intro to Kubernetes
Let's say you have an app which you have containerized (Monoliths were broken into microservices). So you run a bunch of containers to serve your app to users. But how do you manage these different containers? This is where K8s comes to the rescue. Kubernetes is a container orchestration tool for managing production-ready containerized workloads and services that allows for declarative setup as well as automation.

- **Pods**: A pod is a collection of one or more containers with common storage and network resources, as well as a set of rules for how the containers should be run. It is the smallest deployable unit that Kubernetes allows you to create and manage. Each pod has a unique IP address assigned to it. While you can't ping this IP address from outside the cluster, you can ping from within your Kubernetes cluster.

- **Nodes**: The components (physical computers or virtual machines) that run these applications are known as worker nodes. Worker nodes carry out the tasks that the master node has assigned to them.

- **Cluster**: A cluster is a collection of nodes that are used to run containerized applications. A Kubernetes cluster is made up of a set of master nodes and a number of worker nodes. (`Minikube` is highly suggested for new users who want to start building a Kubernetes cluster.)

- **Deployments**: You would never create individual pods to serve your application. Why? Because that would mean if the traffic suddenly increases, your Pod will run out of resources, and you will face downtime. Instead, you create a bunch of identical pods. If one of these pods goes down or the traffic increases and you need more pods, Kubernetes will bring up more pods. The deployment controller does this management of multiple similar pods when you create a Deployment object.

- **Services**: A Kubernetes Service is an abstraction layer that describes a logical group of Pods and allows for external traffic exposure, load balancing, and service discovery for such Pods.

- **Ingress Controller**: Kubernetes Ingress is an API object that manages external users’ access to services in a Kubernetes cluster by providing routing rules. This external request is frequently made using HTTPS/HTTP. You can easily set up rules for traffic routing with Ingress without having to create a bunch of Load Balancers or expose each service on the node.

> Learning resources:
> - The Illustrated Children's Guide to Kubernetes: https://www.cncf.io/phippy/the-childrens-illustrated-guide-to-kubernetes/
> - Kubernetes Essentials IBM lightboarding video: https://www.youtube.com/playlist?list=PLOspHqNVtKABAVX4azqPIu6UfsPzSu2YN

Let's look at an example. The Kubernetes configuration file (`deployment.yaml`) contains two parts because it defines two separate Kubernetes resources. Deployment manages the application instances (pods). Service manages network access to those instances.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-hello-world
spec:
  # how many pods
  replicas: 2
  # which Pods to manage
  selector:
    matchLabels:
      app: nodejs-hello-world
  # describe the pod that will be created
  template:
    metadata:
      labels:
        app: nodejs-hello-world
    spec:
      containers:
      - name: nodejs-hello-world
        image: your-docker-username/nodejs-hello-world:latest
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: nodejs-hello-world-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: nodejs-hello-world
```

> Deployment manages the desired state of your application. Service provides a stable network endpoint to access those containers. The key to their interaction is the label selector. The Deployment defines labels for its Pods in the template section, and the Service uses a selector to choose which Pods to route traffic to.
> 
> Example Workflow:
> a. Deployment creates Pods with specific labels.
> b. Service is created with a selector matching those labels.
> c. Clients send requests to the Service.
> d. Service routes each request to one of the Pods managed by the Deployment.
> e. If Pods are added/removed, the Service's routing table updates automatically.

**Horizontal Pod Autoscaling (HPA)** is a crucial feature in Kubernetes that enables automatic adjustment of the number of running pods based on observed CPU or memory utilization. The key components of HPA: 
- The Metrics Server collects and serves container resource metrics, playing a pivotal role in HPA functionality.
- The Autoscaler uses the metrics provided by the Metrics Server to make decisions about scaling the number of pod replicas.

This is how Kubernetes HPA work, the metric server sends metrics of resource consumption to HPA and based on the rules you have defined in HPA manifest file, this object decides to scale up or down the pods. For example, the below HPA configuration will monitor the CPU utilization of the `my-app-deployment` deployment. It will ensure that the number of replicas is scaled between 1 and 3 based on the average CPU utilization, maintaining it around 50%.

```yaml
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app-deployment
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

A typical modern cloud-native application deployment on Kubernetes with AWS services:

```
User Request → CloudFront (CDN) → Application Load Balancer (ALB) → Ingress → Service → Pod
```

When a user makes a request to your application, it first reaches CloudFront (CDN) which caches and serves content from the nearest edge location. The request then passes to the Application Load Balancer (ALB), which distributes traffic across multiple targets. The ALB forwards the request to the Kubernetes Ingress, which uses rules to route traffic based on the URL path. The Ingress directs traffic to the appropriate Kubernetes Service (ClusterIP), which provides internal load balancing within the cluster. Finally, the Service forwards the request to one of the available Pods managed by a Deployment, where your application code runs and processes the request, sending the response back through the same path to the user.

## Basic Terraform steps
The process starts with `terraform init` **(Write the Blueprint)**, Terraform downloads all necessary providers and modules - think of it as collecting all the right building blocks before starting construction.

Next comes `terraform plan` **(Check the Layout)**. It examines what currently exists in your infrastructure and compares it with what you want to build, creating a detailed execution plan.

The real action happens with `terraform apply` **(Build the Playground)**. Terraform will create new resources, modify existing ones, or remove what's no longer needed. Throughout this process, it keeps track of everything in a state file (`terraform.tfstate`), which is like having a perfect memory of how everything was built.

Your infrastructure blueprint lives in configuration files (typically `main.tf` or `terraform.tf`). These files are like the rulebook that tells Terraform exactly what to build and how to build it.

- `terraform.tf` is your wishes (what you want)
- `terraform.tfstate` is reality (what actually exists)

This is why when you run `terraform plan`, Terraform compares these two files to determine what changes need to be made to turn your wishes (`terraform.tf`) into reality (`terraform.tfstate`).

*"Error: Saved plan is stale"* may occur in Terraform when the actual infrastructure state has changed between when you created the plan and when you try to apply that saved plan. For example, someone else made changes to the same infrastructure while you had your plan file waiting, or another automation process (like CI/CD) modified the infrastructure.
