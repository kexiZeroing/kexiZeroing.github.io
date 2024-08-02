---
layout: "../layouts/BlogPost.astro"
title: "JavaScript String, Array and Object"
slug: js-string-array-object
description: ""
added: "Aug 6 2020"
tags: [js]
updatedDate: "Feb 28 2024"
---

## String
 
### string primitives and String objects
Note that JavaScript distinguishes between String objects and primitive string values (The same is true of Boolean and Numbers). In contexts where a method is to be invoked on a primitive string or a property lookup occurs, JavaScript will automatically wrap the string primitive and call the method or perform the property lookup. A String object can always be converted to its primitive counterpart with the `valueOf()` method.

### Template literals (Template strings)
```js
`string text ${expression} string text`

// Multi-line string
// newline characters inserted in the source are part of the template literal
console.log(`string text line 1
string text line 2`);
// "string text line 1
// string text line 2"
```

A more advanced form of template literals are **tagged templates**. Tags allow you to parse template literals with a function, which you can manipulate before outputting. The first argument is a string array containing string literals from the template: First element in the array is string starting from index 0 to the first interpolated value, second element is string after first interpolated value to next interpolation and so on until end of template is reached. All the interpolated expressions are evaluated and passed to the tag as second argument in order of their occurrence. In the end, your function can return your manipulated string or it can return something completely different.

The special `raw` property, available on the first argument to the tag function, allows you to access the raw strings as they were entered, without processing escape sequences.

```js
var person = 'Mike';
var age = 28;

function myTag(strings, ...keys) {
  var str0 = strings[0]; // "That "
  var str1 = strings[1]; // " is a "
  var str2 = strings[2]; // There is an empty string after the final expression
 
  var ageStr = keys[1] > 99 ? 'centenarian' : 'youngster';
  
  return `${str0}${keys[0]}${str1}${ageStr}`;
}

var output = myTag`That ${ person } is a ${ age }`;
console.log(output);  // That Mike is a youngster

// raw property
function tag(strings) {
  console.log(strings[0]);     // escape \n to a new line
  console.log(strings.raw[0]); // include \n in the string
}
tag`string text line 1 \n string text line 2`;
```

### String startsWith/endsWith, padStart/padEnd, repeat
```js
str.startsWith(searchString[, position])
str.endsWith(searchString[, length])
str.padStart(targetLength [, padString])
str.padEnd(targetLength [, padString])
str.repeat(count)

const str = 'To be, or not to be, that is the question.'
str.startsWith('To be')         // true
str.startsWith('not to be', 10) // true
str.endsWith('question.')       // true
str.endsWith('to be', 19)       // true

'abc'.padStart(10, "foo")   // "foofoofabc"
'abc'.padStart(6, "123465") // "123abc"
'abc'.padStart(1)           // "abc"
'abc'.padEnd(10)            // "abc       "
'abc'.padEnd(10, "foo")     // "abcfoofoof"
'abc'.padEnd(6, "123456")   // "abc123"

'abc'.repeat(-1)    // RangeError
'abc'.repeat(0)     // ''
'abc'.repeat(1)     // 'abc'
'abc'.repeat(2)     // 'abcabc'
```

### String.prototype.replace() / replaceAll()
It returns a new string with some or all matches of a pattern replaced by a replacement. The pattern can be a string or a RegExp, and the replacement can be a string or a function. The function's result (return value) will be used as the replacement string. The original string is left unchanged. **If not using `replaceAll` and the pattern is a string, only the first occurrence will be replaced**.

The replacement string can include the following special replacement patterns:
- `$&`: the matched substring
- `$\`: the portion of the string that precedes the matched substring
- `$'`:	the portion of the string that follows the matched substring
- `$n`: the nth parenthesized submatch string

```js
'John Smith'.replace(/(\w+)\s(\w+)/, '$2, $1'); // Smith, John
'abc5885c'.replace(/(\d)(\d)\2\1/g, '-$&-'); // abc-5885-c

// When using a regular expression search value, must set the global flag
'aabbcc'.replaceAll(/b/g, '.');  // aa..cc

// the matched substring
// capture groups
// offset of the matched substring within the whole string being examined
// the whole string being examined
function replacer(match, p1, p2, p3, offset, string) {
  // p1 is nondigits, p2 digits, and p3 non-alphanumerics
  return [p1, p2, p3].join('-');
}
'abc123#$'.replace(/([^\d]*)(\d*)([^\w]*)/, replacer); // abc-123-#$
```

## Array

### Check if the variable is an array
- Array.isArray(value)
- Object.prototype.toString.call(value) === '[object Array]'
- value instanceof Array

Note that `value instanceof Array` evaluates to `false` when value is an array created in a different iframe than the Array constructor function (v is instance of thatFrame.contentWindow.Array)

```js
({}).toString.call([]);   // '[object Array]'
({}).toString.call({});   // '[object Object]'
({}).toString.call('');   // '[object String]'
({}).toString.call(null); // '[object Null]'
```

### Remove duplicates
- [...new Set(array)]
- array.filter((item, index, arr) => arr.indexOf(item) === index)
- array.reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], [])

```js
// liner time, but has at least two drawbacks:
// 1. doesn't distinguish numbers and "numeric strings" like [1, "1"]
// 2. all objects will be considered equal `[object Object]`
function uniq(a) {
  var seen = {};
  return a.filter(function(item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}
```

### Clone an Array
- loop
- arr.slice()
- Array.from()
- [].concat(arr)
- [...arr]
- JSON.parse(JSON.stringify(arr))  // deep clone
- structuredClone(arr)  // deep clone, works across the latest browser versions

Note that `JSON.parse(JSON.stringify(arr))` depends upon JSON, it also inherits its limitations. `undefined`, `Function`, and `Symbol` are not valid JSON values. If any such values are encountered during the stringify conversion, they are either omitted (when found in an object) or changed to `null` (when found in an array).

```js
JSON.stringify(function(){}) // undefined
JSON.stringify([undefined, function(){}, () => {}])  // "[null, null, null]"
```

### Array-like object
An Object which has a length property of a non-negative integer, and usually some indexed properties. You can actually just use Array's `slice` function to convert it into a standard JavaScript array. **The `slice` function is intentionally generic;** it does not require that its `this` value be an Array object, so it works on anything that has a length property, which `arguments` conveniently does.

```js
Array.prototype.slice.call(obj);  // same as [].slice.call(obj)
```

### Array.from()
It creates a new, shallow-copied Array instance from an array-like or iterable object. It has an optional parameter `mapFn`, which allows you to execute a map function on each element of the array that is being created.

```js
Array.from('foo');  // [ "f", "o", "o" ]

const set = new Set(['foo', 'bar', 'baz', 'foo']);
Array.from(set);  // [ "foo", "bar", "baz" ]

Array.from([1, 2, 3], x => x + x);  // [2, 4, 6]

// Since the array is initialized with `undefined` on each position,
// the value of `v` below will be `undefined`
Array.from({length: 5}, (v, i) => i);  // [0, 1, 2, 3, 4]
```

### Array.of()
It creates a new Array instance from a variable number of arguments. The difference between `Array.of()` and the `Array` constructor is in the handling of integer arguments: `Array.of(7)` creates an array with a single element, `7`, whereas `Array(7)` creates an empty array with a length of 7 (which implies an array of 7 empty slots, not slots with actual `undefined` values).

```js
Array.of(7);       // [7] 
Array.of(1, 2, 3); // [1, 2, 3]

Array(7);          // array of 7 empty slots
Array(1, 2, 3);    // [1, 2, 3]
```

> 1. `Array()` can be called with or without `new`. Both create a new Array instance.
> 2. The `length` property of an array is a 32-bit unsigned integer, which limits the maximum number of entries an array can have, which is `Math.pow(2, 32) - 1`.

### Array.prototype.fill()
The fill method takes up to three arguments `value`, `start` and `end`. The start and end arguments are optional with default values of 0 and the length of the this object. `fill()` is intentionally generic, it does not require that its `this` value be an Array object.

```js
Array(3).fill(4)  // [4, 4, 4]

// Objects by reference
var arr = Array(3).fill({}) // [{}, {}, {}];
arr[0].hi = "hi"; // [{ hi: "hi" }, { hi: "hi" }, { hi: "hi" }]

[].fill.call({ length: 3 }, 4);  // {0: 4, 1: 4, 2: 4, length: 3}
```

### Array.prototype.find()
```js
arr.find(callback(element[, index[, array]])[, thisArg])

const array1 = [5, 12, 8, 130, 44];
const found = array1.find(element => element > 10);  // 12
const foundIndex = array1.findIndex(element => element > 10); // 1

const inventory = [
  {name: 'apples', quantity: 2},
  {name: 'bananas', quantity: 0},
  {name: 'cherries', quantity: 5}
];
const result = inventory.find( ({ name }) => name === 'cherries' );
```

### Array.prototype.reduce()
- If `initialValue` is provided, then accumulator will be equal to `initialValue`, and `currentValue` will be equal to the first value in the array. If no `initialValue` is provided, then accumulator will be equal to the first value in the array, and `currentValue` will be equal to the second. 
- If the array has only one element and no initialValue was provided, or if initialValue is provided but the array is empty, the solo value would be returned without calling callback.

```js
arr.forEach(callback(currentValue [, index [, array]])[, thisArg]);

// thisArg (Optional), value to use as `this` when executing callback
[1,2,3].forEach(function(){console.log(this)})  // window
[1,2,3].forEach(function(){console.log(this)}, {a: 1})  // {a: 1}
[1,2,3].forEach(() => console.log(this), {a: 1})  // window

arr.reduce(callback(accumulator, currentValue[, index[, array]])[, initialValue])

// implement map using reduce
function implementMapUsingReduce(list, func) {
  return list.reduce((acc, cur, i) => {
    acc[i] = func(cur);
    return acc;
  }, []);
}
```

### Array.prototype.splice()
It changes the contents of an array by removing or replacing existing elements or adding new elements in place.

```js
var arrDeletedItems = array.splice(start[, deleteCount[, item1[, item2[, ...]]]])

// insert
var myFish = ['angel', 'clown', 'mandarin', 'sturgeon'];
var removed = myFish.splice(2, 0, 'drum');

// remove
var myFish = ['angel', 'clown', 'drum', 'mandarin', 'sturgeon'];
var removed = myFish.splice(3, 1);

// replace
var myFish = ['angel', 'clown', 'trumpet', 'sturgeon'];
var removed = myFish.splice(0, 2, 'parrot', 'anemone', 'blue');
```

### Flatten array
```js
const arr1 = [1, 2, [3, 4]];
arr1.flat();  // [1, 2, 3, 4]

const arr2 = [1, 2, [3, 4, [5, 6]]];
arr2.flat();  // [1, 2, 3, 4, [5, 6]]

const arr3 = [1, 2, [3, 4, [5, 6, [7, 8, [9, 10]]]]];
arr4.flat(Infinity);  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// deep level flatten use recursion
// [].concat([1,[2,3]]) returns [1,[2,3]]  
// [].concat(1,[2,3]) returns [1,2,3] 
function flattenDeep(arr) {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}

// flatMap is identical to a map() followed by a flat() of depth 1
let arr1 = ["it's Sunny in", "", "California"];

// [["it's","Sunny","in"],[""],["California"]]
arr1.map(x => x.split(" "));

// ["it's","Sunny","in", "", "California"]
arr1.flatMap(x => x.split(" "));
```

### Array sort
- The `sort()` method sorts the elements of an array in place and returns the reference to the same array.
- The time and space complexity of the sort cannot be guaranteed as it depends on the implementation.
- Since ECMAScript 2019, the specification dictates that `Array.prototype.sort` is stable. All major JavaScript engines now implement a stable Array sort.

### New JS Array methods
```js
let wizards = ['Merlin', 'Ursula', 'Gandalf'];
let reverseWizards = wizards.toReversed();

// logs ["Gandalf", "Ursula", "Merlin"]
console.log(reverseWizards);
// logs ["Merlin", "Ursula", "Gandalf"]
console.log(wizards);

let wizards = ['Merlin', 'Ursula of the Sea', 'Gandalf the Gray'];
let sortedWizards = wizards.toSorted();

// logs ['Gandalf the Gray', 'Merlin', 'Ursula of the Sea']
console.log(sortedWizards);
// logs ['Merlin', 'Ursula of the Sea', 'Gandalf the Gray']
console.log(wizards);

let wizards = ['Merlin', 'Ursula', 'Gandalf', 'Radagast'];
let lessWizards = wizards.toSpliced(2, 1);

// logs ['Merlin', 'Ursula', 'Radagast']
console.log(lessWizards);
// logs ['Merlin', 'Ursula', 'Gandalf', 'Radagast']
console.log(wizards);

// Creates a copy of an array and updates a single value in the array.
// e.g. You want to copy an array but use a different value for one index.
let wizards = ['Merlin', 'Ursula', 'Gandalf'];
let differentWizards = wizards.with(2, 'Radagast');

// logs ['Merlin', 'Ursula', 'Radagast']
console.log(differentWizards);
// logs ['Merlin', 'Ursula', 'Gandalf']
console.log(wizards);
```

## Object

### Check if an object is empty
- Object.keys(obj).length === 0 && obj.constructor === Object
- JSON.stringify(obj) === JSON.stringify({})
- Object.getOwnPropertyNames(obj).length === 0

```js
function badEmptyCheck(value) {
  return Object.keys(value).length === 0;
}
badEmptyCheck(new Object());  // true
badEmptyCheck(new String());  // true 
badEmptyCheck(new Number());  // true
badEmptyCheck(new Array());   // true

function goodEmptyCheck(value) {
  return Object.keys(value).length === 0 && value.constructor === Object;
}
badEmptyCheck(new Object());  // true
badEmptyCheck(new String());  // false 
badEmptyCheck(new Number());  // false
badEmptyCheck(new Array());   // false
```

### Object.defineProperty()
It defines a new property or modifies an existing property on an object, and returns the object. By default, values added using `Object.defineProperty()` are immutable and not enumerable. Property descriptors present in objects come in two main flavors: **data descriptors or accessor descriptors**. A data descriptor is a property that has a value, which may or may not be writable. An accessor descriptor is a property described by a getter-setter pair of functions. A descriptor must be one of these two flavors; it cannot be both.

- **configurable**: true if the type of this property descriptor may be changed and if the property may be deleted from the object. (defaults to false)
- **enumerable**: true if and only if this property shows up during enumeration of the properties on the object. (defaults to false)
- **value**: the value associated with the property. (defaults to undefined)
- **writable**: true if the value associated with the property may be changed with an assignment operator. (defaults to false)
- **get**: a function which serves as a getter for the property, or undefined if there is no getter. When the property is accessed, this function is called without arguments and the return value will be used as the value of the property.
- **set**: a function which serves as a setter for the property, or undefined if there is no setter. When the property is assigned to, this function is called with one argument which is the value being assigned to the property.

```js
// data descriptor
Object.defineProperty(o, 'key', {
  enumerable: false,
  configurable: false,
  writable: true,
  value: 'static'
});

// accessor descriptor
var bValue = 38;
Object.defineProperty(o, 'b', {
  enumerable: true,
  configurable: true,
  get() { return bValue; },
  set(newValue) { bValue = newValue; }
});
o.b; // 38, the value of o.b is now always identical to bValue

var o = {};
o.a = 1;
// is equivalent to:
Object.defineProperty(o, 'a', {
  value: 1,
  writable: true,
  configurable: true,
  enumerable: true
});

// On the other hand,
// default: not enumerable, not configurable, not writable
Object.defineProperty(o, 'a', { value: 1 });
// is equivalent to:
Object.defineProperty(o, 'a', {
  value: 1,
  writable: false,
  configurable: false,
  enumerable: false
});

var o = {}; 
Object.defineProperty(o, 'a', {
  value: 37,
  writable: false
});
o.a = 25; // it would throw error in strict mode even if the value had been the same
console.log(o.a); // 37

var o = {};
Object.defineProperty(o, 'a', {
  value: 1,
  enumerable: true
});
Object.defineProperty(o, 'b', {
  value: 2,
  enumerable: false
});
Object.defineProperty(o, 'c', {
  value: 3
});
o.d = 4; 

// non-enumerable means that property will not be shown in Object.keys() or for-loop
for (var i in o) { console.log(i) } // logs 'a' and 'd'
Object.keys(o); // ['a', 'd']
o.propertyIsEnumerable('a'); // true
o.propertyIsEnumerable('b'); // false
var p = { ...o };
p.a // 1
p.b // undefined
```

### getter and setter in Object
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

### Object.keys(), Object.values(), Object.entries()
- Object.keys() returns an array whose elements are strings corresponding to the enumerable properties found directly upon object. 
- Object.values() returns an array of a given object's own enumerable property values, in the same order as that provided by a `for...in` loop (the difference being that **for-in loop enumerates properties in the prototype chain as well**).
- Object.entries() returns an array whose elements are arrays corresponding to the enumerable property `[key, value]` pairs found directly upon object.

A `for...in` loop only iterates over enumerable, non-Symbol properties. Objects created from built–in constructors like `Object` and `String` have inherited non–enumerable properties from `Object.prototype` and `String.prototype`, such as String's `indexOf()` method or Object's `toString()` method **(not enumerable)**. The loop will iterate over all enumerable properties of the object itself and those enumerable properties the object inherits from its prototype chain.

```js
var arr = ['a', 'b', 'c'];
console.log(Object.keys(arr)); // ['0', '1', '2']

var obj = { foo: 'bar', baz: 42 };
console.log(Object.values(obj)); // ['bar', 42]

const obj = { foo: 'bar', baz: 42 };
console.log(Object.entries(obj)); // [ ['foo', 'bar'], ['baz', 42] ]

// fromEntries() method transforms a list of key-value pairs into an object
// iterable argument is expected
const arr = [ ['0', 'a'], ['1', 'b'], ['2', 'c'] ];
Object.fromEntries(arr); // { 0: "a", 1: "b", 2: "c" }

const map = new Map([ ['foo', 'bar'], ['baz', 42] ]);
Object.fromEntries(map); // { foo: "bar", baz: 42 }
```

### hasOwnProperty, getOwnPropertyNames, getPrototypeOf, isPrototypeOf
```js
// hasOwnProperty() returns a boolean indicating whether the object has the specified property
// as its own property as opposed to inheriting it
const o = new Object();
o.prop = 'exists';
o.hasOwnProperty('prop');     // true
o.hasOwnProperty('toString'); // false

// getOwnPropertyNames() returns an array of all properties (including non-enumerable properties) 
// found directly in a given object
const arr = ['a', 'b', 'c'];
console.log(Object.getOwnPropertyNames(arr).sort()); // ["0", "1", "2", "length"]

// getPrototypeOf() returns the prototype (the value of the internal [[Prototype]] property)
// of the specified object
var proto = {};
var obj = Object.create(proto);
Object.getPrototypeOf(obj) === proto; // true

// isPrototypeOf() checks if an object exists within another object's prototype chain
function Foo() {}
function Bar() {}
function Baz() {}

Bar.prototype = Object.create(Foo.prototype);
Baz.prototype = Object.create(Bar.prototype);

var baz = new Baz();
Baz.prototype.isPrototypeOf(baz);    // true
Bar.prototype.isPrototypeOf(baz);    // true
Foo.prototype.isPrototypeOf(baz);    // true
Object.prototype.isPrototypeOf(baz); // true
```

### toString() and valueOf()
Every object has a `toString()` method that is automatically called when the object is to be represented as a text value or when an object is referred to in a manner in which a string is expected. **For Numbers, `toString()` takes an optional parameter radix, the value of radix must be minimum 2 and maximum 36**.

You can create a function to be called in place of the default `toString()` method. The `toString()` method you create can be any value you want, but it will be most useful if it carries information about the object.

```js
function Dog(name, breed, color, sex) {
  this.name = name;
  this.breed = breed;
  this.color = color;
  this.sex = sex;
}

theDog = new Dog('Gabby', 'Lab', 'chocolate', 'female');
theDog.toString(); // [object Object]

Dog.prototype.toString = function() {
  return `Dog ${this.name} is a ${this.sex} ${this.color} ${this.breed}`;
}
theDog.toString(); // "Dog Gabby is a female chocolate Lab"
```

JavaScript calls `valueOf()` to convert an object to a primitive value. You rarely need to invoke the `valueOf` method yourself; JavaScript automatically invokes it when encountering an object where a primitive value is expected. A unary plus sign can sometimes be used as a shorthand for `valueOf`.

```js
+"5" // 5
+""  // 0
+"foo" // NaN 
+{} // NaN
+[] // 0
+[1] // 1
+[1,2] // NaN
+undefined // NaN
+null // 0
+true // 1
+false // 0
```

### Object.assign()
Copy the values of all enumerable and own properties from one or more source objects to a target object and return the target object. If the source value is a reference to an object, it only copies that reference value (shallow copy). Properties in the target object will be overwritten by properties in the sources if they have the same key.

```js
var obj = { a: 1 };
var copy = Object.assign({}, obj);
console.log(copy); // { a: 1 }

// Merging objects
var o1 = { a: 1 };
var o2 = { b: 2 };
var o3 = { c: 3 };
var obj = Object.assign(o1, o2, o3);
console.log(obj); // { a: 1, b: 2, c: 3 }
console.log(o1);  // { a: 1, b: 2, c: 3 }
```

### Object.create()
It creates a new object, using an existing object as the prototype of the newly created object. Be aware of that using `Object.keys()` on an object created via `Object.create()` will result in an empty array being returned.

```js
const o1 = Object.create({});   // create a normal object
const o2 = Object.create(null); // create a totally empty object (without prototype)

"first is: " + o1  // "first is: [object Object]"
"second is: " + o2 // throws error: Cannot convert object to primitive value

o1.toString() // [object Object]
o2.toString() // throws error: ocn.toString is not a function

o1.constructor // "Object() { [native code] }"
o2.constructor // "undefined"

// Class inheritance with Object.create()
function Shape() {
  this.x = 0;
  this.y = 0;
}
function Rectangle() {
  // call super constructor
  Shape.call(this); 
}

Rectangle.prototype = Object.create(Shape.prototype);
// If don't set constructor to Rectangle, it will take Shape as the constructor
Rectangle.prototype.constructor = Rectangle;

var rect = new Rectangle();
rect instanceof Rectangle  // true
rect instanceof Shape      // true
```

### Object.is()
It determines whether two values are the same value. The only difference between `Object.is()` and `===` is in their treatment of signed zeros and NaN values.

```js
Object.is('foo', 'foo');  // true

var foo = { a: 1 };
var bar = { a: 1 };
Object.is(foo, bar);  // false

+0 === -0             // true
Object.is(+0, -0);    // false

NaN === NaN           // false
Object.is(NaN, NaN);  // true
Object.is(NaN, 0/0);  // true
```

## Map and Set
The Map object holds key-value pairs and **remembers the original insertion order of the keys**. Any value (both objects and primitive values) may be used as either a key or a value.

Object is similar to Map, and Objects have been used as Maps historically; however, there are important differences that make using a Map preferable in certain cases:
- The keys of an Object are String and Symbol, whereas they can be any value for a Map, including functions, objects, and any primitive.
- The keys in Map are ordered while keys added to object are not. Thus, when iterating over it, a Map object returns keys in order of insertion.
- You can get the size of a Map easily with the `size` property, while the number of properties in an Object must be determined manually. (A Map is iterable, whereas a objects is not iterable.)

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
> Normally, the garbage collector would collect this object and remove it from memory. However, because our Map is holding a reference, it'll never be garbage collected, causing a memory leak. Here’s where we can use the WeakMap type.

Every key of a WeakMap is an object. Primitive data types as keys are not allowed. WeakMap allows garbage collector to do its task but not Map. There is no such thing as a list of WeakMap keys, they are just references to another objects. After removing the key from the memory we can still access it inside the map. At the same time removing the key of WeakMap removes it from weakmap as well by reference.

In WeakMaps, references to key objects are held "weakly", which means that they do not prevent garbage collection when there would be no other reference to the object. Because of references being weak, you cannot iterate over its keys or values, cannot clear all items (no clear method), cannot check its size (no size property).

```js
// Map and Weakmap
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

> `WeakRef` is a similar built-in object, which holds a weak reference to another object, without preventing that object from getting garbage-collected. Correct use of `WeakRef` takes careful thought, and it's best avoided if possible.
