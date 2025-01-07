---
title: "CSS effects collection"
description: ""
added: "Dec 5 2022"
tags: [css]
updatedDate: "Jan 7 2025"
---

### TOC
- [TOC](#toc)
- [Rainbow Artword](#rainbow-artword)
- [Hover Text Effects](#hover-text-effects)
- [Apple-style OS dock](#apple-style-os-dock)
- [3D Flip Hover Effects](#3d-flip-hover-effects)
- [Color Palettes](#color-palettes)
- [3D Clock](#3d-clock)
- [Blurry image load](#blurry-image-load)
- [Animation with View Transitions](#animation-with-view-transitions)
- [Filter and backdrop filter](#filter-and-backdrop-filter)
- [Scroll-driven animations](#scroll-driven-animations)
- [Reveal hover effect](#reveal-hover-effect)
- [Rotating highlight effect](#rotating-highlight-effect)
- [Glass folder effect](#glass-folder-effect)
- [The Periodic Table](#the-periodic-table)
- [Selection menu](#selection-menu)
- [Double input range slider](#double-input-range-slider)
- [Hover list focus by demotion](#hover-list-focus-by-demotion)
- [Light/Dark modes baiscs](#lightdark-modes-baiscs)

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
- A cool website: https://www.makewordart.com

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

### Apple-style OS dock
CSS only, no JS. This one would be pretty sweet as a nav on your portfolio.

<img alt="apple-style-dock" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/dwucuh.png" width="450">

https://codepen.io/jh3y/pen/GRwwWoV

```css
.b:has(+ .b:hover),
.b:hover + .b {
  flex: calc(0.2 + (sin(30deg) * 1.5));
  translate: 0 calc(sin(30deg) * -75%);
}
```

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
- Build a wide gamut color palette with okLCH and inspects color with devtools: https://www.youtube.com/watch?v=6aCsAMgwnjE
- Create a custom palette: https://www.radix-ui.com/colors/custom

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
    /* justify-content && align-content */
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

Another way is using CSS `color-mix()`, which is stable in Chrome 111. The trick for creating semi-opaque versions of the brand colors is mixing them with the transparent color value. 

```css
:root {
  --brandBlue: skyblue;
  --brandBlue-a10: color-mix(in srgb, var(--brandBlue), transparent 90%);
  --brandBlue-a20: color-mix(in srgb, var(--brandBlue), transparent 80%);
  --brandBlue-a30: color-mix(in srgb, var(--brandBlue), transparent 70%);
  --brandBlue-a40: color-mix(in srgb, var(--brandBlue), transparent 60%);
  --brandBlue-a50: color-mix(in srgb, var(--brandBlue), transparent 50%);
  --brandBlue-a60: color-mix(in srgb, var(--brandBlue), transparent 40%);
  --brandBlue-a70: color-mix(in srgb, var(--brandBlue), transparent 30%);
  --brandBlue-a80: color-mix(in srgb, var(--brandBlue), transparent 20%);
  --brandBlue-a90: color-mix(in srgb, var(--brandBlue), transparent 10%);
}
```

### 3D Clock
<img alt="3D Clock" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/3dclock.jpg" width="300">

https://codepen.io/bigxixi/pen/abjEMbg

### Blurry image load

```html
<style>
.blurry-load {
  filter: blur(8px);
}

@keyframes blurOut {
  0% {
    filter: blur(20px);
  }
  50% {
    filter: blur(10px);
  }
  100% {
    filter: blur(0px);
  }
}
.blur-out {
  animation: blurOut 0.5s ease-out forwards;
}
</style>

<img
  class="blurry-load"
  src="image-small.jpg"
  data-large="image.jpg"
/>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.blurry-load');
  
  images.forEach(img => {
    const fullImage = new Image();
    
    fullImage.onload = () => {
      img.src = fullImage.src;
      img.classList.add('blur-out');
      img.classList.remove('blurry-load');
    };
    
    fullImage.src = img.getAttribute('data-large');
  });
});
</script>
```

### Animation with View Transitions

- Getting started with View Transitions on multi-page apps: https://daverupert.com/2023/05/getting-started-view-transitions
- A collection of example view transitions for multi-page sites: https://mpa-view-transitions-sandbox.netlify.app
- Adam Argyle at SeattleJS Conf: https://seattlejs-view-transitions.netlify.app
- Same-Document View Transitions for SPA: https://developer.chrome.com/docs/web-platform/view-transitions/same-document
- Cross-Document View Transitions for MPA: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document

> When a view transition occurs between two different documents it is called a cross-document view transition. This is typically the case in multi-page applications (MPA). Chrome 126 enables Cross-Document View Transitions triggered by a same-origin navigation. From now on, you no longer need rearchitect your app to an SPA to use View Transitions.

```html
<style>
  body {
    display: grid;
    place-content: center;
  } 
  .box {
    /* Having a name means "hold onto this element and try to tween it" (otherwise you get the cross-fade) */
    view-transition-name: box; /* whatever a unique name */
    width: 100px;
    height: 100px;
    background: blue;
  }
</style>

<div class="box"></div>
<script>
  // https://codepen.io/argyleink/pen/NWOEvro
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

https://codepen.io/argyleink/pen/GRPRJyM

<img alt="just the tabs" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/245b6eaa-8117-430d-a2aa-faa40e0e51a2.png" width="450">

### Filter and backdrop filter
[backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) has the same effect as [filter](https://developer.mozilla.org/en-US/docs/Web/CSS/filter), with one notable difference — backdrop filters apply only to areas behind the element instead of to the element and its children. Filters, on the other hand, apply directly to the element and its children, and don’t affect anything behind the element.

<figure>
  <img alt="filter" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/a9f0c5e0-6f17-4068-b481-17bfac204791.png" width="500">
  <figcaption>filter example</figcaption>
</figure>

<figure>
  <img alt="backdrop-filter" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/t0635k.png" width="500">
  <figcaption>backdrop-filter example</figcaption>
</figure>

```html
<div class="parent">
  <div class="blur">Blur</div>
  <div class="invert">Invert</div>
  <div class="hue">Hue</div>
  <div class="grayscale">Grayscale</div>
</div>
<style>
.parent {
  background-image: url("/images/neue-donau.webp");
}
.blur {
  backdrop-filter: blur(5px);
}
.invert {
  backdrop-filter: invert(1);
}
.hue {
  backdrop-filter: hue-rotate(260deg);
}
.grayscale {
  backdrop-filter: grayscale(100%);
}
</style>
```

### Scroll-driven animations
At its simplest, the `animation-timeline` property lets us link any keyframe animation to the progress of scroll. They still run from 0-100%. But now, 0% is the scroll start position and 100% is the scroll end position.

```css
@keyframes spin {
  to {
    transform: rotateY(5turn);
  }
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    div {
      animation: spin linear both;
      animation-timeline: scroll();
    } 
  }
}
```

Next, change `scroll()` to `view()`, which means we can trigger animations when elements enter and exit the viewport. This time 0% is when the element is entering the scroll area and 100% is when it’s about to go out of that scroll area.

```css
/* Animate images: https://codepen.io/una/pen/KKYZzJM */
@keyframes appear {
  from { opacity: 0; scale: 0.8; }
  to { opacity: 1; scale: 1; }
}

img {
  animation: appear linear both;
  animation-timeline: view();
  animation-range: entry 25% cover 50%;
}
```

Because scroll-driven animations are only active when there is scrollable overflow, it is possible to use them as a mechanism to detect if an element can scroll or not.

```css
.container {
  height: 250px;
  width: 250px;
  overflow-y: auto;

  --can-scroll: 0;
  animation: detect-scroll;
  animation-timeline: scroll(self);
}

@keyframes detect-scroll {
  from, to  {
    --can-scroll: 1;
  }
}
```

> ["Unleash the Power of Scroll-Driven Animations"](https://www.youtube.com/playlist?list=PLNYkxOF6rcICM3ttukz9x5LCNOHfWBVnn) from Google is a 10-part video course to learn all about scroll-driven animations.

### Reveal hover effect
https://codepen.io/t_afif/pen/GRYEZrr

```html
<img src="https://picsum.photos/seed/picsum/200/200" class="left">
<img src="https://picsum.photos/seed/picsum/200/200" class="right">

<style>
img {
  --s: 200px; /* the image size */
  
  width: var(--s);
  height: var(--s);
  box-sizing: border-box;
  object-fit: cover;
  transition: .5s;
}
img.left {
  object-position: right;
  padding-left: var(--s);
  background: #542437;
}
img.right {
  object-position: left;
  padding-right: var(--s);
  background: #8A9B0F;
}

img:hover {
  padding: 0;
}
</style>
```

- `object-fit` property is used to specify how an `<img>` should be resized to fit its container. `fill` is default, which means the image is resized to fill the given dimension.
- `object-position` is used together with `object-fit` to specify how an `<img>` should be positioned with x/y coordinates inside its "own content box".
- `box-sizing: border-box` will make the size of the content box equal to 0. In other words, we don’t see the image, but we see the background color since it covers the padding area.

### Rotating highlight effect
It creates an animated button with a rotating highlight effect around its border. Conic gradients are employed to generate the rotating highlight and the `@property` rule defines a custom property for rotation.

https://codepen.io/wesbos/pen/PoraMVV

```html
<button>
  <div class="fancy"></div>
  <span class="text">Download For Free</span>
</button>

<style>
  @property --rotate {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  button {
    --blue: #0173ff;
    --radius: 50px;
    --rotate: 0deg;
    border-radius: var(--radius);
    background: var(--blue);
    color: white;
    border: 0;
    position: relative;
    
    .fancy {
      position: absolute;
      inset: 0;
      &:before {
        content: "";
        background: conic-gradient(
          from var(--rotate),
          transparent 0%,
          white 5%,
          transparent 10%
        );
        position: absolute;
        inset: 0;
        animation: rotate 1s linear infinite;
      }
      &:after {
        content: "";
        background: var(--blue);
        position: absolute;
        inset: 2px;
        border-radius: calc(var(--radius) - 2px);
      }
    }
    .text {
      position: relative;
    }
  }
  @keyframes rotate {
    to {
      --rotate: 360deg;
    }
  }
</style>
```

### Glass folder effect
<img alt="Glass-folder-effect" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/glass-folder.png" width="200">

```html
<div class="folder">
  <img src="https://picsum.photos/seed/picsum/200/200" />
</div>

<style>
  img {
    border-radius: 10px;
    box-shadow: 0 2px 15px #333;
    transition: all 0.2s;
    margin-top: -30%;
  }
  .folder {
    display: inline-block;
    background: #007eaf;
    transition: all 0.2s;
    box-shadow: 0 2px 15px #333;
    padding: 30px;
    border-radius: 10px;
    position: relative;
    margin-top: 30%;
  }
  .folder:hover img {
    translate: 0 -50px;
  }
  .folder::after {
    box-shadow: 0 2px 5px #3334 inset;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;      
    content: '';
    position: absolute;
    background: #019eda44;
    inset: 20% 0 0;
    backdrop-filter: blur(8px);
  }
</style>
```

### The Periodic Table
https://dev.to/madsstoumann/the-periodic-table-in-css-3lmm

```css
ol {
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(18, 1fr);
  grid-template-rows: repeat(10, 1fr);
}
li {
  &:nth-of-type(2) { grid-column: 18; } /* pushed to the last column */
}

/* filter */
body:has(#alk:checked) li:not(.alk) { 
  opacity: 0.2;
}
```

### Selection menu
https://codepen.io/chriscoyier/pen/eYBQamQ

```html
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
<template><span id="control"></span></template>

<script>
  let control = document.importNode(document.querySelector('template').content, true).childNodes[0];
  control.addEventListener('pointerdown', oncontroldown, false);

  document.querySelector('p').onpointerup = () => {
    let selection = document.getSelection();
    let text = selection.toString();
    
    if (text !== "") {
      let rect = selection.getRangeAt(0).getBoundingClientRect();
      control.style.top = `calc(${rect.top}px - 48px)`;
      control.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 40px)`;
      document.body.appendChild(control);
    }
  }
  document.onpointerdown = () => {	
    let control = document.querySelector('#control');
    if (control !== null) {
      control.remove();
      document.getSelection().removeAllRanges();
    }
  }
</script>
```

### Double input range slider
https://codepen.io/alexpg96/pen/xxrBgbP

```html
<style>
  .container {
    position: relative;
    width: 300px;
    height: 100px;
  }
  .slider-track {
    width: 100%;
    height: 5px;
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
  }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    outline: none;
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    background-color: transparent;
    pointer-events: none;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    -webkit-appearance: none;
    height: 5px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 22px;
    width: 22px;
    background-color: blue;
    cursor: pointer;
    margin-top: -8px;
    pointer-events: auto;
    border-radius: 50%;
  }
  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #ffffff;
    border: 1px solid blue;
  }
</style>

<body>
  <div class="values">
    <span id="range1">0</span>
    <span> &dash; </span>
    <span id="range2">100</span>
  </div>
  <div class="container">
    <div class="slider-track"></div>
    <input type="range" min="0" max="100" value="30" id="slider-1" oninput="slideOne()">
    <input type="range" min="0" max="100" value="70" id="slider-2" oninput="slideTwo()">
  </div>

  <script>
    window.onload = function () {
      slideOne();
      slideTwo();
    };

    let sliderOne = document.getElementById("slider-1");
    let sliderTwo = document.getElementById("slider-2");
    let displayValOne = document.getElementById("range1");
    let displayValTwo = document.getElementById("range2");
    let sliderTrack = document.querySelector(".slider-track");
    let sliderMaxValue = 100;

    function slideOne() {
      if (parseInt(sliderTwo.value) <= parseInt(sliderOne.value)) {
        sliderOne.value = parseInt(sliderTwo.value);
      }
      displayValOne.textContent = sliderOne.value;
      fillColor();
    }
    function slideTwo() {
      if (parseInt(sliderTwo.value) <= parseInt(sliderOne.value)) {
        sliderTwo.value = parseInt(sliderOne.value);
      }
      displayValTwo.textContent = sliderTwo.value;
      fillColor();
    }
    function fillColor() {
      percent1 = (sliderOne.value / sliderMaxValue) * 100;
      percent2 = (sliderTwo.value / sliderMaxValue) * 100;
      // The color gray starts from the beginning and transitions to percent1%
      // At percent1%, the color changes to blue, and the color blue continues up to percent2%
      // At percent2%, the color changes back to gray
      sliderTrack.style.background = `linear-gradient(to right, lightgray ${percent1}%, blue ${percent1}%, blue ${percent2}%, lightgray ${percent2}%)`;
    }
  </script>
</body>
</html>
```

### Hover list focus by demotion
https://nerdy.dev/hover-not-hover-sorry-not-sorry

```html
<style>
  @import "https://unpkg.com/open-props/easings.min.css";
  
  ul li {
    transform-origin: left center;
    transition: 
      transform 1s var(--ease-spring-3),
      opacity .3s var(--ease-3);
  }
  ul:hover > li:not(:hover) {
    opacity: .25;
    transform: scale(0.8);
  }
</style>

<ul>
  <li>Apple</li>
  <li>Banana</li>
  <li>Orange</li>
  <li>Mango</li>
  <li>Pineapple</li>
  <li>Strawberry</li>
  <li>Blueberry</li>
  <li>Grape</li>
  <li>Watermelon</li>
  <li>Peach</li>
</ul>
```

### Light/Dark modes baiscs

```css
html {
  --bg: black;
  --text: #ffdbdb;

  --link-color: #4ac6ff;
  --link-color-hover: #9ce0ff;
  --bright-color: white;
  --faded-color: #373232;
}

@media (prefers-color-scheme: light) {
  html {
    --bg: white;
    --text: #323232;

    --link-color: #068dcb;
    --link-color-hover: #67cfff;
    --bright-color: black;
    --faded-color: #dedede;
  }
}
```

`color-scheme: light dark;` tells the browser that the element supports both light and dark color modes, with light mode being the default.

The `light-dark()` CSS function is a relatively new color function that allows you to specify different colors for light and dark color schemes. It provides a more direct way to handle color variations between light and dark modes. It prevents you from having to use the `@media` query and re-declare variables.

```css
:root {
  color-scheme: light dark; /* Supports both, light is default */

  --light: #292524;
  --dark: #f5f5f4;
}

body {
  color: light-dark(var(--light), var(--dark));
  background-color: light-dark(var(--dark), var(--light));
}
```