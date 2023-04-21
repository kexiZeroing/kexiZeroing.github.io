---
layout: "../layouts/BlogPost.astro"
title: "Functional programming jargon"
slug: fp-jargon
description: ""
added: "Jul 24 2022"
tags: [other]
updatedDate: "Nov 10 2022"
---

### The Rules of Functional Programming
There are two main things you need to know to understand the concept:
- Data is immutable: If you want to change data, such as an array, you return a new array with the changes, not the original.
- Functions are stateless: Functions act as if for the first time, every single time. In other words, the function always gives the same return value for the same arguments.

### Arity
The number of arguments a function takes. From words like unary, binary, ternary, etc.

### Higher-Order Functions
A function which takes a function as an argument and/or returns a function.

```js
const filter = (predicate, xs) => xs.filter(predicate)
const is = (type) => (x) => Object(x) instanceof type

filter(is(Number), [0, 'a', 2, null]) // [0, 2]
```

### Predicate
A predicate is a function that returns true or false for a given value. A common use of a predicate is as the callback for array filter.

### Partial Application
Partially applying a function means creating a new function by pre-filling some of the arguments to the original function.

```js
// Takes a function and some arguments
const partial = (f, ...args) =>
  // returns a function that takes the rest of the arguments
  (...moreArgs) =>
    // and calls the original function with all of them
    f(...args, ...moreArgs)

// Something to apply
const add3 = (a, b, c) => a + b + c

// Partially applying `2` and `3` to `add3` gives you a one-argument function
const fivePlus = partial(add3, 2, 3) // (c) => 2 + 3 + c

fivePlus(4) // 9
```

### Currying
The process of converting a function that takes multiple arguments into a function that takes them one at a time. Each time the function is called it only accepts one argument and returns a function that takes one argument until all arguments are passed.

```js
const sum = (a, b) => a + b
const curriedSum = (a) => (b) => a + b

curriedSum(40)(2) // 42

const add2 = curriedSum(2) // (b) => 2 + b
add2(10) // 12
```

### Function Composition
The act of putting two functions together to form a third function where the output of one function is the input of the other.

```js
const compose = (f, g) => (a) => f(g(a))
const floorAndToString = compose((val) => val.toString(), Math.floor)

floorAndToString(121.212121) // '121'
```

### Pure Function
A function is pure if the return value is only determined by its input values, and does not produce side effects. The function must always return the same result when given the same input.

```js
const greet = (name) => `Hi, ${name}`
greet('Brianne') // 'Hi, Brianne'
```

### Side effects
A function or expression is said to have a side effect if apart from returning a value, it interacts with (reads from or writes to) external mutable state.

```js
window.name = 'Brianne'
const greet = () => `Hi, ${window.name}`
greet() // "Hi, Brianne"

const differentEveryTime = new Date()

console.log('IO is a side effect!')
```

### Idempotent
A function is idempotent if reapplying it to its result does not produce a different result.

### Contracts
A contract specifies the obligations and guarantees of the behavior from a function or expression at runtime. This acts as a set of rules that are expected from the input and output of a function or expression, and errors are generally reported whenever a contract is violated.

### Referential Transparency
An expression that can be replaced with its value without changing the behavior of the program is said to be referentially transparent. Given the function greet:

```js
const greet = () => 'Hello World!'
```

Any invocation of `greet()` can be replaced with `Hello World!` hence greet is referentially transparent. This would be broken if greet depended on external state like configuration or a database call.

### Lambda
An anonymous function that can be treated like a value. Lambdas are often passed as arguments to Higher-Order functions. You can assign a lambda to a variable.

```js
(function (a) {
  return a + 1
})

(a) => a + 1

const add1 = (a) => a + 1
```

### Lazy evaluation
Lazy evaluation is a call-by-need evaluation mechanism that delays the evaluation of an expression until its value is needed. In functional languages, this allows for structures like infinite lists, which would not normally be available in an imperative language where the sequencing of commands is significant.

```js
const rand = function*() {
  while (1 < 2) {
    yield Math.random()
  }
}

const randIter = rand()
randIter.next()
```

### Option
Option is a sum type (the combination of two types together into another one) with two cases often called `Some` and `None`. Option is useful for composing functions that might not return a value. `Option` is also known as `Maybe`. `Some` is sometimes called `Just`. `None` is sometimes called `Nothing`.

```js
const Some = (v) => ({
  val: v,
  map (f) {
    return Some(f(this.val))
  },
  chain (f) {
    return f(this.val)
  }
})

const None = () => ({
  map (f) {
    return this
  },
  chain (f) {
    return this
  }
})

const maybeProp = (key, obj) => typeof obj[key] === 'undefined' ? None() : Some(obj[key])
```
