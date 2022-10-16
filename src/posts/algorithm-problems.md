---
layout: "../layouts/BlogPost.astro"
title: "Algorithm Problems"
slug: algorithm-problems
description: ""
added: ""
top: true
order: 5
---

> Find more algorithm interview questions: 
> - https://febook.hzfe.org/awesome-interview
> - https://github.com/course-dasheng/fe-algorithm

Given a string `s`, find the longest palindromic substring in `s`.

```js
var longestPalindrome = function(s) {
  let max = '';
  for (let i = 0; i < s.length; i++) {
    // different palindromes like 'aba' and 'abba'
    for (const j of [0, 1]) {
      let left = i;
      let right = i + j;
      while (left >= 0 && right < s.length && s[left] === s[right]) {
        left--;
        right++;
      }

      if ((right - left - 1) > max.length) {
        max = s.substring(left + 1, right);
      }   
    }
  }
  return max;
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
  // another way to construct the key
  let counts = Array(26).fill(0);
  for (let j = 0; j < str.length; j++) {
    counts[str[j].charCodeAt(0) - 'a'.charCodeAt(0)]++;
  }
  const key = counts.join("");
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

Write a program to find the sum of contiguous subarray within a one-dimensional array of numbers that has the largest sum. 

```js
var maxSubArraySum = function(nums) {
  let curSum = 0;
  let maxSum = nums[0];

  for (let i = 0; i < nums.length; i++) {
    curSum = (a[i] > curSum + a[i]) ? a[i] : curSum + a[i];
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

Given a non-empty array of integers, every element appears twice except for one. Find that single one. Your algorithm should have a linear runtime complexity and without using extra memory.

```js
// a xor a === 0; a xor 0 === a
var singleNumber = function(nums) {
  let ret = 0;
  for (let i = 0; i < nums.length; i++) {
    ret = ret ^ nums[i];
  }
  return ret;
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

Given an array with n objects colored red, white or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white and blue. Here, we will use the integers 0, 1, and 2 to represent the color red, white, and blue respectively. Could you come up with a one-pass algorithm using only constant space?

```js
var sortColors = function(nums) {
  let red = 0, blue = nums.length - 1;
  for (let i = 0; i <= blue; i++) {
    if (nums[i] === 0) {
      [nums[i], nums[red]] = [nums[red], nums[i]]
      red++;
    } else if (nums[i] === 2) {
      [nums[i], nums[blue]] = [nums[blue], nums[i]]
      blue--;
      i--;   // need to check the element after swap
    } 
  }
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

Given an array nums containing n + 1 integers where each integer is between 1 and n (inclusive). Assume that there is only one duplicate number, find the duplicate one. You must not modify the array and only have `O(1)` extra space.

```js
// [1,3,4,2,2] has the value 1，2，3，4, we do the binary search for [1,2,3,4]
var findDuplicate = function(nums) {
  let start = 1;
  let end = nums.length - 1;
  
  while (start < end) {
    let mid = (start + end) >> 1;
    let cnt = 0;

    // if there is no repeat, the # of value that smaller or equal to m should be m
    for (let n of nums) {
      if (n <= mid) cnt++;
    }
    if (cnt > mid) {
      end = mid;
    } else {
      start = mid + 1;
    }
  }
  return start;
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

    // [start, mid] is ascending order
    if (nums[mid] > nums[start]) {
      // target in [start, mid]
      if (target >= nums[start] && target < nums[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    } else {
      // [mid, end] is ascending order
      if (target > nums[mid] && target <= nums[end]) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
  }

  return -1;
};
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

Median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value. So the median is the mean of the two middle value. Design a data structure that supports the following two operations:
- `void addNum(int num)` - Add a integer number from the data stream to the data structure.
- `double findMedian()` - Return the median of all elements so far.

```js
// priority queue (implemented in heap, stored in a complete binary tree)
var MedianFinder = function() {
    // construct a maxHeap and a minHeap
    // 1. numbers from maxHeap is smaller than minHeap.
    // 2. the size of maxHeap is not smaller than minHeap, but only greater than one at most.
  this.maxHeap = new PriorityQueue((a, b) => b - a);
  this.minHeap = new PriorityQueue((a, b) => a - b);
};

MedianFinder.prototype.addNum = function(num) {
  this.maxHeap.enq(num);
  this.minHeap.enq(this.maxHeap.deq());  // ensure #1
  if (this.maxHeap.size() < this.minHeap.size()){  // ensure #2
    this.maxHeap.enq(this.minHeap.deq());
  }
};

MedianFinder.prototype.findMedian = function() {
  if (this.maxHeap.size() == this.minHeap.size()) {
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
  } else {
    return this.maxHeap.peek();
  }
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
