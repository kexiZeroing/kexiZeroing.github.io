---
layout: "../layouts/BlogPost.astro"
title: "Learn from Advent Of Vue 2022"
slug: learn-from-advent-of-vue-2022
description: ""
added: "Dec 27 2022"
tags: [js]
---

[Advent Of Vue](https://www.getrevue.co/profile/AdventOfVue) is a series of Vue coding challenges.

### Code Structure
https://stackblitz.com/edit/vue3-vite-starter

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en" class="w-screen h-screen">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Advent Of Vue Challenge</title>
  </head>
  <body class="m-0 p-0 w-full h-full">
    <div id="app" class="w-full h-full"></div>
    <footer class="bottom-0 fixed w-full bg-green text-gray-dark p-3 text-center">
      Made for
      <a
        href="https://adventofvue.com"
        target="_blank"
        rel="noreferrer noopener"
        class="underline hover:bg-gray-dark hover:text-green"
      >
        Advent Of Vue 2022
      </a>
    </footer>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

```js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import './base.css'

createApp(App).mount('#app')
```

### Date Countdown
https://papaya-caramel-13dd76.netlify.app/

1. Use the [useNow](https://vueuse.org/core/usenow) composable from VueUse to get a reactive version of the current time and then do the math to get days, hours, minutes, and seconds.
2. Use the Vue transition component to transition smoothly between each countdown number.

```vue
<script setup>
defineProps({
  label: String,
  number: Number,
})
</script>
<template>
  <div class="segment text-center">
    <div class="pt-10 overflow-hidden relative">
      <transition>
        <span :key="number" class="numbers text-green absolute top-0 left-[50%]">{{ number }}</span>
      </transition>
    </div>

    <span class="label block pt-2">{{ label }}</span>
  </div>
</template>
<style>
.segment {
  width: 80px;
}
.numbers {
  transform: translateX(-50%);
  font-size: 32px;
}
.label {
  font-size: 16px;
}
.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}
.v-enter-from {
  transform: translateY(-100%) translateX(-50%);
}
.v-leave-to {
  transform: translateY(100%) translateX(-50%);
}
.v-enter-to,
.v-leave-from {
  transform: translateY(0px) translateX(-50%);
}
</style>
```

### Recursive Tree
1. Recursion always requires two things: Define your base case and recursive case. To do this you need a switch of some kind (maybe a `v-if`), and a value that changes with each step in the recursion.
2. You can either place the recusion before or after what the component is rendering. Each will give you opposite results, and the wrong one will give you an upside-down tree.
3. Challenge on decorations: https://github.com/Advent-Of-Vue/2022-christmas-tree-ornaments-solution

```vue
<!-- App.vue -->
<ChristmasTree :size="7" />

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

<script setup lang="ts">
// https://vuejs.org/api/sfc-script-setup.html#typescript-only-features
withDefaults(
  defineProps<{
    size: number
  }>(),
  {
    size: 1,
  }
)
</script>
```

### Use Composables
```js
// composables/itemComparison.js
import { ref } from 'vue'

const availableItems = ref([])
const isFetchingItems = ref(true)
const itemsToCompare = ref([])

export const useItemComparison = () => ({
  availableItems,
  isFetchingItems,
  itemsToCompare,
})
```

```js
// App.vue
const { isFetchingItems, availableItems, itemsToCompare } = useItemComparison()
onMounted(async () => {
  try {
    const { products } = await (
      await fetch('https://dummyjson.com/products')
    ).json()
    availableItems.value = products
  } catch (error) {
    console.error(error)
  } finally {
    isFetchingItems.value = false
  }
})

// ItemSelect.vue
const { isFetchingItems, availableItems, itemsToCompare } = useItemComparison()
const selectedItem = ref()

watch(selectedItem, (newItem, prevItem) => {
  itemsToCompare.value = itemsToCompare.value.filter(
    item => item.id !== prevItem?.id
  )
  itemsToCompare.value.push(newItem)
})
```

### Drag and Drop
Adding the proper event listeners and implementing the `startDrag` and `onDrop` methods. If you'd like some more explanations, here's a tutorial: https://learnvue.co/tutorials/vue-drag-and-drop

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

### Renderless Components
Renderless components can be an alternative to composables when finding ways to design reusable logic in your Vue apps. As you might guess, they don't render anything. Instead, they handle all the logic inside a script section and then expose properties through a scoped slot.

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
