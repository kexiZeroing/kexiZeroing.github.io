---
layout: "../layouts/BlogPost.astro"
title: "Implement a Trie"
slug: implement-a-trie
description: ""
added: "Sep 19 2024"
tags: [code]
---

Trie is a tree-like data structure that stores a dynamic set of strings, typically used to facilitate operations like searching, insertion, and deletion. Tries are particularly useful for tasks that require quick lookups of strings with a common prefix, such as in text autocomplete or in a Router implementation to find the matching paths.

The complexity of creating a trie is O(W*L), where W is the number of words, and L is an average length of the word. Same goes for looking up words later: you perform L steps for each of the W words.

```js
class TrieNode {
  isEndOfWord = false;
  children = new Map();
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, node = this.root) {
    const wordLength = word.length;
    if (wordLength === 0) return;

    for (let idx = 0; idx < wordLength; idx++) {
      let char = word[idx];

      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }

      node = node.children.get(char);
    }

    node.isEndOfWord = true;
  }

  search(word) {
    let currentNode = this.root;

    for (let idx = 0; idx < word.length; idx++) {
      let char = word[idx];
      if (currentNode.children.has(char)) {
        currentNode = currentNode.children.get(char);
      } else {
        return false;
      }
    }

    return currentNode.isEndOfWord;
  }
}
```