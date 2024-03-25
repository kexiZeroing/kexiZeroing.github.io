---
layout: "../layouts/BlogPost.astro"
title: "String Matching – What’s behind Ctrl+F"
slug: string-matching-whats-behind-ctrl-f
description: ""
added: "Mar 24 2024"
tags: [other]
---

When we do search for a string in a notepad file, browser, or database, pattern searching algorithms are used to show the search results. Boyer-Moore String Search is one such pattern searching algorithm, meaning it has large area of practical use.

String matching - Search for a string (pattern) in a large body of text  
Input:
- T: The text being searched within, length is n
- P: The pattern being searched for, length is m, typically n >> m

Output: 
- The first occurrence (match) of P in T
- or NO_MATCH if P does not occur in T

### Brute Force
```
procedure bruteForceSM(T, P)
  for i = 0...n-m-1 do
    for j = 0...m-1 do
      if (T[i+j] != P[j]) then break inner loop
    if j == m then return i
  
  return NO_MATCH
```

Cost measure: #character comparisons
- number of possible checks ≤ n * m

Worst possible input:
- P = aaab, T = aaaaaaaa
- Worst-case performance: (n - m + 1) * m

### Boyer-Moore Algorithm
Let’s check from right to left (starting with the last character in the pattern). If we are lucky, we can eliminate several shifts in one shot.

New rules  
- Bad character jumps: Upon mismatch at T[i] = c, if P does not contain c, shift P entirely past i. Otherwise, shift P to align the last occurrence of c in P with T[i].
- Good suffix jumps: Upon a mismatch, shift so that the already matched suffix of P aligns with a previous occurrence of that suffix (or part of it) in P.
- Shift forward is larger of two heuristics, and it is always positive.

<img alt="Bad character" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/bad-character.png" width="600">

<br>
<img alt="Good suffix" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/good-suffix.png" width="600">

> The preprocessing for the good suffix heuristics is rather difficult to understand and to implement. Therefore, sometimes versions of the Boyer-Moore algorithm are found in which the good suffix heuristics is left away.
