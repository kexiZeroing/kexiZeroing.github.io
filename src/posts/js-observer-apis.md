---
layout: "../layouts/BlogPost.astro"
title: "JavaScript Observer APIs"
slug: js-observer-apis
description: ""
added: "May 9 2024"
tags: [js]
updatedDate: "July 31 2024"
---

Observers can be helpful to watch certain activities happening in the browser and respond accordingly. For example, we can observe, if child element has been added or removed from the parent DOM element, if a video is displayed within the viewport and enable autoplay, if the size/dimensions of a box element has changed and so on. These are different types of observer APIs in JavaScript.

## Mutation Observer API
The `MutationObserver` interface provides the ability to watch for changes being made to the DOM tree.

The `MutationObserver()` constructor creates and returns a new observer which invokes a specified callback when DOM events occur. The callback function takes as input two parameters:
1. An array of objects describing each change that occurred.
2. The `MutationObserver` which invoked the callback. *This is most often used to disconnect the observer using `MutationObserver.disconnect()`.*

DOM observation does not begin immediately; the `observe(target, options)` method must be called first to establish which portion of the DOM to watch (`target`) and what kinds of changes to watch for (`options`). To be more specific, the `options` object describe which DOM mutations should be reported to `mutationObserver`'s callback. At a minimum, one of `childList`, `attributes`, and `characterData` must be true. Otherwise, a TypeError exception will be thrown.

- `subtree`: Set to true to extend monitoring to the entire subtree of nodes rooted at target. All of the other properties are then extended to all of the nodes in the subtree instead of applying solely to the target node. *(detect changes in all descendants of the node)*
- `childList`: Set to true to monitor the target node for the addition of new child nodes or removal of existing child nodes. *(detect changes in the direct children of node)*
- `attributes`: Set to true to watch for changes to the value of attributes on the node being monitored. *(detect attribute changes of node)*
- `characterData`: Set to true to monitor the specified target node for changes to the character data contained within the node. *(observe the changes of text content)*

```js
const targetNode = document.getElementById("some-id")

const config = { attributes: true, childList: true, subtree: true }

const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      console.log("A child node has been added or removed.")
    } else if (mutation.type === "attributes") {
      console.log(`The ${mutation.attributeName} attribute was modified.`)
    }
  }
}

const observer = new MutationObserver(callback)
observer.observe(targetNode, config)

// Later, you can stop observing
observer.disconnect()
```

## Intersection Observer API
The `IntersectionObserver` interface provides a way to asynchronously observe changes in the intersection of a target element with an ancestor element or with a top-level document's viewport. The ancestor element or viewport is referred to as the root.

The `IntersectionObserver(callback, options)` constructor creates and returns a new `IntersectionObserver` object.

The callback function is called when the percentage of the target element is visible crosses a threshold. The callback receives two parameters:
1. An array of objects, each describing the intersection between the target element and its root container at a specific moment of transition.
2. The `IntersectionObserver` for which the callback is being invoked.

The `options` object customizes the observer, for exmple, we can set the `root` or `threshold` property. If not specified, the observer uses the document's viewport as the root, with no margin, and a 0% threshold.

Then, we call the `observe()` method on the `IntersectionObserver` object, telling it to observe intersection changes for the target element (whose visibility within the root is to be monitored.)

```js
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const intersecting = entry.isIntersecting
    entry.target.style.backgroundColor = intersecting ? "blue" : "orange"
  })
})

observer.observe(document.getElementById("test"))
```

```js
const images = document.querySelectorAll('.lazyload')

function handleIntersection(entries) {
  entries.map((entry) => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src
      entry.target.classList.add('loaded')
      // `unobserve()` instructs the IntersectionObserver to stop observing the specified target element.
      // `disconnect()` stops watching all of its target elements for visibility changes.
      observer.unobserve(entry.target)
    }
  })
}

const observer = new IntersectionObserver(handleIntersection)

images.forEach(image => observer.observe(image))
```

The `thresholds`, if specified, accepts a value between 0 and 1 and represents the percentage of the element that must be visible before `isIntersecting` becomes true. By default this is set to 0 which means as soon as any part of the element is visible it will be considered intersecting. You can also pass an array to threshold which means that the `IntersectionObserver` will fire each time your element passes one of the thresholds passed to it.

```js
const observer = new IntersectionObserver(
  entries => {
    entires.forEach(entry => {
      entry.target.innerText = `${Math.round(entry.intersectionRatio * 100)}%`
    })
  },
  { threshold: [0, 0.25, 0.5, 0.75, 1] }
)
```

## Resize Observer API
The Resize Observer API provides a performant mechanism by which we can monitor an element for changes to its size, with notifications being delivered to the observer each time the size changes.

Usage is simple *(All the APIs with the `Observer` suffix we mentioned above share a simple API design)*, you create a new `ResizeObserver` object using the `ResizeObserver()` constructor, then use `ResizeObserver.observe()` to make it look for changes to a specific element's size. A callback function set up inside the constructor then runs every time the size changes, providing access to the new dimensions and allowing you to do anything you like in response to those changes.

```js
const ro = new ResizeObserver(entries => {
  for (let entry of entries) {
    const cr = entry.contentRect

    console.log('Element:', entry.target)
    console.log(`Element size: ${cr.width}px x ${cr.height}px`)
  }
})

ro.observe(document.getElementById("test"))
```
