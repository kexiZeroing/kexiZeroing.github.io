---
layout: "../layouts/BlogPost.astro"
title: "Explore interactive blog cells"
slug: explore-interactive-blog-cells
description: ""
added: "Aug 25 2023"
tags: [code]
---

[blog-cells](https://github.com/rameshvarun/blog-cells) adds interactive code snippets to any blog or webpage. It's worth a try at here.

<p>
<script type="text/notebook-cell" data-autorun="true">
console.log("Hello World!");
</script>
</p>

<p>
<script type="text/notebook-cell">
console.log("Hello World, but not automatic.");
</script>
</p>

<script type="text/notebook-cell" data-autorun="true">
const response = await fetch("https://pokeapi.co/api/v2/pokemon/ditto");
const data = await response.json();
console.log(data);
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/blog-cells@0.4.1/dist/blog-cells.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/blog-cells@0.4.1/dist/blog-cells.js"></script>
