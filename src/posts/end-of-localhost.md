---
layout: "../layouts/BlogPost.astro"
title: "The end of localhost"
slug: the-end-of-localhost
description: ""
added: "Jul 10 2022"
tags: [system]
updatedDate: "Feb 17 2023"
---

> This file is created in Gitpod instead of local. Try a workspace at https://gitpod.io/workspaces

### Why code in the cloud?
Developers traditionally install and run tools like IDEs, libraries, and language runtimes on their local workstations. This approach makes sense at first, but has some downsides as an organization grows:

- Everyone must carefully follow long setup instructions every time they work on a new project or get a new device.
- Laptop processing power limits build speeds. Docker is fast on Linux but much slower on Mac.
- Managing various versions of Python, Node.js, and others on the same laptop gets pretty risky.
- Making local builds accessible to coworkers for testing takes significant time and effort.
- Some required tools may only work on certain laptops.

### GitHub Codespaces
https://github.com/features/codespaces  
https://github.blog/2021-08-11-githubs-engineering-team-moved-codespaces  

### CodeSandbox
https://codesandbox.io/

### StackBlitz
https://stackblitz.com/

### Gitpod
https://www.gitpod.io/

From a Git Repository on GitHub, Gitlab or Bitbucket, Gitpod can spin up a server-side-dev-environment for you in seconds (prefixing its URL with `gitpod.io/#`). That's a docker container that you can fully customize and that includes your source code, git-Terminal, VS Code extensions, your IDE, etc. The dev environment is enough powerful to run your app and even side-services like databases.

This is easily repeatable and reproducible because it's automated and version-controlled and shared across the team. We call this dev-environment-as-code. Sending a snapshot of your dev environment to a colleague is as easy as sending a URL.

Your workplace is already compiled and all dependencies of your code have been downloaded. In order to tell Gitpod how to prepare a dev environment for your project, check in a `.gitpod.yml` file into the root of the repository.

### Brev.dev
https://www.brev.dev/  
https://console.brev.dev/

Brev creates your powerful computer in the cloud for development. Brev solves configurations with the `.brev` directory. Create your `.brev/setup.sh` script to make your environment reproducible. Brev will automatically run it when creating the workspace.

<img alt="brev demo" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/e6c9d24ely1h3dnwzu0szj21ee0o4mzl.jpg" width="800">
