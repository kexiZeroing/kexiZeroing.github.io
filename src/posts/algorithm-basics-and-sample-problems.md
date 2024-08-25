---
layout: "../layouts/BlogPost.astro"
title: "Algorithm basics and sample problems"
slug: algorithm-basics-and-sample-problems
description: ""
added: ""
top: true
order: 4
updatedDate: "Aug 16 2024"
---

### TOC
- [TOC](#toc)
- [Binary Search](#binary-search)
- [Bubble Sort](#bubble-sort)
- [Selection Sort](#selection-sort)
- [Insertion Sort](#insertion-sort)
- [Quick Sort](#quick-sort)
- [Merge Sort](#merge-sort)
- [Linked List](#linked-list)
- [Undo/Redo stacks](#undoredo-stacks)
- [Shuffle an array](#shuffle-an-array)
- [Traverse Binary Tree](#traverse-binary-tree)
- [Graph DFS](#graph-dfs)
- [Graph BFS](#graph-bfs)
- [Union Find](#union-find)
- [Heap](#heap)
- [DP](#dp)
- [LRU](#lru)
- [Sample Problems](#sample-problems)

### Binary Search

```js
const binarySearch = (nums, target) => {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    // parseInt(i + (j - i) / 2)
    let mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] > target) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // If the target is not found,
  // return the index where it would be if it were inserted in order.
  return left;
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
function quickSort(arr, lo, hi) {
  if (lo >= hi) {
    return;
  }
  const pivot = partition(arr, lo, hi);
  quickSort(arr, lo, pivot - 1);
  quickSort(arr, pivot + 1, hi);
}

function partition(nums, left, right) {
  let pivot = nums[left]
  
  while (left < right) {
    while (left < right && nums[right] >= pivot) {
      right--;
    }
    nums[left] = nums[right];

    while (left < right && nums[left] <= pivot) {
      left++;
    }
    nums[right] = nums[left];
  }

  nums[left] = pivot;
  return left;
}
```

> 1. Quick sort is an in-place algorithm, but the stack due to recursive calls adds additional storage space proportional to the recursive depth.
> 
> 2. It's not recommended to choose the first or last element to be the pivot, your pivot value is always the largest value on already sorted or nearly sorted arrays. So rather than splitting the array into two roughly equal subarrays, you split it into a single sub array that has only one fewer element than you started with. One way to choose the pivot to avoid this is to pick the pivot randomly. This makes it unlikely to hit the worst case, and so on average will work well.

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

### Linked List

```js
class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

// Basic operations for a linked list:
// 1. Find the middle node of a linked list
// 2. Check if a linked list has a cycle
// 3. Reverse a linked list

function getMiddleNode(head) {
  if (head === null) {
    return null;
  }

  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}

function hasCycle(head) {
  if (head === null || head.next === null) {
    return false;
  }

  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}

function reverseList(head) {
  if (head === null || head.next === null) {
    return head;
  }

  let current = head;
  let prev = null;

  while (current !== null) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  return prev;
}

// fast pointer moves forward `n` steps first,
// then fast and slow pointers move forward together
// until the fast pointer reaches the end of the linked list.
function removeNthFromEnd(head, n) {
  let dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  while (n--) {
    fast = fast.next;
  }
  while (fast.next) {
    slow = slow.next;
    fast = fast.next;
  }
  
  slow.next = slow.next.next;
  return dummy.next;
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
    action();

    this.undoStack.push(action);
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

// Oops.js: Add powerful undo/redo capabilities to your app
// https://github.com/HeyPuter/Oops.js
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

// Note that sorting is an `O(N log N)` operation where the Fisher-Yates algorithm is `O(N)`.
```

### Traverse Binary Tree

```js
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
  let current = root;

  while (stack.length > 0 || current !== null) {
    if (current !== null) {
      stack.push(current);
      current = current.left;
    } else {
      current = stack.pop();
      result.push(current.val);
      current = current.right;
    }
  }
  return result;
};

var postorderTraversal = function (root) {
  if (root == null) return [];
  
  let result = [];
  let stack = [root];
  let cur = null;

  while (stack.length) {
    cur = stack.pop();
    result.push(cur.val);
    cur.left && stack.push(cur.left);
    cur.right && stack.push(cur.right);
  }
  return result.reverse();
};

var levelOrderTraversal = function(root) {  
  if (!root) return [];

  const nodeQueue = [root];
  let result = [];

  while (nodeQueue.length) {
    const size = nodeQueue.length;
    const level = [];

    for (let i = 0; i < size; i++) {
      const curNode = nodeQueue.shift();
      level.push(curNode.val);

      if (curNode.left) {
        nodeQueue.push(curNode.left);
      }
      if (curNode.right) {
        nodeQueue.push(curNode.right);
      }
    }
    result.push(level);
  }

  return result;
};
```

```js
// Max and Min depth of Binary Tree
var maxDepth = function(root) {
  if (!root) return 0;

  const left = maxDepth(root.left);
  const right = maxDepth(root.right);

  return Math.max(left, right) + 1;
}

var minDepth = function(root) {
  if (!root) return 0;
  
  const nodeQueue = [root];
  let depth = 0;

  while (nodeQueue.length) {
    const size = nodeQueue.length;
    depth++;

    for (let i = 0; i < size; i++) {
      const curNode = nodeQueue.shift();
      // If it's a leaf node, return the depth
      if (!curNode.left && !curNode.right) {
        return depth;
      }
      if (curNode.left) {
        nodeQueue.push(curNode.left);
      }
      if (curNode.right) {
        nodeQueue.push(curNode.right);
      }
    }
  }
  return depth;
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

### Union Find

```js
class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array(size).fill(1);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX !== rootY) {
      if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX] += 1;
      }
    }
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
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

// All houses at this place are arranged in a circle.
let rob2 = function(nums) {
  const len = nums.length;
  if (len === 1) return nums[0];
  
  // the first house and the last house cannot be robbed together
  return Math.max(robRange(nums.slice(0, -1)), robRange(nums.slice(1)));

  function robRange(range) {
    const n = range.length;
    const dp = Array(n).fill(0);
    dp[0] = range[0];
    dp[1] = Math.max(range[0], range[1]);
    
    for (let i = 2; i < n; i++) {
      dp[i] = Math.max(dp[i - 2] + range[i], dp[i - 1]);
    }
    
    return dp[n - 1];
  };
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

```js
// Given two strings text1 and text2, return the length of their longest common subsequence.
// Input: text1 = "abcde", text2 = "ace" 
// Output: 3. The longest common subsequence is "ace" and its length is 3.
let longestCommonSubsequence = function(text1, text2) {
  let m = text1.length;
  let n = text2.length;
  // dp[i][j] means the LCS of first i characters in text1 and first j characters in text2
  // 1. X[m-1] == Y[n-1] -> LCS(Xm-1，Yn-1)
  // 2. X[m-1] != Y[n-1] -> max(LCS(Xm-1, Yn), LCS(Xm, Yn-1))
  let dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }  
    }
  }

  return dp[m][n];
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
  let node = this.map.get(key);
  if (node) {
    this.removeNode(node);
  }
  let newNode = new DLLNode(key, value);
  this.addNode(newNode);
  this.map.set(key, newNode);

  if (this.map.size > this.capacity) {
    var realHead = this.head.next;
    this.removeNode(realHead);
    this.map.delete(realHead.key)
  }
}
```

### Sample Problems

Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`. Notice that the solution set must not contain duplicate triplets.

```js
var threeSum = function(nums) {
  let res = [];
  nums.sort((a, b) => a - b);
  
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] === nums[i-1]) {
      continue;
    }
        
    let j = i + 1;
    let k = nums.length - 1;

    while (j < k) {
      let total = nums[i] + nums[j] + nums[k];

      if (total === 0) {
        res.push([nums[i], nums[j], nums[k]]);
        // remove the duplicate result
        while (nums[j] === nums[j+1] && j < k) {
          j++;
        }
        while (nums[k] === nums[k-1] && j < k) {
          k--;
        }
        j++;
        k--;
      } else if (total > 0) {
        k--;
      } else {
        j++;
      }
    }
  }

  return res;
};
```

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

Given two strings `ransomNote` and `magazine`, return true if `ransomNote` can be constructed by using the letters from `magazine` and false otherwise.

```js
var canConstruct = function(ransomNote, magazine) {
  let cnt = Array(26).fill(0);
  for (let c of magazine) {
    cnt[c.charCodeAt(0) - 'a'.charCodeAt(0)]++;
  }

  for (let c of ransomNote) {
    cnt[c.charCodeAt(0) - 'a'.charCodeAt(0)]--;

    if (cnt[c.charCodeAt(0) - 'a'.charCodeAt(0)] < 0) {
      return false;
    }
  }
  return true;
};
```

Given a string, find the length of the longest substring without repeating characters.

```js
// slide window
var lengthOfLongestSubstring = function(s) {
  let max = 0;
  let windowSet = new Set();
  
  let i = 0;
  for (let j = 0; j < s.length; j++) {
    while (windowSet.has(s[j])) {
      windowSet.delete(s[i]);
      i++;
    }

    windowSet.add(s[j]);
    max = Math.max(max, j - i + 1);
  }
  return max;
};
```

Given an array of positive integers nums and a positive integer target, return the minimal length of a subarray whose sum is greater than or equal to target.

```js
var minSubArrayLen = function(target, nums) {
  let minLength = Infinity;
  let sum = 0;
  let left = 0;

  for (let right = 0; right < nums.length; right++) {    
    sum += nums[right];

    while (sum >= target) {
      minLength = Math.min(minLength, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return minLength === Infinity ? 0 : minLength;
};
```

Find All Anagrams in a String. Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`. For example, Input: s = "cbaebabacd", p = "abc"; Output: [0,6].

```js
var findAnagrams = function(s, p) {
  let res = [];
  let dict = Array(26).fill(0);

  for (let i = 0; i < p.length; i++) {
    dict[p.charCodeAt(i) - 'a'.charCodeAt(0)]++;
  }

  let windowSet = Array(26).fill(0);
  let i = 0;
  for (let j = 0; j < s.length; j++) {
    windowSet[s.charCodeAt(j) - 'a'.charCodeAt(0)]++;
    if (isSame(windowSet, dict)) {
      res.push(i);
    }

    if (j >= p.length - 1) {
      windowSet[s.charCodeAt(i) - 'a'.charCodeAt(0)]--;
      i++;
    }
  }

  return res;
}

function isSame(dict1, dict2) {
  for (let i = 0; i < 26; i++) {
    if (dict1[i] !== dict2[i]) {
      return false;
    }
  }
  return true;
}
```

Given a string s, return the longest palindromic substring in s.

```js
var longestPalindrome = function(s) {
  let left = 0, right = 0, maxLength = 0;

  const extend = (s, i, j, n) => {
    while (i >= 0 && j < n && s[i] === s[j]) {
      if (j - i + 1 > maxLength) {
        left = i;
        right = j;
        maxLength = j - i + 1;
      }

      i--;
      j++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    extend(s, i, i, s.length);     // i is the center
    extend(s, i, i + 1, s.length); // i and i + 1 are the center
  }

  return s.slice(left, right + 1);
};
```

Given an array nums of size n, return the majority element. The majority element is the element that appears more than `⌊n / 2⌋` times. (assume it always exists)

```js
var majorityElement = function(nums) {
  let count = 0;
  let candidate = 0;

  for (let num of nums) {
    if (count === 0) {
      candidate = num;
    }
    if (num === candidate) {
      count += 1;
    } else {
      count -= 1;
    }
  }
  return candidate;
};
```

Given a string containing just the characters '(' and ')', return the length of the longest valid parentheses substring.

```js
var longestValidParentheses = function(s) {
  let stack = [];
  let maxLength = 0;
  let start = 0;

  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      if (stack.length === 0) {
        start = i + 1;
      } else {
        stack.pop();
        if (stack.length === 0) {
          maxLength = Math.max(maxLength, i - start + 1);
        } else {
          maxLength = Math.max(maxLength, i - stack[stack.length - 1]);
        }
      }
    }
  }
};
```

Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string "".

```js
var longestCommonPrefix = function(strs) {
  strs.sort();

  for (let i = 0; i < strs[0].length; i++) {
    if (strs[0][i] !== strs[strs.length - 1][i]){
      return strs[0].slice(0, i);
    } 
  }

  return strs[0];
};
```

Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. Take `[10, 4, 20, 1, 3, 2]` as an example, the longest consecutive elements sequence is `[1, 2, 3, 4]`.

```js
var longestConsecutive = function(nums) {
  let numSet = new Set(nums);
  let longest = 0;

  for (let n of nums) {
    // check if n starts a new sequence
    if (!numSet.has(n - 1)) {
      let length = 1;

      while (numSet.has(n + length)) {
        length++;
      }
      longest = Math.max(longest, length);
    }
  }
  return longest;
};
```

Given an integer array nums, return an array answer such that `answer[i]` is equal to the product of all the elements of nums except `nums[i]`.

```js
var productExceptSelf = function(nums) {
  let n = nums.length;
  let output = [];

  let leftProducts = [];
  let rightProducts = [];
  leftProducts[0] = 1;
  rightProducts[n - 1] = 1;

  for (let i = 1; i < n; i++) {
    leftProducts[i] = leftProducts[i - 1] * nums[i - 1];
  }

  for (let i = n - 2; i >= 0; i--) {
    rightProducts[i] = rightProducts[i + 1] * nums[i + 1];
  }

  for (let i = 0; i < n; i++) {
    output[i] = leftProducts[i] * rightProducts[i];
  }
  return output;
};
```

Given an array of integers temperatures represents the daily temperatures, return an array answer such that `answer[i]` is the number of days you have to wait after the `ith` day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

```js
var dailyTemperatures = function(temperatures) {
  let stack = [];
  let res = new Array(temperatures.length).fill(0);

  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      let preIndex = stack.pop();
      res[preIndex] = i - preIndex;
    }
    // push the index, not the value
    stack.push(i);
  }

  return res;  
};
```

The next greater element of x in an array is the first greater element that is to the right of x in the same array. You are given two distinct arrays, where nums1 is a subset of nums2. For each `0 <= i < nums1.length`, find the index j such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in nums2. If there is no next greater element, then the answer for this query is -1.

```js
var nextGreaterElement = function(nums1, nums2) {
  // key is a number from nums2
  // value is its next greater number
  let map = new Map();
  let stack = [];

  for (let num of nums2) {
    while (stack.length && num > stack[stack.length - 1]) {
      map.set(stack.pop(), num);
    }
    stack.push(num);
  }

  for (let i = 0; i < nums1.length; i++) {
    nums1[i] = map.has(nums1[i]) ? map.get(nums1[i]) : -1;
  }

  return nums1;
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

Given an array of integers nums and an integer k. A continuous subarray is called nice if there are k odd numbers on it. Return the number of nice sub-arrays.

```js
var numberOfSubarrays = function(nums, k) {
  let oddCount = 0;
  let result = 0;
  let count = new Map();
  // key is the count of odd numbers encountered so far 
  // value is the # of times we've encountered that particular count of odd numbers.
  count.set(0, 1);

  for (const num of nums) {
    if (num % 2 === 1) {
      oddCount += 1;
    }
    if (oddCount >= k && count.has(oddCount - k)) {
      result += count.get(oddCount - k);
    }

    count.set(oddCount, (count.get(oddCount) || 0) + 1);
  }
  return result;
};
```

Given an array of positive integers arr, return the sum of all possible odd-length subarrays of arr.

```js
var sumOddLengthSubarrays = function(arr) {
  let ans = 0;
  // preSum[i] stores the sum of elements from index 0 to i-1.
  // if arr = [1, 2, 3], then preSum will be [0, 1, 3, 6].
  let preSum = Array(arr.length + 1).fill(0);

  for (let i = 0; i < arr.length; i++) {
    preSum[i + 1] = preSum[i] + arr[i];
  }

  for (let i = 0; i < arr.length; i++) {
    for (let j = 1; i + j <= arr.length; j += 2) {
      ans += preSum[i + j] - preSum[i];
    }
  }

  return ans;
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

Given an integer array nums, find the subarray with the largest sum, and return its sum.

```js
var maxSubArray = function(nums) {
  let sum = 0;
  let max = -Infinity;

  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    max = Math.max(max, sum);

    // It's better to start a fresh subarray from the next element
    // rather than carrying forward a negative sum.
    if (sum < 0) {
      sum = 0;
    }
  }
  return max;
};
```

Given a non-empty array of integers nums, the degree of this array is defined as the maximum frequency of any one of its elements. Your task is to find the smallest possible length of a subarray of nums, that has the same degree as nums.

```js
var findShortestSubArray = function(nums) {
  let firstOccurrence = new Map();
  let lastOccurrence = new Map();
  let frequencyMap = new Map();

  nums.forEach((num, index) => {
    if (firstOccurrence.get(num) === undefined) {
      firstOccurrence.set(num, index);
    }
    lastOccurrence.set(num, index);
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  });

  let ans = nums.length;
  let degree = Math.max(...frequencyMap.values());

  for (let [num, frequency] of frequencyMap) {
    if (frequency === degree) {
      ans = Math.min(ans, lastOccurrence.get(num) - firstOccurrence.get(num) + 1);
    }
  }
  return ans;
};
```

Given an integer array containing 0's and 1's, where 0 means empty and 1 means not empty, and an integer n, return true if n new flowers can be planted in the flowerbed. Flowers cannot be planted in adjacent plots.

```js
var canPlaceFlowers = function(flowerbed, n) {
  for (let i = 0; i < flowerbed.length && n > 0;) {
    if (flowerbed[i] === 1) {
      i += 2;
    }
    // current position is empty
    else if (i === flowerbed.length - 1 || flowerbed[i + 1] === 0) {
      n--;
      i += 2;
    }
    // current position is empty but the next position has a flower
    else {
      i += 3;
    }
  }

  return n <= 0;
};
```

You are given an integer array nums. Each element in the array represents your maximum jump length at that position. Return true if you can reach the last index, or false otherwise.

```js
var canJump = function(nums) {
  // Greedy algorithm
  let reachable = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (i > reachable) {
      return false;
    }
    if (i + nums[i] > reachable) {
      reachable = i + nums[i];
    }
  }

  return true;
};
```

There are n gas stations along a circular route. Your car costs `cost[i]` of gas to travel from the ith station to its next station. You begin the journey with an empty tank at one of the gas stations. Return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1.

```js
var canCompleteCircuit = function(gas, cost) {
  // gas:  [1, 2, 3, 4, 5]
  // cost: [3, 4, 5, 1, 2]
  // First, can we know if a solution exists?
  // If `sum of gas - sum of cost < 0`, there is no way to complete a round trip.

  let totalTank = 0;
  let currentTank = 0;
  let start = 0;

  for (let i = 0; i < gas.length; i++) {
    const netCost = gas[i] - cost[i];
    totalTank += netCost;
    currentTank += netCost;

    if (currentTank < 0) {
      start = i + 1;
      currentTank = 0;
    }
  }
  return totalTank < 0 ? -1 : start;

  // The key insight here is that if you can't reach a station j from station i, 
  // you also can't reach it from any station between i and j.
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

You are given an m x n integer matrix. Each row is sorted in non-decreasing order. The first integer of each row is greater than the last integer of the previous row. Given an integer target, return true if target is in matrix or false otherwise.

```js
var searchMatrix = function(matrix, target) {
  let left = 0; 
  let right = matrix.length - 1;
  let mid;

  while (left <= right) {
    mid = Math.floor((left + right ) / 2);
    if (target >= matrix[mid][0] && target <= matrix[mid][matrix[mid].length - 1]) {
      break;
    }
    if (target > matrix[mid][0]) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return binarySearch(matrix[mid], target);
};
```

a) Find the integer square root; b) Check if a number is the perfect square number.

```js
function getSquareRoot(num) {
  let i = 0;
  let j = num;

  while (i <= j) {
    let mid = Math.floor((i + j) / 2);
    if (mid * mid === num) {
      return mid;
    } else if (mid * mid < num) {
      i = mid + 1;
    } else {
      j = mid - 1;
    }
  }

  return -1;
}

function checkPerfectSquare(num) {
  let i = 0;
  let j = num;

  while (i <= j) {
    let mid = Math.floor((i + j) / 2);
    if (mid * mid === num) {
      return true;
    }
    if (mid * mid < num) {
      i = mid + 1;
    } else {
      j = mid - 1;
    }
  }

  return false;
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

Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

```js
var trap = function(height) {
  const stack = [];
  let res = 0;

  for (let i = 0; i < height.length; i++) {
    const curH = height[i];
    while (stack.length && curH > height[stack[stack.length - 1]]) {
      const preIndex = stack.pop();

      if (stack.length) {
        // i -> right boundary
        // stack[stack.length - 1] -> left boundary
        const heightVal = Math.min(height[stack[stack.length - 1]], curH) - height[preIndex];
        const length = i - stack[stack.length - 1] - 1;
        res += heightVal * length;
      }
    }
    stack.push(i);
  }

  return res;
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

Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.

```js
var permute = function(nums) {
  const result = [];
    
  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      const num = nums[i];
      if (path.includes(num)) continue;
      path.push(num);
      backtrack(path);  // console.log(`backtrack(${path});`)
      path.pop();
    }
  }
    
  backtrack([]);
  return result;
};

// Time complexity: O(n!)
// Space complexity: O(n)
```

Given an integer array nums of unique elements, return all possible subsets.

```js
var subsets = function(nums) {
  const result = [];
  const subset = [];
  
  function backtrack(start) {
    result.push([...subset]);
    
    for (let i = start; i < nums.length; i++) {
      subset.push(nums[i]);
      backtrack(i + 1);
      subset.pop();
    }
  }
  
  backtrack(0);
  return result;
};
```

Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of s. Input: `s = "aab"`. Output: `[["a","a","b"],["aa","b"]]`

```js
var partition = function(s) {
  const res = [];
  const part = [];

  function backtrack(i) {
    if (i === s.length) {
      res.push([...part]);
      return;
    }

    for (let j = i; j < s.length; j++) {
      // print i, j, part here: 
      // 0 0 []
      // 1 1 ['a']
      // 2 2 ['a', 'a']
      // 1 2 ['a']
      // 0 1 []
      // 2 2 ['aa']
      // 0 2 []
      if (isPalindrome(s, i, j)) {
        part.push(s.slice(i, j + 1));
        backtrack(j + 1);
        part.pop();
      }
    }
  }
  backtrack(0);
  return res;
};

function isPalindrome(s, l, r) {
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++;
    r--;
  }
  return true;
}
```

Given a binary search tree (BST), find the lowest common ancestor node of two given nodes in the BST.

```js
var lowestCommonAncestor = function(root, p, q) {
  // If root is the LCA node, p and q should be at different side

  // (root.val - p.val) * (root.val - q.val) > 0, means p, q at same side
  // (root.val - p.val) * (root.val - q.val) < 0, means p, q at different side
  while ((root.val - p.val) * (root.val - q.val) > 0) {
    if (p.val < root.val) {
      root = root.left;
    } else {
      root = root.right;
    }
  }
  
  return root;
};
```

Given the root of a binary tree, invert the tree, and return its root.

```js
var invertTree = function(root) {
  if (root === null) return root;
  
  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  
  return root;
};
```

Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum.

```js
var hasPathSum = function(root, targetSum) {
  if (root === null) {
    return false;
  }
  if (root.val === targetSum && (root.left === null && root.right === null)) {
    return true;
  }
  
  return hasPathSum(root.left, targetSum - root.val) || hasPathSum(root.right, targetSum - root.val);
};
```

Given the root of a binary tree, determine if it is a valid binary search tree.

```js
var isValidBST = function(root) {
  // Check range of each node
  const helper = (root, min, max) => {
    if (root === null) return true;
    
    if (root.val < min || root.val > max) return false;
    
    return helper(root.left, min, root.val) && helper(root.right, root.val, max);
  }

  return helper(root, -Infinity, Infinity);
};
```

Construct binary tree from pre-order and in-order traversal.

```js
var buildTree = function(preorder, inorder) {
  if (preorder.length === 0) {
    return null;
  }

  const root = new TreeNode(preorder[0]);
  const mid = inorder.indexOf(preorder[0]);

  // the # of elements in the left subtree is the same in both traversals
  root.left = buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
  root.right = buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));

  return root;
};
```

Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.

```js
var kthSmallest = function(root, k) {
  // BST -> in-order traversal
  let n = 0;
  let stack = [];
  let current = root;

  while (stack.length > 0 || current) {
    while (current) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();
    n++;
    if (n === k) {
      return current.val;
    }
    current = current.right;
  }
};
```

Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.

```js
var rightSideView = function(root) {
  if (!root) return [];

  let result = [];
  let queue = [root];
  while (queue.length) {
    let levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      let node = queue.shift();

      if (i === levelSize - 1) {
        result.push(node.val);
      }

      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }
  }
  return result;
};
```

Given a 2d grid map of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges are all surrounded by water.

```js
var numIslands = function(grid) {
  let count = 0;
  let rows = grid.length;
  if (rows === 0) return 0;
  let cols = grid[0].length;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === '1') {
        dfs(grid, i, j, rows, cols);  
        count++;
      }
    }
  }
  return count;
};

function dfs(grid, i, j, rows, cols) {
  if (i < 0 || j < 0 || i > rows - 1 || j > cols - 1 || grid[i][j] === '0') {
    return;
  }

  grid[i][j] = '0';

  dfs(grid, i + 1, j, rows, cols);
  dfs(grid, i, j + 1, rows, cols);
  dfs(grid, i - 1, j, rows, cols);
  dfs(grid, i, j - 1, rows, cols);
}
```

You are given an `m x n` binary matrix grid. An island is a group of 1's connected 4-directionally. The area of an island is the number of cells with a value 1. Return the maximum area of an island in grid.

```js
var maxAreaOfIsland = function(grid) {
  let n = grid.length;
  let m = grid[0].length;
  let ans = 0;
  
  function dfs(i, j) {
    if (i < 0 || j < 0 || i > n-1 || j > m-1 || !grid[i][j]) {
      return 0;
    }
    grid[i][j] = 0;
    
    return 1 + dfs(i-1, j) + dfs(i, j-1) + dfs(i+1, j) + dfs(i, j+1);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (grid[i][j]) {
        ans = Math.max(ans, dfs(i, j));
      }
    }
  }
  return ans;
};
```

Given an integer array nums, return the length of the longest strictly increasing subsequence. For example, `[10,9,2,5,3,7,101,18]`'s longest increasing subsequence is `[2,3,7,101]`.

```js
var lengthOfLIS = function(nums) {
  if (nums.length === 0) {
    return 0;
  }
  // dp[i] represents the length of the LIS ending at index i
  let dp = Array(nums.length).fill(1);
  let maxLength = 1;

  for (let i = 1; i < nums.length; i++) {
    // iterate index before i
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLength = Math.max(maxLength, dp[i]);
  }
  return maxLength;
};
```

Best Time to Buy and Sell Stock. You are given an array prices where `prices[i]` is the price of a given stock on the `ith` day.

```js
// only one transaction
var maxProfit = function(prices) {
  let min = prices[0];
  let maxProfit = 0;

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < min) {
      min = prices[i];
    } else if (prices[i] - min > maxProfit) {
      maxProfit = prices[i] - min;
    }
  }
  return maxProfit;
};

// multiple transactions (greedy)
var maxProfit = function(prices) {
  let maxProfit = 0;
    
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      maxProfit += prices[i] - prices[i - 1];
    }
  }
  return maxProfit;
};

// multiple transactions but with transaction fee for each one
var maxProfit = function(prices, fee) {
  // dp[i] represents two states
  // 1. dp[i][0]: max profit on day i if you hold a stock.
  // 2. dp[i][1]: max profit on day i if you do not hold a stock.
  let dp = Array.from(Array(prices.length), () => Array(2).fill(0));
  dp[0][0] = 0 - prices[0];
  dp[0][1] = 0;

  for (let i = 1; i < prices.length; i++) {
    dp[i][0] = Math.max(dp[i - 1][0], dp[i - 1][1] - prices[i]);
    dp[i][1] = Math.max(dp[i - 1][0] + prices[i] - fee, dp[i - 1][1]);
  }

  return dp[prices.length - 1][1];
};

// After you sell your stock, you cannot buy stock on the next day
var maxProfit = function(prices) {
  // dp[i][0]: Holding a stock after day i.
  // dp[i][1]: Not holding a stock after day i without entering a cooldown.
  // dp[i][2]: Just sold a stock on day i.
  // dp[i][3]: In a cooldown after selling stock.
  let dp = Array.from(Array(prices.length), () => Array(4).fill(0));
  dp[0][0] = -prices[0];

  for (let i = 1; i < prices.length; ++i) {
    dp[i][0] = Math.max(dp[i - 1][0], dp[i - 1][1] - prices[i], dp[i - 1][3] - prices[i]);
    dp[i][1] = Math.max(dp[i - 1][1], dp[i - 1][3]);
    dp[i][2] = dp[i - 1][0] + prices[i];
    dp[i][3] = dp[i - 1][2];
  }

  return Math.max(dp[prices.length - 1][1], dp[prices.length - 1][2], dp[prices.length - 1][3]);
};
