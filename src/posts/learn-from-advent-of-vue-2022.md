---
layout: "../layouts/BlogPost.astro"
title: "Learn from Advent of Vue 2022"
slug: learn-from-advent-of-vue-2022
description: ""
added: "Dec 27 2022"
tags: [vue]
updatedDate: "Mar 7 2024"
---

### Code Structure
Use the template https://stackblitz.com/edit/vue3-vite-starter to start.

In a Vue component, `<script setup>` can be used alongside normal `<script>` using the options API. It works because the `<script setup>` block is compiled into the component's `setup()` function, [check out the docs](https://vuejs.org/api/sfc-script-setup.html#usage-alongside-normal-script)

Components using `<script setup>` are closed by default - i.e. the public instance of the component will not expose any of the bindings declared inside `<script setup>`. To explicitly expose properties, use the `defineExpose` compiler macro.

### Date Countdown
https://papaya-caramel-13dd76.netlify.app/

1. Use the [useNow](https://vueuse.org/core/usenow) composable from VueUse to get a reactive version of the current time and then do the math to get days, hours, minutes, and seconds.
2. Use the Vue transition component to transition smoothly between each countdown number.

By the way, **destructuring a value from a reactive object will break reactivity**, since the reactivity comes from the object itself and not the property you’re grabbing. Using `toRefs` lets us destructure our props when using `script setup` without losing reactivity.

```js
const { count } = defineProps<{ count: number }>(); // Don't do this!

// The first obvious solution is to not destructure the props object
const props = defineProps<{ count: number }>();
const even = computed(() => (props.count % 2 === 0 ? 'even' : 'odd'));

// Use toRefs() helper
const props = defineProps<{ count: number }>();
const { count } = toRefs(props);
const even = computed(() => (count.value % 2 === 0 ? 'even' : 'odd'));
```

> What is the difference between ref, toRef and toRefs: https://stackoverflow.com/questions/66585688/what-is-the-difference-between-ref-toref-and-torefs
>
> I was wondering why `toRef` exists since you can just do `const fooRef = ref(state.foo)`, but that creates a disconnected ref; any changes to it only update fooRef's dependencies. But using `toRef` keeps the original connection.

Adding deep reactivity to a large object can cost you a lot of performance, you can optimize the reactivity in your app by using `shallowRef`. Here reactivity is only triggered when the `value` of the `ref` itself is changed, but modifying any of the nested properties won’t trigger anything.

```js
const state = shallowRef({ count: 1 })

// does NOT trigger change
state.value.count = 2

// does trigger change
state.value = { count: 2 }
```

### Recursive Tree
1. Recursion always requires two things: Define your base case and recursive case. To do this you need a switch of some kind (maybe a `v-if`), and a value that changes with each step in the recursion.
2. You can either place the recusion before or after what the component is rendering. Each will give you opposite results, and the wrong one will give you an upside-down tree.
3. Challenge on decorations: https://github.com/Advent-Of-Vue/2022-christmas-tree-ornaments-solution

```vue
<!-- ChristmasTree.vue -->
<template>
  <div>
    <ChristmasTree v-if="size > 1" :size="size - 1" />

    <div class="flex flex-row justify-center">
      <!-- Create the tree sections -->
      <div v-for="i in size" class="relative rounded-full bg-green w-16 h-16 -m-2 flex justify-center items-center" />
    </div>
  </div>
</template>
```

`v-if` vs. `v-show`: Generally speaking, `v-if` has higher toggle costs while `v-show` has higher initial render costs. For example, if you have a tabs component, that some tab contains a heavy component. Using `v-if`, it will get the component destroyed and re-created when switching tabs. Using `v-show`, you will need to pay the mounting cost on the initial render even you haven't switch to that tab yet.

### Use Composables
> Similar idea to "Copy JSX? Create a component. Copy logic? Create a hook."

**How the Vue Composition API replaces Vue Mixins?**  
Normally, a Vue component is defined by a JavaScript object with various properties representing the functionality we need — things like `data`, `methods`, `computed`, and so on. When we want to share the same properties between components, we can extract the common properties into a separate module. Now we can add this mixin to any consuming component by assigning it to the `mixin` config property. At runtime, Vue will merge the properties of the component with any added mixins.

Mixins have drawbacks: 
1. Naming collisions. What happens if they both share a property with the same name?
2. Implicit dependencies. A component can use a data property defined in the mixin but a mixin can also use a data property it assumes is defined in the component. This can cause problems. What happens if we want to refactor a component later and change the name of a variable that the mixin needs?

The key idea of the Composition API is that, rather than defining a component’s functionality as object properties, we define them as JavaScript variables that get returned from a new `setup` function. The clear advantage of the Composition API is that it’s easy to extract logic. It allows Vue to lean on the safeguards built into native JavaScript in order to share code, like passing variables to the composition function, and the module system.

```js
// useCounter.js
// https://css-tricks.com/how-the-vue-composition-api-replaces-vue-mixins/
import { ref, computed } from 'vue';
export default function () {
  const count = ref(0);
  const double = computed(() => count.value * 2)
  function increment() {
    count.value++;
  }
  return {
    count,
    double,
    increment
  }
}

// useEvent composable
import { onMounted, onBeforeUnmount } from 'vue';
export function useEvent = (event, handler, options) => {
  const {
    target = window,
    listener,
  } = options;
  onMounted(() => {
    target.addEventListener(event, handler, listener);
  });
  onBeforeUnmount(() => {
    target.removeEventListener(event, handler, listener);
  });
};
```

### Organize your Composition API code
We abandon the options API for the composition API, and the idea is not that we write everything the same way as the options API but not having the data/computed/watch options.

```js
// Common mistake: Grouping by options
// data
const originalMessage = ref('Hello World!')
const isReversed = ref(false)

// computed
const message = computed(() => {
  if (isReversed.value) {
    return originalMessage.value.split('').reverse().join('')
  }
  return originalMessage.value
})

// watch...
```

```js
// Let's Refactor it
// Message-related stuff
const originalMessage = ref('Hello World!')
const { toggleReverse, message } = useMessage(originalMessage)

// create `useMessage.js` file or inline composables
function useMessage(input) {
  const originalMessage = toRef(input)
  const reversedMessage = computed(() => originalMessage.value.split('').reverse().join(''))
  const isReversed = ref(false)

  function toggleReverse() {
    isReversed.value = !isReversed.value
  }
  const message = computed(() => {
    if (isReversed.value) {
      return reversedMessage.value
    }
    return originalMessage.value
  })

  return {
    toggleReverse,
    message
  }
}
```

### Raido Player
https://github.com/Advent-Of-Vue/xmas-radio  
https://silly-horse-5344a8.netlify.app

Use [useMediaControls](https://vueuse.org/core/usemediacontrols), [useCycleList](https://vueuse.org/core/usecyclelist), [onKeyStroke](https://vueuse.org/core/onkeystroke) composables from VueUse.

### Custom Directives

```html
<div class="w-full h-full flex flex-col justify-center items-center text-center gap-12">
  <p v-christmas>Red + Green (default)</p>
  <p v-christmas:red>Red only</p>
  <p v-christmas:green>Green only</p>
  <p v-christmas="5">Slower Animation</p>
</div>
```

```js
// main.js
const app = createApp(App)

app.directive('christmas', (el, binding) => {
  const duration = binding.value ?? 2 // the length of the animation in seconds
  const color = binding.arg ?? 'red-green' // the class to add for the different colors

  // this will be called for both `mounted` and `updated`
  el.classList.add('christmas-text', color)

  el.style.animationDuration = duration + 's'
})

app.mount('#app')
```

### Writable Computed Refs

```js
const firstName = ref('');
const lastName = ref('');

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (val) => {
    const split = val.split(' '); // ['Michael', 'Thiessen']
    firstName.value = split[0];   // 'Michael'
    lastName.value = split[1];    // 'Thiessen'
  }
});

fullName.value = 'Michael Thiessen';
console.log(lastName.value);      // 'Thiessen'
```

### Renderless Components
Renderless components can be an alternative to composables when finding ways to design reusable logic in your Vue apps. As you might guess, they don't render anything. Instead, they handle all the logic inside a script section and then expose properties through a scoped slot.

Many components are contentless components. They provide a container, and you have to supply the content. Think of a button, a menu, or a card component. Slots allow you to pass in whatever markup and components you want, and they also are relatively open-ended, giving you lots of flexibility.

```vue
<!-- NorthPoleDistance.vue -->
<script setup lang="ts">
import { getDistanceKm, getDistanceMiles } from '@/utils/distance'
import { useGeolocation } from '@vueuse/core'
import { ref, computed } from 'vue'

const { coords } = useGeolocation()

const unit = ref<'km' | 'mile'>('mile')

const distance = computed(() => {
  return unit.value === 'km'
    ? getDistanceKm(coords.value.latitude, coords.value.longitude)
    : getDistanceMiles(coords.value.latitude, coords.value.longitude)
})

const toggleUnit = () => {
  if (unit.value === 'km') {
    unit.value = 'mile'
  } else {
    unit.value = 'km'
  }
}
</script>

<template>
  <!-- this should only render a slot -->
  <!-- or :unit="unit" :distance="distance" :toggleUnit="toggleUnit" -->
  <slot v-bind="{ unit, distance, toggleUnit }" />
</template>

<!-- App.vue -->
<template>
  <div class="container mx-auto px-4">
    <h2>Example</h2>
    <NorthPoleDistance v-slot="{ distance, toggleUnit, unit }">
      <p>You are currently: {{ distance }} {{ unit }}s away from the North Pole.</p>
      <button @click="toggleUnit" class="bg-green text-white px-4 py-2 rounded">Toggle Unit</button>
    </NorthPoleDistance>
  </div>
</template>
```

Composables and renderless components are two patterns in Vue that offer different approaches for encapsulating and reusing logic. Composables typically consist of functions that return reactive data and methods, which can be imported and used in different components. On the other hand, renderless components focus on separating the logic of a component from its presentation by having the parent component take care of rendering the appropriate UI.

```js
// Option 1: composables
export function useCheckboxToggle() {
  const checkbox = ref(false);

  const toggleCheckbox = () => {
    checkbox.value = !checkbox.value;
  };

  return {
    checkbox,
    toggleCheckbox,
  };
}
```

```vue
<!-- Option 2: renderless components -->
<template>
  <slot :checkbox="checkbox" :toggleCheckbox="toggleCheckbox"></slot>
</template>

<script setup>
  import { ref } from "vue";

  const checkbox = ref(false);

  const toggleCheckbox = () => {
    checkbox.value = !checkbox.value;
  };
</script>
```

### Render function
When using the render function instead of templates, you'll be using the `h` function a lot (`hyperscript` - "JavaScript that produces HTML"). It creates a virtual node, an object that Vue uses internally to track updates and what it should be rendering. These render functions are essentially what is happening "under the hood" when Vue compiles your single file components to be run in the browser.

> Vue provides different "builds" optimized for different use cases.
> - Build files that start with `vue.runtime.*` are runtime-only builds: they do not include the compiler. When using these builds, all templates must be pre-compiled via a build step.
> - Build files that do not include `.runtime` are full builds: they include the compiler and support compiling templates directly in the browser. 
> 
> Our default tooling setups use the runtime-only build since all templates in SFCs are pre-compiled. (When using `vue-loader`, templates inside `*.vue` files are pre-compiled into JavaScript at build time.) If, for some reason, you need in-browser template compilation even with a build step, you can do so by configuring the build tool to alias `vue` to `vue/dist/vue.esm-bundler.js` instead.

```vue
<script>
import { h } from 'vue'

export default {
  render() {
    return h("div", {}, [
      h("h1", {}, "Render Functions are awesome"),
      h("p", {class: 'text-blue-400'}, "Some text")
    ])
  }
}
</script>
```

```js
// vue-vdom.js
// Create a virtual node
export function h(tag, props, children) {
  return { tag, props, children }
}

// tag: h1
// props: { class: 'text-red-500'}
// children: 'Hello'
// Add a virtual node onto the DOM
export function mount(vnode, container) {
  const el = document.createElement(vnode.tag)
  vnode.el = el

  for (const key in vnode.props) {
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key])
    }
    el.setAttribute(key, vnode.props[key])
  }

  if (typeof vnode.children === 'string') {
    // Text
    el.textContent = vnode.children
  } else if (Array.isArray(vnode.children)) {
    // Array of vnodes
    vnode.children.forEach(child => mount(child, el))
  } else {
    // Single vnode
    mount(vnode.children, el)
  }

  container.appendChild(el)
}

// Remove a vnode from the real DOM
export function unmount(vnode) {
  vnode.el.parentNode.removeChild(vnode.el)
}
```
