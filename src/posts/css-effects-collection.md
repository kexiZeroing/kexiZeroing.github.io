---
layout: "../layouts/BlogPost.astro"
title: "CSS effects collection"
slug: css-effects-collection
description: ""
added: "Dec 5 2022"
tags: [css]
updatedDate: "May 27 2023"
---

> https://css-tip.com has a wide collection of CSS tips and tricks, which is a good place to keep up to date with the new CSS features.

### TOC
- [TOC](#toc)
- [Rainbow Artword](#rainbow-artword)
- [Hover Text Effects](#hover-text-effects)
- [3D Flip Hover Effects](#3d-flip-hover-effects)
- [Color Palettes](#color-palettes)
- [3D Clock](#3d-clock)
- [Animation with View Transitions](#animation-with-view-transitions)

### Rainbow Artword
<img alt="Rainbow Artword" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8t01qct5yj308q05ct8r.jpg" width="150">

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
    font-size: 60px;
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
<img alt="Hover Text Effects" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8t04ox2d3j30e2048jrb.jpg" width="200">

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

### 3D Flip Hover Effects
<img alt="3D Flip Hover" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/Screen%20Shot%202023-02-18%20at%207.06.16%20PM.png" width="200">

https://codepen.io/rikanutyy/pen/PEJBxX

```html
<style>
  .card {
    color: #013243;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 400px;
    background: #e0e1dc;
    transform-style: preserve-3d;
    transform: translate(-50%,-50%) perspective(2000px);
    box-shadow: inset 300px 0 50px rgba(0,0,0,.5), 20px 0 60px rgba(0,0,0,.5);
    transition: 1s;
  }

  .card:hover {
    transform: translate(-50%,-50%) perspective(2000px) rotate(15deg) scale(1.2);
    box-shadow: inset 20px 0 50px rgba(0,0,0,.5), 0 10px 100px rgba(0,0,0,.5);
  }

  .card:before {
    content:'';
    position: absolute;
    top: -5px;
    left: 0;
    width: 100%;
    height: 5px;
    background: #BAC1BA;
    transform-origin: bottom;
    transform: skewX(-45deg);
  }

  .card:after {
    content: '';
    position: absolute;
    top: 0;
    right: -5px;
    width: 5px;
    height: 100%;
    background: #92A29C;
    transform-origin: left;
    transform: skewY(-45deg);
  }

  .card .imgBox {
    width: 100%;
    height: 100%;
    position: relative;
    transform-origin: left;
    transition: .7s;
  }

  .card .bark {
    position: absolute;
    background: #e0e1dc;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: .7s;
  }

  .card .imgBox img {
    min-width: 250px;
    max-height: 400px;
  }

  .card:hover .imgBox {
    transform: rotateY(-135deg);
  }

  .card:hover .bark {
    opacity: 1;
    transition: .6s;
    box-shadow: 300px 200px 100px rgba(0, 0, 0, .4) inset;
  }

  .card .details {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    padding: 0 0 0 20px;
    z-index: -1;
    margin-top: 70px;
  }
</style>

<div class="card">
  <div class="imgBox">
    <div class="bark"></div>
    <img src="https://placekitten.com/300/400">
  </div>
  <div class="details">
    <h4>HAPPY BIRTHDAY</h4>
  </div>
</div>
```

### Color Palettes
Builds a wide gamut color palette with okLCH and inspects color with devtools. Check out https://www.youtube.com/watch?v=6aCsAMgwnjE

<img alt="okLCH Color Palettes" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vOhrAly1he4xakrh5qj30tg0ka0ts.jpg" width="500">

```html
<style>
  html {
    --hue: 140;
    
    --swatch-1: oklch(99% .05 var(--hue));
    --swatch-2: oklch(90% .1 var(--hue));
    --swatch-3: oklch(80% .2 var(--hue));
    --swatch-4: oklch(72% .25 var(--hue));
    --swatch-5: oklch(67% .31 var(--hue));
    --swatch-6: oklch(50% .27 var(--hue));
    --swatch-7: oklch(35% .25 var(--hue));
    --swatch-8: oklch(25% .2 var(--hue));
    --swatch-9: oklch(13% .2 var(--hue));
    --swatch-10: oklch(5% .1 var(--hue));
    
    --text-1: var(--swatch-10);
    --text-2: var(--swatch-9);
    --surface-1: var(--swatch-1);
    --surface-2: var(--swatch-2);
    --surface-3: var(--swatch-3);
  }

  html {
    background: var(--surface-1);
    color: var(--text-1);
  }
  body {
    display: grid;
    place-content: center;
    gap: 5vmin;
    grid-auto-flow: column;
  }
  .palette {
    display: grid;
    grid-auto-rows: 8vh;
    grid-template-columns: 20vw;
  }
  .swatch {
    box-shadow: inset 0 0 0 1px oklch(50% 0 0 / 20%);
  }
  .swatch:nth-of-type(1)  { background: var(--swatch-1) }
  .swatch:nth-of-type(2)  { background: var(--swatch-2) }
  .swatch:nth-of-type(3)  { background: var(--swatch-3) }
  .swatch:nth-of-type(4)  { background: var(--swatch-4) }
  .swatch:nth-of-type(5)  { background: var(--swatch-5) }
  .swatch:nth-of-type(6)  { background: var(--swatch-6) }
  .swatch:nth-of-type(7)  { background: var(--swatch-7) }
  .swatch:nth-of-type(8)  { background: var(--swatch-8) }
  .swatch:nth-of-type(9)  { background: var(--swatch-9) }
  .swatch:nth-of-type(10) { background: var(--swatch-10) }

  .card {
    display: grid;
    border-radius: 10px;
    background: var(--surface-2);
    border: 1px solid var(--surface-3);
    padding: 1rem;
  }
</style>

<body>
  <div class="palette">
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
    <div class="swatch"></div>
  </div>
  
  <article>
    <div class="card">
      <h2>I'm a card</h2>
      <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Itaque doloremque modi veniam aspernatur voluptatum
        labore dolores perspiciatis.</p>
    </div>
  </article>
</body>
```

### 3D Clock
<img alt="3D Clock" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/3dclock.jpg" width="300">

https://codepen.io/bigxixi/pen/abjEMbg

### Animation with View Transitions
<img alt="View Transitions" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/5fb05025-a9ca-417a-83f8-1363b092535c.png" width="500">

https://codepen.io/argyleink/pen/NWOEvro

> - Getting started with View Transitions on multi-page apps: https://daverupert.com/2023/05/getting-started-view-transitions
> - A collection of example view transitions for multi-page sites: https://mpa-view-transitions-sandbox.netlify.app

```html
<style>
  body {
    display: grid;
    place-content: center;
  } 
  .box {
    view-transition-name: box;
    width: 100px;
    height: 100px;
    background: blue;
  }
</style>

<div class="box"></div>
<script>
  const positions = ['start', 'end', 'center']

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function setRandomAlignments() {
    document.body.style.alignContent = positions[getRandomInt(3)]
    document.body.style.justifyContent = positions[getRandomInt(3)]
  }

  document.body.addEventListener('click', e => {
    if (!document.startViewTransition)
      setRandomAlignments()
    else
      document.startViewTransition(() => {
        setRandomAlignments()
      })
  })
</script>
```
