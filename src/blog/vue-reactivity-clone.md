---
title: "Vue reactivity clone"
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

### Shortcomings of React `useState()`
React `useState()` returns a state, the value. This means that `useState()` has no idea how the state value is used inside the component. The implication is that once you notify React of state change through a call to `setState()`, React has no idea which part of the page has changed and therefore must re-render the whole component.

It's worth noting that while React may re-render the entire component, it does so efficiently. React uses virtual DOM diffing to minimize the amount of work required to update the DOM. This means that even if a component has a large number of elements, React can update only the parts of the DOM that have changed, resulting in a fast and efficient re-render.

The virtual DOM was created to address performance issues caused by frequent manipulation of the real DOM. It is a lightweight, in-memory representation of the real DOM, which can be later used as reference to update the actual web page. When a component is rendered, the virtual DOM calculates the difference between the new state and the previous state (a process called "diffing") and makes the minimal set of changes to the real DOM to bring it in sync with the updated virtual DOM (a process called "reconciliation").

> Diffing isn't free. The more nodes you have, the more time it takes to diff. With newer frameworks like Svelte, the virtual DOM isn't even used because of the performance overhead. Instead, Svelte uses a technique called "dirty checking" to determine what has changed. Fine-grained reactivity frameworks like SolidJS take this a step further by pinpointing exactly what has changed and updating only that part of the DOM.

### Vue reactivity implementation
<img alt="Vue3 reactivity" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/ba9fd338-ae71-43ab-88cc-52086aa8700a.png" width="650" />

```js
let activeEffect = null

// targetMap: WeakMap<target, depsMap>
// depsMap: Map<key, dep>
// dep: Set<effect>
const targetMap = new Map()

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    
    let dep = depsMap.get(key)
    if (!dep) {
      dep = new Set()
      depsMap.set(key, dep)
    }
    
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (!dep) return
  
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

// targetMap: Map {
//   product → depsMap: Map {
//     'price' → Set { effect1, effect2 }
//     'quantity' → Set { effect1, effect3 }
//   }
// }
let product = reactive({ price: 10, quantity: 4 })
let total = 0

effect(() => {
  total = product.price * product.quantity
  console.log('total changed ', total)
})

product.quantity = 5
product.price = 12
```

<br>
<img alt="Vue2 reactivity" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/6a6e5dab-2f12-4dd2-ab94-f47dec512c71.png" width="650" />

```js
let activeEffect = null

class Dep {
  constructor() {
    this.subscribers = new Set()
  }

  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect)
    }
  }

  notify() {
    this.subscribers.forEach(effect => effect())
  }
}

function defineReactive(target) {
  Object.keys(target).forEach(key => {
    let value = target[key]
    const dep = new Dep()

    Object.defineProperty(target, key, {
      get() {
        dep.depend() // track logic
        return value
      },
      set(newVal) {
        if (newVal !== value) {
          value = newVal
          dep.notify() // trigger logic
        }
      }
    })
  })

  return target
}

function effect(fn) {
  activeEffect = fn
  activeEffect()
  activeEffect = null
}

let product = defineReactive({ price: 10, quantity: 4 })
let total = 0

effect(() => {
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
