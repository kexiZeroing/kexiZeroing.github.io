---
layout: "../layouts/BlogPost.astro"
title: "Container queries and :has selector"
slug: container-queries-and-has-selector
description: ""
added: "Jan 08 2023"
tags: [css]
updatedDate: "Dec 31 2023"
---

`@container` and `:has()` are two powerful new responsive APIs landing in Chromium 105. Read at: https://developer.chrome.com/blog/has-with-cq-m105/

## Container Queries
Instead of relying on the viewport for styling input such as available space, developers now have the ability to query the size of in-page elements too. This capability means that a component owns its responsive styling logic.

To build with container queries, you must first set containment on a parent element. Do this by setting a `container-type` on the parent container. Say you might have a card with an image and some text content, setting the `container-type` to `inline-size` queries the inline-direction size of the parent which is the width of the card. Then we can use that container to apply styles to any of its children using `@container`.

```html
<div class="container">
  <div class="card">
    <div class="visual">🚀</div>
    <div class="meta">
      <h1>Rocket</h1>
      <p class="desc">some text here</p>
    </div>
  </div>
</div>
```

```css
.container {
  container-type: inline-size;
}

.card {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

@container (max-width: 400px) {
  .card {
    grid-template-columns: 1fr;
  }
}
```

Use the `container-type` property a value of `size`, `inline-size`, or `normal`.
- `size`: the query will be based on the *inline and block* dimensions of the container.
- `inline-size`: the query will be based on the *inline* dimensions of the container.
- `normal`: The element is not a query container for any container size queries, but remains a query container for container style queries.

> There is also the possiblity to use style queries in addition, Style Queries let us query a CSS property or CSS variable for a container. Style queries are still experimental and currently are implemented only in Chrome Canary. A good reminder that mentioning "container queries" isn't enough now, we need to specify either size or style. Read more at: https://ishadeed.com/article/css-container-style-queries

## The `:has()` parent selector
The CSS `:has()` pseudo-class enables developers to check if a parent element contains children with specific parameters. For example, `p:has(span)` indicates a paragraph selector, which has a `span` inside of it. You can use this to style the parent paragraph itself, or style anything within it.

Let’s expand on the example with the rocket card. What if you had a card without an image? Maybe you want to increase the size of the title and adjust the grid layout to single column so that it looks more intentional without the image.

```css
.card:has(.visual) {
  grid-template-columns: 1fr 1fr;
}

.card:not(:has(.visual)) h1 {
  font-size: 4rem;
}
```

Use Case 1: "Quantity Queries" are very easy in CSS now that we have `:has()`. You can just check if an element, for example, has a 10th child, like `.el:has(:nth-child(10))`, and now you know there are at least 10 children.

Use Case 2: Imagine that you need to open a modal window, it's good practice to prevent the page behind it from scrolling. That's a scroll lock. We can tweak the CSS declaration on our body element to use `:has()`. As long as an element with `.lock-scroll` is in the DOM, the scroll we be locked.
```css
body:has(.lock-scroll) {
  overflow: hidden;
}
```

## The selector `:is()` and `:where()`
- In CSS when using a selector list, if any of the selectors are invalid then the whole list is deemed invalid. When using `:is()` or `:where()` instead of the whole list of selectors being deemed invalid if one fails to parse, the incorrect or unsupported selector will be ignored and the others used. *(so-called "forgiving selectors")*.
- The difference between `:where()` and `:is()` is that `:where()` always has 0 specificity, whereas `:is()` takes on the specificity of the most specific selector in its arguments.
- The `:has()` pseudo-class itself doesn’t add any specificity weight to the selector. Like `:is()` and `:not()`, the specificity of `:has()` is equal to the highest specificity selector in the selector list.

> A side note: Selectors matching happens from right to left. For example:
> - The selector `.a .b .c` contains 3 units: `.a`, `.b`, and `.c`. When trying to find matching elements, the browser will first select all `.c` elements and will then check if they have a `.b` parent. If that’s the case, it will then check if that `.b` is a child of a `.a` element.
> - The selector `.a :is(.b .c)` contains 2 units: `.a`, and `:is(.b .c)`. The first evaluated unit `:is(.b .c)`, which matches the `.c` elements that have a `.b` ancestor. If that’s true, the browser will then continue and check if that matched element – the `.c` – also has a `.a` ancestor.
