# Welcome to My Blog
https://kexizeroing.github.io

## Notes
- The site is powered by Astro and deployed at GitHub Pages.
- Blog pictures are uploaded by [PicGo](https://github.com/Molunerfinn/PicGo).
- Using CDN [jsdelivr](https://www.jsdelivr.com) or [statically](https://statically.io) to serve GitHub (or `raw.githubusercontent.com`) files is banned in China, so somehow find a way to try [GitMirror](https://gitmirror.com) as a replacement.
- Posts searching uses static search library [pagefind](https://pagefind.app).
- A "Pictures" page contains all the images in all posts. Use [image-size](https://github.com/image-size/image-size) to detect image dimensions and [PhotoSwipe](https://photoswipe.com) to preview.

## About Astro - content focus with server-first MPA architecture
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
