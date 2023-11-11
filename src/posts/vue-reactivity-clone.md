---
layout: "../layouts/BlogPost.astro"
title: "Vue reactivity clone"
slug: vue-reactivity-clone
description: ""
added: "June 18 2023"
tags: [vue, code]
updatedDate: "Nov 11 2023"
---

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

<img alt="Vue3 reactivity" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/ba9fd338-ae71-43ab-88cc-52086aa8700a.png" width="650" />

```js
// https://www.youtube.com/watch?v=HezB8UEU5Rg
let activeEffect = null
let dep = new Set()

function track(target, key) {
  // in reality, get the dep from depsMap of targetMap
  if (activeEffect) {
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  dep.forEach(effect => effect())
}

function reactive(target) {
  const handler = {
    get(target, key, receiver) {
      // return target[key]
      const result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      // target[key] = value
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    }
  }
  return new Proxy(target, handler)
}

function effect(fn) {
  activeEffect = fn
  if (activeEffect) activeEffect()
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
  target = null
}

watcher(() => {
  total = product.price * product.quantity
  console.log('total changed ', total)
})

product.quantity = 5
product.price = 12
```

### Vue 2 reactivity caveats
Since Vue 2 performs the getter/setter conversion process during instance initialization, a property must be present in the data object in order for Vue to convert it and make it reactive.
1. It cannot detect property addition or deletion.
2. It cannot detect the changes to an array when you directly set an item with the index.

To work around this, you can use `Vue.set(object, propertyName, value)` method instead. *(`this.$set` instance method is an alias to the global `Vue.set`)*

In Vue 2, any sharing of component code required mixins because it's imperative to setting up reactivity that any properties you intend to be reactive are available to Vue at the time of instantiation. Proxies not only provides a way for the reactivity caveats of Vue 2 to be overcome but also allows the reuse of logic across components via the Composition API. Data objects created using `reactive` are not bound to the component instance. This means they can be shared like any other JavaScript data and retain their reactivity.

### Render function
When using the render function instead of templates, you'll be using the `h` function a lot. It creates a VNode (virtual node), an object that Vue uses internally to track updates and what it should be rendering. These render functions are essentially what is happening "under the hood" when Vue compiles your single file components to be run in the browser.

```vue
<script>
import { h } from 'vue'

export default {
  render() {
    return h("div", {}, [
      h("h1", {}, "Render Functions are awesome"),
      h("p", {class: 'text-blue-400'}, "Some text")
    ]);
  }
}
</script>
```
