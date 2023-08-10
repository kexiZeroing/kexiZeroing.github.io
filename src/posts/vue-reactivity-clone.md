---
layout: "../layouts/BlogPost.astro"
title: "Vue reactivity clone"
slug: vue-reactivity-clone
description: ""
added: "June 18 2023"
tags: [code]
---

### Vue reactivity
By default, JavaScript isn’t reactive.

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

### Render function
When using the render function instead of templates, you'll be using the `h` function a lot. It creates a VNode (virtual node), an object that Vue uses internally to track updates and what it should be rendering.

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
