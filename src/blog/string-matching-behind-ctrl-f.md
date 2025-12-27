---
title: "String Matching – What’s behind Ctrl+F"
description: ""
added: "Mar 24 2024"
tags: [other]
updatedDate: "Mar 30 2024"
---

When we do search for a string in a notepad file, browser, or database, pattern searching algorithms are used to show the search results. Boyer-Moore String Search is one such pattern searching algorithm, meaning it has large area of practical use.

> Btw, BM25, or Best Match 25, is a widely used algorithm for full text search. It is the default in Elasticsearch and SQLite.

String matching - Search for a string (pattern) in a large body of text\
Input:

- T: The text being searched within, length is n
- P: The pattern being searched for, length is m, typically n >> m

Output:

- The first occurrence (match) of P in T
- or NO_MATCH if P does not occur in T

> The string-searching problem is to find all occurrences of pattern(s) in a text string. The Aho-Corasick string searching algorithm simultaneously finds all occurrences of multiple patterns in one pass through the text. On the other hand, the Boyer-Moore algorithm is understood to be the fastest algorithm for a single pattern.

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

<img alt="Bad character" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/bad-character.png" width="600">

<br>
<img alt="Good suffix" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/good-suffix.png" width="600">

The preprocessing for the good suffix heuristics is rather difficult to understand and to implement. Therefore, sometimes versions of the Boyer-Moore algorithm are found in which the good suffix heuristics is left away.

```js
// A simplified Boyer Moore implementation, using only the bad-character heuristic.
const ALPHABET_LEN = 256;
function ord(c) {
  return c.charCodeAt(0);
}
// Bad character table: shift[c] contains the distance from the end of the
// pattern of the last occurrence of c for each character in the alphabet.
// If c does not occur in pat, shift[c] = pat.length
function bad_character_table(pat) {
  let m = pat.length;
  let shift = new Array(ALPHABET_LEN).fill(m);
  for (let i = 0; i < m; i++) {
    shift[ord(pat[i])] = m - i - 1;
  }
  return shift;
}

function simpleBoyerMoore(pattern, text) {
  let i,
    j,
    matches = [],
    m = pattern.length,
    shift = bad_character_table(pattern);

  i = m - 1;
  while (i < text.length) {
    j = m - 1;
    while (j >= 0 && text[i] === pattern[j]) {
      i -= 1;
      j -= 1;
    }
    if (j < 0) {
      matches.push(i + 1);
      i += m + 1;
    } else {
      i += Math.max(m - j, shift[ord(text[i])]);
    }
  }

  return matches;
}
```
