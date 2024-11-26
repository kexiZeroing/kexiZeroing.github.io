---
layout: "../layouts/BlogPost.astro"
title: "Debugging CSS"
slug: debugging-css
description: ""
added: "Oct 10 2021"
tags: [css]
updatedDate: "May 5 2024"
---

- A fundamental concept for CSS layout is inline vs. block elements. Inline means elements only take up the space they need, and do not affect flow. Applying `margin` or `padding` to an inline element will only work in the "inline" direction (left/right) not the "block" direction (top/bottom).

- Sometimes when we include an image in our markup, a bit of mysterious space is added underneath. The problem is that images by default are considered inline elements, and setting `line-height: 0` on the parent can solve it. Another way is to set the image `display: block`, which tells flow layout: Hey, this image isn't a word in a sentence. It's a block element, and block elements never have any of this inline magic space. The third way to solve this is not using flow layout, but set parent `display: flex`.

- `input`, `video`, `img`, `iframe`, `embed` are replaced elements whose width and height are predefined, without CSS. `iframe` has the default width `300px` and height `150px`.

- When an element has a `position` value of `absolute`, it becomes a block-level element by default. This means that adding `inline-block` or `block` as the display type won’t affect it at all.

- The `<p>` element represents a paragraph. It cannot contain block-level elements including `<p>` itself. For example, `<p><div>hello</div></p>` will be parsed as `<p></p><div>hello</div><p></p>` in Chrome. *(Invalid HTML will be fixed by the browser)*

- When you apply a `float` to an element with a display type of `flex` or `inline-flex`, it won’t affect the element at all.

- Say you have two elements, the one above with `margin-bottom`, and the one below with `margin-top`. The greater of the two values will be used as the margin between the elements, and the other will be ignored by the browser.

- `margin: auto` is a popular way to center an element, and it’s important to mention that auto margins (e.g. `margin-right: auto`) will take up the extra space and apply it to the element's margin. 

- You can’t set a percentage-based height for an element unless the height of its parent is explicitly defined. You can use `body { height: 100vh }` to make the `body` element take up the full height of the viewport.

- Elements are grouped into stacking contexts. When we give an element a `z-index`, that value is only compared against other elements in the same context. `z-index` values are not global. By default, a plain HTML document will have a single stacking context that encompasses all nodes. But there are many ways to create stacking contexts, e.g., combining relative or absolute positioning with `z-index`; Setting position to `fixed` or `sticky`; Setting `opacity` to a value less than 1; Adding a `z-index` to a child inside a `display: flex` or `display: grid` container; Using `transform`, `filter`, `perspective`.

- The `::before` pseudo-element becomes the first child of its parent, whereas `::after` is added as the last child. The default display value of a pseudo-element is `inline`. So when you add a width, height, vertical padding or vertical margin, it won’t work unless the `display` type is changed.

- By default, the `color` property is inherited by child elements such as `p` and `span`. Instead of setting the color property on each element, add it to the `body`, and then all `p` and `span` elements will inherit that color. However, the `a`, `input`, or `button` element doesn’t inherit `color` by default. You can override its color or use the `inherit` keyword (to inherit those non-inheritable properties.)

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

  > `getBoundingClientRect` returns a `DOMRect` object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels. Properties other than width and height are relative to the top-left of the viewport.

- A long word or link can easily cause horizontal overflow (scrolling). The solution is to use `overflow-wrap: break-word`. It’s worth mentioning that the property has been renamed from `word-wrap` to `overflow-wrap`.

- Flexbox doesn’t wrap by default, thus may cause horizontal scrolling. Always make sure to add `flex-wrap: wrap`. By default, flexbox stretch its child items to make them equal in height if the direction is set to `row`, and it makes them equal in width if the direction is set to `column`.

- Each flex item has a `flex-basis` property, which acts as the sizing property for that item. When the value is `flex-basis: auto`, the basis is the content’s size. With `.item { flex-grow: 1; flex-basis: 0%; }`, each child item will take up the same space as its siblings. `flex: 1` is equivalent to `flex: 1 1 0`.

- While the default `min-width` value is 0 (zero), for flex items it is `auto`. This can make block elements take up much more space than desired, resulting in overflow. The solution is to add `min-width: 0;` to the flex item.

- `flex-basis` is more of a suggestion than a hard constraint. At a certain point, there isn't enough space for all of the elements to sit at their assigned size, and so they have to compromise, in order to avoid an overflow. The default value for `flex-grow` is 0. The default value for `flex-shrink` is 1.

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

- In order for the `postion: sticky` element to function correctly, it needs to have at least one of it's `top`, `right`, `left`, or `bottom` placement properties set. Also look for any `overflow` property set on any parents of the element. You can't use `overflow: hidden`, `overflow: auto`, or `overflow: scroll` on the parent of a `position: sticky` element.

- If you are using `visible` for either `overflow-x` or `overflow-y` and something other than `visible` for the other, the `visible` value is interpreted as `auto`. Say if one is set to `visible`, and the other to `auto` or `hidden`, then the `visible` is changed to `auto`.

  ```css
  .wrapper {
    overflow-y: hidden;
    /* browser will add this by default, resulting in clipping both sides. */
    overflow-x: auto;
  }
  ```

- This is where the `overflow: clip` becomes helpful. It’s supported by all major browsers. If you set `overflow-y` to `clip`. The `overflow-x` value will stay as is (`visible`). Now the clipping happens only on the y-axis.

- Position `fixed` doesn’t work with `transform` CSS property. It happens because transform creates a new coordinate system and your `position: fixed` element becomes fixed to that transformed element.

- Center one and right/left align other element: Grid layout may be the cleanest and most efficient method. There is no need for absolute positioning or flexbox with fake elements.

  <img alt="header_center_grid" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8pu4q80utj30zq0u0gnm.jpg" width="600" />

  *(above picture comes from @shadeed9)*

  ```css
  header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }
  .left-text, .right-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  ```

- The styles for flexbox columns are built with the `order` property to reposition the columns. With CSS grid, it isn’t needed at all as we can reorder the layout by positioning an element on any grid lines we want.

  ```css
  .c-newspaper {
    grid-template-columns: 1fr 2fr 1fr;
  }
  /* The first column is placed from line 2 to line 3 */
  .c-newspaper__col:first-child {
    grid-column: 2/3;
  }
  /* The last column is placed from line 3 to line 4 */
  .c-newspaper__col:last-child {
    grid-column: 3/4;
  }
  ```

  > There’s a lot of advantages to grid, like `minmax()`/`repeat()` functions. Grid is also required for any 2D layout as flex can’t handle that, and it tends to be better when you have more intentionally defined values for rows and/or columns. Also, you get the `fr` unit which is really handy.

- The `grid-template-areas` property specifies areas within the grid layout (limited to rectangular grid areas). Once the template areas are defined, we can reference them in CSS and assign each named area to its designated element by using the `grid-area` property.

  ```css
  .page {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-areas:
      "aside main"
      "footer footer";
    gap: 1rem;
  }
  .aside {
    grid-area: aside;
  }
  .main {
    grid-area: main;
  }
  .footer {
    grid-area: footer;
  }
  ```

- Have you ever wondered why padding is inconsistent above and below text elements? Each font has a different `line-height` and that comes with a different spacing above and below the text. To fix that, we can add a fake element next to the button’s TextNode, and when a pseudo-element is placed next to it, we can use `vertical-align: middle` to center both. This is a much better solution than setting the different top and bottom spacing values.

  ```css
  .button:before {
    content: "";
    display: inline-block;
    height: 16px;
    vertical-align: middle;
  }
  ```

- A dialog is a component in a web page or app that usually contains an action or some task to perform. Dialogs have a role of `dialog`, which the browser will assign automatically for you when you use the `<dialog>` element. You can also create dialogs with ARIA: apply `role="dialog"` to an element like `<div>`. If it is a modal dialog, add `aria-modal="true"` when it shows, and remove it when it is dismissed. Dialogs can be modal (when shown with `dialog.showModal()`) or non modal (when shown with `dialog.show()`). When `<dialog>`s are modal, the browser will treat the content outside of the dialog as inert, and prevent keyboard focus from reaching web content outside of the dialog. If a `<dialog>` is not modal, the other content is not treated as inert. Browsers will close modal dialogs when users press `Escape`. Non-modal dialogs don't get this default behaviour, developers can add it where it makes sense. Check out the [slides](https://talks.hiddedevries.nl/G9mATs/slides) about how to build dialogs and popovers.

  > `<dialog>` examples demo (default, error, wait, notify, confirm, transitioned, light dismiss, fully customized): https://codepen.io/argyleink/pen/VwJvqrW

- CSS `unset` will remove all properties set directly on the matched element, and revert to inheriting from the cascade - like a parent element or `<body>` (if the property naturally inherits from its parent); `inherit` is pretty straight-forward that inherits all defined properties from its parent element. `revert` will set the property to the user agent stylesheet value — AKA the default browser style. `initial` is the nuclear option. This will reset a CSS property as if no CSS rules had been written for that value, which means it’s gonna remove the style all together.

  ```html
  <!-- What color is the <p> tag’s text? -->
  <!-- The answer is red since unset “unsets” the style of the p tag, 
  so it inherits from its parent – body. -->
  <p class="hello">Hello</p>

  <style>
    body { color: red; }
    p { color: green; }
    .hello { color: unset; }
  </style>
  ```

  > Children of parents with `min-height` can't inherit the height property. The easiest workaround is to add `height: 1px;` to the parent. Alternatively you may set `min-height: inherit;` to the child. 

- Stop re-inventing the wheel and just use `<button>` to create a button. If you're worried about default button styles, use `all: unset`. This one line of CSS will strip all default browser styles so you can apply your own.

- Sometimes the web page looks strangely inflated on mobile landscape devices. The reason is that Mobile Safari increases the default font-size when you switch a website from portrait to landscape. The way to control this font-size inflation is with the `-webkit-text-size-adjust` property, which you can set to a percentage which to increase the text size to at the most, to `auto` for default behavior or to `none` to prevent zooming text in. Setting it to `100%` is equivalent to `none`.

  ```css
  /* Prevent font size inflation */
  html {
    -moz-text-size-adjust: none;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
  ```

- The border radius of the outer element should be equal to the sum of the border radius of the inner element and the distance between the two elements. So if the outer element border radius is 20, and there's a 5px space between the outer element and inner element, the inner element border radius should be 15.

- Before Chrome 118, font sizes smaller than 10px or so were not rendered as specified, but rounded up if the language was Arabic, Farsi, Japanese, Korean, Thai, Simplified or Traditional Chinese. Developers needed workarounds to render small text, for example by using the `transform` property. From Chrome 118, this limit is ended for all languages, making the seven languages match the rest.

- Less absolute positioning with modern CSS. For example, when we have a card that contains text over an image, we often use `position: absolute` to place the content over the image. This is no longer needed with CSS grid. `grid-area: 1 / -1;` *(interpreted as `grid-area: 1 / -1 / auto / auto`)* places the element on the first row and makes it span all the way to the last column. It's a common way to make an element stretch across an entire row or column in a grid layout.

  ```css
  /* By default, CSS grid will create rows automatically based on the content. */
  .card {
    position: relative;
    display: grid;
  }

  .card__thumb,
  .card__content {
    grid-column: 1/2;  /* we can also use `grid-area: 1/-1` */
    grid-row: 1/2;
  }

  /* grid-area: 2 / 1 / 2 / 4; */
  /* grid-row-start / grid-column-start / grid-row-end / grid-column-end
  ```

  <img alt="stack-elements-with-grid" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/stack-elements-grid.png" width="650" />

- 8-digit hex notation (#RRGGBBAA): The first 6 digits are interpreted identically to the 6-digit notation. The last pair of digits, interpreted as a hexadecimal number, specifies the alpha channel of the color, where `00` represents a fully transparent color and `ff` represent a fully opaque color. Btw, 4-digit notation (#RGBA) is a shorter variant of the 8-digit notation. If there is only one number, it is duplicated: `1` means `11`, `c` means `cc`.

- `text-underline-offset` sets the offset distance of an underline text decoration line from its original position. All browsers support this property. Note that it is not part of the `text-decoration` shorthand.

- The `white-space` CSS property sets how white space inside an element is handled. By default, the sequences of white space are collapsed. Newline characters in the source are handled the same as other white space. Use `white-space: pre-wrap;` to preserve spaces, tabs, and new lines.

- CSS animations are pretty sweet, but they typically require explicit sizes, you couldn't use the intrinsic sizing keywords like `auto`, `min-content`, or `fit-content`. [From Chrome 129](https://developer.chrome.com/docs/css-ui/animate-to-height-auto), you can declare `interpolate-size: allow-keywords` on `:root` to enable transitioning to and from intrinsic sizing keywords for the entire document.

- CSS background image on background color.

```css
{
  background-image: url('images/foo.png');
  background-color: #6DB3F2;
}

{
  background: url('images/foo.png'), #6DB3F2;
}
```

**The second one is not shorthand for the first.** In the first method, last property (color) takes precedence. The use of the comma in the background property sets multiple backgrounds which get layered on top of each other. The image will be on top, color underneath (opposite of the first method).

> MDN docs: You can apply multiple backgrounds to elements. These are layered atop one another with the first background you provide on top and the last background listed in the back. Only the last background can include a background color. You can do this with both the shorthand `background` property and the individual properties except for `background-color`.
