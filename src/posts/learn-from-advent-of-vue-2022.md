---
layout: "../layouts/BlogPost.astro"
title: "Learn from Advent of Vue 2022"
slug: learn-from-advent-of-vue-2022
description: ""
added: "Dec 27 2022"
tags: [vue]
updatedDate: "Nov 19 2023"
---

### Code Structure
[Advent Of Vue](https://www.getrevue.co/profile/AdventOfVue) is a series of Vue coding challenges. The template of code starter is here https://stackblitz.com/edit/vue3-vite-starter

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

In a Vue component, `<script setup>` can be used alongside normal `<script>` (Use the options API or Run setup code one time). It works because the `<script setup>` block is compiled into the component's `setup()` function, [check out the docs](https://vuejs.org/api/sfc-script-setup.html#usage-alongside-normal-script)

Components using `<script setup>` are closed by default - i.e. the public instance of the component will not expose any of the bindings declared inside `<script setup>`. To explicitly expose properties, use the `defineExpose` compiler macro.

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

By the way, destructuring a value from a reactive object will break reactivity, since the reactivity comes from the object itself and not the property you’re grabbing. Using `toRefs` lets us destructure our props when using `script setup` without losing reactivity:

```js
const { prop1, prop2 } = toRefs(defineProps({
  prop1: {
    type: String,
    required: true,
  },
  prop2: {
    type: String,
    default: 'World',
  },
}));
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

`v-if` vs. `v-show`: Generally speaking, `v-if` has higher toggle costs while `v-show` has higher initial render costs. For example, if you have a tabs component, that some tab contains a heavy component. Using `v-if`, it will get the component destroyed and re-created when switching tabs. Using `v-show`, you will need to pay the mounting cost on the initial render even you haven't switch to that tab yet.

### Use Composables
> Similar idea to "Copy JSX? Create a component. Copy logic? Create a hook."

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

**How the Vue Composition API Replaces Vue Mixins?**  
Normally, a Vue component is defined by a JavaScript object with various properties representing the functionality we need — things like `data`, `methods`, `computed`, and so on. When we want to share the same properties between components, we can extract the common properties into a separate module. Now we can add this mixin to any consuming component by assigning it to the `mixin` config property. At runtime, Vue will merge the properties of the component with any added mixins.

Mixins have drawbacks: 
1. Naming collisions. What happens if they both share a property with the same name?
2. Implicit dependencies. A component can use a data property defined in the mixin but a mixin can also use a data property it assumes is defined in the component. This can cause problems. What happens if we want to refactor a component later and change the name of a variable that the mixin needs?

The key idea of the Composition API is that, rather than defining a component’s functionality as object properties, we define them as JavaScript variables that get returned from a new `setup` function. The clear advantage of the Composition API is that it’s easy to extract logic. It allows Vue to lean on the safeguards built into native JavaScript in order to share code, like passing variables to the composition function, and the module system.

```js
// useCounter.js
// https://css-tricks.com/how-the-vue-composition-api-replaces-vue-mixins/
import { ref, computed } from "vue";
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
```

[VueUse](https://github.com/vueuse/vueuse) is a collection of essential Vue composition utilities for Vue 2 and 3. Check the most recent update in [v10.0.0](https://github.com/vueuse/vueuse/releases/tag/v10.0.0).

> It looks like most devs prefer the Composition API, but many are stuck with the Options API in order to support legacy projects. Many are slowly refactoring a codebase from Options API towards using Composition API. Some are using a hybrid approach — Options API with a `setup` section so they can leverage VueUse and other composables for reusability.

```js
// The easy way from Options API to Composition API
setup() {
  // Copy from data()
  const state = reactive({
    username: 'Michael',
    access: 'superuser',
    favouriteColour: 'blue',
  });

  // Copy from methods
  updateUsername(username) {
    state.username = username;
  }

	// Use toRefs so we can access values directly
	return {
    updateUsername,
    ...toRefs(state),
  }
}
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
Renderless components can be an alternative to composables when finding ways to design reusable logic in your Vue apps. As you might guess, they don't render anything. Instead, they handle all the logic inside a script section and then expose properties through a scoped slot. *(The ability to have the parent component dictate what should be rendered is made possible with the concept known as slots.)*

> Many components are contentless components. They provide a container, and you have to supply the content. Think of a button, a menu, or a card component. Slots allow you to pass in whatever markup and components you want, and they also are relatively open-ended, giving you lots of flexibility.

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

### Prevent Navigation Away
We can use the native `beforeunload` event to detect when a user is about to navigate away or refresh the page.

```vue
<script setup>
import { ref, onBeforeMount, onBeforeUnmount } from 'vue';

const blockNavigation = ref(false);
const preventNav = event => {
  if (!blockNavigation.value) return;
  event.preventDefault();
  // Chrome requires returnValue to be set
  event.returnValue = "";
};

onBeforeMount(() => {
  window.addEventListener("beforeunload", preventNav);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", preventNav);
});
</script>
```
