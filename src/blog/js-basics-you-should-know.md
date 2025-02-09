---
title: "JavaScript basics you should know"
description: ""
added: "Aug 3 2020"
tags: [js]
updatedDate: "Sep 29 2024"
---

> You can read this post together with [JavaScript Questions](https://github.com/lydiahallie/javascript-questions) created by @lydiahallie to test how well you know JavaScript.

## let and const
`let` allows you to declare variables that are limited to a scope of a block statement, unlike the `var` keyword, which defines a variable globally, or locally to an entire function regardless of block scope. The `let` **does not create properties of the window object** when declared globally.

`const` is quite similar to let, it's block-scoped and has TDZ. Variable declared using const can't be re-assigned. You must specify a value when declaring a variable using const.

```js
const arr = [1, 2, 3, 4, 5];
for (let i = 0; i < arr.length; i++) {};
console.log(i); // ReferenceError: i is not defined

// var
function varTest() {
  var x = 1;
  if (true) {
    var x = 2;
  }
  console.log(x);  // 2
}

// let
function letTest() {
  let x = 1;
  if (true) {
    let x = 2;
  }
  console.log(x);  // 1
}

// globally scoped
let me = 'go';  
var i = 'able';

console.log(window.me); // undefined
console.log(window.i); // 'able'

// Loop with closures  
// 3, 3, 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 0, 1, 2
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
```

### Temporal Dead Zone  
The period between entering scope and being declared where they cannot be accessed. Because of the TDZ, variables declared using `let` can't be accessed before they are declared. Attempting to do so throws an error.

```js
console.log(alet) // ReferenceError: alet is not defined
let alet
console.log(alet) // undefined
alet = 10
console.log(alet) // 10

// but let is still hoisted
let x = 'outer value';
(function() {
  console.log(x);  // ReferenceError: Cannot access 'x' before initialization
  let x = 'inner value';
}());
```

## Arrow functions
1. If the function body contains just a single statement, you can omit the brackets and write all in a single line. Values are returned without having to use the `return` keyword when there is a one-line statement in the function body **(when returning an object, remember to wrap the curly brackets in parentheses to avoid it being considered the wrapping function body brackets)**. If you have only one parameter, you could omit the parentheses completely.
2. An arrow function does not have its own `this`. The `this` value of the enclosing lexical scope is used; arrow functions follow the normal variable lookup rules. Due to this, arrow functions are not suited as object methods.
3. Since arrow functions do not bind `this`, the methods `call()` or `apply()` can only pass in parameters. `thisArg` is ignored.
4. Arrow functions don't have `arguments`. This array-like object was a workaround to begin with, which now has solved with a rest parameter. 
5. Arrow functions cannot be used as constructors and will throw an error when used with keyword `new`.

```js
const shape = {
  radius: 10,
  diameter() {
    return this.radius * 2;
  },
  perimeter: () => 2 * Math.PI * this.radius
};

shape.diameter();  // 20
shape.perimeter();  // NaN

const link = document.querySelector('#link')
link.addEventListener('click', function() {
  // this === link
})

link.addEventListener('click', () => {
  // this === window
})
```

Arrow functions are not free. When arrow functions are defined as class methods/properties, a new function object is created for each instance of the class. Most of the time, the decision between using arrow functions or regular methods in classes comes down to semantics and specific requirements around `this` binding. Unless we're in a very performance-critical scenario or creating a vast number of instances, the difference is likely negligible.

## Closure
Lexical scoping describes how a parser resolves variable names when functions are nested. The word "lexical" refers to the fact that lexical scoping uses the location where a variable is declared within the source code to determine where that variable is available. Nested functions have access to variables declared in their outer scope.

**A closure is the combination of a function and the lexical environment within which that function was declared.** This environment consists of any local variables that were in-scope at the time the closure was created. Closures are useful because they let you associate data (the lexical environment) with a function that operates on that data.

```js
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

// add5 and add10 are both closures. They store different lexical environments.
var add5 = makeAdder(5);
var add10 = makeAdder(10);

console.log(add5(2));  // 7
console.log(add10(2)); // 12
```

It is possible to emulate private methods using closures. Private methods provide a way to manage global namespace. Using closures in this way is known as the **module pattern**. The shared lexical environment is created in the body of an anonymous function, which is executed as soon as it has been defined. The lexical environment contains private items, and neither of these private items can be accessed directly from outside. Instead, they must be accessed by the public functions that are returned from the anonymous wrapper. Using closures in this way provides a number of benefits that are normally associated with object-oriented programming -- in particular, data hiding and encapsulation.

```js
const counter = (function() {
  let privateCounter = 0;

  function changeBy(val) {
    privateCounter += val;
  }

  return {
    increment: function() {
      changeBy(1);
    },
    decrement: function() {
      changeBy(-1);
    },
    value: function() {
      return privateCounter;
    }
  };
})();

console.log(counter.value()); // logs 0
counter.increment();
counter.increment();
console.log(counter.value()); // logs 2
counter.decrement();
console.log(counter.value()); // logs 1
```

> It is unwise to unnecessarily create functions within other functions if closures are not needed for a particular task, as it will negatively affect script performance both in terms of processing speed and memory consumption. In JavaScript, memory leaks happen when objects are no longer needed, but are still referenced by functions or other objects. These references prevent the unneeded objects from being reclaimed by the garbage collector.

## try...catch...finally
The try statement consists of a try block, which contains one or more statements. `{}` must always be used, even for single statements. At least one catch clause, or a finally clause, must be present. If any statement within the try-block throws an exception, control is immediately shifted to the catch-block. If no exception is thrown in the try-block, the catch-block is skipped.

- You can nest one or more try statements. If an inner try statement does not have a catch clause, the enclosing try statement's catch clause is entered.
- **The `finally` block always run, even if there is an exception or a return**. This is the perfect place to put code that needs to run regardless of what happens.
- In ES2019, catch can now be used without a binding (omit the parameter). This is useful if you don’t have a need for the exception object in the code that handles the exception.

```js
(function() {
  try {
    console.log("I'm picking up my ball and going home.")  // run 
    return
  }
  finally {
    console.log('Finally?')  // finally always run  
  }
})()

(function() {
  try {
    fail()
  }
  catch (e) {
    console.log("Will finally run?")  // run
    throw e
  }
  finally {
    console.log("FINALLY RUNS!")  // run
  }
  console.log("This shouldn't be called eh?")  // does not run because throw in catch
})()
```

The non-standard `stack` property of an Error instance offers a trace of which functions were called. The stack string proceeds from the most recent calls to earlier ones, leading back to the original global scope call. Each JavaScript engine uses its own format for stack traces, but they are fairly consistent in their high-level structure.

```js
function foo() {
  console.log(new Error().stack);
}
```

## Data types
number, string, boolean, undefined, null, object, symbol, bigInt

```js
typeof 37 === 'number'
typeof 42n === 'bigint'
typeof true === 'boolean'
typeof 'a' === 'string'
typeof Symbol() === 'symbol'
typeof undefined === 'undefined'
typeof {a: 1} === 'object'
typeof [1, 2] === 'object'
typeof function() {} === 'function'
typeof null === "object"

Object.prototype.toString.call({})            // '[object Object]'
Object.prototype.toString.call([])            // '[object Array]'
Object.prototype.toString.call(() => {})      // '[object Function]'
Object.prototype.toString.call('seymoe')      // '[object String]'
Object.prototype.toString.call(1)             // '[object Number]'
Object.prototype.toString.call(true)          // '[object Boolean]'
Object.prototype.toString.call(Symbol())      // '[object Symbol]'
Object.prototype.toString.call(null)          // '[object Null]'
Object.prototype.toString.call(undefined)     // '[object Undefined]'
Object.prototype.toString.call(new Set())     // '[object Set]'
Object.prototype.toString.call(new Map())     // '[object Map]'
```

### Number static properties and BigInt
- The `Number` type is a double-precision 64-bit binary format IEEE 754 value (with a numeric precision of 53 bits). Integer values up to ±2^53 − 1 can be represented exactly.
- To check for the largest available value or smallest available value within `±Infinity`, you can use the constants `Number.MAX_VALUE` or `Number.MIN_VALUE`. Values larger than `MAX_VALUE` are represented as `Infinity`.
- `Number.MAX_VALUE` is the largest number possible to represent using a double precision floating point representation.
- `Number.MAX_SAFE_INTEGER` is the largest integer which can be used safely in calculations, for example, `Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2` is true. Any integer larger than `Number.MAX_SAFE_INTEGER` cannot always be represented in memory accurately and will be a double-precision floating point approximation of the value.
- With the introduction of `BigInt`, you can operate with numbers beyond the `Number.MAX_SAFE_INTEGER`. A `BigInt` is created by appending `n` to the end of an integer or by calling the constructor.
- The `Number.isFinite()` static method determines whether the passed value is a finite number — that is neither positive Infinity, negative Infinity, nor NaN.
- `Number.isInteger()` returns true if the given value is an integer, otherwise return false. If the value is NaN or Infinity, return false.
- `Number.isNaN()` determines whether the passed value is the number value NaN, and returns false if the input is not of the Number type. Note that `Number.isNaN()` doesn't attempt to convert the parameter to a number, so non-numbers always return false.

> Tweet IDs are big numbers, bigger than `2^53`. The Twitter API now returns them as both integers and strings, so that in Javascript you can just use the string ID, but if you tried to use the integer version in JS, things would go very wrong. This particular issue doesn’t happen in Python, because Python has integers. Read more about [Examples of floating point problems](https://jvns.ca/blog/2023/01/13/examples-of-floating-point-problems/).

### Deal with floating point number precision
Avoiding Integers and Floats for Monetary Values:
- **Floats:** Using floats for monetary values is risky because of the inherent imprecision of floating-point arithmetic. Since floats are represented in binary, some decimal values can't be accurately represented, which leads to small rounding errors.
- **Integers:** While integers avoid the precision issue of floats, they are not ideal unless you are consistently working with values like cents (e.g., 100 = $1.00). This approach requires converting back and forth between dollars and cents, which can introduce unnecessary complexity.

1. Using Decimals. Decimals represent exact decimal numbers, avoiding the imprecision that floats can introduce. Many programming languages have libraries or data types (e.g., Python’s `decimal.Decimal`, Java’s `BigDecimal`) that offer this precision. JavaScript does not natively support decimals, but third-party libraries like `decimal.js` offer arbitrary-precision decimal support. Decimals are stored differently from floats. They store numbers as base-10 (decimal) fractions. They typically store three components: *Mantissa*, *Exponent*, and *Sign*, that preserves its exact value without converting to binary.

```
Example Decimal Storage: Let's say you store the number `123.45` as a decimal:

Mantissa: 12345
Exponent: -2
Sign: Positive
```

2. You need to replace equality tests with comparisons that allow some amount of tolerance. Do not do `if (x == y) { ... }`. Instead do `if (abs(x - y) < myToleranceValue) { ... }`.

3. `toPrecision()` returns a string representing this number to the specified number of significant digits.

```js
const fixNumber = num => Number(num.toPrecision(5));

// fixNumber(0.3 - 0.1) => 0.2
// fixNumber(0.0003 - 0.0001) => 0.0002
// fixNumber(0.57 * 100) => 57
```

### Why `[] + {}` is `"[object Object]"`
Firstly convert both operands to primitive values, and try `valueOf()` followed by `toString()`. If either of them is a string, do `String(a) + String(b)`, otherwise do `Number(a) + Number(b)`.

In the case of `{}`, it first tries to call `valueOf` on the object but that returns `{}`. Since `typeof {} === "object"`, it then calls `toString` and gets `"[object Object]"`. In the case of `[]`, calling `valueOf` returns `[]`, and since `typeof [] === "object"`, it calls `toString` and the return value of `Array.prototype.toString()` on an empty array is an empty string.

Another example is `{} > []`, because we get `"[object Object]" > ""`.

> Why you get an error when you attempt to run `{} > []` in the browser? **Block statements are evaluated before expressions**, so when the interpreter sees curly braces when not in an expression context, it interprets them as a block rather than an object literal. The way to force the interpreter to see `{}` as an object literal instead of as a block is to wrap it in parentheses.

## this, globalThis and binding
In most cases, the value of `this` is determined by how a function is called (runtime binding). `bind()` method can set the value of a function's `this` regardless of how it's called, and arrow functions which don't provide their own `this` binding. In non–strict mode, it's always a reference to an object and in strict mode can be any value.

Historically, accessing the global object has required different syntax in different JavaScript environments. On the web you can use `window`, `self`, or `frames`. In Node.js none of these work, and you must instead use `global`. The `globalThis` property provides a standard way of accessing the global `this` value across environments. In this way, you can access the global object in a consistent manner without having to know which environment the code is being run in.

- In strict mode, if the value of `this` is not set when entering an execution context, it remains as `undefined`.
- In arrow functions, `this` retains the value of the enclosing lexical context's `this`. In global code, it will be set to the global object.
- As a constructor (with the `new` keyword), its `this` is bound to the new object being constructed.
- As a DOM event handler, `this` is set to the element on which the listener is placed, `this === e.currentTarget` is alwasy true.

```js
window.age = 10;
function Person() {
  this.age = 42;
  setTimeout(function () {
    console.log(this.age); // yields "10" 
  }, 100);
}

var p = new Person();

window.age = 10;
function Person() {
  this.age = 42;
  setTimeout(() => {
    console.log(this.age); // yields "42"
  }, 100);
}

var p = new Person();
```

Figure out what the `"this"` is referencing:
1. Is there an object to the left of the dot? If so, that's what the "this" keyword is referencing. (Implicit Binding)
2. Was the function invoked with "call", "apply", or "bind"? If so, it'll explicitly state what the "this" keyword is referencing. (Explicit Binding)
3. Was the function invoked using the "new" keyword? If so, the "this" keyword is referencing the newly created object that was made by the JavaScript interpreter. (new Binding)
4. Is "this" inside of an arrow function? If so, its reference may be found lexically in the enclosing scope. (Lexical Binding)
5. Are you in "strict mode"? If yes, the "this" keyword is undefined. If not, "this" is referencing the "window" object. (window Binding)

### Function.prototype.call() / apply()
While the syntax of `call()` function is almost identical to that of `apply()`, the fundamental difference is that `call()` accepts an argument list, while `apply()` accepts a single array of arguments (or an array-like object). They provide a new value of `this` to the function. With call or apply, you can write a method once and then inherit it in another object, without having to rewrite the method for the new object. If the first argument is not passed, the value of `this` is bound to the global object (the value of `this` will be undefined in strict mode).

```js
const numbers = [5, 6, 2, 3, 7];
Math.max.apply(null, numbers);
Math.min.apply(null, numbers);

// `this` is ignored when binding `this` on arrow function
window.name = 'a'
const obj = {
  name: 'b',
  fn: () => console.log(this.name)
}
obj.fn.call({name: 'c'});  // 'a'

function fruit() {
  return () => {
    console.log(this.name);
  }
}
var apple = {
  name: 'apple'
}
var banana = {
  name: 'banana'
}

var fruitCall = fruit.call(apple);  // `fruit` is normal function here
fruitCall();  // apple
fruitCall.call(banana);  // apple
```

### Function.prototype.bind()
The `bind()` method creates a new function that, when called, has its `this` keyword set to the provided value, with a given sequence of arguments preceding any provided when the new function is called.

`bind()` creates a new bound function, which wraps the original function object. Calling the bound function generally results in the execution of its wrapped function. A bound function has the following internal properties:

- `[[BoundTargetFunction]]` - the wrapped function object.
- `[[BoundThis]]` - the value that is always passed as `this` value when calling the wrapped function.
- `[[BoundArguments]]` - a list of values whose elements are used as the first arguments to any call to the wrapped function.
- `[[Call]]` - executes code associated with `this`. Invoked via a function call expression. 

**When a bound function is called, it calls internal method `[[Call]]` on `[[BoundTargetFunction]]` with `Call(boundThis, ...args)`**. Where, boundThis is `[[BoundThis]]`, args is `[[BoundArguments]]` followed by the arguments passed by the new function call.

```js
// polyfill
var slice = Array.prototype.slice;
Function.prototype.bind = function() {
  var thatFunc = this;
  var thatArg = arguments[0];
  var args = slice.call(arguments, 1);
  if (typeof thatFunc !== 'function') {
    throw new TypeError('what is trying to be bound is not callable');
  }
  return function() {
    var funcArgs = args.concat(slice.call(arguments))
    return thatFunc.apply(thatArg, funcArgs);
  };
};
```

```js
var x = 9;
var module = {
  x: 81,
  getX: function() { return this.x; }
};

module.getX(); // 81

var retrieveX = module.getX;
retrieveX();  // 9

var boundGetX = retrieveX.bind(module);
boundGetX(); // 81

// partially applied function
function addArguments(arg1, arg2) {
  return arg1 + arg2
}

var addThirtySeven = addArguments.bind(null, 37); 

var result2 = addThirtySeven(5);  // 37 + 5 = 42 
var result3 = addThirtySeven(5, 10);  // 37 + 5 = 42 , second argument is ignored

// setTimeout, explicitly bind this to the callback function
function LateBloomer() {
  this.petalCount = Math.floor(Math.random() * 12) + 1;
}

LateBloomer.prototype.bloom = function() {
  setTimeout(this.declare.bind(this), 1000);
};

LateBloomer.prototype.declare = function() {
  console.log('flower with ' + this.petalCount + ' petals!');
};

var flower = new LateBloomer();
flower.bloom();  // after 1 second, triggers the 'declare' method
```

## Custom Event
The Event interface represents an event which takes place in the DOM. An event can be triggered by the user action or generated by APIs to represent the progress of an asynchronous task. It can also be triggered programmatically, such as by calling the `HTMLElement.click()` method of an element, or by defining the event, then sending it to a specified target using `EventTarget.dispatchEvent()`.

> If you inspect the `HTMLElement` prototype chain, you'll discover it inherits from `Element`, `Node` and `EventTarget`. Thanks to the `EventTarget` interface, you can subscribe to an element's DOM events via `addEventListener`.

Unlike "native" events, which are fired by the DOM and invoke event handlers **asynchronously** via the event loop, **`dispatchEvent()` invokes event handlers synchronously**. All applicable event handlers will execute and return before the code continues on after the call to `dispatchEvent()`.

`isTrusted` is a read-only property that is only set to true if the event was dispatched by the user agent, which means that it was triggered by the user, such as a copy event triggered by the user pressing `Cmd + C`. This is in contrast to a synthetic event programmatically dispatched via `dispatchEvent()`, where `e.isTrusted` is false.

Events can be created with the `Event` constructor. This constructor is supported in most modern browsers. To add more data to the event object, the `CustomEvent` interface exists and the `detail` property can be used to pass custom data.

```js
// Adding custom data
const pizzaEvent = new CustomEvent("pizzaDelivery", {
  detail: {
    name: "supreme",
  },
});

window.addEventListener("pizzaDelivery", (e) => console.log(e.detail.name));
window.dispatchEvent(pizzaEvent);

// Event bubbling
const form = document.querySelector('form');
const textarea = document.querySelector('textarea');

const eventAwesome = new CustomEvent('awesome', {
  bubbles: true,
  detail: { text: () => textarea.value }
});

form.addEventListener('awesome', e => console.log(e.detail.text()));
textarea.addEventListener('input', e => e.target.dispatchEvent(eventAwesome));
```

The most common approaches available to remove event listeners:
- Use `removeEventListener()` if the callback function is assigned to a variable and within easy reach of where the listener was added.
- Use the `once` option in `addEventListener()` if you need to fire a callback only once.
- Use `AbortController()` if you have a series of listeners you’d like to imperatively remove at once, or if you just like the syntax.

```js
const button = document.getElementById('button');
const controller = new AbortController();
const { signal } = controller;

button.addEventListener(
  'click', 
  () => console.log('clicked!'), 
  { signal }
);

controller.abort();
```

```js
useEffect(() => {
  const controller = new AbortController()

  window.addEventListener('resize', handleResize, {
    signal: controller.signal,
  })
  window.addEventListener('hashchange', handleHashChange, {
    signal: controller.signal,
  })
  window.addEventListener('storage', handleStorageChange, {
    signal: controller.signal,
  })

  return () => {
    // Calling `.abort()` removes ALL event listeners
    // associated with `controller.signal`.
    controller.abort()
  }
}, [])
```

## Destructuring assignments
The destructuring assignment syntax is a JavaScript expression that makes it possible to unpack values from arrays, or properties from objects, into distinct variables.

### Array destructuring
```js
const foo = ['one', 'two', 'three'];
const [one, two, three] = foo;

// Assignment separate from declaration
let a, b;
[a, b] = [1, 2];
console.log(a); // 1
console.log(b); // 2

// default value
const colors = [];
const [firstColor = 'white'] = colors;
console.log(firstColor); // 'white'

// Ignoring some values
const [a, , b] = [1, 2, 3];
console.log(a); // 1
console.log(b); // 3

// rest pattern
const [a, ...b] = [1, 2, 3];
console.log(a); // 1
console.log(b); // [2, 3]

// Swapping variables
let a = 1, b = 3;
[a, b] = [b, a];
console.log(a); // 3
console.log(b); // 1

// Note: the semicolon here is required
let b = 3
[a, b] = [b, a]
// will become:
let b = 3[a, b] = [b, a];
```

### Object destructuring
```js
const o = {p: 42, q: true};
const {p, q} = o;
console.log(p); // 42
console.log(q); // true

// Assigning to new variable names
const o = {p: 42, q: true};
const {p: foo, q: bar} = o;
console.log(foo); // 42 
console.log(bar); // true
console.log(p); // ReferenceError: p is not defined
console.log(q); // ReferenceError: q is not defined

// get both `a` and `b` as variables in one line of destructuring
const o = {a: {b: 'hi'}};
const {a, a: {b}} = o;

// Assignment separate from declaration
// The parentheses around the assignment statement are required when using 
// object literal destructuring assignment without a declaration.
let a, b, rest;
({a, b, ...rest} = {a: 10, b: 20, c: 30, d: 40});
console.log(a); // 10
console.log(b); // 20
console.log(rest); // {c: 30, d: 40}

// destructuring dynamic properties
function greet(obj, nameProp) {
 const { [nameProp]: name = 'Unknown' } = obj;
 return `Hello, ${name}!`;
}
greet({ name: 'Batman' }, 'name'); // => 'Hello, Batman!'
greet({ }, 'name'); // => 'Hello, Unknown!'
```

## Spread operator
1. Expand an array, an object or a string using the spread operator `...`.
2. The **rest parameter** syntax allows us to represent an indefinite number of arguments as an array. Only the last parameter can be a "rest parameter". The `arguments` object is not a real array, while rest parameters are Array instances, meaning Array methods can be used on rest parameters.

```js
// spread syntax
var arr1 = [0, 1, 2];
var arr2 = [3, 4, 5];
arr1 = [...arr1, ...arr2]; // arr1 is now [0, 1, 2, 3, 4, 5]

// create a copy of an array or an object
const c = [...arr];
const newObj = { ...oldObj };

// replace apply() when you want to use an array as arguments to a function
function myFunction(x, y, z) { }
var args = [0, 1, 2];
myFunction(...args);

// rest parameter
function myFun(a, b, ...manyMoreArgs) {
  console.log(a);  // one
  console.log(b);  // two
  console.log(manyMoreArgs);  // [three, four, five, six]
}
myFun("one", "two", "three", "four", "five", "six");
myFun("one", "two");  // manyMoreArgs will be []
```

## Shorthand and Computed property names
```js
// Shorthand property names
const a = 'foo', b = 42, c = {};
const o = {a, b, c};

// Shorthand method names
const o = {
  property(parameters) {}
};

// Computed property names
var prop = 'foo';
var o = {
  [prop]: 'hey',
  ['b' + 'ar']: 'there'
};

// The shorthand syntax also supports computed property names
var bar = {
  foo1() { return 1; },
  ['foo' + 2]() { return 2; }
};

// prototype and super()
const o = { y: 'y', test: () => 'zoo' }
const x = {
  __proto__: o, 
  test() { return super.test() + 'x' }
}  
x.test(); // zoox
```

## Nullish coalescing and Optional chaining
The **nullish coalescing operator (`??`)** is a logical operator that returns its right-hand side operand when its left-hand side operand is `null` or `undefined`, and otherwise returns its left-hand side operand. Earlier, when one wanted to assign a default value to a variable, a common pattern was to use the logical OR operator (`||`). However, due to `||` being a boolean logical operator, any falsy value (`0`, `''`, `NaN`, `null`, `undefined`) is not returned. This behavior may cause unexpected consequences if you consider `0` or `''` as valid values.

```js
const nullValue = null;
const emptyText = "";

const valA = nullValue ?? "default for A";
const valB = emptyText ?? "default for B";
const valC = emptyText || "default for C";

console.log(valA); // "default for A"
console.log(valB); // ""
console.log(valC); // "default for C"

// Nullish coalescing assignment (??=)
let x1 = undefined;
let x2 = 'a';
const getNewValue = () => 'b';

// Assigns the new value to x1, because undefined is nullish.
x1 ??= 'b';
console.log(x1) // "b"

// Does not assign a new value to x2, because a string is not nullish.
// Also note: getNewValue() is never executed.
x2 ??= getNewValue();
console.log(x2) // "a"
```

The **optional chaining operator (?.)** functions similarly to the `.` chaining operator, except that instead of causing an error if a reference is nullish (`null` or `undefined`), the expression short-circuits with a return value of undefined. When used with function calls, it returns undefined if the given function does not exist.

```js
let customerCity = customer.details?.address?.city;
let duration = vacations.trip?.getTime?.();
let nestedProp = obj?.['prop' + 'Name'];

let foo = { someFooProp: "hi" };
console.log(foo.someFooProp?.toUpperCase() ?? "not available"); // "HI"
console.log(foo.someBarProp?.toUpperCase() ?? "not available"); // "not available"
```

## encodeURI() and encodeURIComponent()
`encodeURI` and `encodeURIComponent` are used to encode URI by replacing each instance of certain characters by escape sequences representing the UTF-8 encoding of the character.

- `encodeURI()` escapes all characters except: `A-Z a-z 0-9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #`.
- `encodeURIComponent()` escapes all characters except: `A-Z a-z 0-9 - _ . ! ~ * ' ( )`

```javascript
encodeURI("http://www.example.org/a file with spaces.html")
// http://www.example.org/a%20file%20with%20spaces.html

// Don't call encodeURIComponent since it would destroy the URL
encodeURIComponent("http://www.example.org/a file with spaces.html")
// http%3A%2F%2Fwww.example.org%2Fa%20file%20with%20spaces.html

// Use encodeURIComponent when you want to encode the value of a URL parameter
var p1 = encodeURIComponent("http://example.org/?a=12&b=55")

// Then you may create the URL you need
var url = "http://example.net/?param1=" + p1 + "&param2=99";
// http://example.net/?param1=http%3A%2F%2Fexample.org%2F%Ffa%3D12%26b%3D55&param2=99
```

```js
// Real use case: handles URL redirection for login
let nextParam = location.pathname;
if (location.search) {
  nextParam += location.search;
}
location.href = '/web/?next=' + encodeURIComponent(nextParam) + '&type=3';

// after login in `/web` page
let $next = GetQueryString('next')
if (GetQueryString('type') && $next) {
  $next = decodeURIComponent($next);

  if ($next.indexOf('?') > -1) {
    $next += '&date=' + Date.now()
  } else {
    $next += '?date=' + Date.now()
  }
  location.href = location.origin + $next
}
```

## JSON stringify and parse
`JSON.stringify(value, replacer, space)` converts a value to the JSON notation that the value represents, optionally replacing values if a replacer function is specified or optionally including only the specified properties if a replacer array is specified.

- If the value has a `toJSON()` method, it's responsible to define what data will be serialized.
- `Boolean`, `Number`, and `String` objects are converted to the corresponding primitive values.
- The default conversion from an object to string is `"[object Object]"`, which uses `toString()` method in the object. 
- `undefined`, `Functions`, and `Symbols` are not valid JSON values. If any such values are encountered during conversion they are either omitted (when found in an object) or changed to `null` (when found in an array).
- All `Symbol`-keyed properties will be completely ignored.

```js
JSON.stringify({ x: 5 });             // '{"x":5}'
JSON.stringify(true);                 // 'true'
JSON.stringify([1, 'false', false]);  // '[1,"false",false]'
JSON.stringify(null);                 // 'null'

// Map is not serializable. To fix this, you can convert the Map to a serializable object.
const state = new Map([['key', 1]]);
const serializableState = Object.fromEntries(state);
JSON.stringify(state);  // '{}'
JSON.stringify(serializableState);  // '{"key":1}'

JSON.stringify({ x: 5, y: 6, toJSON(){ return this.x + this.y; } });
// '11'

// The replacer parameter can be either a function or an array.
const foo = {foundation: 'Mozilla', model: 'box', week: 45, month: 7};

JSON.stringify(foo, (key, value) => {
  if (typeof value === "string") {
    return undefined;
  }
  return value;
});
// '{"week": 45, "month": 7}'

JSON.stringify(foo, ['week', 'month']);  
// '{"week": 45, "month": 7}'

// The last `space` argument may be used to control spacing in the final string
// 1. If it is a number, successive levels will each be indented by this # of space characters.
// 2. If it is a string, will be indented by this string.
JSON.stringify({ uno: 1, dos: 2 }, null, '\t');
// '{
//     "uno": 1,
//     "dos": 2
// }'
```

`JSON.parse(text[, reviver])` parses a JSON string, constructing the JavaScript value or object described by the string. An optional reviver function can be provided to perform a transformation on the resulting object before it is returned. **`JSON.parse()` does not allow trailing commas and single quotes.**

```js
JSON.parse('{}');              // {}
JSON.parse('true');            // true
JSON.parse('[1, 5, "false"]'); // [1, 5, "false"]
JSON.parse('null');            // null

JSON.parse('{"foo": 1}');
JSON.parse("{\"foo\": 1}");

JSON.parse('{"p": 5}', (key, value) =>
  typeof value === 'number' ? value * 2 : value
);
// { p: 10 }

JSON.parse('{"1": 1, "2": 2, "3": {"4": 4, "5": {"6": 6}}}', (key, value) => {
  console.log(key); // log the current property name, the last is ""
  return value; 
});
// 1 2 4 6 5 3 ""
```

## Symbol
Symbol is a primitive data type and the `Symbol()` function returns a value of type symbol. It resembles a built-in object class, but is incomplete as a constructor because it does not support the syntax `new Symbol()`. 

**Every symbol value returned from `Symbol()` is unique.** A symbol value may be used as an identifier for object properties, which is the data type's primary purpose. Symbol can have an optional description, but for debugging purposes only. Symbols are guaranteed to be unique. Even if we create many symbols with the same description, they are different values.

The `Symbol` class has constants for so-called well-known symbols. Examples of well-known symbols are: `Symbol.iterator` for array-like objects, or `Symbol.search` for string objects.

- Unlike the other primitives, Symbols do not have a literal syntax
- Symbols don't auto-convert to strings
- Symbols are not enumerable in `for...in` iterations or `Object.keys()`
- Symbol-keyed properties will be completely ignored when using `JSON.stringify()`

```javascript
const symbol1 = Symbol(42);
const symbol2 = Symbol('foo');

console.log(typeof symbol1);  // symbol
console.log(symbol1.description);  // '42'
console.log(Symbol('foo') === Symbol('foo')); // false
typeof Symbol.iterator === 'symbol'  // true

var obj = {};
obj[Symbol('a')] = 'a';
obj['b'] = 'b';
obj.c = 'c';

for (var i in obj) {
  console.log(i);  // logs "b" and "c"
}

var obj = {};
var a = Symbol('a');
var b = Symbol.for('b');
obj[a] = 'localSymbol';
obj[b] = 'globalSymbol';

var objectSymbols = Object.getOwnPropertySymbols(obj);
console.log(objectSymbols);  // [Symbol(a), Symbol(b)]
```

### Global symbol registry
There is a global symbol registry holding all available symbols. The global symbol registry is mostly built by JavaScript's compiler infrastructure, and it is not available to JavaScript's run-time environment, except through the methods `Symbol.for()` and `Symbol.keyFor()`.

The global symbol registry is a list with the following record structure and it is initialized empty. A record in the global symbol registry:
- `[[key]]` - a string key used to identify a symbol.
- `[[symbol]]` - a symbol that is stored globally.

The `Symbol.for(key)` method searches for existing symbols in a runtime-wide symbol registry with the given key and returns it if found. Otherwise a new symbol gets created in the global symbol registry with this key. `Symbol.keyFor(sym)` method retrieves a symbol key from the global symbol registry for the given symbol.

```javascript
Symbol.for('foo'); // create a new global symbol
Symbol.for('foo'); // retrieve the already created symbol

Symbol('bar') === Symbol('bar'); // false
Symbol.for('bar') === Symbol.for('bar'); // true

var globalSym = Symbol.for('foo');
Symbol.keyFor(globalSym); // "foo"

var localSym = Symbol();
Symbol.keyFor(localSym); // undefined

// Well-known symbols are not symbols registered in the global symbol registry
Symbol.keyFor(Symbol.iterator) // undefined
```

## Iterators and Iterables
Iterators are a new way to loop over any collection in JavaScript. We can use `for...of` to iterate an array, but would get a TypeError saying that the object is not iterable. *(The `for...of` loops require an iterable, otherwise it will throw a TypeError.)* A lot of things are iterables in JavaScript: Arrays, Strings, Maps and Sets, arguments, DOM elements.

The **iterable protocol** allows JavaScript objects to define or customize their iteration behavior, such as what values are looped over in a `for..of` construct. **In order to be iterable, an object must implement the @@iterator method, meaning that the object must have a property with a @@iterator key which is available via constant `Symbol.iterator`**. Symbols offer names that are unique and cannot clash with other property names. That method will return an object called an **`iterator`**. This iterator will have a method called **`next`** which will return an object with keys **`value` and `done`**. The `value` will contain the current value. The `done` is boolean which denotes whether all the values have been fetched or not.

<img alt="iterable" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h83i5srgy6j30ii09wmxt.jpg" width="700">  

```js
// Iterable is an object with a function whose key is Symbol.iterator
const iterable = {
  [Symbol.iterator](): iterator
}

// Iterator is the above function to obtain the values to be iterated
const iterator = {
  next: () => ({
    value: any,
    done: boolean
  })
}
```

- There is no @@iterator function. It is only used in specification to denote a specific symbol. If you want to use that symbol in your code, you have to use `Symbol.iterator` which is a symbol specifies the default iterator for an object. 
- Some built-in types are built-in iterables with a default iteration behavior, such as Array or Map, because their prototype objects all have a `Symbol.iterator` method, while other types such as Object are not.
- `for...of` iterates over the property values; `for...in` iterates the property names/keys.

```js
// String is an example of a built-in iterable object
const someString = 'hi';
typeof someString[Symbol.iterator];  // "function"

const iterator = someString[Symbol.iterator]();
iterator.next();  // { value: "h", done: false }
iterator.next();  // { value: "i", done: false }
iterator.next();  // { value: undefined, done: true }

// Destructuring happens because of iterables
const array = ['a', 'b', 'c', 'd'];
const [first, ,third,last] = array;

// is equivalent to
const array = ['a', 'b', 'c', 'd'];
const iterator = array[Symbol.iterator]();
const first = iterator.next().value
iterator.next().value // Since it was skipped, so it's not assigned
const third = iterator.next().value
const last = iterator.next().value
```

```js
// To Make objects iterable, we need to implement `Symbol.iterator` method
let Reptiles = {
  biomes: {
    water: ["Alligators", "Crocs"],
    land: ["Snakes", "Turtles"]
  },

  [Symbol.iterator]() {
    let reptilesByBiome = Object.values(this.biomes);
    let reptileIndex = 0;
    let biomeIndex = 0;
    
    // return an iterator with next method
    return {
      next() {
        if (reptileIndex >= reptilesByBiome[biomeIndex].length) {
          biomeIndex++;
          reptileIndex = 0;
        }

        if (biomeIndex >= reptilesByBiome.length) {
          return { value: undefined, done: true };
        }

        return {
          value: reptilesByBiome[biomeIndex][reptileIndex++],
          done: false
        };
      }
    };
  }
};

// for...of loop takes an iterable and keeps on calling the `next()` until done is true
for (let reptile of Reptiles) console.log(reptile);
```

## Generator functions
It allows you to define an iterative method by writing a function whose execution is not continuous. Generator functions are written **using the function\* syntax**. When called initially, generator functions do not execute any of their code, instead **returning a type of iterator called a generator**. By calling the generator's `next` method, the generator executes until it encounters the `yield` keyword. A generator can contain many `yield` keywords, thus halting itself multiple times. Generators compute `yield` values on demand, which allows to represent sequences that are expensive to compute, or even infinite sequences.

The `yield` keyword pauses generator function's execution and the value of the expression following the `yield` keyword is returned to the generator's caller. It can be thought of as a generator-based version of the `return` keyword. The `yield` actually returns an object with two properties, value and done. The next time `next()` is called, execution resumes with the statement immediately after the `yield`.

```js
function* makeRangeIterator(start, end, step) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}
let it = makeRangeIterator(1, 10, 2);

it.next();  // {value: 1, done: false}
it.next();  // {value: 3, done: false}

// another example
function* calculator(input) {
  const doubleThat = 2 * (yield (input / 2));
  const another = yield doubleThat;
  return input * doubleThat * another;
}
const calc = calculator(10);

calc.next();    // {value: 5, done: false}
calc.next(7);   // {value: 14, done: false}
calc.next(100); // {value: 14000, done: true}
```

## Promise
A `Promise` is a proxy for a value not necessarily known when the promise is created. The Promise object represents the eventual completion or failure of an asynchronous operation and its success value or failure reason. Instead of immediately returning the final value, the asynchronous method returns a promise to supply the value at some point in the future.

A Promise is in one of these states: `pending`, `fulfilled`, `rejected`. A promise is said to be `settled` if it is either fulfilled or rejected, but not pending. A pending promise can either be fulfilled with a value or rejected with an error. When either of these options happens, the associated handlers queued up by a promise's `then` method are called. Note that **promises are guaranteed to be asynchronous**, so an action for an already "settled" promise will occur only after the stack has cleared and a clock-tick has passed. **Promise executor functions should not be async** (Don't do any awaiting inside the Promise constructor).

```js
let p = function() {
  return new Promise(function(resolve, reject) {
    setTimeout(() => resolve('foo'), 300);
  });
}

p().then(function(value) {
  console.log(value);  // "foo"
});

const promiseA = new Promise((resolve, reject) => {
  resolve(777);
});
promiseA.then(val => console.log("asynchronous logging has val:", val));
console.log("immediate logging");
```

The methods `promise.then()`, `promise.catch()`, and `promise.finally()` are used to associate further asynchronous action with a promise that becomes settled. **These methods also return a newly generated promise object, which can be used for chaining.**

`Promise.resolve()` returns a Promise object that is resolved with a given value. `Promise.reject()` method returns a Promise object that is rejected with a given reason.

```js
Promise.resolve('foo')
  // 1. Receive "foo", concatenate "bar" to it, and resolve that to the next then
  .then(function(string) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        string += 'bar';
        resolve(string);
      }, 1);
    });
  })
  // 2. receive "foobar", register a callback function to work on that string,
  // but after returning the unworked string to the next then
  .then(function(string) {
    setTimeout(function() {
      string += 'baz';
      console.log(string);
    }, 1);
    return string;
  })
  // 3. print messages will be run before the string is actually processed
  .then(function(string) {
    console.log(string);
  });

// logs, in order:
// foobar
// foobarbaz

Promise.resolve()
  .then(() => {
    // makes .then() return a rejected promise
    throw new Error('Oh no!');
  })
  .then(() => {
    console.log('Not get called.');
  }, error => {
    console.error('onRejected function called: ' + error.message);
  });

Promise.resolve()
  .then(() => {
    throw new Error('Oh no!');
  })
  .catch(error => {
    console.error('onRejected function called: ' + error.message);
  })
  .then(() => {
    console.log("I am always called even if the prior then's promise rejects");
  });
```

### Promise static methods
`Promise.all()` method returns a single Promise that resolved when all of the promises passed as an iterable (such as an Array) have resolved or when the iterable contains no promises. It rejects immediately upon any of the input promises rejecting, and will reject with this first rejection message.

```js
var p1 = Promise.resolve(3);
var p2 = 1337;
var p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("foo");
  }, 100);
}); 

Promise.all([p1, p2, p3]).then(values => { 
  console.log(values);  // [3, 1337, "foo"] 
});

function loadImg(src) {
  return new Promise((resolve, reject) => {
    let img = document.createElement('img');
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  })
}

function showImgs(imgs) {
  imgs.forEach(function(img) {
    document.body.appendChild(img)
  })
}

Promise.all([
  loadImg('1.jpg'),
  loadImg('2.jpg'),
  loadImg('3.jpg')
]).then(showImgs);
```

`Promise.race()` method returns a promise that fulfills or rejects as soon as one of the promises in an iterable fulfills or rejects, with the value or reason from that promise.

```js
var p1 = new Promise(function(resolve, reject) { 
  setTimeout(() => resolve('one'), 500); 
});
var p2 = new Promise(function(resolve, reject) { 
  setTimeout(() => resolve('two'), 100); 
});

Promise.race([p1, p2]).then(function(value) {
  console.log(value); // "two"
});

var p3 = new Promise(function(resolve, reject) { 
  setTimeout(() => resolve('three'), 500); 
});
var p4 = new Promise(function(resolve, reject) { 
  setTimeout(() => reject(new Error('four')), 100);
});

Promise.race([p3, p4]).then(function(value) {
  // not called
}, function(error) {
  console.log(error.message); // "four"
});
```

`Promise.allSettled()` method (in ES2020) returns a promise that resolves after all of the given promises have either fulfilled or rejected, with an array of objects that each describes the outcome of each promise.

```js
Promise.allSettled([
  Promise.resolve(33),
  new Promise(resolve => setTimeout(() => resolve(66), 0)),
  99,
  Promise.reject(new Error('an error'))
])
.then(values => console.log(values));

// [
//   {status: "fulfilled", value: 33},
//   {status: "fulfilled", value: 66},
//   {status: "fulfilled", value: 99},
//   {status: "rejected",  reason: Error: an error}
// ]
```

```js
// use Promise.allSettled() for async error handling
const profilePromise = fetch(endpoint).then(response => response.json());
const [ result ] = await Promise.allSettled([profilePromise]);

if (result.status === 'rejected') {
  console.error(result.reason);
  return;
}

console.log(result.value);
```

`Promise.any()` method (in ES2021) runs promises in parallel and resolves to the value of the first successfully resolved promise. Even if some promises get rejected, these rejections are ignored. However, if all promises in the input array are rejected or if the input array is empty, then `Promise.any()` rejects with an aggregate error containing all the rejection reasons of the input promises.

```js
const pErr = new Promise((resolve, reject) => {
  reject("Always fails");
});

const pSlow = new Promise((resolve, reject) => {
  setTimeout(resolve, 500, "Done eventually");
});

const pFast = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, "Done quick");
});

Promise.any([pErr, pSlow, pFast]).then((value) => {
  console.log(value);  // Done quick
});
```

Promise with the concurrency control: https://github.com/sindresorhus/promise-fun
```js
import pMap from 'p-map';

const urls = [
  'https://sindresorhus.com',
  'https://avajs.dev',
  'https://github.com',
  ...
];

const mapper = url => fetchStats(url); //=> Promise

const result = await pMap(urls, mapper, {concurrency: 5});
console.log(result);
```

Implement a basic JavaScript Promise class from scratch, including the ability to resolve, reject, and chain promises using `.then()` and `.catch()` methods.

```js
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.callbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.callbacks.forEach(callback => this._handleCallback(callback));
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.value = reason;
        this.callbacks.forEach(callback => this._handleCallback(callback));
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  _handleCallback(callback) {
    const { onFulfilled, onRejected, resolve, reject } = callback;

    if (this.state === 'fulfilled') {
      if (typeof onFulfilled === 'function') {
        try {
          const result = onFulfilled(this.value);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(this.value);
      }
    } else if (this.state === 'rejected') {
      if (typeof onRejected === 'function') {
        try {
          const result = onRejected(this.value);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(this.value);
      }
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const callback = { onFulfilled, onRejected, resolve, reject };
      
      if (this.state === 'pending') {
        this.callbacks.push(callback);
      } else {
        this._handleCallback(callback);
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}
```

## async and await
Async functions can contain zero or more `await` expressions. Await expressions suspend progress through an async function, yielding control and subsequently resuming progress only when an awaited promise-based asynchronous operation is either fulfilled or rejected. **The resolved value of the promise is treated as the return value of the await expression**. 

- **Async functions always return a promise**. If the return value of an async function is not explicitly a promise, it will be implicitly wrapped in a promise.
- You can use await with any function which returns a promise. The function you're awaiting doesn't need to be async necessarily.
- The `await` keyword is only valid inside async functions.
- Use of `async / await` enables the use of ordinary `try / catch` blocks around asynchronous code.

```js
// Helper buddy for removing async/await try/catch
function safeAwait(promise) {
  return promise.then(data => {
    if (data instanceof Error) return [data]
    return [null, data]
  }).catch(err => [err])
}

// const [ err, data ] = await safeAwait(myPromise())
```

Now you should understand why the below code will throw an error. The `useEffect` hook isn't expecting us to return a promise. It expects us to return either nothing or a cleanup function. A quick fix is to create a separate async function within our effect.

```js
React.useEffect(async () => {
  const url = `${API}/get-profile?id=${userId}`
  const res = await fetch(url)
  const json = await res.json()
  setUser(json)
}, [userId])
```

```js
// wait 1 second
// await new Promise(resolve => setTimeout(resolve, 1000));

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(function() {
      resolve("slow")
    }, 2000)
  })
}

function resolveAfter1Second() {
  return new Promise(resolve => {
    setTimeout(function() {
      resolve("fast")
    }, 1000)
  })
}

async function sequentialStart() {
  // 1. Execution gets here almost instantly
  console.log('==SEQUENTIAL START==')

  const slow = await resolveAfter2Seconds()
  console.log(slow) // 2. runs 2 seconds after 1

  const fast = await resolveAfter1Second()
  console.log(fast) // 3. runs 3 seconds after 1
}

async function concurrentStart() {
  console.log('==CONCURRENT START with await==')

  const slow = resolveAfter2Seconds() // starts timer immediately
  const fast = resolveAfter1Second() // starts timer immediately

  // 1. Execution gets here almost instantly
  console.log(await slow) // 2. runs 2 seconds after 1
  console.log(await fast) // 3. runs 2 seconds after 1, immediately after 2, since fast is already resolved
}

function concurrentPromise() {
  console.log('==CONCURRENT START with Promise.all==')
  
  return Promise.all([resolveAfter2Seconds(), resolveAfter1Second()])
    .then((messages) => {
      console.log(messages[0])  
      console.log(messages[1])
    })
}

async function parallel() {
  console.log('==PARALLEL with await Promise.all==')
  
  // Start 2 "jobs" in parallel and wait for both of them to complete
  // after 1 second, logs "fast", then after 1 more second, "slow"
  await Promise.all([
    (async() => console.log(await resolveAfter2Seconds()))(),
    (async() => console.log(await resolveAfter1Second()))()
  ])
}
```

> Concurrency is when two or more tasks can start, run, and complete in overlapping time periods. It doesn't necessarily mean they'll ever be running at the same instant. For example, multitasking on a single-core machine. Parallelism is when tasks literally run at the same time, e.g., on a multicore processor.

```ts
// try...catch for await
function catchError<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
  return promise
    .then(data => {
      return [undefined, data] as [undefined, T]
    })
    .catch(err => {
      return [err]
    })
}

const [error, user] = await catchError(getUser(1))
if (error) {
  console.error('There was an error:', error.message)
} else {
  console.log(user)
}
```

### `for await...of`
The `for await..of` loop is a handy tool when working with asynchronous operations. It allows us to iterate over the results of promises or asynchronous generators in a more readable and intuitive way.

When a `for await...of` loop iterates over an iterable, it first gets the iterable's `[Symbol.asyncIterator]()` method and calls it, which returns an async iterator. If it does not exist, it then looks for an `[Symbol.iterator]()` method, which returns a sync iterator. The sync iterator returned is then wrapped into an async iterator by wrapping every object returned from the `next()` method into a resolved or rejected promise. The loop then repeatedly calls the final async iterator's `next()` method and awaits the returned promise, producing the sequence of values to be assigned to variable.

- `for await...of` works on both sync and async iterables, while `for...of` only works on sync iterables.
- If the iterable is a sync iterable that yields promises, `for await...of` would produce a sequence of resolved values, while `for...of` would produce a sequence of promises.

```js
const LIMIT = 3;

const asyncIterable = {
  [Symbol.asyncIterator]() {
    let i = 0;
    return {
      next() {
        const done = i === LIMIT;
        const value = done ? undefined : i++;
        return Promise.resolve({ value, done });
      },
      return() {
        // This will be reached if the consumer called 'break' or 'return' early in the loop.
        return { done: true };
      },
    };
  },
};

(async () => {
  for await (const num of asyncIterable) {
    console.log(num); // 0, 1, 2
  }
})();
```

## What is a JavaScript test

```js
import { assert, describe, expect, it } from 'vitest'

describe('suite name', () => {
  it('foo', () => {
    assert.equal(Math.sqrt(4), 2)
  })

  it('bar', () => {
    expect(1 + 1).eq(2)
  })
})
```

> Before, we needed to write lots of defensive code to check if we passed weird things into methods. Now, we can use Typescript to make sure that never happens. We still need to test our business logic, but by using Typescript, we can write fewer unit tests.

```js
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import Link from '../components/Link.jsx'

test('Link changes the state when hovered', async () => {
  render(
    <Link page="http://antfu.me">Anthony Fu</Link>,
  )

  const link = screen.getByText('Anthony Fu')

  expect(link).toHaveAccessibleName('Link is normal')

  await userEvent.hover(link)

  expect(link).toHaveAccessibleName('Link is hovered')

  await userEvent.unhover(link)

  expect(link).toHaveAccessibleName('Link is normal')
})
```

- [Jest](https://jestjs.io) is a JavaScript testing framework built on top of Jasmine and maintained by Meta. It works out of the box for most JavaScript projects. Jest finds tests, runs the tests, and determines whether the tests passed or failed. Additionally, it offers functions for test suites, test cases, and assertions.
- [Vitest](https://vitest.dev) is a popular alternative to Jest, especially when being used in Vite. It also comes with a test runner, test suites (describe-block), test cases (it-block), and assertions (expect).
- [React Testing Library](https://github.com/testing-library/react-testing-library) is not a test runner. It provides virtual DOMs for testing React components. If you are using create-react-app, Jest and React Testing Library comes by default with the installation. Enzyme and React Testing Library are two similar things and alternatives to each other.
- [Playwright](https://github.com/microsoft/playwright) enables reliable end-to-end testing for modern web apps. It allows testing Chromium, Firefox and WebKit with a single API. Playwright is built to enable cross-browser web automation. Headless execution is supported for all browsers on all platforms.
