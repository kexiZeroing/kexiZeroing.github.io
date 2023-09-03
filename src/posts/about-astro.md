---
layout: "../layouts/BlogPost.astro"
title: "About Astro - content focus with server-first MPA architecture"
slug: about-astro
description: ""
added: "Sep 11 2022"
tags: [web]
updatedDate: "Sep 3 2023"
---

## Astro and its features
By default, [Astro](https://astro.build) ships HTML and CSS. No JavaScript at all. This is ideal for a substantial portion of the sites on the internet — most of these sites show us text and images without much interactivity or state. 

```astro
---
// Example Astro component. You write JavaScript inside the `---` block
// everything here will be run on the server
export let name = 'Astro';
---

<h1 class="title">Hello {name}</h1>

<style>
  .title {
    color: red;
  }
</style>
```

Astro is unique among the JavaScript frameworks in that it supports other UI frameworks. You can import components written in React, Preact, Svelte, Vue, Lit, or Solid directly into Astro, and even mix them within the same file. It’s all possible with the command: `npx astro add @astrojs/react @astrojs/svelte @astrojs/vue`. And, because Astro outputs zero JavaScript by default, the bundle size does not increase for each new framework. Each component gets server-rendered and turned into static HTML.

```astro
---
// Import components from different frameworks
import SvelteNavbar from './components/SvelteNavbar.svelte';
import ReactPostList from './components/ReactPostList.jsx';
import VueFooter from './components/VueFooter.vue';
---

<article>
  <header>
    <SvelteNavbar />
  </header>

  <main>
    <ReactPostList />
  </main>

  <footer>
    <VueFooter />
  </footer>
</article>
```

Astro includes built-in support for standard Markdown files. With the `@astrojs/mdx` integration installed, Astro also supports [MDX](https://docs.astro.build/en/guides/markdown-content/) (`.mdx`) files which bring added features like support for JSX expressions and components in your Markdown content. Astro lets you turn markdown and MDX files directly into pages on your website. All you have to do is specify a layout value in the front matter.

```md
---
title: About
layout: ../layouts/MarkdownPage.astro
---

Welcome to My Blog
```

## Astro Links
- Astro CHANGELOG: https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md
- Astro starter template: https://github.com/surjithctly/astroship
- Build beautiful, high-performance documentation websites with Astro: https://starlight.astro.build
- Accessible Astro Components: https://github.com/markteekman/accessible-astro-components
- Astro View Transitions: https://developer.chrome.com/blog/astro-view-transitions
