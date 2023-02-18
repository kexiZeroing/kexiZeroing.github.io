---
layout: "../layouts/BlogPost.astro"
title: "CSS effects collection"
slug: css-effects-collection
description: ""
added: "Dec 5 2022"
tags: [css]
---

### Rainbow Artword
<img alt="Rainbow Artword" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vxvgGly1h8t01qct5yj308q05ct8r.jpg" width="150">

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
<img alt="Hover Text Effects" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vxvgGly1h8t04ox2d3j30e2048jrb.jpg" width="200">

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
<img alt="3D Flip Hover" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/Screen%20Shot%202023-02-18%20at%207.06.16%20PM.png" width="200">

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

### GSAP with ScrollTrigger plugin
Scroll-driven animations re-invented by [ScrollTrigger](https://greensock.com/scrolltrigger)

https://codepen.io/GreenSock/pen/bGVjLwG

```html
<style>
  .panel {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5em;
    color: white;
  }
  .line {
    width: 600px;
    height: 8px;
    margin: 0 0 10px 0;
    display: block;
    background-color: white;
  }
</style>

<section id="two" class="panel red">
  <p><span class="line line-1"></span>Panel 2</p>
</section>

<section id="three" class="panel orange">
  <p><span class="line line-2"></span>Panel 3</p>
</section>

<section id="four" class="panel purple">
  <p><span class="line line-3"></span>Panel 4</p>
</section>

<script src="https://unpkg.co/gsap@3/dist/gsap.min.js"></script>
<script src="https://unpkg.com/gsap@3/dist/ScrollTrigger.min.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);

  // --- RED PANEL ---
  gsap.from(".line-1", {
    scrollTrigger: {
      trigger: ".line-1",
      scrub: true,
    },
    scaleX: 0,
    transformOrigin: "left center", 
    ease: "none"
  });

  // --- ORANGE PANEL ---
  gsap.from(".line-2", {
    scrollTrigger: {
      trigger: ".orange",
      scrub: true,
      pin: true,
    },
    scaleX: 0, 
    transformOrigin: "left center", 
    ease: "none"
  });

  // --- PURPLE/GREEN PANEL ---
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".purple",
      scrub: true,
      pin: true,
    }
  });

  tl.from(".purple p", {scale: 0.3, rotation: 45, autoAlpha: 0, ease: "power2"})
    .from(".line-3", {scaleX: 0, transformOrigin: "left center", ease: "none"}, 0)
    .to(".purple", {backgroundColor: "#28a92b"}, 0);

</script>
```
