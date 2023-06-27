---
layout: "../layouts/BlogPost.astro"
title: "JavaScript basics you should know"
slug: js-basics-you-should-know
description: ""
added: "Aug 3 2020"
tags: [js]
updatedDate: "Mar 15 2023"
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

// Default parameters with destructuring
const colorize = ({ color = 'yellow' }) => {...} 
const colorize = ({ color = 'yellow' } = {}) => {...}
```

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
The try statement consists of a try block, which contains one or more statements. `{}` must always be used, even for single statements. **At least one catch clause, or a finally clause, must be present**. If any statement within the try-block throws an exception, control is immediately shifted to the catch-block. If no exception is thrown in the try-block, the catch-block is skipped.

- You can nest one or more try statements. If an inner try statement does not have a catch clause, the enclosing try statement's catch clause is entered.
- **The finally block always run, even if there is an exception or a return**. This is the perfect place to put code that needs to run regardless of what happens.
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
- The `Number` type is a double-precision 64-bit binary format IEEE 754 value, and each digit represents 4-bits, hence 64-bit has 16 digits. That's why some numbers are rounded while represented in more than 16 digits.
- To check for the largest available value or smallest available value within `±Infinity`, you can use the constants `Number.MAX_VALUE` or `Number.MIN_VALUE`. Values larger than `MAX_VALUE` are represented as `Infinity`.
- `Number.MAX_VALUE` is the largest number possible to represent using a double precision floating point representation.
- `Number.MAX_SAFE_INTEGER` is the largest integer which can be used safely in calculations, for example, `Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2` is true. Any integer larger than `Number.MAX_SAFE_INTEGER` cannot always be represented in memory accurately and will be a double-precision floating point approximation of the value.
- With the introduction of `BigInt`, you can operate with numbers beyond the `Number.MAX_SAFE_INTEGER`. A `BigInt` is created by appending `n` to the end of an integer or by calling the constructor.

> **The corrupted JSON data:**  
> Javascript only has floating point numbers – it doesn’t have an integer type. The biggest integer you can represent in a 64-bit floating point number is `2^53`. People mentioned issues when they were trying to send a large integer in JSON and it got corrupted. This mostly makes sense to me because JSON has “Javascript” in the name, so it seems reasonable to decode the values the way Javascript would. This particular issue doesn’t happen in Python, because Python has integers. Read more about [Examples of floating point problems](https://jvns.ca/blog/2023/01/13/examples-of-floating-point-problems/).

### Why `[] + {}` is `"[object Object]"`
Firstly convert both operands to primitive values, and try `valueOf()` followed by `toString()`. If either of them is a string, do `String(a) + String(b)`, otherwise do `Number(a) + Number(b)`.

Another example is `{} > []`. In the case of `{}`, it first tries to call `valueOf` on the object but that returns `{}`. Since `typeof {} === "object"`, it then calls `toString` and gets `"[object Object]"`. In the case of `[]`, calling `valueOf` returns `[]`, and since `typeof [] === "object"`, it calls `toString` and the return value of `Array.prototype.toString()` on an empty array is an empty string. So we get `"[object Object]" > ""`.

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

var fruitCall = fruit.call(apple);
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
  return function(){
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

## Inheritance and the prototype chain
JavaScript is a bit confusing for developers experienced in class-based languages like Java or C++, as it is dynamic and does not provide a class implementation (the `class` keyword is introduced in ES2015, but is syntactical sugar, JavaScript remains prototype-based).

When it comes to inheritance, JavaScript only has one construct: objects. Each object has a private property which holds a link to another object called its **prototype**. That prototype object has a prototype of its own, and so on until an object is reached with `null` as its prototype. By definition, `null` has no prototype, and acts as the final link in this prototype chain.

When trying to access a property of an object, the property will not only be sought on the object but on the prototype of the object, the prototype of the prototype, and so on until either a property with a matching name is found or the end of the prototype chain is reached.

Following the ECMAScript standard, the notation `someObject.[[Prototype]]` is used to designate the prototype of `someObject`. **Since ECMAScript 2015, the `[[Prototype]]` is accessed using the accessors `Object.getPrototypeOf()` and `Object.setPrototypeOf()`. This is equivalent to the JavaScript property `__proto__` which is non-standard but implemented by many browsers**. It should not be confused with the `func.prototype` property of functions, which specifies the `[[Prototype]]` to be assigned to all instances of objects created by the given function when used as a constructor. The reference to the prototype object is copied to the internal `[[Prototype]]` property of the new instance.

- All functions have a special property named `prototype`, but there is one exception that arrow function doesn't have a default prototype property. 
- The native prototypes should never be extended unless it is for the sake of compatibility with newer JavaScript features.
- Changing the `[[Prototype]]` of an object is a very slow operation in every browser and JavaScript engine, so you should avoid setting the `[[Prototype]]` of an object by using `Object.setPrototypeOf()`. Instead, create a new object with the desired `[[Prototype]]` using `Object.create()`.
- To check whether an object has a property defined on itself and not somewhere on its prototype chain, it is necessary to use the `Object.prototype.hasOwnProperty()` method.

```js
// when you call
var o = new Foo();

// JavaScript actually just does
var o = new Object();
o.[[Prototype]] = Foo.prototype;
Foo.call(o);

// create an object
let f = function () {
   this.a = 1;
   this.b = 2;
}
let o = new f();

f.prototype.b = 3;
f.prototype.c = 4;

// do not set f.prototype = {b:3, c:4}; this will break the prototype chain
// o.[[Prototype]] has properties b and c.
// o.[[Prototype]].[[Prototype]] is Object.prototype.
// Finally, o.[[Prototype]].[[Prototype]].[[Prototype]] is null.
// This is the end of the prototype chain.

// The prototype also has a 'b' property, but it's not visited. 
// This is called Property Shadowing.

var o = {
  a: 2,
  m: function() {
    return this.a + 1;
  }
};

// p is an object whose prototype is o
var p = Object.create(o);
p.a = 4;
console.log(p.m()); // 5

var b = Object.create(a);
// b ---> a ---> Object.prototype ---> null
var c = Object.create(null);
// c ---> null

// should-be-deprecated and ill-performant
Object.setPrototypeOf(d, foo.prototype);
```

## Classes
JavaScript classes are primarily syntactical sugar over existing prototype-based inheritance. The class syntax does not introduce a new object-oriented model to JavaScript. **The body of a class is executed in strict mode**.

Classes are in fact "special functions", and just as you can define function expressions and function declarations, the class syntax also includes class expressions and class declarations. An important difference between function declarations and class declarations is that function declarations are hoisted and class declarations are not.

The constructor method is a special method for creating and initializing an object created with a class. There can only be one special method with the name "constructor" in a class. A constructor can use the `super` keyword to call the constructor of the parent class. If you do not specify a constructor method, a default constructor is used.

```js
// class declaration
class Rectangle {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
}

// class expression
let Rectangle = class {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
};

// methods defined within the class body are added to the prototype
var rect = new Rectangle(1,1);
rect.constructor === Rectangle.prototype.constructor  // true
Object.getPrototypeOf(rect)  // { constructor: class Rectangle }

// class methods
class Animal {
  eat() {}
  sleep = () => {}
}

// Is equivalent to
function Animal () {
  this.sleep = function () {}
}
Animal.prototype.eat = function () {}
```

### Class field
It will allow you to add instance properties directly as a property on the class without having to use the constructor method. Class properties are public by default. Sometimes when you’re building a class, you want to have private values that aren’t exposed to the outside world. Historically because we’ve lacked the ability to have truly private values, we’ve marked them with an underscore (but it is only a convention). **According to the new proposal, you can create a private field using a hash # prefix**.

> Both public and private field declarations are an experimental feature (stage 3) proposed at TC39. Support in browsers is limited, but the feature can be used through a build step with systems like Babel. 

```js
class Car {
  // private field, # as a part of the property name
  #milesDriven = 0  
  
  drive(distance) {
    this.#milesDriven += distance
  }
  getMilesDriven() {
    return this.#milesDriven
  }
}

const tesla = new Car()
tesla.drive(10)
tesla.getMilesDriven() // 10
tesla.#milesDriven     // Invalid
```

### Class static fields
Public static fields are useful when you want a field to exist only once per class, not on every class instance you create. Static methods aren't called on instances of the class. Instead, they're called on the class itself. 

Static methods are not directly accessible using `this` keyword from non-static methods. You need to call them using the class name: `CLASSNAME.STATIC_METHOD_NAME()` or by calling the method as a property of the constructor: `this.constructor.STATIC_METHOD_NAME()`.

```js
class ClassWithStaticField {
  static staticField = 'static field';

  constructor() {
    console.log(ClassWithStaticField.staticMethod()); 
    console.log(this.constructor.staticMethod()); 
  }
  
  static staticMethod() {
    return 'Static method has been called';
  }

  static anotherStaticMethod() {
    return this.staticMethod() + ' from another static method';
  }
}

console.log(ClassWithStaticField.staticField);
ClassWithStaticField.staticMethod(); 
```

### Class getter and setter
Add methods prefixed with `get` or `set` to create a getter and setter, which are executed based on what you are doing: accessing the variable, or modifying its value. If you only have a getter, the property cannot be set; If you only have a setter, you can change the value but not access it.

```js
class Circle {
  constructor (radius) {
    this.radius = radius;
  }

  calcArea() {
    return Math.PI * this.radius * this.radius;
  }
 
  get area() {
    return this.calcArea();
  }

  set area(n) {
    this.radius = Math.sqrt(n / Math.PI);
  }
}

const circle = new Circle(10);
console.log(circle.area);
```

### Class inheritance
A class can extend another class or extend traditional function-based "classes". The `super` keyword is used to reference the parent class.

```js
class Square extends Polygon {
  constructor(length) {
    // calls parent class constructor
    super(length, length);
    this.name = 'Square';
  }

  hello() {
    return super.hello() + ' I am a square.'
  }
}

Object.getPrototypeOf(Square.prototype) === Polygon.prototype;  // true

// In derived classes, super() must be called before you can use 'this'
class A {}
class B extends A {
  constructor() {
    super();
    console.log(this);  // B {}
  }
}
class C extends A {
  constructor() {
    console.log(this);  // ReferenceError
  }
}
```

### new.target
It lets you detect whether a function or constructor was called using the `new` operator. Normally the left-hand side of the dot is the object on which property access is performed, but here `new` is not an object. **If constructors and functions invoked using the `new` operator, `new.target` returns a reference to the constructor or function. In normal function calls, `new.target` is undefined.** In arrow functions, `new.target` is inherited from the surrounding scope.

```js
function Foo() {
  if (!new.target) throw 'Foo() must be called with new';
  console.log('Foo instantiated with new');
}

new Foo();  // "Foo instantiated with new"
Foo();  // throws "Foo() must be called with new"

// new.target refers to the constructor that was directly invoked by new
class A {
  constructor() { console.log(new.target.name); }
}
class B extends A { 
  constructor() { super(); } 
}

const a = new A();  // logs "A"
const b = new B();  // logs "B"
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
1. Expand an array, an object or a string using the spread operator `...` .
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

## getter and setter in Object
The `get syntax` binds an object property to a function that will be called when that property is looked up. The `set syntax` binds an object property to a function to be called when there is an attempt to set that property.

```js
// getter
const obj = {
  log: ['example', 'test'],
  get latest() {
    return this.log[this.log.length - 1];
  }
}
console.log(obj.latest); // "test"

// setter
const language = {
  set current(name) {
    this.log.push(name);
  },
  log: []
}
language.current = 'EN';
console.log(language.log); // ['EN']
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

## Date toLocaleString
The `toLocaleString()` method returns a string with a language-sensitive representation of this date. In implementations with `Intl.DateTimeFormat` API support, this method simply calls `Intl.DateTimeFormat`.

With the syntax `toLocaleString(locales, options)`, the `locales` and `options` arguments customize the behavior of the function and let applications specify the language whose formatting conventions should be used.

> Date uses the system time on the client computer where this javascript is executed. So if you change the date/time on the client computer it will send the new value.

```js
// returns the number of milliseconds since January 1, 1970, 00:00:00 UTC
const date = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));

// US English uses month-day-year order and 12-hour time with AM/PM
console.log(date.toLocaleString('en-US'));
// "12/20/2012, 11:00:00 AM"

// British English uses day-month-year order and 24-hour time without AM/PM
console.log(date.toLocaleString('en-GB'));
// "20/12/2012, 11:00:00"

const enUS = date.toLocaleString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});
console.log(enUS); // 11:00 AM

// Request a weekday along with a long date
const options = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

console.log(date.toLocaleString('en-US', options));
// Thursday, December 20, 2012
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

## JSON stringify and parse 
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

JSON.stringify({ x: 5, y: 6, toJSON(){ return this.x + this.y; } });
// '11'

// The replacer array indicate the names of the properties that should be included in the result
const foo = {foundation: 'Mozilla', model: 'box', week: 45, month: 7};
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

## Map and Set
The Map object holds key-value pairs and **remembers the original insertion order of the keys**. Any value (both objects and primitive values) may be used as either a key or a value.

Object is similar to Map, and Objects have been used as Maps historically; however, there are important differences that make using a Map preferable in certain cases:
- The keys of an Object are String and Symbol, whereas they can be any value for a Map, including functions, objects, and any primitive.
- The keys in Map are ordered while keys added to object are not. Thus, when iterating over it, a Map object returns keys in order of insertion.
- You can get the size of a Map easily with the `size` property, while the number of properties in an Object must be determined manually.

```js
var myMap = new Map();
myMap.set(0, 'zero');
myMap.set(1, 'one');

myMap.size;

var myMap2 = new Map([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

myMap.get('key1');  
myMap.has('key1');
myMap.delete('key1');

// Iterating with for..of
for (let key of myMap.keys()) console.log(key);
for (let value of myMap.values()) console.log(value);
for (let [key, value] of myMap.entries()) console.log(key + ' = ' + value);

myMap.forEach(function(value, key, map) {
  console.log(`map.get('${key}') = ${value}`);
});

myMap.clear();

// Relation with Array 
// Use the Array.from to transform a map into a 2D key-value Array
Array.from(myMap);
// or
[...myMap];

// Or use the keys or values iterators and convert them to an array
Array.from(myMap.keys());

// Maps can be merged
var first = new Map([
  [1, 'one'],
  [2, 'two'],
  [3, 'three'],
]);

var second = new Map([
  [1, 'uno'],
  [2, 'dos']
]);

// Merge two maps. The last repeated key wins.
var merged = new Map([...first, ...second]);
```

The Set object lets you store unique values of any type, whether primitive values or object references.

```js
var mySet = new Set();
var mySet = new Set(['value1', 'value2', 'value3']);

// You can't add multiple elements to a set in one add()
mySet.add(1);
mySet.add(2); 

mySet.has(1); // true
mySet.has(3); // false
mySet.delete(1);

mySet.size;

// There are no keys in Set, so key and value are the same here
for (let item of mySet.keys()) console.log(item);
for (let item of mySet.values()) console.log(item);
for (let [key, value] of mySet.entries()) console.log(key);

mySet.forEach(function(value, key, set) {
  console.log(value);
});

mySet.clear();

// converting between Set and Array
mySet2 = new Set([1, 2, 3, 4]);
Array.from(mySet2)
// or
[...mySet2];

// intersection
var intersection = new Set([...set1].filter(x => set2.has(x)));
```

### WeakMap
Every key of a WeakMap is an object. Primitive data types as keys are not allowed. WeakMap allows garbage collector to do its task but not Map. There is no such thing as a list of WeakMap keys, they are just references to another objects. After removing the key from the memory we can still access it inside the map. At the same time removing the key of WeakMap removes it from weakmap as well by reference.

> Normally, the garbage collector would collect this object and remove it from memory. However, because our map is holding a reference, it'll never be garbage collected, causing a memory leak. Here’s where we can use the WeakMap type. 

In WeakMaps, references to key objects are held "weakly", which means that they do not prevent garbage collection when there would be no other reference to the object. Because of references being weak, you cannot iterate over its keys or values, cannot clear all items (no clear method), cannot check its size (no size property). *A use case that would otherwise cause a memory leak enabled by WeakMap is keeping data about host objects like DOM nodes in the browser.*

```js
// Weakmap
var k1 = {a: 1};
var k2 = {b: 2};

var map = new Map();
var wm = new WeakMap();

map.set(k1, 'k1');
wm.set(k2, 'k2');

k1 = null;
map.forEach(function (val, key) {
  console.log(key, val); // {a: 1} "k1"
});

k2 = null;
wm.get(k2); // undefined
```

## Custom Event
The Event interface represents an event which takes place in the DOM. An event can be triggered by the user action or generated by APIs to represent the progress of an asynchronous task. It can also be triggered programmatically, such as by calling the `HTMLElement.click()` method of an element, or by defining the event, then sending it to a specified target using `EventTarget.dispatchEvent()`.

> If you inspect the `HTMLElement` prototype chain, you'll discover it inherits from `Element`, `Node` and `EventTarget`. Thanks to the `EventTarget` interface, you can subscribe to an element's DOM events via `addEventListener`.

Unlike "native" events, which are fired by the DOM and invoke event handlers **asynchronously** via the event loop, **`dispatchEvent()` invokes event handlers synchronously**. All applicable event handlers will execute and return before the code continues on after the call to `dispatchEvent()`.

Events can be created with the `Event` constructor. This constructor is supported in most modern browsers. To add more data to the event object, the `CustomEvent` interface exists and the `detail` property can be used to pass custom data.

```js
const event1 = new Event('build');
$0.addEventListener('build', function(e) {}, false);
$0.dispatchEvent(event1);

// Adding custom data
const event2 = new CustomEvent('build', { detail: $0.dataset.time });
function eventHandler(e) {
  console.log('The time is: ' + e.detail);
}
$0.addEventListener('build', eventHandler, false);
$0.dispatchEvent(event2);

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

> The most common approaches available to remove event listeners:
> - Use `removeEventListener()` if the callback function is assigned to a variable and within easy reach of where the listener was added.
> - Use the `once` option in `addEventListener()` if you need to fire a callback only once.
> - Use `AbortController()` if you have a series of listeners you’d like to imperatively remove at once, or if you just like the syntax.

## Cross-site scripting
Cross-site scripting (XSS) is a security bug that can affect websites. This bug can allow an attacker to add their own malicious JavaScript code onto the HTML pages displayed to the users. The vulnerabilities most often happen when user input is sent to the server, and the server responds back to the user by displaying a page that includes the user input without validation. XSS also can occur entirely in the client-side without data being sent back and forth between the client and server.

A common technique for preventing XSS vulnerabilities is "escaping". The purpose of character and string escaping is to make sure that every part of a string is interpreted as a string primitive, not as a control character or code. Escape certain characters (like `<`, `>`, `&`, and `"`) with HTML entity to prevent them being executed.

A good test string is `>'>"><img src=x onerror=alert(0)>`. If your application doesn't correctly escape this string, you will see an alert and will know that something went wrong. [The Big List of Naughty Strings](https://github.com/minimaxir/big-list-of-naughty-strings) is a list of strings which have a high probability of causing issues when used as user-input data.

> We do not recommend that you manually escape user-supplied data. Instead, we strongly recommend that you use a templating system or web development framework that provides context-aware auto-escaping. If this is impossible for your website, use existing libraries (e.g., [DOMPurify](https://github.com/cure53/DOMPurify)) that are known to work, and apply them consistently to all user-supplied data.

## Promise
A `Promise` is a proxy for a value not necessarily known when the promise is created. The Promise object represents the eventual completion or failure of an asynchronous operation and its success value or failure reason. Instead of immediately returning the final value, the asynchronous method returns a promise to supply the value at some point in the future.

A Promise is in one of these states: `pending`, `fulfilled`, `rejected`. A promise is said to be `settled` if it is either fulfilled or rejected, but not pending. A pending promise can either be fulfilled with a value or rejected with an error. When either of these options happens, the associated handlers queued up by a promise's `then` method are called. Note that **promises are guaranteed to be asynchronous**, so an action for an already "settled" promise will occur only after the stack has cleared and a clock-tick has passed.

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
// At this point, "promiseA" is already settled
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

function loadImg(src){
  return new Promise((resolve,reject) => {
    let img = document.createElement('img');
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => eject(err);
  })
}

function showImgs(imgs){
  imgs.forEach(function(img){
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

## async and await
Async functions can contain zero or more `await` expressions. Await expressions suspend progress through an async function, yielding control and subsequently resuming progress only when an awaited promise-based asynchronous operation is either fulfilled or rejected. **The resolved value of the promise is treated as the return value of the await expression**. 

- Async functions always return a promise. If the return value of an async function is not explicitly a promise, it will be implicitly wrapped in a promise.
- You can use await with any function which returns a promise. The function you're awaiting doesn't need to be async necessarily.
- The `await` keyword is only valid inside async functions.
- Use of `async / await` enables the use of ordinary `try / catch` blocks around asynchronous code.

```js
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

```js
// async error handling
async function asyncWrap(promise) {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    return [null, err];
  }
}

const [data, err] = await asyncWrap(getData());
```

## What is a JavaScript test

```js
// math.js
const sum = (a, b) => a + b
const subtract = (a, b) => a - b

module.exports = {sum, subtract}

// test.js
const {sum, subtract} = require('./math')

test('sum adds numbers', () => {
  const result = sum(3, 7)
  const expected = 10
  expect(result).toBe(expected)
})

test('subtract subtracts numbers', () => {
  const result = subtract(7, 3)
  const expected = 4
  expect(result).toBe(expected)
})

function test(title, callback) {
  try {
    callback()
    console.log(`✓ ${title}`)
  } catch (error) {
    console.error(`✕ ${title}`)
    console.error(error)
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`${actual} is not equal to ${expected}`)
      }
    },
  }
}
```

Instead of building our own framework, [Jest](https://jestjs.io) is a JavaScript testing framework built on top of Jasmine and maintained by Meta. It works out of the box for most JavaScript projects.

## Javascript obfuscation techniques
https://www.trickster.dev/post/javascript-obfuscation-techniques-by-example
