---
title: "Reading Dan's new articles"
description: ""
added: "Apr 20 2025"
tags: [react, code]
---

Dan is really a good writer. He has published several articles consecutively this April, which is uncommon in recent years. I'm particularly drawn to his storytelling style that captivates readers from beginning to end. Instead of sharing his original texts here, I'll show some code from his articles that demonstrates key ideas.

## React for Two Computers

```js
// 1. blueprint of tags
window.concat = (a, b) => a + b;

function greeting() {
  return {
    fn: 'alert',
    args: [{
      fn: 'concat',
      args: ['Hello, ', {
        fn: 'prompt',
        args: ['Who are you?']
      }]
    }]
  };
}

function interpret(json) {
  if (json && json.fn) {
    let fn = window[json.fn];
    let args = json.args.map((arg) => interpret(arg));
    let result = fn(...args);
    return interpret(result);
  } else {
    return json;
  }
}

interpret(greeting());
```

```js
// 2. dissolve some tags earlier and some later
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args.map(arg => interpret(arg, knownTags));
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else {
    return json;
  }
}

const step1 = greeting();
 
const step2 = interpret(step1, {
  prompt: window.prompt,
  concat: (a, b) => a + b,
});
// {
//   fn: 'alert',
//   args: ['Hello, Dan']
// };
 
interpret(step2, {
  alert: window.alert,
});
```

```js
// 3. interpret and perform / Thinking and Doing

// interprets tags outside-in
// embed stuff and return tags
function interpret(json, knownTags) {
  if (json && json.fn) {
    if (knownTags[json.fn]) {
      let fn = knownTags[json.fn];
      let args = json.args;
      let result = fn(...args);
      return interpret(result, knownTags);
    } else {
      let args = json.args.map(arg => interpret(arg, knownTags));
      return { fn: json.fn, args };
    }
  } else if (Array.isArray(json)) {
    return json.map(item => interpret(item, knownTags));
  } else {
    return json;
  }
}

// run inside-out
// introspect stuff and need to know their arguments
function perform(json, knownTags) {
  if (json && json.fn) {
    let fn = knownTags[json.fn];
    let args = perform(json.args, knownTags);
    let result = fn(...args);
    return perform(result, knownTags);
  } else if (Array.isArray(json)) {
    return json.map(item => perform(item, knownTags));
  } else {
    return json;
  }
}
```

```js
// 4. convert a tree of Components to a tree of Primitives
function App() {
  return {
    type: "div", // Primitive (string)
    props: {
      children: [
        { type: "Greeting", props: {} }, // Component (function)
        {
          type: "p", // Primitive (string)
          props: {
            className: "text-purple-500",
            children: [
              "The time is: ",
              { type: "Clock", props: {} } // Component (function)
            ],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

// If json.type is a function, that function itself is the Component.
// Otherwise, it must be a Primitive,
function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const primitives = interpret({ type: App, props: {} });
const tree = perform(primitives);
document.body.appendChild(tree);
```

```js
// 5. Early and Late Components
function App() {
  return {
    type: "div",
    props: {
      children: [
        { type: Greeting, props: {} },
        {
          type: "/src/Donut.js#Donut",
          props: {
            children: ["The time is: ", { type: Clock, props: {} }],
          },
        },
      ],
    },
  };
}

function Greeting() {
  return {
    type: "p",
    props: {
      children: [
        "Hello, ",
        {
          type: "input",
          props: { placeholder: "Who are you?" },
        },
      ],
    },
  };
}

function Clock() {
  return new Date().toString();
}

function Donut({ children }) {
  return {
    type: "p",
    props: {
      style: { color: prompt("Pick a color:") },
      children,
    },
  };
}

async function loadReference(lateReference) {
  // Pretend it was loaded over the network or from the bundler cache.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (lateReference === "/src/Clock.js#Clock") {
    return Clock;
  } else if (lateReference === "/src/Donut.js#Donut") {
    return Donut;
  } else {
    throw Error("Module not found.");
  }
}

function interpret(json) {
  if (json && json.type) {
    if (typeof json.type === "function") {
      let Component = json.type;
      let props = json.props;
      let result = Component(props);
      return interpret(result);
    } else {
      let children = json.props.children && json.props.children.map(interpret);
      let props = { ...json.props, children };
      return { type: json.type, props };
    }
  } else if (Array.isArray(json)) {
    return json.map(interpret);
  } else {
    return json;
  }
}

function perform(json) {
  if (json && json.type) {
    let tagName = json.type;
    let node = document.createElement(tagName);
    for (let [propKey, propValue] of Object.entries(json.props)) {
      if (propKey === "children") {
        let children = perform(propValue);
        for (let child of [children].flat().filter(Boolean)) {
          node.appendChild(child);
        }
      } else if (propKey === "style") {
        for (let [styleKey, styleValue] of Object.entries(propValue)) {
          node.style[styleKey] = styleValue;
        }
      } else {
        node[propKey] = propValue;
      }
    }
    return node;
  } else if (typeof json === "string") {
    return document.createTextNode(json);
  } else if (Array.isArray(json)) {
    return json.map((item) => perform(item));
  } else {
    return json;
  }
}

const jsonString = JSON.stringify(interpret({ type: App, props: {} }));
const pendingPromises = [];
const lateComponents = JSON.parse(jsonString, (key, value) => {
  if (value && typeof value.type === "string" && value.type.includes("#")) {
    const promise = loadReference(value.type).then((fn) => {
      value.type = fn;
    });
    pendingPromises.push(promise);
  }
  return value;
});

async function render() {
  await Promise.all(pendingPromises);
  const primitives = interpret(lateComponents);
  const tree = perform(primitives);
  document.body.innerHTML = "";
  document.body.appendChild(tree);
}

render();
```
