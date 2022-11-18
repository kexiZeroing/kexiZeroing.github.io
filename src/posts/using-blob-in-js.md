---
layout: "../layouts/BlogPost.astro"
title: "Using Blob in JavaScript"
slug: using-blob-in-js
description: ""
added: "Nov 18 2022"
tags: [js]
---

Blob means "Binary Large Object" and it’s an opaque representation of a chunk of bytes. Blob can be read as text or binary data, or converted into a ReadableStream so its methods can be used for processing the data. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system.

A Blob has its size and MIME type just like a file has, and it can be created using:
- the `Blob(array, options)` constructor
- another blob, using the `Blob.slice()` instance method

The constructor takes an array of values. Even if you have just one string to put in the blob, you must wrap it in an array. Once you have a Blob object, you can access its size (the length in bytes of the content of the blob) and type.

```js
new Blob(["<h1>This is my blob content</h1>"], { type : "text/plain" });

const obj = { hello: "world" };
const blob = new Blob([JSON.stringify(obj, null, 2)], {
  type: "application/json",
});
```

As we have `file://` URLs, referencing to a real file in a local filesystem. Similarly, we have `blob://` URLs referencing to a blob. `blob://` URLs can be used almost wherever we use regular URLs. The `URL.createObjectURL()` static method creates a string containing a URL representing the object given in the parameter. **The URL lifetime is tied to the document in the window on which it was created.** To release an object URL, call `URL.revokeObjectURL()`.

```js
let blobHtml = new Blob(['<html><head><title>Hello Blob</title></head><body><h1 style="color: red">Hello JavaScript!</h1></body></html>'], { type: 'text/html' });

let link = document.createElement('a');
link.href = URL.createObjectURL(blobHtml);

document.body.appendChild(link);
```

```js
// blob url as the image source
const input = document.querySelector('input[type=file]');

input.addEventListener('change', e => {
  const img = document.createElement('img');
  const imageBlob = URL.createObjectURL(input.files[0]);
  img.src = imageBlob;

  img.onload = function() {
    URL.revokeObjectURL(imageBlob);
  }

  input.parentNode.replaceChild(img, input);
});
```

A TypedArray object describes an array-like view of an underlying binary data buffer, and you use it to read and write the contents of the buffer. When creating an instance of a TypedArray subclass (e.g. Int8Array), an array buffer is created internally in memory or, if an ArrayBuffer object is given as constructor argument, that ArrayBuffer is used instead. 

`TypedArray.prototype.buffer` represents the ArrayBuffer referenced by a TypedArray at construction time. The value is established when the TypedArray is constructed and cannot be changed.

```js
function typedArrayToURL(typedArray, mimeType) {
  return URL.createObjectURL(new Blob([typedArray.buffer], { type: mimeType }));
}
// an array of 8-bit unsigned integers
const bytes = new Uint8Array(26);

for (let i = 0; i < 26; i++) {
  bytes[i] = 65 + i;
}

const url = typedArrayToURL(bytes, "text/plain");

const link = document.createElement("a");
link.href = url;
link.innerText = "Open the array URL";

document.body.appendChild(link);
```
