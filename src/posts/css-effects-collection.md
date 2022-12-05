---
layout: "../layouts/BlogPost.astro"
title: "CSS effects collection"
slug: css-effects-collection
description: ""
added: ""
top: true
order: 6
---

### Rainbow Artword
```html
<style>
  .wordart {
    display: inline-block;
    background: linear-gradient(
      90deg,
      #ff0000,
      #ff8800,
      #ffff00,
      #02be02,
      #0000ff,
      #4f00ff,
      #9c00ff
    );
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-size: 90px;
    font-weight: bold;
    transform: skewY(-8deg) scaleY(1.3) scaleX(0.8);
    filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.2));
  }
</style>

<span class="wordart">WordArt</span>
```

- Using the `background-clip` property we can control where the background shows. Specifically, we can set `background-clip: text` to make the background only show wherever there's text in the element.
- `drop-shadow` is similar to the `box-shadow` property. The `box-shadow` property creates a rectangular shadow behind an element's entire box, while the `drop-shadow` creates a shadow that conforms to the shape (alpha channel) of the image itself.

### Hover Text Effects
https://codepen.io/jh3y/pen/abGPKGO

```html
<script src="https://unpkg.com/splitting/dist/splitting.min.js"></script>
<style>
  .char {
    --pop: 0;
    display: inline-block;
    position: relative;
    color: transparent;
    z-index: calc(1 + (var(--pop) * 2));
  }

  .char:after {
    content: attr(data-char);
    position: absolute;
    inset: 0;
    color: hsl(45 calc(var(--pop) * 100%) calc(80% - (30% * var(--pop))));
    translate: 0 calc(var(--pop, 0) * -65%);
    scale: calc(1 + var(--pop) * 0.75);
    transition: translate 0.2s, scale 0.2s, color 0.2s;
  }

  .char:hover {
    --pop: 1;
  }

  /* elements that are immediately before and after the char being hovered */
  .char:hover + .char,
  .char:has(+ .char:hover) {
    --pop: 0.4;
  }
</style>

<h1 data-splitting>Happy Birthday!</h1>
<script> Splitting(); </script>
```

- [Splitting.js](https://splitting.js.org) is designed to split an element in a variety of ways, such as words, characters, child nodes, and more.
- The `inset` CSS property is a shorthand that corresponds to the `top`, `right`, `bottom` and `left` properties.
- `:has(+ .char:hover)` means target any character that is directly followed by a character that is hovered. It is available in Chrome 105.
