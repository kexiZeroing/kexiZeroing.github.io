---
layout: "../layouts/BlogPost.astro"
title: "Algorithm Basics"
slug: algorithm-basics
description: ""
added: ""
top: true
order: 4
updatedDate: "Feb 21 2024"
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
- [Undo/Redo stacks](#undoredo-stacks)
- [Shuffle an array](#shuffle-an-array)
- [Traverse Binary Tree](#traverse-binary-tree)
- [Graph DFS](#graph-dfs)
- [Graph BFS](#graph-bfs)
- [Heap](#heap)
- [Backtracking](#backtracking)
- [DP](#dp)
- [LRU](#lru)
- [Bloom Filter](#bloom-filter)
- [Example Problems](#example-problems)

### Binary Search

```js
const binarySearch = (array, target) => {
  let startIndex = 0;
  let endIndex = array.length - 1;

  while(startIndex <= endIndex) {
    // parseInt(i + (j - i) / 2)
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
  
  // If the target is not found,
  // `startIndex` points to the first element that is greater than the target
  // `endIndex` points to the last element that is less than the target
  return -1;
}
```

### Bubble Sort

```js
function bubbleSort(nums) {
  for (let i = nums.length - 1; i > 0; i--) {
    for (let j = 0; j < i; j++) {
      if (nums[j] > nums[j + 1]) {
        let tmp = nums[j];
        nums[j] = nums[j + 1];
        nums[j + 1] = tmp;
      }
    }
  }
}

function bubbleSortWithFlag(nums) {
  for (let i = nums.length - 1; i > 0; i--) {
    let flag = false;
    for (let j = 0; j < i; j++) {
      if (nums[j] > nums[j + 1]) {
        let tmp = nums[j];
        nums[j] = nums[j + 1];
        nums[j + 1] = tmp;
        flag = true;
      }
    }
    if (!flag) break;
  }
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
function partition(nums, left, right) {
  let i = left, j = right;
  while (i < j) {
    while (i < j && nums[j] >= nums[left]) {
      j -= 1;
    }
    while (i < j && nums[i] <= nums[left]) {
      i += 1;
    }

    this.swap(nums, i, j);
  }

  this.swap(nums, i, left);
  return i;
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

### Undo/Redo stacks

```js
class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  doAction(action) {
    // Perform the action
    action();

    // Push the action onto the undo stack
    this.undoStack.push(action);

    // Clear the redo stack
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length > 0) {
      const lastAction = this.undoStack.pop();
      lastAction();

      this.redoStack.push(lastAction);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const lastUndoneAction = this.redoStack.pop();
      lastUndoneAction();

      this.undoStack.push(lastUndoneAction);
    }
  }
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

// backtracking with path
function preOrder(root, path, res) {
  if (root === null) {
    return;
  }
  path.push(root);

  // i.e. to find the node which has value 7
  if (root.val === 7) {
    res.push([...path]);
  }

  preOrder(root.left, path, res);
  preOrder(root.right, path, res);
  path.pop();
}
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

### Backtracking

```js
function permute(nums) {
  let result = []
  backtracking(result, [], nums) 
  return result
}

const backtracking = (result, current, nums) => {
  if (current.length === nums.length) {
    result.push([...current])
  } else {
    for (let i = 0; i < nums.length; i++) {
      if (current.includes(nums[i])) continue
      
      current.push(nums[i])
      backtracking(result, current, nums)
      current.pop()
    }
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

### Bloom Filter
A [bloom filter](https://samwho.dev/bloom-filters/) is a probabilistic data structure that is based on hashing. It is extremely space efficient. When testing if an element is in the bloom filter, false positives are possible. It will either say that an element is definitely not in the set or that it is possible the element is in the set.

```js
class BloomFilter {
  constructor(size) {
    this.size = size;
    this.bitArray = new Array(size).fill(0);
  }

  async add(item) {
    const hashes = await this.getHashes(item);
    hashes.forEach((hash) => {
      this.bitArray[Math.abs(hash) % this.size] = 1;
    });
  }

  async contains(item) {
    const hashes = await this.getHashes(item);
    for (let i = 0; i < hashes.length; i++) {
      if (this.bitArray[Math.abs(hashes[i]) % this.size] === 0) {
        return false; // definitely not in set
      }
    }
    return true; // possibly in set
  }

  async hash(item, algo) {
    // `TextEncoder` takes a string as input, and returns a Uint8Array containing UTF-8 encoded text
    const buffer = new TextEncoder().encode(item);
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // reduce to get a single value
    const hash = hashArray.reduce((a, b) => a + b, 0);
    return hash;
  }

  async getHashes(item) {
    const sha1 = await this.hash(item, "SHA-1");
    const sha256 = await this.hash(item, "SHA-256");
    const sha512 = await this.hash(item, "SHA-512");
    return [sha1, sha256, sha512];
  }
}
```

### Example Problems

Given a non-empty array of integers, return the `k` most frequent elements.

```js
var topKFrequent = function(nums, k) {
  const res = [];
  const map = new Map();
  const bucket = Array(nums.length + 1);
  
  // key is nums[i], value is its count
  for (let n of nums) {
    if (map.has(n)) {
      map.set(n, map.get(n) + 1);
    } else {
      map.set(n, 1);
    }
  }
  
  // the same frequency in the same bucket
  for (let [key, val] of map.entries()) {
    if (!bucket[val]) {
      bucket[val] = [];
    }
    bucket[val].push(key);
  } 
  
  // collect buckets from the end
  for (let pos = bucket.length - 1; pos >= 0 && res.length < k; pos--) {
    if (bucket[pos]) {
      res.push(...bucket[pos]);
    }
  }
  
  return res;
};
```

Find the `kth` largest element in an unsorted array. Note that it is the `kth` largest element in the sorted order, not the `kth` largest distinct element. You may assume `k` is always valid.

```js
var findKthLargest = function(nums, k) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    let pos = partition(nums, left, right);
    // if pos is 3, it is the 4th largest element
    if (pos === k - 1) return nums[pos];
    else if (pos > k - 1) right = pos - 1;
    else left = pos + 1;
  }
  
  // elements before i >= pivot; every elements after i < pivot
  function partition(nums, low, high) {
    let pivot = nums[high];
    let i = low;
    for (let j = low; j < high; j++) {
      if (nums[j] >= pivot) {
        swap(nums, i, j);
        i++;
      }
    }
    swap(nums, i, high);
    return i;
  }

  function swap(nums, i, j) {
    let tmp = nums[i];
    nums[i] = nums[j];
    nums[j] = tmp;
  }
};
```

Given an array of strings, group anagrams together. i.e. Input: `["eat", "tea", "tan", "ate", "nat", "bat"]`, Output: `[ ["ate","eat","tea"], ["nat","tan"], ["bat"] ]`

```js
var groupAnagrams = function(strs) {
  const hashTable = new Map();
  function sort(str) {
    return str.split("").sort().join("");
  }

  for (let i = 0; i < strs.length; i++) {
    const str = strs[i];
    const key = sort(str);
    /**
      * Another way to construct the key: 
      * 
      * const counts = Array(26).fill(0);
      * for (let j = 0; j < str.length; j++) {
      *   counts[str[j].charCodeAt(0) - 'a'.charCodeAt(0)]++;
      * }
      * const key = counts.join("");
    **/
      
    if (!hashTable.has(key)) {
      hashTable.set(key, [str]);
    } else {
      hashTable.get(key).push(str);
    }
  }

  return [...hashTable.values()];
};
```

Write a program to find the sum of contiguous subarray within a one-dimensional array of numbers that has the largest sum. 

```js
var maxSubArraySum = function(nums) {
  let curSum = 0;
  let maxSum = nums[0];

  for (let i = 0; i < nums.length; i++) {
    curSum = (nums[i] > curSum + nums[i]) ? nums[i] : curSum + nums[i];
    if (curSum > maxSum) {
      maxSum = curSum
    }
  }
  return maxSum;
}
```

Given a string, find the length of the longest substring without repeating characters.

```js
// slide window
var lengthOfLongestSubstring = function(s) {
  let max = 0;
  let slideWindow = [];
  
  for (let i = 0; i < s.length; i++) {
    if (slideWindow.includes(s[i])) {
      slideWindow.shift();
      i--;  // need to check this again
    } else {
      slideWindow.push(s[i]);
      max = Math.max(max, slideWindow.length);
    }
  }
  return max;
};
```

Given an array of integers and an integer `k`, you need to find the total number of continuous subarrays whose sum equals to `k`. For example, Input: nums = `[1,1,1]`, k = 2; Output: 2

```js
// the sum of subarray can be get by `sum[0,j] - sum[0,i]`
var subarraySum = function(nums, k) {
  let sum = 0, res = 0;
  let map = new Map();  // key is the sum, value is the # of way to get that sum
  map.set(0, 1);

  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (map.has(sum - k)) {
      res += map.get(sum - k);
    }
    
    if (map.get(sum)) {
      map.set(sum, map.get(sum) + 1);
    } else {
      map.set(sum, 1);
    }
  }
  return res;
};
```

Given an array nums of n integers where n > 1, return an array output such that `output[i]` is equal to the product of all the elements of nums except `nums[i]`. i.e. Input: `[1,2,3,4]`; Output: `[24,12,8,6]`. Note: Please solve it without division and in `O(n)`.

```js
var productExceptSelf = function(nums) {
  let res = [];
  let n = nums.length;
  res[0] = 1;
  
  // loop from the start
  for (let i = 1; i < n; i++) {
    res[i] = res[i - 1] * nums[i - 1];
  }
  
  // another loop from the end
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= right;
    right *= nums[i];
  }
  return res;
};
```

Given an array of integers and an integer `k`, find out whether there are two distinct indices `i` and `j` in the array such that `nums[i] = nums[j]` and the absolute difference between `i` and `j` is at most `k`.

```js
var containsNearbyDuplicate = function(nums, k) {
  const map = new Map();  // key is nums[i], value is its index
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    if (map.has(num) && i - map.get(num) <= k) {
      return true;
    }
    map.set(num, i);
  }
  return false;
};
```

Given a sorted array nums, remove the duplicates in-place such that each element appear only once and return the new length. You must do this by modifying the input array in-place.

```js
var removeDuplicates = function(nums) {
  let p = 0;
  for (let q = 0; q < nums.length; q++) {
    if (nums[q] !== nums[p]) {
      p++;
      nums[p] = nums[q]
    }   
  }
  return p + 1;
};
```

Given an array nums, write a function to move all 0's to the end of it while maintaining the relative order of the non-zero elements. You must do this in-place without making a copy of the array.

```js
var moveZeroes = function(nums) {
  let index = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      nums[index] = nums[i];
      index++;
    }
  }

  for(let i = index; i < nums.length; i++) {
    nums[i] = 0;
  }
};
```

Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand. (i.e., `[0,1,2,4,5,6,7]` might become `[4,5,6,7,0,1,2]`). You are given a target value to search. If found in the array return its index, otherwise return -1. You may assume no duplicate exists in the array.

```js
var search = function(nums, target) {
  let start = 0;
  let end = nums.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    if (nums[mid] === target) return mid;

    // [mid, end] is ascending order
    if (nums[mid] < nums[end]) {
      if (target > nums[mid] && target <= nums[end]) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    // [start, mid] is ascending order
    else {
      if (target >= nums[start] && target < nums[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
  }

  return -1;
};
```

a) Find the integer square root; b) Check if a number is the perfect square number.

```js
function getSquareRoot(num) {
  let i = 0;
  let j = num;
  let ans = -1;

  while (i <= j) {
    let mid = Math.floor((i + j) / 2);
    if (mid * mid <= num) {
      // get a possible answer and continue
      ans = mid;
      i = mid + 1;
    } else {
      j = mid - 1;
    }
  }

  return ans
}

function checkPerfectSquare(num) {
  let i = 0;
  let j = num;

  while (i <= j) {
    let mid = Math.floor((i + j) / 2);
    if (mid * mid === num) {
      return true
    }
    if (mid * mid < num) {
      i = mid + 1 
    } else {
      j = mid - 1
    }
  }

  return false
}
```

Given a collection of intervals, merge all overlapping intervals. i.e. Input: `[[1,3],[2,6],[8,10],[15,18]]`; Output: `[[1,6],[8,10],[15,18]]`.

```js
var merge = function(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < intervals.length - 1; i++) {
    const cur = intervals[i];
    const next = intervals[i + 1];

    if (cur[1] >= next[0]) {
      intervals[i] = undefined;
      intervals[i + 1] = [Math.min(cur[0], next[0]), Math.max(cur[1], next[1])];
    }
  }
  return intervals.filter(q => q); // fiter to pass undefined value
};
```

You are given an integer array `height` of length n. There are n vertical lines. Find two lines that together with the x-axis form a container, such that the container contains the most water.

```js
var maxArea = function(height) {
  let i = 0, j = height.length - 1;
  let res = 0;

  while (i < j) {
    const cap = Math.min(height[i], height[j]) * (j - i);
    res = Math.max(res, cap);

    if (height[i] < height[j]) {
      i += 1;
    } else {
      j -= 1;
    }
  }
  return res;  
};
```

Given a binary tree, find its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

```js
var maxDepth = function(root) {
  if (!root) return 0;
  if (!root.left && !root.right) return 1;

  let cur = root;
  let queue = [root, null];
  let depth = 1;
	
  while (queue) {
    const cur = queue.shift();

    if (cur === null) {
      if (queue.length === 0) return depth;
      depth++;
      queue.push(null);
    } else {
      if (cur.left) queue.push(cur.left);
      if (cur.right) queue.push(cur.right);	
    }
  }
};
```

Given a 2d grid map of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges are all surrounded by water.

```js
function dfs(grid, i, j, rows, cols) {
  if (i < 0 || j < 0 || i > rows - 1 || j > cols - 1 || grid[i][j] === '0')
    return;

  grid[i][j] = '0';

  dfs(grid, i + 1, j, rows, cols);
  dfs(grid, i, j + 1, rows, cols);
  dfs(grid, i - 1, j, rows, cols);
  dfs(grid, i, j - 1, rows, cols);
}

var numIslands = function(grid) {
  let count = 0;
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === '1') {
        // call one dfs to find all the connected area `grid[i][j]` can reach
        dfs(grid, i, j, rows, cols);  
        count++;
      }
    }
  }
  return count;
};
```
