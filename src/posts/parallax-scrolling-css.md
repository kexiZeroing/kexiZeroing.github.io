---
layout: "../layouts/BlogPost.astro"
title: "Parallax scrolling in CSS"
slug: parallax-scrolling-css
description: ""
added: "Nov 10 2022"
tags: [css]
---

In a parallax scrolling effect, both the foreground and background are moving, but the background typically moves much more slowly, giving the illusion of depth.

What the CSS is doing here is moving layers forward and backward in space (with `translateZ`). This creates visual parallax, where things farther in the distance move slower than those close to you. Check the [article by Keith Clark](https://keithclark.co.uk/articles/pure-css-parallax-websites) and the [accompanying demo](https://keithclark.co.uk/articles/pure-css-parallax-websites/demo3/) to better understand how this works.

> Parallax is almost always handled with JavaScript and, more often than not, it's implemented badly with the worst offenders listening for the scroll event and modifying the DOM directly in the handler, triggering needless reflows and paints. All this happens out of sync with the browsers rendering pipeline causing dropped frames and stuttering. Deferring the parallax effect to CSS removes all these issues and allows the browser to leverage hardware acceleration resulting in almost everything being handled by the compositor.

- To activate 3D space, an element needs perspective. The smaller the value, the closer you get from the Z plane and the more impressive the visual effect. The greater the value, the more subtle will be the effect. Please note the `perspective` property doesn’t affect how the element is rendered; it simply enables a 3D-space for children elements.

- We need to apply the `transform-style: preserve-3d` to the parent of the element in which we want to apply the Z transformation. This will make sure its children elements are positioned on the 3d space instead of on the 2d flattened plane.

- Translating an element along the Z axis has a side effect - its effective size changes as we move it closer to or farther away from the viewport. To counter this we need to apply a `scale()` transform to the element so that it appears to be rendered at its original size. The scale factor can be calculated with `1 + (translateZ * -1) / perspective`.

- Layer speed is controlled by a combination of the perspective and the Z translation values. Elements with negative Z values will scroll slower than those with a positive value. The further the value is from `0` the more pronounced the parallax effect (i.e. `translateZ(-10px)` will scroll slower than `translateZ(-1px)`).

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pure CSS Parallax Effect</title>
    <style>
      body {
        margin: 0;
      }

      main {
        height: 100vh;
        overflow-x: hidden;
        overflow-y: auto;
        perspective: 2px;
      }

      section {
        transform-style: preserve-3d;
        position: relative;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .no-parallax {
        background-color: #111;
        z-index: 999;
      }

      section h1 {
        text-align: center;
        font-size: 4rem;
        font-family: sans-serif;
      }

      .parallax h1 {
        width: 60%;
        font-size: 2rem;
      }

      .parallax::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: -1;
        background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
          url('https://picsum.photos/1080/720');
        background-size: cover;
        transform: translateZ(-1px) scale(1.5);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="no-parallax">
        <h1>Fun fact:</h1>
      </section>
      <section class="parallax">
        <h1>
          The sound that occurs when you snap your fingers is made by your
          middle finger hitting your palm!
        </h1>
      </section>
      <section class="no-parallax">
        <h1>Have a nice day!</h1>
      </section>
    </main>
  </body>
</html>
```
