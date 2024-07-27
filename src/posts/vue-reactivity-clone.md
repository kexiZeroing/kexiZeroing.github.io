---
layout: "../layouts/BlogPost.astro"
title: "Vue reactivity clone"
slug: vue-reactivity-clone
description: ""
added: "Jun 18 2023"
tags: [vue, code]
updatedDate: "July 27 2024"
---

In a reactive programming context, dependency tracking is a technique used to automatically update computations that depend on some input data when that data changes. In order for dependency tracking to work, the reactive framework needs to know which computations depend on which data. This is typically done by wrapping the data in reactive objects or variables that the framework can monitor for changes. When a piece of data changes, the framework can then notify any computations that depend on that data and trigger a re-evaluation of those computations.

Reactive data can be broadly thought of as data that causes some intended side effect when accessed or modified. By default, JavaScript isn’t reactive.

```js
let framework = 'Vue'
let sentence = `${framework} is awesome`
console.log(sentence)
// logs "Vue is awesome"

framework = 'React'
console.log(sentence)
// still logs "Vue is awesome"
// should log "React is awesome" if 'sentence' is reactive.
```

### Why Vue need to use `.value` to access the ref property?
The `.value` syntax is used in Vue 3 to access the value of a ref property because refs are designed to be reactive objects rather than simple values. When you create a ref, you are actually creating an object with a single property named `value`. The `value` property holds the actual value that the ref represents, and any changes to the `value` property trigger reactivity. When we access the ref directly, we are accessing the object, not the value.

When you create a reactive object with `reactive()`, you can access its properties directly using dot notation, without needing to use `.value`. This is because reactive objects use JavaScript's built-in getters and setters to intercept property access and modification, allowing Vue to track dependencies and trigger reactivity as needed.

- `reactive()` only takes objects, NOT JS primitives.
- `ref()` is calling `reactive()` behind the scenes.
- `ref()` has a `.value` property for reassigning, `reactive()` does not have this and therefore CANNOT be reassigned.

### Why Vue component data needs to be a function?
To ensure that each instance has its own unique set of data, the data option in a component must be a function that returns an object, rather than an object itself. This is because the object returned from a function is created every time a new instance of the component is created, while an object assigned directly to the data option would be shared across all instances. Methods, computed property definitions, and lifecycle hooks are created and stored only once, and run against every instance of a component.

### Shortcomings of React `useState()`
React `useState()` returns a state, the value. This means that `useState()` has no idea how the state value is used inside the component. The implication is that once you notify React of state change through a call to `setState()`, React has no idea which part of the page has changed and therefore must re-render the whole component.

It's worth noting that while React may re-render the entire component, it does so efficiently. React uses virtual DOM diffing to minimize the amount of work required to update the DOM. This means that even if a component has a large number of elements, React can update only the parts of the DOM that have changed, resulting in a fast and efficient re-render.

The virtual DOM was created to address performance issues caused by frequent manipulation of the real DOM. It is a lightweight, in-memory representation of the real DOM, which can be later used as reference to update the actual web page. When a component is rendered, the virtual DOM calculates the difference between the new state and the previous state (a process called "diffing") and makes the minimal set of changes to the real DOM to bring it in sync with the updated virtual DOM (a process called "reconciliation").

> Diffing isn't free. The more nodes you have, the more time it takes to diff. With newer frameworks like Svelte, the virtual DOM isn't even used because of the performance overhead. Instead, Svelte uses a technique called "dirty checking" to determine what has changed. Fine-grained reactivity frameworks like SolidJS take this a step further by pinpointing exactly what has changed and updating only that part of the DOM.

### Angular Signals in Vue by Evan You
https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals

```js
import { shallowRef, triggerRef, computed as _computed } from 'vue'

export function signal(initialValue) {
  const r = shallowRef(initialValue)
  const s = () => r.value
  s.set = value => { r.value = value }
  s.update = updater => { r.value = updater(r.value) }
  // `triggerRef` is used to force trigger effects that depends on a shallow ref.
  // It is used after making deep mutations to the inner value of a shallow ref.
  s.mutate = mutator => { mutator(r.value); triggerRef(r) }
  return s
}

export function computed(getter) {
  const c = _computed(getter)
  return () => c.value
}
```

### Vue reactivity implementation
<img alt="Vue3 reactivity" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/ba9fd338-ae71-43ab-88cc-52086aa8700a.png" width="650" />

```js
// https://www.youtube.com/watch?v=HezB8UEU5Rg
let activeEffect = null
let dep = new Set()

function track(target, key) {
  if (activeEffect) {
    // in reality, get the dep from depsMap of targetMap
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  dep.forEach(effect => effect())
}

function reactive(target) {
  const handler = {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    }
  }
  return new Proxy(target, handler)
}

function effect(fn) {
  activeEffect = fn
  activeEffect()
  activeEffect = null
}

let product = reactive({ price: 10, quantity: 4 })
let total = 0

// watcher
effect(() => {
  total = product.price * product.quantity
  console.log('total changed ', total)
})

product.quantity = 5
product.price = 12
```


<img alt="Vue2 reactivity" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/6a6e5dab-2f12-4dd2-ab94-f47dec512c71.png" width="650" />

```js
let target = null
let product = { price: 10, quantity: 4 }
let total = 0

class Dep {
  constructor() {
    this.subscribers = []
  }
  depend () {
    if (target && !this.subscribers.includes(target)) {
      this.subscribers.push(target)
    }
  }
  notify() {
    this.subscribers.forEach(sub => sub())
  }
}

Object.keys(product).forEach(key => {
  let value = product[key]

  const dep = new Dep()
  Object.defineProperty(product, key, {
    get() {
      dep.depend()
      return value
    },
    set(newVal) {
      if (newVal !== value) {
        value = newVal
        dep.notify()
      }
    }
  })
})

function watcher(fn) {
  target = fn
  target()
  // ensures that each watcher only collects the dependencies it directly uses
  target = null
}

// 1. update computed properties
// 2. trigger watch callbacks 
// 3. creates a watcher for the component's render function
watcher(() => {
  total = product.price * product.quantity
  console.log('total changed ', total)
})

product.quantity = 5
product.price = 12
```

Vue 2 reactivity caveats: Since Vue 2 performs the getter/setter conversion process during instance initialization, a property must be present in the data object in order for Vue to convert it and make it reactive.
1. It cannot detect property addition or deletion.
2. It cannot detect the changes to an array when you directly set an item with the index.

> Vue wraps an observed array’s mutation methods (`push`, `pop`, `unshift`, `shift`, etc) so they will trigger view updates.

To work around this, you can use `Vue.set(object, propertyName, value)` method instead. (`this.$set` instance method is an alias to the global `Vue.set`)
