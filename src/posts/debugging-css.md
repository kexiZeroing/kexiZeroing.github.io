---
layout: "../layouts/BlogPost.astro"
title: "Debugging CSS"
slug: debugging-css
description: ""
added: "Oct 10 2021"
tags: [css]
---

- Vertical padding and margin doesn’t work for inline elements. You would have to change the element’s `display` property to `inline-block` or `block`.

- `input`, `video`, `img`, `iframe`, `embed` are replaced elements whose width and height are predefined, without CSS. `iframe` has the default width `300px` and height `150px`.

- When an element has a `position` value of `absolute`, it becomes a block-level element by default. This means that adding `inline-block` or `block` as the display type won’t affect it at all.

- When you apply a `float` to an element with a display type of `flex` or `inline-flex`, it won’t affect the element at all.

- Say you have two elements, the one above with `margin-bottom`, and the one below with `margin-top`. The greater of the two values will be used as the margin between the elements, and the other will be ignored by the browser.

- `margin: auto` is a popular way to center an element, and it’s important to mention that it only works with block-level elements.

- You can’t set a percentage-based height for an element unless the height of its parent is explicitly defined. You can use `body { height: 100vh }` to make the `body` element take up the full height of the viewport.

- Elements are grouped into stacking contexts. When we give an element a `z-index`, that value is only compared against other elements in the same context. `z-index` values are not global. By default, a plain HTML document will have a single stacking context that encompasses all nodes. But there are many ways to create stacking contexts, e.g., combining relative or absolute positioning with `z-index`; Setting position to `fixed` or `sticky`; Setting `opacity` to a value less than 1; Adding a `z-index` to a child inside a `display: flex` or `display: grid` container; Using `transform`, `filter`, `perspective`.

- The `::before` pseudo-element becomes the first child of its parent, whereas `::after` is added as the last child. The default display value of a pseudo-element is `inline`. So when you add a width, height, vertical padding or vertical margin, it won’t work unless the `display` type is changed.

- By default, the `color` property is inherited by child elements such as `p` and `span`. Instead of setting the color property on each element, add it to the `body`, and then all `p` and `span` elements will inherit that color. However, the `a` element doesn’t inherit `color` by default. You can override its color or use the `inherit` keyword.

- A common mistake when showing a border on hover is to add the border only on hover. If the border is 1 pixel, then the element will jump by that much when the user hovers over it. To avoid the jump, add the border to the normal state with a transparent color.

- Unlike border, `outline` is drawn outside the element's border and may overlap other content. Also, the outline is not a part of the element's dimensions; the element's total width and height is not affected by the width of the outline. You can override it with a custom one, but don’t remove that outline under any circumstances, because it will affect the accessibility of the website.

  ```css
  /* debug your CSS layouts with one line */
  * {
    outline: 1px solid #f00 !important;
  }
  ```

- Find element that is causing the showing of horizontal scrollbar.

  ```js
  let all = document.getElementsByTagName("*"),
      rect,
      docWidth = document.documentElement.offsetWidth;
  for (let i = 0; i < all.length; i++) {
    rect = all[i].getBoundingClientRect();
    if (rect.right > docWidth || rect.left < 0){
      console.log(all[i]);
      all[i].style.outline = '1px solid red';
    }
  }
  ```

- A long word or link can easily cause horizontal overflow (scrolling). The solution is to use `overflow-wrap: break-word`. It’s worth mentioning that the property has been renamed from `word-wrap` to `overflow-wrap`.

- For `text-overflow: ellipsis` to work, the element’s `display` type should be set to `block` and the element must have the `overflow: hidden` and `white-space: nowrap` set.

- Flexbox doesn’t wrap by default, thus may cause horizontal scrolling. Always make sure to add `flex-wrap: wrap`. By default, flexbox stretch its child items to make them equal in height if the direction is set to `row`, and it makes them equal in width if the direction is set to `column`.

- Each flex item has a `flex-basis` property, which acts as the sizing property for that item. When the value is `flex-basis: auto`, the basis is the content’s size. With `.item { flex-grow: 1; flex-basis: 0%; }`, each child item will take up the same space as its siblings.

- How we compare a design against implementation? We can take the original design as an image and place it above the page in the browser. Thanks to CSS backgrounds and pseudo-elements, this is possible. Please make sure that the browser width is equal to the design width and no other element in the same stacking context has a higher `z-index` than the pseudo-element. Also, you will notice that nothing is hoverable or clickable, that’s because the pseudo-element is covering the page. We can allow interactivity by setting `pointer-events: none` (the specified HTML element is never the target of pointer events).

  ```css
  body {
    position: relative;
  }

  body:after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    z-index: 100;
    width: 100%;
    height: 100%;
    background-image: url('example.png');
    background-size: 100% auto;
    background-repeat: no-repeat;
    opacity: 0.5;
    pointer-events: none;
  }
  ```

- You can add infinite borders using `box-shadow` if you want to apply multiple borders on one div. `box-shadow` is described by X and Y offsets relative to the element, blur and spread radius, and color. You can set multiple effects separated by commas.

  ```css
  img {
    margin: 40px;
    width: 90px;
    border-radius: 50%;
    /* box-shadow: x-offset y-offset blur spread color */
    box-shadow:
      0 0 0 10px #817dd1,
      0 0 0 20px #5c58aa,
      0 0 0 30px #3d3a84,
      0 0 0 40px #211f56;
  }
  ```

- A shaded blur behind a logo is simple but beautiful affect.
  ```css
  .img-bg {
    position: absolute;
    background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
    border-radius: 50%;
    filter: blur(72px);
    z-index: -1;
    animation: pulse 4s cubic-bezier(0, 0, 0, 0.5) infinite;
  }

  @keyframes pulse {
    50% {
      transform: scale(1.5);
    }
  }
  ```

- In order for the `postion: sticky` element to function correctly, it needs to have at least one of it's `top`, `right`, `left`, or `bottom` placement properties set. Also look for any `overflow` property set on any parents of the element. You can't use `overflow: hidden`, `overflow: auto`, or `overflow: scroll` on the parent of a `position: sticky` element.

- Position `fixed` doesn’t work with `transform` CSS property. It happens because transform creates a new coordinate system and your `position: fixed` element becomes fixed to that transformed element.

- Hints for inactive CSS properties come in Chrome 108 update. It helps identify CSS styles that are entirely valid but have no visible effects.

  <img alt="devtool_css_hints" src="https://tva1.sinaimg.cn/large/008vxvgGly1h7igjzobb8j30vg0m8add.jpg" width="600" />

- Center one and right/left align other element: Grid layout may be the cleanest and most efficient method. There is no need for absolute positioning or flexbox with fake elements.

  ```css
  ul {
    display: grid;
    grid-template-columns: 1fr repeat(3, auto) 1fr;
    grid-column-gap: 5px;
    justify-items: center;
  }
  li:nth-child(1) { margin-right: auto; }
  li:nth-child(2) { grid-column-start: 2; }

  /* for demo only */
  ul { padding: 0; margin: 0; list-style: none; }
  li { padding: 5px; background: #ccc; }
  ```

  ```html
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
    <li>D</li>
  </ul>
  ```
