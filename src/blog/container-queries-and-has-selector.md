---
title: "Container queries and :has selector"
description: ""
added: "Jan 08 2023"
tags: [css]
updatedDate: "Jan 18 2025"
---

`@container` and `:has()` are two powerful new responsive APIs landing in Chromium 105. Read at: https://developer.chrome.com/blog/has-with-cq-m105/

## Container Queries
Instead of relying on the viewport for styling, developers now have the ability to query the size of in-page elements too. This capability means that a component owns its responsive styling logic.

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

```js
// before
const cardContainer = document.querySelector('.card-container');
const cards = cardContainer.children;

function adjustLayout() {
  if (cardContainer.offsetWidth > 900) {
    cards.forEach(card => card.style.width = '33.33%');
  } else if (cardContainer.offsetWidth > 600) {
    cards.forEach(card => card.style.width = '50%');
  } else {
    cards.forEach(card => card.style.width = '100%');
  }
}

window.addEventListener('resize', adjustLayout);
adjustLayout();
```

```css
/* after */
.card-container {
  container-type: inline-size;
}
.card {
  width: 100%;
}
@container (min-width: 600px) {
  .card {
    width: 50%;
  }
}
@container (min-width: 900px) {
  .card {
    width: 33.33%;
  }
}
```

Use the `container-type` property a value of `size`, `inline-size`, or `normal`.
- `size`: the query will be based on the *inline and block* dimensions of the container.
- `inline-size`: the query will be based on the *inline* dimensions of the container.
- `normal`: The element is not a query container for any container size queries, but remains a query container for container style queries.

When applying styles to a container using container queries, you can use container query length units. These units specify a length relative to the dimensions of a query container.
- `cqw`: 1% of a query container's width
- `cqh`: 1% of a query container's height
- `cqi`: 1% of a query container's inline size
- `cqb`: 1% of a query container's block size

### Container style queries
There is also the possiblity to use style queries, which enables applying styles to elements based on a containing element's style features. Currently, the only style feature supported by style queries is CSS custom properties. In this case, the query returns true or false depending on the computed value of the containing element's custom properties. When container style queries are fully supported, they will enable you to apply styles to any element's descendants based on any property, declaration, or computed value.

```css
@container style(--theme: green) or style(--theme: blue) {
  output {
    color: var(--theme);
  }
}

@container style(--theme: red) {
  output {
    font-weight: bold;
  }
}
```

> Style queries are still experimental. A good reminder that mentioning "container queries" isn't enough now, we need to specify either size or style. Read more at: https://ishadeed.com/article/css-container-style-queries

### Scroll state queries
Chrome 133 introduces scroll state container queries. Before scroll state queries, you’d need to use JavaScript to understand if an element was stuck, snapped, or scrollable. Now there's a more performant method to trigger style changes when an element is stuck to an edge, is snapped on an axis, or is overflowing.

```css
.stuck-top {
  container-type: scroll-state;
  position: sticky;
  top: 0px;

  > nav {
    @container scroll-state(stuck: top) {
      background: Highlight;
      color: HighlightText;
    }
  }
}
```

## The `:has()` selector
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

> `.card:has(:not(img))` means “select a card that has any element that is not an image”. `.card:not(:has(img))` means “select a card doesn't have an image”, and that's exactly what we want.

Use Case 1: "Quantity Queries" are very easy in CSS now that we have `:has()`. You can just check if an element, for example, has a 10th child, like `.el:has(:nth-child(10))`, and now you know there are at least 10 children.

Use Case 2: Imagine that you need to open a modal window, it's good practice to prevent the page behind it from scrolling. That's a scroll lock. We can tweak the CSS declaration on our body element to use `:has()`. As long as an element with `.lock-scroll` is in the DOM, the scroll we be locked.
```css
body:has(.lock-scroll) {
  overflow: hidden;
}
```

Use Case 3: We can check the input state like a checkbox or radio button.
```css
.box:has(input[type="checkbox"]:checked) {
  .btn {
    opacity: 1;
    pointer-events: initial;
  }
}

.box:has(input[value="standard"]:checked) {
  .note {
    display: block;
  }
}
```

## The selector `:is()` and `:where()`
- In CSS when using a selector list, if any of the selectors are invalid then the whole list is deemed invalid. When using `:is()` or `:where()` instead of the whole list of selectors being deemed invalid if one fails to parse, the incorrect or unsupported selector will be ignored and the others used. *(so-called "forgiving selectors")*.
- The difference between `:where()` and `:is()` is that `:where()` always has 0 specificity, whereas `:is()` takes on the specificity of the most specific selector in its arguments.
- The `:has()` pseudo-class itself doesn’t add any specificity weight to the selector. Like `:is()` and `:not()`, the specificity of `:has()` is equal to the highest specificity selector in the selector list.

```css
/* Specificity: 0 0 1 */
:is(h1, h2, h3, h4, h5, h6) {
  color: #666;
}

/* Specificity: 0 0 0 */
:where(h1, h2, h3, h4, h5, h6) {
  color: #666;
}
```

```js
// Specificity is a triple that has three components (A,B,C)
const compare = (s1, s2) => {
  if (s1.a === s2.a) {
    if (s1.b === s2.b) {
      return s1.c - s2.c;
    }
    return s1.b - s2.b;
  }
  return s1.a - s2.a;
};
```

> A side note: Selectors matching happens from right to left. For example:
> - The selector `.a .b .c` contains 3 units: `.a`, `.b`, and `.c`. When trying to find matching elements, the browser will first select all `.c` elements and will then check if they have a `.b` parent. If that’s the case, it will then check if that `.b` is a child of a `.a` element.
> - The selector `.a :is(.b .c)` contains 2 units: `.a`, and `:is(.b .c)`. The first evaluated unit `:is(.b .c)`, which matches the `.c` elements that have a `.b` ancestor. If that’s true, the browser will then continue and check if that matched element – the `.c` – also has a `.a` ancestor.
