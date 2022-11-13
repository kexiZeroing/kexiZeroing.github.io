---
layout: "../layouts/BlogPost.astro"
title: "Fetch API and POST requests"
slug: fetch-api-and-post-requests
description: ""
added: "Aug 9 2020"
tags: [js]
---

## Fetch API
Fetch method allows you to make network requests similar to `XMLHttpRequest`. The main difference is that the Fetch API uses `Promise`, which enables a simpler and cleaner API, avoiding callback hell and having to remember the complex API of XHR. 

The `fetch()` method takes one mandatory argument, the path to the resource you want to fetch. It returns a Promise that resolves to the Response to that request even if the server response is an HTTP error status. Once a Response is retrieved, there are a number of methods available to define what the body content is and how it should be handled.

> At the heart of Fetch are the Interface abstractions of HTTP [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response), and [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers), along with a `fetch()` method for initiating asynchronous resource requests.

- The Promise returned from `fetch()` **won’t reject on HTTP error status even if the response is an HTTP 404 or 500**. Instead, it will resolve normally and only reject on network failure or if anything prevented the request from completing. So a `then()` handler must check the `Response.ok` or `Response.status` properties.
- `fetch()` won’t send cookies, unless you set the credentials in init option. To cause browsers to send credentials in a cross-origin call, add `credentials: 'include'`.
- CORS mode is enabled by default in `fetch()`.

### init option
- **method**: e.g., GET, POST. Note that the `Origin` header is not set on Fetch requests with a method of HEAD or GET. (GET is default)
- **headers**: Any headers you want to add to your request, contained within a `Headers` object or an object literal.
- **body**: Any body that you want to add to your request. Note that a request using the GET or HEAD method cannot have a body.
- **mode**: The mode you want to use for the request, e.g., `cors`, `no-cors`, or `same-origin`. (`cors` is default)
- **credentials**: The request credentials you want to use for the request, e.g., `omit`, `same-origin`, or `include`. To automatically send cookies for the current domain, this option must be provided. (`same-origin` is default)

```javascript
async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

postData('https://example.com/answer', { answer: 42 })
  .then(data => {
    console.log(data);
  });
```

```javascript
// Checking if the fetch is successful
fetch('flowers.jpg')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.blob();
  })
  .then(myBlob => {
    myImage.src = URL.createObjectURL(myBlob);
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
```

```javascript
// Uploading a file
const formData = new FormData();
const fileField = document.querySelector('input[type="file"]');

formData.append('username', 'abc123');
formData.append('avatar', fileField.files[0]);

fetch('https://example.com/profile/avatar', {
  method: 'PUT',
  body: formData  // this automatically sets the "Content-Type" header to `multipart/form-data`
})
  .then(response => response.json())
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

```javascript
// URLSearchParams as a fetch body
async function isPositive(value) {
  const response = await fetch(`http://text-processing.com/api/sentiment/`, {
    method: 'POST',
    // this automatically sets the "Content-Type" header to `application/x-www-form-urlencoded`
    body: new URLSearchParams({ text: value }) 
  });
  const json = await response.json();
  return json.label === 'pos';
}
```

### abort api
When the Fetch API was initially introduced, there was no way to set a timeout at all. Browsers have recently added support for the `Abort API` to support timeouts.

```js
const controller = new AbortController();
const signal = controller.signal;

const url = "video.mp4";
const downloadBtn = document.querySelector(".download");
const abortBtn = document.querySelector(".abort");

downloadBtn.addEventListener("click", fetchVideo);

abortBtn.addEventListener("click", () => {
  controller.abort();
});

function fetchVideo() {
  fetch(url, { signal })
    .then((response) => {
      console.log("Download complete", response);
    })
    .catch((err) => {
      console.error(`Download error: ${err.message}`);
    });
}
```

## POST Requests
The HTTP POST method sends data to the server. The type of the body of the request is indicated by the `Content-Type` header.

When using cURL, `-d` means transfer payload, `-H` is the header info included in requests, `GET` is the default one, use `-X` to support other HTTP verbs.

```bash
# application/x-www-form-urlencoded
curl -d "param1=value1&param2=value2" -H "Content-Type: application/x-www-form-urlencoded" -X POST http://localhost:3000/data
# in nodeJs, `req.body` is a string, and use `&` to split the string to get parameters 

# application/json
curl -d '{"key1":"value1", "key2":"value2"}' -H "Content-Type: application/json" -X POST http://localhost:3000/data
# in nodeJs, use `JSON.parse(req.body)` to get parameters 
```

> More options for curl, check `open x-man-page://curl`
> - **-I, --head**: Fetch the headers only. When used on an FTP or FILE, displays the file size and last modification time only.
> - **-i, --include**: Include the HTTP response headers in the output.
> - **-v, --verbose**: Makes curl verbose during the operation. Useful for seeing what's going on under the hood. Try `curl -vI https://www.baidu.com` as an exmple.

A POST request is typically sent via an HTML form. In this case, the content type is selected by the string in the **`enctype` attribute** of the `form` element.

- **application/x-www-form-urlencoded**: the keys and values are encoded in key-value tuples separated by `'&'`, with a `'='` between the key and the value. Non-alphanumeric characters in both keys and values are percent encoded. (default type)
- **multipart/form-data**: each value is sent as a block of data ("body part"), with a user agent defined delimiter ("boundary") separating each part. The keys are given in the `Content-Disposition` header of each part.
- **text/plain**

Use `multipart/form-data` when your form includes any `<input type="file">` elements. **Characters are NOT encoded**. This is important when the form has a file upload control. You want to send the file binary and this ensures that bitstream is not altered.

- fields are separated by the given boundary string. The browser must choose a boundary that will not appear in any of the fields, so this is why the boundary may vary between requests.
- Every field gets some sub headers before its data: `Content-Disposition: form-data`, the field name, the filename, followed by the data.

<img alt="form-data" src="https://tva1.sinaimg.cn/large/008vxvgGly1h7pzihd80yj31440gy40l.jpg" width="700"> 

### POST and PUT
The difference between `PUT` and `POST` is that `PUT` is idempotent *(If you PUT an object twice, it has no effect)*. `PUT` implies putting a resource - completely replacing whatever is available at the given URL with a different thing. Do it as many times as you like, and the result is the same. You can PUT a resource whether it previously exists, or not. So consider like this: do you name your URL objects you create explicitly, or let the server decide? If you name them then use `PUT`. If you let the server decide then use `POST`.

### POST and GET
GET data is appended to the URL as a query string, so there is a hard limit to the amount of data you can transfer. *GET is idempotent*. POST data is included in the body of the HTTP request and isn't visible in the URL. As such, there's no limit to the amount of data you can transfer over POST.

As far as security, **POST method is not more secure than GET as it also gets sent unencrypted over network**. HTTPS encrypts the data in transit and the remote server will decrypt it upon receipt; it protects against any 3rd parties in the middle being able to read or manipulate the data. A packet sniffer will show that the HTTP message sent over SSL is encrypted on the wire.

> Should data in an HTTPS request appear as encrypted in Chrome developer tools? The browser is obviously going to know what data it is sending, and the Chrome developer tools wouldn't be very helpful if they just showed the encrypted data. These tools are located in the network stack before the data gets encrypted and sent to the server.

JSONP doesn't support other methods than GET and also doesn't support custom headers. It basically use a script tag (the domain limitation is ignored) and pass a special parameter that tells the server a little bit about your page. Then the server is able to wrap up its response in a way that your page can handle.

## Headers
The Headers interface allows you to create your own headers object via the `Headers()` constructor. A Headers object has an associated header list, and you can add to this using methods like `append()`. For security reasons, **some headers can only be controlled by the user agent**. These headers cannot be modified programmatically, like `Accept-Charset`, `Accept-Encoding`, `Access-Control-Request-Headers`, `Access-Control-Request-Method`, `Cookie`, `Date`, `Host`, `Origin`. All of the Headers methods throw a `TypeError` if a header name is used that is not a valid HTTP Header name.

```javascript
const content = 'Hello World';

// add a new header using append()
const myHeaders = new Headers();
myHeaders.append('Content-Type', 'text/plain');
myHeaders.append('Content-Length', content.length.toString());
myHeaders.append('X-Custom-Header', 'ProcessThisImmediately');

// passing an object literal to the constructor
const myHeaders = new Headers({
  'Content-Type': 'text/plain',
  'Content-Length': content.length.toString(),
  'X-Custom-Header': 'ProcessThisImmediately'
});

console.log(myHeaders.has('Content-Type')); // true
console.log(myHeaders.has('Set-Cookie'));   // false

myHeaders.append('X-Custom-Header', 'AnotherValue');
console.log(myHeaders.get('X-Custom-Header')); // ['ProcessThisImmediately', 'AnotherValue']

myHeaders.delete('X-Custom-Header');
console.log(myHeaders.get('X-Custom-Header')); // null
```

## Response
You can create a new Response object using the `Response()` constructor, but you are more likely to encounter a Response object being returned as the result of another API.

- **Response.headers**: The Headers object associated with the response.
- **Response.ok**: A boolean indicating whether the response was successful (status in the range 200–299) or not.
- **Response.status**: The status code of the response.
- **Response.statusText**: The status message corresponding to the status code. (e.g., OK for 200).
- **Response.url**: The URL of the response. It will be the final URL obtained after any redirects.

The body of Response allows you to declare what its content type is and how it should be handled (`.json()`, `.blob()`, `.arrayBuffer()`, `.formData()`, `.text()`). For exmaple, The `json()` method of the Response interface takes a Response stream and reads it to completion. It returns a promise which resolves with the result of parsing the body text as JSON.

### Blob object and URL
Blob stands for "Binary Large Object", which is a **file-like object of immutable, raw data**. Blobs can represent data that isn't necessarily in a JavaScript-native format. The `File` interface is based on Blob.

Blob URLs are generated by the browser and are internal references. Given a blob, you can generate a URL to it using the `URL.createObjectURL()` function. **The new object URL represents the specified `File` object or `Blob` object**. Having converted the data into an object URL, it can be **used as the value of the `<img>` element's src attribute**. A Blob URL starts with the `blob://` scheme. It does not refer to data that exists on the server, it refers to data that your browser currently has in memory for the current page. It will not be available on other pages or in other browsers. Once you generate a blob URL, you can remove it calling the `URL.revokeObjectURL()` and passing that URL.

```javascript
// blob url as the image source
const input = document.querySelector('input');

input.addEventListener('change', e => {
  const img = document.createElement('img');
  const imageBlob = URL.createObjectURL(input.files[0]);
  img.src = imageBlob;

  img.onload = function() {
    URL.revokeObjectURL(imageBlob);
  }

  input.parentNode.replaceChild(img, input);
});

// blob url representing the content
const obj = { hello: "world" };
const blob = new Blob([JSON.stringify(obj, null, 2)], {
  type: "application/json",
});
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.innerText = 'Open the json URL';
document.body.appendChild(link);
```

```javascript
// new URL(url [, base])
const url = new URL('/cats?id=1#abc', 'http://www.example.com');
console.log(url.href);      // "http://www.example.com/cats?id=1#abc"
console.log(url.hostname);  // "www.example.com"
console.log(url.pathname);  // "/cats"
console.log(url.protocol);  // "http:"
console.log(url.hash);      // "#abc"
console.log(url.search);    // "?id=1"
console.log(url.searchParams.get('id'));  // "1"

/*
- `hostname` is the host name (example.org)
- `host` includes both the host name, and any port numbers associated (example.org:8888)
*/
```

## HTTP and socket
HTTP is an application protocol and used mostly for browsing the internet. HTTP itself can't be used to transport information to/from a remote end point. Instead it relies on an underlying protocol which in HTTP's case is TCP. TCP provides a reliable link between two computers (if packet get lost - it is re-transmitted). TCP itself rides on top of IP, which provides unified addressing to communicate between computers. Basically it means if you are communicating HTTP, you are doing it with TCP/IP underneath.

Sockets are an **API that most operating systems provide** to be able to talk with the network **at the transport layer**. A socket API provided by the OS can be accessed using libraries in all programming languages. Plain sockets are more powerful and generic. They run over TCP/IP but they are not restricted to browsers or HTTP protocol. They could be used to implement any kind of communication, but you need to take care of all the lower-level details of a TCP/IP connection.

WebSocket is another application level protocol over TCP protocol. A webSocket runs over a regular socket, but runs its own connection scheme and framing protocol on top of the regular socket.

## Always set timeouts when making network calls
Modern applications don’t crash; they hang. One of the main reasons for it is the assumption that the network is reliable. It isn’t. You are leaking sockets if your asynchronous network calls don’t return. Client-side timeouts are as crucial as server-side ones. There is a maximum number of sockets your browser can open for a particular host. If you make network requests that never returns, you are going to exhaust the socket pool. When the pool is exhausted, you are no longer able to connect to the host. So never use "infinity" as a default timeout.