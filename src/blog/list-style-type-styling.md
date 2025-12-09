---
title: "CSS list-style-type styling"
description: ""
added: "Dec 8 2025"
tags: [css]
---

Modern CSS gives us several tools for generating list markers, ranging from simple built-in bullets to fully customized counter algorithms. Developers often reach for `list-style-type` without realizing they can mix built-in marker styles, counters, or even define completely new numbering systems with `@counter-style`.

## list-style-type
Only a few elements (`<li>` and `<summary>`) have a default value of `display: list-item`. However, the `list-style-type` property may be applied to any element whose display value is set to `list-item`. Moreover, because this property is inherited, it can be set on a parent element (commonly `<ol>` or `<ul>`) to make it apply to all list items.

Use `list-style-type` when one of the built-in list markers already does what you need.
Examples of built-ins:
- `disc`, `circle`, `square`
- `decimal`, `upper-roman`, `lower-roman`
- `upper-alpha`, `lower-alpha`
- `cjk-decimal`, `cjk-heavenly-stem`, `korean-hangul-formal`, etc.

```css
/* keyword value */
list-style-type: disc;

/* string value — the same marker for every item */
list-style-type: "**";

/* We will talk about it soon */
/* matching an @counter-style rule */
list-style-type: custom-counter-style;
```

This is the simplest way to get bullets or numbering without custom logic. MDN has a [full list of built-ins](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/list-style-type#all_list_style_types).

## counter() CSS function
Use CSS counters (`counter-reset`, `counter-increment`, `counter()`) when you want to custom numbering rules for arbitrary HTML structures—not only `<ol>` or `<ul>`.

The `counter()` function accepts up to two parameters. The first parameter is the `<counter-name>`. The optional second parameter is the `<counter-style>`.
- You define a counter name using the `counter-reset` property, often on a parent element. This property also initializes the counter's value.
- The `counter-style` is either a built-in counter style (e.g. `disc`, `decimal`, `upper-roman`, etc) or a custom counter style defined with `@counter-style`. If omitted, it defaults to decimal.


The basic workflow is:
1. Define and initialize a counter with `counter-reset`
2. Increment it using `counter-increment`
3. Output it in content using `counter()`

```css
ul {
  counter-reset: count;
}
li {
  counter-increment: count;
}
li::before {
  content:
    "[" counter(count) "] == ["
    counter(count, lower-alpha) "]";
}

/* It will render as:
[1] == [a] xxxx
[2] == [b] yyyy
*/
```

```css
.double-list {
  counter-reset: count -1;
}

.double-list li {
  counter-increment: count 2;
}

.double-list li::marker {
  content: counter(count, decimal) ") ";
}

/* It will render as:
1) Item 1
3) Item 2
5) Item 3
*/
```

```css
section {
  counter-reset: sectionCounter;
}
h2::before {
  counter-increment: sectionCounter;
  content: "Section " counter(sectionCounter, lower-roman) ": ";
}

<section>
  <h2>Intro</h2>
  <h2>Usage</h2>
</section>
/* It will render as:
Section i: Intro
Section ii: Usage
*/
```

```css
.level-1 {
  counter-reset: myLevel1;
}
.level-1 > .item {
  counter-increment: myLevel1;
}
.level-1 > .item::before {
  content: counter(myLevel1, decimal) ". ";
}

.level-2 {
  counter-reset: myLevel2;
}
.level-2 > .item {
  counter-increment: myLevel2;
}
.level-2 > .item::before {
  content: counter(myLevel2, lower-alpha) ") ";
}

/* It will render as:
1. Level 1 item
2. Level 1 item
   a) Level 2 item
   b) Level 2 item
3. Level 1 item
*/
```

## @counter-style rule
Use `@counter-style` when you want to define a fully custom numbering system or bullets.

- `system`: Specifies the algorithm to be used for converting the integer value of a counter to a string representation.
  - `system: cyclic`: Repeats the symbols in a loop, one symbol per counter value.
  - `system: fixed`: Uses each symbol once in order; after the list is exhausted, the style stops or falls back.
  - `system: numeric`: Uses the symbols as digits to display the counter value as a number.
  - `system: alphabetic`: Turns numbers into sequences of letters (like A, B, … Z, AA, AB, …).
- `symbols`: The actual marker strings (can be text, emoji, images).
- `prefix` / `suffix`: Add characters before or after each marker.
- `fallback`: Specifies the counter name to fall back to if either the specified system is unable to construct the representation of a counter value or if the counter value is outside the specified range. (ultimately fall back to the decimal style)

```css
@counter-style checkmark {
  system: cyclic;
  symbols: "✔";
  suffix: " ";
}

ul {
  list-style-type: checkmark;
}
```

Check more examples [here](https://mdn.github.io/css-examples/counter-style-demo/).

Besides use it directly in `list-style-type`, you can also use it with the `counter()` function to create custom counters.

```css
@counter-style stars {
  system: numeric;
  symbols: "★" "★★" "★★★" "★★★★" "★★★★★";
}

ol {
  counter-reset: r;
}

li::before {
  counter-increment: r;
  content: counter(r, stars) " ";
}

/* 
Means each digit is shown using special “digit symbols”
digit 0 -> "★"
digit 1 -> "★★"
digit 2 -> "★★★" 
*/
```

## Summary
CSS list markers are more powerful than most people expect.
- Use `list-style-type` for quick, built-in markers.
- Use CSS counters (`counter()`) when you need full control over numbering across arbitrary elements. Think of counters as “the logic that increments numbers anywhere on the page.”
- Use `@counter-style` when even the built-in styles aren’t enough and you want your own rule-based system for bullets or numbers. Think of `@counter-style` as “the system that turns numbers into text/emoji/icons/images.”
  