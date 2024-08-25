---
layout: "../layouts/BlogPost.astro"
title: "Start a Javascript stack project"
slug: start-js-stack-project
description: ""
added: "Jun 16 2022"
tags: [web]
updatedDate: "Aug 25 2024"
---

## Start a modern web project

```sh
# `npm create` is an alias for `npm init`
npm create vite@latest

npm create vite@latest my-vue-app -- --template vue
```

```sh
npx create-next-app@latest my-app --typescript --tailwind --eslint

npx shadcn-ui@latest init
```

```sh
npx nuxi@latest init my-app
```

Start with templates:
- Awesome Vite: https://github.com/vitejs/awesome-vite
- A Next.js 13 template for building apps with Radix UI and Tailwind CSS: https://github.com/shadcn-ui/next-template
- Vercel pre-built solutions: https://vercel.com/templates
- Cloudflare workers: https://github.com/cloudflare/workers-sdk

A typical full stack web application with Next.js, React, shadcn/ui, Prisma, and MySQL:
- @clerk/nextjs: add authentication and user management to your Next.js application.
- prisma and @prisma/client: an open-source ORM for Node.js and TypeScript. You can integrate Prisma with [PlanetScale](https://planetscale.com/docs/prisma/prisma-quickstart), a MySQL-compatible serverless database. The fastest way to get started with Prisma is by following the [Quickstart](https://www.prisma.io/docs/getting-started/quickstart).
- [Neon](https://neon.tech) is a serverless Postgres platform, *Neon is to PostgreSQL as PlanetScale is to MySQL*. Neon provides a generous free tier, making it a good fit for small applications and hobby projects. (PlanetScale has made the decision to stop offering the Hobby tier.)
- [Upstash](https://upstash.com) is a serverless data platform with Redis, Kafka and Vector Database APIs.
- zustand: one of many state management libraries for React. It's kinda like Redux, but much simpler.
- react-hot-toast: lightweight notifications for React.
- lucide-react: implementation of the lucide icon library for react applications.
- next-cloudinary: a community-built solution for using Cloudinary in a Next.js project. It includes tools like the `CldImage` component, social cards, and an upload widget.
- @tanstack/react-table: headless UI for building powerful tables & datagrids for React. ([@tanstack/react-query](https://tanstack.com/query/latest/docs) is more popular.)
- recharts: chart library to help you to write charts in React.
- stripe: access to the Stripe API from applications, and use [webhook](https://stripe.com/docs/webhooks) to get real-time updates.
- @mux/mux-node is a Mux API wrapper for Node projects to post a video. Note that this package uses Mux access tokens and secret keys and is intended to be used in server-side code only. Also add @mux/mux-player-react to integrate [Mux](https://docs.mux.com) player into your web application.
- react-confetti: create a confetti effect to celebrate the accomplishment of particular steps in an application.
- [next-auth](https://github.com/vercel/next.js/tree/canary/examples/auth) is a complete open-source authentication solution for Next.js applications.

> Why Next.js written by @leeerob: I never need to write separate backends for projects I want to create. I can build my entire project with Next.js. I never have to worry about bundler, compiler, or frontend infrastructure. I'm able to use the latest React features, which I personally find to have a great developer experience. Next.js provides a bunch of components that help me keep my site fast.

### Remix - full stack web framework
- Remix Tutorial: https://remix.run/start/tutorial
- Remix Templates: https://remix.run/docs/en/main/guides/templates
- Remix for Next.js Developers: https://remixfornextdevs.com

```jsx
export const action = async ({ params, request }: ActionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};
```

> An `invariant` function from [tiny-invariant](https://github.com/alexreardon/tiny-invariant) takes a value, and if the value is falsy then the invariant function will throw. If the value is truthy, then the function will not throw.

### Writing CSS in 2024
**CSS Modules** are a small but impactful enhancement on top of vanilla CSS. A CSS Module is a CSS file where all class names and animation names are scoped locally by default. They treat the classes defined in each file as unique. Each class name or identifier is renamed to include a unique hash, and a mapping is exported to JavaScript to allow referencing them. CSS Modules are available in almost every [modern bundler and framework](https://github.com/css-modules/css-modules/blob/master/docs/get-started.md).

**Tailwind** uses a compiler to generate only the classes used. So while the utility CSS framework contains many possible class names, only the classes used will be included in the single, compiled CSS file. Tailwind classes are just utilities for normal CSS that adhere to a design system. You can mix and match Tailwind with CSS Modules.

**CSS-in-JS libraries** which require runtime JavaScript are not currently supported in Server Components. Using CSS-in-JS with newer React features like Server Components and Streaming requires library authors to support the latest version of React.

[Lightning CSS](https://lightningcss.dev) is an extremely fast CSS parser, transformer, and minifier written in Rust. It lets you use modern CSS features and future syntax today. Features such as CSS nesting, custom media queries, high gamut color spaces, logical properties, and new selector features are automatically converted to more compatible syntax based on your browser targets. Lightning CSS is used by Vite, and soon by Tailwind and Next.js. Tools like `postcss` and `autoprefixer` are being replaced by faster, all-in-one Rust toolchains.

Lightning CSS can be used as a library from JavaScript or Rust, or from a standalone CLI. It can also be wrapped as a plugin in other build tools, and it is built into Parcel out of the box. For example, as a standalone CLI, it can be used to compile, minify, and bundle CSS files: `lightningcss --minify --bundle --targets 'defaults' input.css -o output.css`.

### `module` and `require` in Node.js 
**Node.js treats each JavaScript file as a separate module and encloses the entire code within a function wrapper**: `(function(exports, require, module, __filename, __dirname) {})`. The five parameters — `exports`, `require`, `module`, `__filename`, `__dirname` are available inside each module. Even if you define a global variable in a module using `let` or `const` keywords, the variables are scoped locally to the module rather than being scoped globally.

The `module` parameter refers to the object representing the current module and `exports` is a key of the `module` object which is also an object. `module.exports` is used for defining stuff that can be exported by a module. `exports` parameter and `module.exports` are the same unless you reassign `exports` within your module.

```js
exports.name = 'Alan';
exports.test = function () {};
console.log(module)  // { exports: { name: 'Alan', test: [Function] } }

// exports is a reference and it's no longer same as module.exports if you change the reference
exports = {
  name: 'Bob',
  add: function () {}
}
console.log(exports) // { name: 'Bob', add: [Function] }
console.log(module)  // { exports: { name: 'Alan', test: [Function] } }

module.exports = {
  name: 'Bob',
  add: function () {}
}
console.log(module)  // { exports: { name: 'Bob', add: [Function] } }
```

`require` keyword refers to a function which is used to import all the constructs exported using the `module.exports` from another module. The value returned by the `require` function in module y is equal to the `module.exports` object in the module x. The require function takes in an argument which can be a name or a path. You should provide the name as an argument when you are using the third-party modules or core modules provided by NPM. On the other hand, when you have custom modules defined by you, you should provide the path of the module as the argument.

Modules are cached after the first time they are loaded. This means every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file.

### browserslist and postcss
The [browserslist](https://github.com/browserslist/browserslist) configuration (either in `package.json` or `.browserslistrc`) uses `caniuse` data (https://caniuse.com/usage-table) for queries to control the outputted JS/CSS so that the emitted code will be compatible with the browsers specified. It will be installed with webpack and used by many popular tools like autoprefixer, babel-preset-env. You can find these tools require `browserslist` in the `package-lock.json` file.

- There is a `defaults` query (`> 0.5%, last 2 versions, Firefox ESR, not dead`), which gives a reasonable configuration for most users.
- If you want to change the default set of browsers, we recommend combining `last 2 versions`, `not dead` with a usage number like `> 0.2%`.
- `last 1 version or > 1%` is equal to `last 1 version, > 1%`. Each line in `.browserslistrc` file is combined with `or` combiner.
- Display target browsers from a browserslist config: https://browsersl.ist/#q=defaults
- Run `npx browserslist` in project directory to see what browsers was selected by your queries.

`PostCSS` is a tool for transforming CSS with JavaScript plugins. It provides features via its extensive plugin ecosystem to help improve the CSS writing experience. Plugins for just about [anything](https://www.postcss.parts). For example:
- [Autoprefixer](https://github.com/postcss/autoprefixer) is one of the many popular PostCSS plugins.
- [postcss-import](https://github.com/postcss/postcss-import) to transform `@import` rules by inlining content. (`postcss-import` is different than the import rule in native CSS. You should avoid the import rule in native CSS, since it can prevent stylesheets from being downloaded concurrently which affects the loading speed and performance.)
- [postcss-preset-env](https://www.npmjs.com/package/postcss-preset-env) lets you convert modern CSS into something most browsers can understand, which is similar to `@babel/preset-env`.
- [cssnano](https://cssnano.co) is a compression tool written on top of the PostCSS ecosystem to compact CSS appropriately.

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({ stage: 1 }),
    require('cssnano'),
  ]
}
```

### Polyfills and Transpilers
When Babel compiles your code, what it's doing is taking your syntax and running it through various syntax transforms in order to get browser compatible syntax. What it's not doing is adding any new JavaScript primitives or any properties you may need to the browser's global namespace. One way you can think about it is that when you compile your code, you're transforming it. When you add a polyfill, you're adding new functionality to the browser. For example, Babel can transform `arrow functions` into regular functions, so, they can be compiled. However, there's nothing Babel can do to transform `Promises` or `Math.trunc` into native syntax that browsers understand, so they need to be polyfilled.

With syntax transforms, I recommend `babel-preset-env`. For polyfills, the most popular one is `core-js`.

`core-js` provides support for the latest ECMAScript standard and proposals, from ancient ES5 features to bleeding edge features. It is one of the main reasons why developers can use modern ECMAScript features in their development process each day for many years, but most developers just don't know that they have this possibility because of `core-js` since they use `core-js` indirectly as it's provided by their transpilers or frameworks.

`core-js` is used by most of the popular websites. We can check it using `window['__core-js_shared__'].versions`, see details at https://github.com/zloirock/core-js/blob/master/docs/2023-02-14-so-whats-next.md

### Live Reload and Hot Reload
> When a file is edited, the dev server recompiles with the changes, then pushes a notification to the client code in the browser. The app code can then subscribe to "some file changed" notifications, re-import the new version of the code, and swap out the old code for the new code as the app is still running.

**Live Reload** refreshes the entire app when a file changes. For example, if you were four links deep into your navigation and saved a change, live reloading would restart the app and load the app back to the initial route. **Hot Reload** only refreshes the files that were changed without losing the state of the app. (Webpack's **Hot Module Replacement** replaces the modules that have been modified on the fly without reloading the entire page). The advantage of this is that it doesn't lose your app state, e.g. your inputs on your form fields, your currently selected tab.

## Set up Prettier and ESLint
Install `Prettier` and `ESLint` VSCode plugins and enable `format on save` in settings (execute `save without formatting` command to disable). If you don't see the code formatted automatically on file save then it might be because you have multiple formatters installed in VS Code. Set `Format Document With...` and choose prettier to get it working.

Install npm packages `npm i -D eslint prettier`. ESLint only as an npm package does not provide any editor integration, only the CLI executable. Run `eslint --init` to create a `eslintrc.json` (or `.js`, `.yml`) config file after install eslint globally `npm i -g eslint` (otherwise need to run `./node_modules/eslint/bin/eslint.js --init`), pick the options as you prefer. Add `eslint src` as a lint script which can be run as `npm run lint`, and it shows eslint errors in the Problems tab. Run `npm run lint -- --fix` to fix errors (if not format on save).

Formatting and linting are two separate concerns. Use Prettier for code formatting concerns, and linters for code-quality concerns. Mixing the two can have negative impacts on the performance and understandability of your developer tooling. 
- `eslint-plugin-prettier` is a legacy plugin developed a long time ago. It runs Prettier as if it were an ESLint rule, applies formatting on `--fix`, and **is not recommended**.
- `eslint-config-prettier` is the config that turns off all formatting rules. It's recommended by Prettier to be used together with Prettier. You'd still use Prettier itself to actually do the formatting. (Add explicit `yarn prettier --check .` to CI.)

If you don’t use a legacy ESLint shareable config that enables formatting rules, you probably don’t need `eslint-config-prettier`. Adding `eslint-config-prettier` at the end of the "extends" list doesn’t do anything if nothing enabled formatting rules to begin with.

Check out the following resources:
1. [You Probably Don't Need eslint-config-prettier or eslint-plugin-prettier](https://www.joshuakgoldberg.com/blog/you-probably-dont-need-eslint-config-prettier-or-eslint-plugin-prettier/)
2. [Reasonable ESLint, Prettier, and TypeScript configs](https://github.com/epicweb-dev/config)

### What is Husky
While working on an enterprise development team, it is important that all code linting and unit tests are passing before committing code, especially if you are using some form of continuous integration. [Git Hooks](https://githooks.com) are a built-in feature of Git that can execute automatically when certain events occur. **Husky**, as a project, is a very popular npm package that allows custom scripts to be ran against your repository to prevent bad `git commit` and `git push`, which makes commits of fixing lint errors doesn't happen.

Install husky `npm i -D husky` and have a "husky" section in the `package.json` file to add git hooks.
```json
// package.json
"husky": {
    "hooks": {
        "pre-commit": "npm run lint && npm run test",
        "pre-push": "npm test"
    }
}
```

### Debugging Node.js with `--inspect-brk`
https://www.builder.io/blog/debug-nodejs

Launch your Node.js process using the `--inspect-brk` flag (`node server.js --inspect-brk`). Now, open up any Edge or Chrome dev tools window and click the little green Node.js logo button. A new instance of DevTools will open and connect to the node process.

> Node.js 20.6.0 now supports reading `.env` files with the `--env-file` flag. You'll no longer need the `dotenv` package. Also supports passing runtime flags like `--inspect` and `--watch`. Example from @wesbos:  
> <img alt="node-env" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/F5WdyiKXEAAY7So.jpeg" width="600" />

## Introducing the Backend For Frontend
We had server-side functionality which we wanted to expose both via our desktop web UI, and via one or more mobile UIs. We often faced a problem in accommodating these new types of user interface, often as we already had a tight coupling between the desktop web UI and our backed services. However the nature of a mobile experience differs from a desktop web experience. In practice, our mobile devices will want to make different calls, fewer calls, and will want to display different (and probably less) data than their desktop counterparts. This means that we need to add additional functionality to our API backend to support our mobile interfaces.

One solution to this problem is that rather than have a general-purpose API backend, instead you have one backend per user experience - or call it a Backend For Frontend (BFF). The BFF is tightly coupled to a specific UI, and will typically be maintained by the same team as the user interface, thereby making it easier to define and adapt the API as the UI requires.

BFFs can be a useful pattern for architectures where there are a number of backend services, as the need to aggregate multiple downstream calls to deliver user functionality increases. In such situations it will be common for a single call in to a BFF to result in multiple downstream calls to microservices (multiple services hold the pieces of information we want).

The other benefit of using a BFF is that the team creating the interface can be much more fluid in thinking about where functionality lives. For example they could decide to push functionality on to the server-side to promote reuse in the future and simplify a native mobile application, or to allow for the faster release of new functionality. This decision is one that can be made by the team in isolation if they own both the mobile application and the BFF - it doesn't require any cross-team coordination.

## Jamstack
Jamstack is a web architecture and stands for **J**avascript, **A**PIs, and **M**arkup stack. In this architecture, the frontend and the backend are completely separate. All interactions with the backend and third parties are done using APIs. Markup that incorporates Javascript, is pre-built into static assets, served to a client from a CDN, and relies on reusable APIs for its functionalities. **A Jamstack site is a set of pre-generated static assets served from a CDN.**

> Jamstack is a way of working. It’s not a group of frameworks or services or tied to any particular brands or tech stack. Jamstack is defined by how you build websites, rather than the tools with which you choose to build them.

Jamstack sites have better performance, are easier to secure and scale, and cost a lot less than sites built with traditional architectures (Jamstack hosting providers take care of all of this for you). Pre-building pages ensure that any errors can be detected early enough. Most importantly, Jamstack allows teams to outsource complex services to vendors who provide, maintain, and secure APIs used on their sites. The APIs can provide specific functionality to static sites like payments, authentication, search, image uploads using Paypal, Auth0, Algolia, Cloudinary.

The most common types of Jamstack site build tools include static site generators (SSG) and headless content management systems (CMS). **Static site generators** are build tools that add content to templates and produce static web pages of a site. These generators can be used for Jamstack sites. Some well-known site generators include Hugo, Gatsby, Jekyll, Next.js, etc. 

There are two points in time that you can integrate dynamic content into a Jamsack application:
- **Build time** - During the build process, a Jamstack site can call out to any number of external API services to fetch data to pre-generate static pages. You can think of it like a content cache that applies to all your site’s users.
- **Run time** - This should typically be content that is user specific, needs to update frequently, or is in response to a specific user action. For example, an ecommerce site may have product details populated at build time, but things like the current inventory, shipping options/prices based upon the user’s location, or the user’s shopping cart would all be populated at run time in the browser. As you may notice, in this example, the content on a single page (product details) may be a combination of both pre-rendered (build time) content (i.e. the product name, photo and description) and run time content (i.e. the product inventory and shipping options based on location).

> What type of website are you building? https://whattheframework.netlify.app

## Headless UI and shadcn/ui
The web platform is severely lacking in terms of UI components. There's pretty minimal by way of built-in components, and for many that do exist, they are extremely difficult to style. What's best is to get a "headless" UI library: One which handles the logic of accessible, reusable components, but leaves the styling up to you. Headless UI components separate the logic & behavior of a component from its visual representation. They offer maximum visual flexibility by providing no interface.

People constantly have to reinvent the wheel to offer fairly basic functionality, so it’s good that there are libraries to handle the behaviour and accessibility while supporting whatever visual styles you want to make.

- [Headless UI](https://headlessui.com) is a good example, which contains completely unstyled, fully accessible UI components, designed to integrate beautifully with Tailwind CSS.
- [Radix UI](https://github.com/radix-ui/primitives) is a low-level UI component library with a focus on accessibility, customization and developer experience. You can use these components either as the base layer of your design system, or adopt them incrementally. Try out: https://www.radix-ui.com/themes/playground

Examples:
1. The video [So You Think You Can Build A Dropdown?](https://www.youtube.com/watch?v=lY-RQjWeweo) is diving deep into the complexities of designing and building a fully-accessible dropdown menu.
2. [Vaul](https://github.com/emilkowalski/vaul) is an unstyled drawer component for React that can be used as a Dialog replacement on tablet and mobile devices.

Then it leaves us with the decision about how to style things. This is where [shadcn/ui](https://ui.shadcn.com) comes into the picture. It's not a component library, but more of a code registry where you can copy/paste/modify the code to your content. It's built with Tailwind and Radix. `shadcn/ui` is a collection of reusable components that can be copied and pasted into your apps. Every component can be installed separately. It also provides a CLI that can be used to easily import components into your project, as simple as `npx shadcn-ui add card`, making it even more convenient to use. Here is a component demo page: https://kexizeroing.github.io/shadcn-ui

To understand shadcn/ui, first we need to know what does `cva (class-variance-authority)` do. It basically is a function, that allows us to define variants for the element we want to style. A simple variant definition has a name and a list of possible values, each with a list of classes that should apply.

```jsx
// Using `cva` to handle our variant's classes
import { cva } from "class-variance-authority";
 
const buttonVariants = cva(["font-semibold", "border", "rounded"], {
  variants: {
    intent: {
      primary: [
        "bg-blue-500",
        "text-white",
        "border-transparent",
        "hover:bg-blue-600",
      ],
      secondary: [
        "bg-white",
        "text-gray-800",
        "border-gray-400",
        "hover:bg-gray-100",
      ],
    },
    size: {
      small: ["text-sm", "py-1", "px-2"],
      medium: ["text-base", "py-2", "px-4"],
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "medium",
  },
});
 
buttonVariants();
// => "font-semibold border rounded bg-blue-500 text-white border-transparent hover:bg-blue-600 text-base py-2 px-4"
 
buttonVariants({ intent: "secondary", size: "small" });
// => "font-semibold border rounded bg-white text-gray-800 border-gray-400 hover:bg-gray-100 text-sm py-1 px-2"
```

[clsx](https://github.com/lukeed/clsx) is used in `cva`. It is a utility for constructing `className` strings conditionally.

```js
import clsx from 'clsx';

clsx('foo', true && 'bar', 'baz');
//=> 'foo bar baz'

clsx({ foo:true, bar:false, baz:isTrue() });
//=> 'foo baz'

clsx({ foo:true }, { bar:false }, null, { '--foobar':'hello' });
//=> 'foo --foobar'

clsx(['foo', 0, false, 'bar']);
//=> 'foo bar'

clsx(['foo'], ['', 0, false, 'bar'], [['baz', [['hello'], 'there']]]);
//=> 'foo bar baz hello there'
```

### Design system examples
A design system is an ever evolving collection of reusable components, guided by rules that ensure consistency and speed, by being the single source of truth for any product development.

- Stack Overflow's Design System: https://stackoverflow.design

- GitHub’s design system: https://primer.style

- Vercel's Design System: https://vercel.com/geist/introduction

- Shopify's Design System: https://polaris.shopify.com

- GOV.UK Design System: https://design-system.service.gov.uk

- Atlassian's Design System: https://atlassian.design

## Serverless
Your code needs to be hosted on a server. Depending on the size of your code and the amount of users you expect to use your product, you might need many servers. Companies used to have their own facilities and warehouses that held their servers and many still do. But for many, this is not ideal. Servers can be difficult to maintain. Maintaining servers and the buildings that house them can become expensive too. That's where AWS and other [cloud providers](https://getdeploying.com) come in.

Cloud is basically renting out servers and data storage that's owned by someone else (Serverless does not mean there aren't any servers; You still need servers to host and run your code.) Through the cloud provider (AWS, Azure, or Google Cloud), you gain access to resources like storage services, servers, networking, analytics, AI, and more. There are many other benefits: You pay only for what you use. You can easily spin up and use new servers when needed, allowing you to scale quickly. You can deploy applications globally.

Serverless is just a way of handling how you are using servers. Instead of handling all the infrastructure and server operations yourself you're relying on a cloud provider. There are different families of cloud services:
- **Infrastructure as a service (IaaS)** - Amazon EC2, Digital Ocean
- **Platform as a service (PaaS)** - Heroku, AWS Elastic Beanstalk
- **Software as a service (SaaS)** - Dropbox, iCloud, Slack
- **Function as a service (FaaS)** - AWS Lambda

Serverless functions are an approach to writing back-end code that doesn’t require writing a back-end. In the simplest terms: we write a function using our preferred language, like JavaScript; we send that function to a serverless provider; and then we can call that function just like any API using HTTP methods. These Functions are co-located with your code and part of your Git workflow. You can focus on the business needs and developing a better quality application instead of worrying about the infrastructure and maintenance of a traditional server.

An intro to AWS for front-end developers:
1. *s3* – This is just setting up a basic S3 bucket for web hosting static assets.
2. *cf-s3* – This adds a Cloudfront distribution in front of the S3 bucket to implement edge caching of static assets.
3. *lambda* – This adds a simple Lambda with function URL to handle backend calls for the site.
4. *api-gateway* – This assumes you'll have a larger backend than a single function that you'd like to put behind an API Gateway with logical endpoints.
5. *dynamodb* – This adds a data backend stored in DynamoDB that provides data through the Lambda to the site.

> AWS provides all the necessary building blocks for the modern web. With over 200 services, AWS caters to every aspect of web application infrastructure, including compute, storage, databases, machine learning, and more. Start watching Basic Elements of AWS: https://www.proaws.dev/tutorials/basic-elements-of-aws~hk2qv

### Fully hosted and self hosting solutions
In a fully hosted solution, the service provider takes care of hosting the software, managing servers, databases, scaling, and maintaining the infrastructure. Users don’t have to worry about setting up or managing the backend infrastructure. Examples: Google Workspace (formerly G Suite), Shopify, Slack.

In a self-hosted solution, the user is responsible for installing, configuring, and maintaining the software on their own servers or infrastructure. Users have full control over the environment. Examples: WordPress, GitLab.

### Netlify functions
The serverless functions can be run by [Netlify Dev](https://cli.netlify.com/netlify-dev) in the same way they would be when deployed to the cloud. Once you've configured the functions directory in your `netlify.toml`, the functions will be accessible through netlify dev server. e.g. at `http://localhost:8888/.netlify/functions/{function-name}`.

Go through the guide (mainly on traditional serverless functions): https://www.netlify.com/blog/intro-to-serverless-functions/

```js
// netlify/functions/hello-world.js
export const handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello world!'
    })
  }
}
```

```js
fetchBtn.addEventListener('click', async () => {
  const response = await fetch('/.netlify/functions/hello-world').then(
    response => response.json()
  )

  responseText.innerText = JSON.stringify(response)
})
```

### What is "edge compute"?
To solve the latency problem, very smart folks came up with the idea of deploying multiple copies of a program and distributing it around the world. When a user makes a request, it can be handled by the closest copy, thus reducing the distance traveled and the time spent in transit.

- The **Origin server** refers to the main computer that stores and runs the original version of your application code.
- **CDNs** store static content (such as HTML and image files) in multiple locations around the world. When a new request comes in, the closest CDN location to the user can respond with the cached result.
- Similar to CDNs, **Edge servers** are distributed to multiple locations around the world. But unlike CDNs, which store static content, some Edge servers can run small snippets of code. This means both caching and code execution can be done at the Edge closer to the user.

> Cloud = a server, somewhere;  
> Edge = a server, close to you;  
> Edge functions = serverless functions run at the Edge;
>
> Edge functions without the database in the same place aren't providing meaningful improvements. Most data is not globally replicated. So running compute in many regions, which all connect to a us-east database, made no sense.

So what JS engines/runtimes do we have now?
- Three main engines: V8 (Chromium), SpiderMonkey (Firefox), JavaScriptCore (Safari)
- Node.js, Deno, Cloudflare Workers: all run on V8
- Bun: runs on JavascriptCore
- Edge-computing providers: a limited JavaScript environment running on CDN Nodes

For example, [Cloudflare Workers](https://developers.cloudflare.com/workers/learning/how-workers-works) provides a serverless execution environment that allows you to create new applications without configuring or maintaining infrastructure. Under the hood, the Workers runtime uses the V8 engine. The Workers runtime also implements many of the standard APIs available in most modern browsers. Rather than running on an individual’s machine, Workers functions run on Cloudflare’s Edge Network - a growing global network of thousands of machines distributed across hundreds of locations.

> *workerd* is a JavaScript / Wasm server runtime based on the same code that powers Cloudflare Workers. The name "workerd" (pronounced "worker dee") comes from the Unix tradition of naming servers with a "-d" suffix standing for "daemon". *A daemon is a background, non-interactive program. It is detached from the keyboard and display of any interactive user.* The name is not capitalized because it is a program name, which are traditionally lower-case in Unix-like environments.

Read more about The Edge:
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) (using CloudFlare Workers under the hood)
- [Netlify Edge Functions](https://www.netlify.com/blog/edge-functions-explained) (using Deno under the hood)
- [Nuxt on the Edge](https://nuxt.com/blog/nuxt-on-the-edge)
