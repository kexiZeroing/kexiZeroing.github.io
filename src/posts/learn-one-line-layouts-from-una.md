---
layout: "../layouts/BlogPost.astro"
title: "Learn 1-Line Layouts from Una"
slug: learn-one-line-layouts-from-una
description: ""
added: "May 27 2023"
tags: [css]
updatedDate: "Mar 8 2024"
---

[Una Kravets](https://una.im) builds an amazing site with [1-Line Layouts](https://1linelayouts.glitch.me) demos showing how robust and impactful a single-line of styling code can be. There is a lot to learn, but it is all worth learning and empowers you to do great things.

### 01. Super Centered

```css
.parent {
  display: grid;
  place-items: center;
}
```

First specify `grid` as the `display` method, and then write `place-items: center` on the same element. `place-items` is a shorthand to set both `align-items` and `justify-items` at once.

- The `justify-items` property is set on the grid container to align the items inside their grid areas on the inline axis. In flexbox layouts, this property is ignored.
- The `justify-content` property controls the alignment of grid columns; The `justify-items` property aligns grid items within their columns (not the entire container).

### 02. The Deconstructed Pancake

```css
.parent {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.box {
  flex: 1 1 150px;  /*  Stretching */
  flex: 0 1 150px;  /*  No stretching */
}
```

This is a common layout for marketing sites, for example, which may have a row of 3 items, usually with an image, title, and then some text. On mobile, we'll want those to stack nicely, and expand as we increase the screen size.

By using Flexbox for this effect, you won't need media queries to adjust the placement of these elements when the screen resizes. The `flex` shorthand stands for: `flex: <flex-grow> <flex-shrink> <flex-basis>`.

### 03. Sidebar Says

```css
.parent {
  display: grid;
  grid-template-columns: minmax(150px, 25%) 1fr;
}
```

This takes advantage of the `minmax` function for grid layouts. What we're doing here is setting the minimum sidebar size to be `150px`, but on larger screens, letting that stretch out to `25%`. The sidebar will always take up 25% of its parent's horizontal space until that 25% becomes smaller than `150px`. Add the second item takes up the rest of the space as a single `1fr` track.

### 04. Pancake Stack

```css
.parent {
  display: grid;
  grid-template-rows: auto 1fr auto;
}
```

This layout is often used for both websites and apps with a single column grid. It sets the header and footer content to automatically take the size of its children, and applies the remaining space to the main area. The `auto` sized row will take the size of the minimum content of its children, so as that content increases in size, the row itself will grow to adjust.

> `fr` is greedy, `auto` is shy.
> - `1fr 1fr 1fr` --> 3 equal columns
> - `auto auto auto` --> 3 adaptive-width columns

### 05. Classic Holy Grail Layout

```css
.parent {
  display: grid;
  grid-template: auto 1fr auto / auto 1fr auto;
}
  
header {
  grid-column: 1 / 4;
}

.left-side {
  grid-column: 1 / 2;
}

main {
  grid-column: 2 / 3;
}

.right-side {
  grid-column: 3 / 4;
}

footer {
  grid-column: 1 / 4;
}
```

For this classic holy grail layout, there is a header, footer, left sidebar, right sidebar, and main content. To write this entire grid using a single line of code, use the `grid-template` property (`grid-template-rows` / `grid-template-columns`). This enables you to set both the rows and columns at the same time.

### 06. 12-Span Grid

```css
.parent {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}

.child-span-12 {
  grid-column: 1 / 13;
}

.child-span-6 {
  grid-column: 1 / span 6;
}
```

We have another classic: the 12-span grid. Using `repeat(12, 1fr)` gives you 12 columns each of `1fr`. Then we can place our children using grid lines. For example, `grid-column: 1 / 13` would span all the way from the first line to the last and span 12 columns.

Another way to write this is by using the `span` keyword. With `span`, you set the starting line and then how many columns to span from that starting point. In this case, `grid-column: 1 / span 12` would be equivalent to `grid-column: 1 / 13`.

### 07. RAM (Repeat, Auto, Minmax)

```css
.parent {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}
```

You are using repeat again, but this time, using the `auto-fit` keyword instead of an explicit numeric value. This enables auto-placement of these child elements. These children also have a base minimum value of `150px` with a maximum value `1fr`.

- With `auto-fit`, when there are not enough grid items to fill the number of tracks created, those empty tracks are collapsed. *(Fit entire length of container)*
- With `auto-fill`, everything is the same as `auto-fit`, except empty tracks are not collapsed. *(Doesn't fit entire length of the contaier)*

<img alt="grid-auto-fit" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/68c40383-3e52-433a-88ee-9650cc9d601a.png" width="600">

```css
/* Responsive CSS Grid */
.smol-css-grid {
  --min: 15ch;
  --gap: 1rem;

  display: grid;
  grid-gap: var(--gap);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--min)), 1fr));
}
```

```css
/* Responsive Flexbox Grid */
.smol-flexbox-grid {
  --min: 10ch;
  --gap: 1rem;

  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
}
.smol-flexbox-grid > * {
  flex: 1 1 var(--min);
}
```

### 08. Line Up

```css
.parent {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

This places the title, description, and image block in a vertical column inside of the parent card. Then, applying `justify-content: space-between` anchors the first (title) and last (image block) elements to the edges of the flexbox, and the descriptive text in between those gets placed with equal spacing to each endpoint.

### 09. Clamping My Style

```css
.parent {
  width: clamp(23ch, 50%, 46ch);
}
```

The minimum size here is `23ch` or 23 character units, and the maximum size is `46ch`, 46 characters. *Character width units* are based on the font size of the element (specifically the width of the `0` glyph).

> In monospace (fixed-width) fonts, where all characters are the same width, `1ch` equals one character. Otherwise, in proportional (variable-width) fonts, any given character could be wider or narrower than the “0” character.

What the `clamp()` function does here is enabling this element to retain a 50% width until 50% is either greater than `46ch`, or smaller than `23ch`. This enables more legible layouts, as the text won't be too wide or too squished and narrow.

This is also a great way to implement responsive typography. For example, you could write: `font-size: clamp(1.5rem, 20vw, 3rem)`. In this case, the font-size of a headline would always stay clamped between `1.5rem` and `3rem` but would grow and shrink based on the `20vw` actual value to fit the width of of the viewport.

### 10. Respect for Aspect

```css
.card {
  width: 50%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.visual {
  aspect-ratio: 16 / 9;
}
```

With the `aspect-ratio` property, as I resize the card, the visual block maintains this 16 x 9 aspect ratio. You can make a square with `1 / 1` ratio, a 2 to 1 ratio with `2 / 1`, and really just anything you need for the image or video to scale with a set size ratio. Note that if both a height and width are set on an element, then `aspect-ratio` is ignored.
