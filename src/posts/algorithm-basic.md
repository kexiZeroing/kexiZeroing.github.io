---
layout: "../layouts/BlogPost.astro"
title: "Algorithm Basic"
slug: algorithm-basic
description: ""
added: ""
top: true
order: 3
---

### TOC
- [TOC](#toc)
- [Binary Search](#binary-search)
- [Bubble Sort](#bubble-sort)
- [Selection Sort](#selection-sort)
- [Insertion Sort](#insertion-sort)
- [Quick Sort](#quick-sort)
- [Merge Sort](#merge-sort)
- [Count Sort](#count-sort)
- [Shuffle an array](#shuffle-an-array)
- [Traverse Binary Tree](#traverse-binary-tree)
- [Graph DFS](#graph-dfs)
- [Graph BFS](#graph-bfs)
- [Heap](#heap)
- [DP](#dp)
- [LRU](#lru)

### Binary Search

```js
const binarySearch = (array, target) => {
  let startIndex = 0;
  let endIndex = array.length - 1;

  while(startIndex <= endIndex) {
    let middleIndex = Math.floor((startIndex + endIndex) / 2);
    if(target === array[middleIndex]) {
      return middleIndex;
    }
    if(target > array[middleIndex]) {
      startIndex = middleIndex + 1;
    }
    if(target < array[middleIndex]) {
      endIndex = middleIndex - 1;
    }
  }
  
  return -1;
}
```

### Bubble Sort

```js
function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        let tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
  return arr;
}
```

### Selection Sort

```js
function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let min = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[min] > arr[j]) {
        min = j;
      }
    }
    if (min !== i) {
      let tmp = arr[i];
      arr[i] = arr[min];
      arr[min] = tmp;
    }
  }
  return arr;
}
```

### Insertion Sort

```js
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j = j - 1;
    }
    arr[j + 1] = key;
  }
  return arr;
}
```

### Quick Sort

```js
function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }
  
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  return i;
}

function _quickSort(arr, lo, hi) {
  if (lo >= hi) {
    return;
  }
  const pivot = partition(arr, lo, hi);
  _quickSort(arr, lo, pivot - 1);
  _quickSort(arr, pivot + 1, hi);
}
  
function quickSort(arr) {
  const result = arr.slice(0);
  _quickSort(result, 0, result.length - 1);
  return result;
}

// another way to do the partition with two pointers
function partition(arr, left, right) {
  const pivot = arr[Math.floor((right + left) / 2)];
  while (left <= right) {
    while (arr[left] < pivot) {
      left++;
    }
    while (arr[right] > pivot) {
      right--;
    }
    if (left <= right) {
      let temp = arr[left];
      arr[left] = arr[right];
      arr[right] = temp;
      left++;
      right--;
    }
  }
  return left;
}
```

### Merge Sort

```js
function merge(arr1, arr2) {
  const merged = [];
  let i = 0;
  let j = 0;
  
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) {
      merged.push(arr1[i]);
      i++;
    } else {
      merged.push(arr2[j]);
      j++;
    }
  }

  merged.push(...arr1.slice(i), ...arr2.slice(j));
  return merged;
}
  
function mergeSort(arr) {
  if (arr.length < 2) {
    return arr.slice(0);
  }

  const split = Math.floor(arr.length / 2);
  const left = arr.slice(0, split);
  const right = arr.slice(split, arr.length);

  return merge(mergeSort(left), mergeSort(right));
}
```

### Count Sort

```js
function countSort(arr, min, max) {
  let i = min, j = 0, count = [];

  for (i; i <= max; i++) {
    count[i] = 0;
  }
  for (i = 0; i < arr.length; i++) {
    count[arr[i]] += 1;
  }
  for (i = min; i <= max; i++) {
    while (count[i] > 0) {
      arr[j] = i;
      j++;
      count[i]--;
    }
  }
  return arr;
}
```

### Shuffle an array
The Art of Computer Programming, Vol. 2, section 3.4.2 “Random sampling and shuffling” describes two solutions:
- If the number of items to sort is small, then simply put all possible orderings in a table and select one ordering at random. For example with 5 items, the table would need `5! = 120` rows.
- Fisher-Yates Shuffle

```js
/* 
Fisher-Yates Algorithm
To shuffle an array a of n elements (indices 0..n-1):
for i from n−1 downto 1 do
    j ← random integer such that 0 ≤ j ≤ i
    exchange a[j] and a[i]
*/

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
```

The random sort `() => 0.5 - Math.random()` is not recommended, because **it is inefficient and strongly biased**.

A sorting algorithm requires a certain number `c` of comparisons, e.g. `c = n(n-1)/2` for bubble sort. The random comparison function makes the outcome of each comparison equally likely, and there are `2^c` equally probable results. Now, each result has to correspond to one of the `n!` permutations of the array's entries, which makes an even distribution impossible in the general case.

According to the ECMA spec, if `comparefn` is not a consistent comparison function for the elements of this array (e.g. you first claim A < B and B < C, but then C < A), the sort order is implementation-defined (can do anything or nothing, unpredictably). Depending on the exact algorithm used, it may just do a few exchanges operations and then prematurely stop. Or it could be worse and lead to an infinite loop.

Furthermore, sorting is an `O(N log N)` operation where the Fisher-Yates algorithm is `O(N)`.

### Traverse Binary Tree

```js
// iterative pre-order and in-order traversal
var preorderTraversal = function(root) {
  if (root == null) return [];
  let stack = [];
  let result = [];
  stack.push(root);

  while (stack.length > 0) {
    let node = stack.pop();
    result.push(node.val);
    if (node.right) {
      stack.push(node.right);
    }
    if (node.left) {
      stack.push(node.left);
    }
  }
  return result;
};

var inorderTraversal = function(root) {
  if (root == null) return [];
  let result = [];
  let stack = [];
  let pointerNode = root;

  while (stack.length > 0 || pointerNode !== null) {
    if (pointerNode !== null) {
      stack.push(pointerNode);
      pointerNode = pointerNode.left;
    } else {
      pointerNode = stack.pop();
      result.push(pointerNode.val);
      pointerNode = pointerNode.right;
    }
  }
  return result;
};

// Level-Order traversal
var levelOrderTraversal = function(root) {
  if (!root) return [];
  let result = [];
  let queue = [root, null];
  let levelNodes = [];

  while (queue.length) {
    const t = queue.shift();

    if (t) {
      levelNodes.push(t.val)
      if (t.left) {
        queue.push(t.left);
      }
      if (t.right) {
        queue.push(t.right);
      }
    } else {
      result.push(levelNodes);
      levelNodes.length = 0 ;
      if (queue.length > 0) {
        queue.push(null)
      }
    }
  }

  return result;
};
```

### Graph DFS

```js
function dfs(startingNodeKey, visitFn) {
  const startingNode = this.getNode(startingNodeKey)
  const visitedHash = nodes.reduce((acc, cur) => {
    acc[cur.key] = false
    return acc
  }, {})

  function explore(node) {
    if (visitedHash[node.key]) {
      return
    }

    visitFn(node)
    visitedHash[node.key] = true

    node.children.forEach(child => {
      explore(child)
    })
  }

  explore(startingNode)
}
```

### Graph BFS

```js
function bfs(startingNodeKey, visitFn) {
  const startingNode = this.getNode(startingNodeKey)
  const visitedHash = nodes.reduce((acc, cur) => {
    acc[cur.key] = false
    return acc
  }, {})
  const queue = createQueue()
  queue.enqueue(startingNode)

  while (!queue.isEmpty()) {
    const currentNode = queue.dequeue()

    if (!visitedHash[currentNode.key]) {
      visitFn(currentNode)
      visitedHash[currentNode.key] = true
    }

    currentNode.children.forEach(node => {
      if (!visitedHash[node.key]) {
        queue.enqueue(node)
      }
    })
  }
}
```

### Heap

```js
function Heap () {
  this.items = [];
}

Heap.prototype.swap = function (index1, index2) {
  var temp = this.items[index1];
  this.items[index1] = this.items[index2];
  this.items[index2] = temp;
}

Heap.prototype.parentIndex = function (index) {
  return Math.floor((index - 1) / 2);
}

Heap.prototype.leftChildIndex = function (index) {
  return index * 2 + 1;
}

Heap.prototype.rightChildIndex = function (index) {
  return index * 2 + 2;
}

Heap.prototype.parent = function (index) {
  return this.items[this.parentIndex(index)];
}

Heap.prototype.leftChild = function (index) {
  return this.items[this.leftChildIndex(index)];
}

Heap.prototype.rightChild = function (index) {
  return this.items[this.rightChildIndex(index)];
}

Heap.prototype.peek = function (index) {
  return this.items[0];
}

Heap.prototype.size = function () {
  return this.items.length;
}

function MinHeap () {
  this.items = [];
}

MinHeap.prototype = Object.create(Heap.prototype);

// add at the last position and then re-order the heap
MinHeap.prototype.add = function (item) {
  this.items[this.items.length] = item;
  this.bubbleUp();
}

// remove the minimum element and need to keep the heap order
MinHeap.prototype.poll = function () {
  var item = this.items[0];
  this.items[0] = this.items[this.items.length - 1];
  this.items.pop();
  this.bubbleDown();
  return item;
}

MinHeap.prototype.bubbleUp = function () {
  var index = this.items.length - 1;
  while (this.parent(index) && this.parent(index) > this.items[index]) {
    this.swap(this.parentIndex(index), index);
    index = this.parentIndex(index);
  }
}

MinHeap.prototype.bubbleDown = function () {
  var index = 0;
  while (this.leftChild(index) &&
      (this.leftChild(index) < this.items[index] ||
      this.rightChild(index) < this.items[index])) {
    var smallerIndex = this.leftChildIndex(index);
    if (this.rightChild(index) && this.rightChild(index) < this.items[smallerIndex]) {
      smallerIndex = this.rightChildIndex(index);
    }
    this.swap(smallerIndex, index);
    index = smallerIndex;
  }
}
```

### DP

```js
/*
  You are climbing a stair case. It takes n steps to reach to the top.
  Each time you can either climb 1 or 2 steps. 
  How many distinct ways can you climb to the top?
*/ 
let climbStairs = function(n) {
  const dp = Array(n+1).fill(0);
  dp[1] = 1;
  dp[2] = 2;
  
  for (let i = 3; i < dp.length; i++) {
    dp[i] = dp[i-1] + dp[i-2];
  }
  
  return dp[n];
};
```

```js
/*
  Given a list of non-negative integers representing the amount of money of each house, and the adjacent houses have security system,
  determine the maximum amount of money you can rob without alerting the police.
*/
let rob = function(nums) {
  const dp = Array(nums.length).fill(0);
  dp[0] = nums[0];
  dp[1] = Math.max(nums[0], nums[1]);

  for (let i = 2; i < nums.length; i++) {
    dp[i] = Math.max(dp[i - 2] + nums[i], dp[i - 1]);
  }

  return dp[nums.length - 1];
};
```

```js
// Compute the fewest number of coins that you need to make up that amount.
let coinChange = function(coins, amount) {
  if (amount === 0) {
    return 0;
  }
  const dp = Array(amount + 1).fill(Number.MAX_VALUE)
  dp[0] = 0;

  for (let i = 1; i < dp.length; i++) {
    for (let j = 0; j < coins.length; j++) {
      if (i - coins[j] >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coins[j]] + 1);
      }
    }
  }

  return dp[dp.length - 1] === Number.MAX_VALUE ? -1 : dp[dp.length - 1];
};
```

### LRU

```js
/* 
  LRU cache is implemented using a doubly linked list and hash table.
  - Map is used to search the node in O(1); 
  - List maintains the order in O(1) with head and tail.
*/

function DLLNode(key, data) {
  this.key = key;
  this.data = data;
  this.next = null;
  this.prev = null;
}

function LRUCache(capacity) {
  this.map = new Map();
  this.capacity = capacity;
  this.head = new DLLNode("", null);
  this.tail = new DLLNode("", null);
  this.head.next = this.tail;
  this.tail.prev = this.head;
}

LRUCache.prototype.addNode = function(node) {
  let realTail = this.tail.prev;
  realTail.next = node;
  this.tail.prev = node;
  node.prev = realTail;
  node.next = this.tail;
}

LRUCache.prototype.removeNode = function(node) {
  let prev = node.prev;
  let next = node.next;
  prev.next = next;
  next.prev = prev;
}

LRUCache.prototype.get = function(key) {
  let node = this.map.get(key);
  if (node === undefined) {
    return -1;
  } else {
    this.removeNode(node);
    this.addNode(node);
    return node.data;
  }
}

LRUCache.prototype.put = function(key, value) {
  var node = this.map.get(key);
  if (node) {
    this.removeNode(node);
  }
  var newNode = new DLLNode(key, value);
  this.addNode(newNode);
  this.map.set(key, newNode);

  if (this.map.size > this.capacity) {
    var realHead = this.head.next;
    this.removeNode(realHead);
    this.map.delete(realHead.key)
  }
}
```
