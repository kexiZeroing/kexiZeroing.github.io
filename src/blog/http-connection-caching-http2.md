---
title: "HTTP connection, caching and HTTP/2"
description: ""
added: "Nov 20 2022"
tags: [web]
updatedDate: "May 10 2025"
---

## Connection management
HTTP mostly relies on TCP for its transport protocol, providing a connection between the client and the server. Opening each TCP connection is a resource-consuming operation. Several messages must be exchanged between the client and the server. Opening and maintaining connections largely impacts the performance of web applications.

The original model of HTTP, and the default one in HTTP/1.0, is **short-lived connections**. Each HTTP request is completed on its own connection; this means a TCP handshake happens before each HTTP request, and these are serialized.

A **persistent connection**, also called keep-alive connection, remains open for a period of time, and can be reused for several requests, saving the need for a new TCP handshake. To put it simply, the HTTP server doesn't close the TCP connection after each response but waits some time if some other HTTP request will come over it too. The connection will not stay open forever: idle connections are closed after some time. *For example, Nginx `keepalive_timeout` is the time where the server will keep an idle connection open. If you send a request and then do nothing on this connection, the server will shutdown the connection at 75s after your previous request.* In HTTP/1.1, persistence is the default and the connection header is no longer needed, unless the client explicitly asks the server to close the connection by including a `Connection: close` header in its request, or the server decides to includes a `Connection: close` header in its response.

Connection headers are prohibited in HTTP/2 and HTTP/3.

### HTTP pipelining
By default, HTTP requests are issued sequentially. HTTP/1.1 introduced the concept of pipelining so you could send more requests while you were waiting. The server processes the requests and sends the responses in the order they were receive. It allows multiple HTTP requests to be sent over a single TCP, reducing the overhead associated with setting up and tearing down multiple TCP connections.

The disadvantages of HTTP pipelining is **Head of Line (HOL) blocking**. If one request in the pipeline takes a long time to process, it can block the responses of all subsequent requests. This is one of the primary reasons pipelining is not widely adopted. This technique has been superseded by multiplexing, that is used by HTTP/2.

HTTP/2 does however still suffer from another kind of HOL blocking at the TCP level. One lost packet in the TCP stream makes all streams wait until that packet is re-transmitted and received. This HOL is being addressed with the QUIC protocol.

HTTP/3 builds on the strengths of HTTP/2 and runs over the QUIC protocol *(pronounced exactly like the English word "quick")*, which runs over UDP, further reducing latency and avoiding HOL blocking.

### Domain sharding
In HTTP/1.x, the browser naively queue all HTTP requests on the client, sending one after another over a single, persistent connection. However, this is too slow. Hence, the browser vendors are left with no other choice than to **open multiple TCP sessions in parallel**. How many? In practice, most modern browsers, both desktop and mobile, open up to six connections per host. *(The higher the limit, the higher the client and server overhead, but at the additional benefit of higher request parallelism. Six connections per host is simply a safe middle ground.)*

Domain sharding is used to load resources from multiple domains/subdomains in an attempt to overcome a browser’s limit on the number of concurrent requests it can make, and therefore improving load performance. Browsers distinguish domains by name rather than by IP address. With modern browsers the limit connections for each domain is 6, we can boost the connections to 18 if we use 3 domains. 

But another limit is that browsers have a total limit of concurrent connections regardless of the number of different domains used. And adding multiple domains can, however, introduce performance losses. Web browsers have to perform a DNS lookup on each additional domain and maintain connections to each domain, resulting in slower initial load times. Unless you have a very specific immediate need, **don't use this deprecated technique; switch to HTTP/2 instead**. In HTTP/2, domain sharding is no longer useful and the HTTP/2 connection is able to handle parallel requests very well.

### HTTP and socket
HTTP is an application protocol and used mostly for browsing the internet. HTTP itself can't be used to transport information to/from a remote end point. Instead it relies on an underlying protocol which in HTTP's case is TCP. TCP provides a reliable link between two computers (if packet get lost - it is re-transmitted). TCP itself rides on top of IP, which provides unified addressing to communicate between computers. Basically it means if you are communicating HTTP, you are doing it with TCP/IP underneath.

Sockets are an API that most operating systems provide to be able to talk with the network at the transport layer. A socket API provided by the OS can be accessed using libraries in all programming languages. Plain sockets are more powerful and generic. They run over TCP/IP but they are not restricted to browsers or HTTP protocol. They could be used to implement any kind of communication, but you need to take care of all the lower-level details of a TCP/IP connection.

WebSocket is another application level protocol over TCP protocol. A webSocket runs over a regular socket, but runs its own connection scheme and framing protocol on top of the regular socket.

> [PartySocket](https://www.npmjs.com/package/partysocket) is a tiny abstraction on top of websockets that adds reconnections/buffering/resilience. Use it as a drop in replacement for your ws `import { WebSocket } from “partysocket”`.

WebSockets are stateful, making them challenging to scale in distributed systems. Systems typically use:
- Consistent Hashing for Load Balancing – Ensures that a reconnecting client is routed to the correct server.
- Cross-Server Communication – Messages need to be passed between WebSocket servers to ensure continuity for users, regardless of which server they land on. A typical way to do this is to store messages in a shared database like Redis or pass messages between servers using a Publish/Subscribe framework like Kafka or RabbitMQ.

### Redirections
In HTTP, redirection is triggered by a server sending a special redirect response to a request. Redirect responses have status codes that start with `3`, and a `Location` header holding the URL to redirect to. When browsers receive a redirect, they immediately load the new URL provided in the `Location` header. **However, browsers always send a `GET` request to that new URL**.

The `301 (Moved Permanently)` status code indicates that the target resource has been assigned a new permanent URI. The client should always go to the new location. A user agent may change the request method from `POST` to `GET` for the subsequent request.

The `302 (Found)` status code indicates that the target resource resides temporarily under a different URI, and the client should continue requesting the original url. A user agent may change the request method from `POST` to `GET` for the subsequent request. If this behavior is undesired, the `307 (Temporary Redirect)` status code can be used instead.

The `307 (Temporary Redirect)` status code indicates that the target resource resides temporarily under a different URI and the user agent **must not change the request method and post data** if it performs an automatic redirection to that URI.

The `308 (Permanent Redirect)` status code, that is similar to `301 (Moved Permanently)` but does not allow the request method to be changed from `POST` to `GET`.

- When a site resides at `www.example.com`, but accessing it from `example.com` should also work. Redirections for `example.com` to `www.example.com` are thus set up. The server answers with a code `301` with the header `Location: http://www.example.com`.
- Your company was renamed, but you want existing links or bookmarks to still find you under the new name.
- Requests to the `http://` version of your site will redirect to the `https://` version of your site.

> Chrome users who navigate to websites by manually typing a URL often don’t include `http://` or `https://`. In this case, if it was a user’s first visit to a website, Chrome would previously choose `http://` as the default protocol. This was a practical default in the past, when much of the web did not support HTTPS. Starting in version 90, Chrome’s address bar uses `https://` by default.

### Mixed content
An HTTPS page that includes content fetched using cleartext HTTP is called a mixed content page. Pages like this are only partially encrypted, leaving the unencrypted content accessible to sniffers and man-in-the-middle attackers. There are two categories for mixed content: mixed passive/display content and mixed active content.

- **Mixed passive/display content** is content served over HTTP that is included in an HTTPS webpage, but that cannot alter other portions of the webpage. For example, an attacker could replace an image served over HTTP with an inappropriate image or message to the user. (img src attribute, video src attribute, etc.)
- **Mixed active content** is content that has access to all or parts of the Document Object Model of the HTTPS page. This type of mixed content can alter the behavior of the HTTPS page and potentially steal sensitive data from the user. (script src attribute, iframe src attribute, xhr requests, fetch, etc.)

When visiting an HTTPS page in Chrome, the browser alerts you to mixed content as errors and warnings in the JavaScript console. Mixed active content is blocked by default.

The `upgrade-insecure-requests` CSP directive instructs the browser to upgrade insecure URLs before making network requests. As with browser automatic upgrading, if the resource is not available over HTTPS, the upgraded request fails and the resource is not loaded. *(“If this page loads HTTP resources (images, scripts, etc.), automatically upgrade them to HTTPS.”)*

The HTTP `Strict-Transport-Security` response header (often abbreviated as `HSTS`) informs browsers that the site should only be accessed using HTTPS, and that any future attempts to access it using HTTP should automatically be converted to HTTPS. *(“Always access this site over HTTPS, even if the user types http)*

### Chunked transfer encoding
In HTTP/1.1, use `transfer-encoding: chunked` in response header, and we could keep writing response `res.write()`, till we use `res.end()` to finish the streaming process.

Here’s what’s happening:
- Each chunk starts with its length in hexadecimal.
- The data follows the length, and the next chunk starts after a newline.
- The response ends with a zero-length chunk.

Note that HTTP/2 specification explicitly forbids the use of the `Transfer-Encoding` header. HTTP/2 and later provide more efficient mechanisms for data streaming than chunked transfer. Usage of the header in HTTP/2 may likely result in a specific protocol error.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
});

server.on('stream', (stream, headers) => {
  stream.respond({
    ':status': 200,
    'content-type': 'text/html',
  });

  stream.write('<!DOCTYPE html><html><head><title>HTTP/2 Streaming</title></head><body>');

  setTimeout(() => {
    stream.write('<p>First chunk of content streamed.</p>');
  }, 1000);

  setTimeout(() => {
    stream.write('<p>Final chunk of content streamed.</p>');
    stream.end('</body></html>');
  }, 2000);
});

server.listen(3000, () => {
  console.log('HTTP/2 server running at https://localhost:3000/');
});
```

## HTTP caching
The HTTP cache stores a response associated with a request and reuses the stored response for subsequent requests. Proper operation of the cache is critical to the health of the system.

While **private cache** (browser cache) helps with many requests by the same user, it doesn't solve the issue of many users making requests, because each user has their own browser with their own cache. To fix this, you need a **shared cache**. For example, an ISP might have set up a web proxy as part of its local network infrastructure to serve many users so that popular resources are reused a number of times, reducing network traffic and latency.

### Controlling caching
There are many directives in the `Cache-Control` spec, and it may be difficult to understand all of them. But most websites can be covered by a combination of a handful of patterns.

```
Cache-Control: must-revalidate
Cache-Control: no-cache
Cache-Control: no-store
Cache-Control: public
Cache-Control: private
Cache-Control: max-age=<seconds>
Cache-Control: stale-while-revalidate=<seconds>
```

In HTTP/1.0, freshness used to be specified by the `Expires` header. However, the time format is difficult to parse and many implementation bugs were found, therefore, `max-age` — for specifying an elapsed time — was adopted for `Cache-Control` in HTTP/1.1. If both `Expires` and `Cache-Control: max-age` are available, `max-age` is defined to be preferred.

To ensure that the latest versions of resources will always be transferred, it's common practice to make the default `Cache-Control` value include `no-cache`. In addition, if the service implements cookies and the content is personalized for each user, `private` must be given too.

**`no-cache` means don’t use the response without validating, even if it’s still fresh.** It does not prevent the storing of responses but instead prevents the reuse of responses without revalidation. If you don't want a response stored in any cache, use `no-store`.

`s-maxage` is similar to `max-age` but it applies to proxies (CDN) instead of clients. Web proxy caches work on the same principle, but a much larger scale. Use `public` and `s-maxage` for general resources, which generate shared cache for every user, and only the first user needs to wait on response.

`max-age=600, stale-while-revalidate=30` indicates that it is fresh for 600 seconds, and it may continue to be served stale for up to an additional 30 seconds while an asynchronous validation is attempted. Revalidation will make the cache be fresh again. If no request happened during that period, the cache became stale and the next request will revalidate normally.

`stale-if-error=86400` indicates that the cache can reuse a stale response for an extra 1 day (86400s) when an error is encountered. Here, an error is considered any response with a status code of 500, 502, 503, or 504.

#### `Cache-Control` as a Request Header
One thing we’re probably less familiar with is the use of the `Cache-Control` as a request header, which influences how the browser decides whether to use a cached response or fetch fresh content from the network. The most common time you’ll encounter `Cache-Control` in a request is when refreshing a page.

In Chrome, even if the page is still fresh, refreshing it will dispatch a request to the network with `Cache-Control: max-age=0` and `If-Modified-Since | If-None-Match`. A hard refresh means bypass the cache entirely, fetching both the main document and all subresources from the network. These requests typically include the header `Cache-Control: no-cache`.

### Freshness and Cache validation
Before the expiration time, the resource is fresh; after the expiration time, the resource is stale. Stale responses are not immediately discarded. HTTP has a mechanism to transform a stale response into a fresh one by asking the origin server. This is called validation. Validation is done by using a conditional request that includes an `If-Modified-Since` or `If-None-Match` request header. The server will respond with `304 Not Modified` if the content has not changed. **Since this response only indicates "no change", there is no response body — there's just a status code — so the transfer size is extremely small.** The response can also include headers that update the expiration time of the cached resource.

- The `ETag` response header is an opaque-to-the-useragent value that can be used as a strong validator. That means the browser does not know what this string represents and can't predict what its value would be. If the `ETag` header was part of the response for a resource, the client can issue an `If-None-Match` in the header of future requests in order to validate the cached resource.

- The `Last-Modified` response header can be used as a weak validator. If the `Last-Modified` header is present in a response, then the client can issue an `If-Modified-Since` request header to validate the cached resource.

In short, by adding `Cache-Control: no-cache` to the response along with `Last-Modified` and `ETag`, the client will receive a `200 OK` response if the requested resource has been updated, or will otherwise receive a `304 Not Modified` response if the requested resource has not been updated.

### Revved resources
They are some resources that would benefit the most from caching, but this makes them very difficult to update. This is typical of the resources included and linked from each web pages: JavaScript and CSS files change infrequently, but when they change you want them to be updated quickly.

Web developers invented a technique called `revving` *(short for "revisioned")*. Infrequently updated files are named in a specific way: a revision (or version) number is added to the filename, and it doesn't need to be a classical version string like `1.1.3`. It can be anything that prevent collisions, like a hash or a date. Each new revision is considered as a resource that never changes and that can have an expiration time very far in the future. In order to have the new versions, all the links to them must be changed. This additional complexity is usually taken care of by the tool chain used by web developers.

## HTTP/2
- Brief History of HTTP: https://hpbn.co/brief-history-of-http
- HTTP/2: https://hpbn.co/http2/
- What does multiplexing mean in HTTP/2: https://stackoverflow.com/questions/36517829/what-does-multiplexing-mean-in-http-2

In HTTP/1.1, two requests cannot ride together the same TCP connection - it is necessary that the first one ends for the subsequent to begin. 

The primary goals for HTTP/2 are to reduce latency by enabling **full request and response multiplexing**, minimize protocol overhead via efficient **compression of HTTP header fields**, and **add support for request prioritization and server push**. HTTP/2 does not modify the application semantics of HTTP in any way. All the core concepts such as HTTP methods, status codes, URIs, and header fields remain in place. Instead, HTTP/2 modifies how the data is formatted (framed) and transported between the client and server.

> SPDY (pronounced "speedy") is a deprecated open-specification networking protocol that was developed primarily at Google for transporting web content. SPDY manipulates HTTP traffic, with particular goals of reducing web page load latency and improving web security. SPDY was chosen as the basis for HTTP/2, and the core developers of SPDY have been involved in the development of HTTP/2. **SPDY is acting as an experimental branch that was used to test new features and proposals for the HTTP/2 standard**. In early 2015, Google announced its plans to remove support for SPDY in favor of HTTP/2.

### Binary Framing Layer
At the core of all performance enhancements of HTTP/2 is the new binary framing layer, which dictates how the HTTP messages are encapsulated and transferred between the client and server.

<img alt="http/2" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8alebcldyj318o0ncq5w.jpg" width="600" />

The "layer" refers to a design choice to introduce a new optimized encoding mechanism. Unlike the newline delimited plaintext HTTP/1.x protocol, **all HTTP/2 communication is split into smaller messages and frames, each of which is encoded in binary format**. As a result, both client and server must use the new encoding mechanism to understand each other: an HTTP/1.x client won’t understand an HTTP/2 only server, and vice versa. Thankfully, our applications (not working with raw TCP sockets) remain blissfully unaware of all these changes, as the client and server perform all the necessary framing work on our behalf.

### Streams, messages, and frames
- All communication is performed over a single TCP connection that can carry any number of bidirectional streams.
- Each stream has a unique identifier and optional priority information that is used to carry bidirectional messages.
- Each message is a complete sequence of frames that map to a logical request or response message.
- The frame is the smallest unit of communication that carries a specific type of data, e.g., HTTP headers, message payload, and so on. Frames from different streams may be interleaved and then reassembled via the embedded stream identifier in the header of each frame.

### Request and Response Multiplexing
With HTTP/1.x, if the client wants to make multiple parallel requests, then multiple TCP connections must be used. This behavior is a consequence of the HTTP/1.x delivery model, which ensures that only one response can be delivered at a time per connection. The new binary framing layer in HTTP/2 removes these limitations, and enables full request and response multiplexing, by allowing the client and server to **break down an HTTP message into independent frames, interleave them, and then reassemble them on the other end**. All HTTP/2 connections are persistent, and only one connection per origin is required.

<img alt="multiplexing" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8aquuwp3gj319o0dedhk.jpg" width="700" />

The client is transmitting a DATA frame (stream 5) to the server, while the server is transmitting an interleaved sequence of frames to the client for streams 1 and 3. As a result, there are three parallel streams in flight.

- Interleave multiple requests in parallel without blocking on any one
- Interleave multiple responses in parallel without blocking on any one
- Use a single connection to deliver multiple requests and responses in parallel
- Remove unnecessary HTTP/1.x workarounds such as concatenated files, image sprites, and domain sharding

### Stream Prioritization
HTTP/2 standard **allows each stream to have an associated weight and dependency**: Each stream may be assigned an integer weight between 1 and 256; Each stream may be given an explicit dependency on another stream. The combination of stream dependencies and weights allows the client to expresses how it would prefer to receive the responses. In turn, the server can use this information to prioritize stream processing, and once the response data is available, allocation of bandwidth to ensure optimal delivery of high-priority responses to the client.

> Not all resources have equal priority when rendering a page in the browser: the HTML document itself is critical to construct the DOM; the CSS is required to construct the CSSOM; both DOM and CSSOM construction can be blocked on JavaScript resources; and remaining resources, such as images, are often fetched with lower priority.

HTTP/1.x must rely on the use of parallel connections, which enables limited parallelism of up to six requests per origin. As a result, requests are queued on the client until a connection is available, which adds unnecessary network latency. It is eliminated in HTTP/2 because the browser can dispatch all requests the moment they are discovered, and the browser can communicate its stream prioritization preference via stream dependencies and weights, allowing the server to further optimize response delivery.

### Header Compression
Each HTTP transfer carries a set of headers that describe the transferred resource and its properties. In HTTP/1.x, this metadata is always sent as plain text *(Text-Based Headers, not efficiently compressed)* and adds 500–800 bytes of overhead per transfer, and sometimes kilobytes more if HTTP cookies are being used. To reduce this overhead and improve performance, HTTP/2 compresses request and response header metadata using the **HPACK** compression format that uses two techniques:

- It allows the transmitted header fields to be encoded via a static Huffman code, which reduces their individual transfer size.
- It requires that both the client and server maintain and update an indexed list of previously seen header fields, which is then used as a reference to efficiently encode previously transferred values.

In HTTP/2, `:method`, `:scheme`, `:authority`, and `:path` are pseudo-header fields. It tries to compress headers and strip headers that are equal to the headers sent in the previous request. Clients that generate HTTP/2 requests directly should use the `:authority` pseudo-header field instead of the `Host` header field.

```
# HTTP/1.x
# the first request
GET /resoure HTTP/1.1
Host: www.example.com

# and a consecutive request
GET /new_resource HTTP/1.1
Host: www.example.com

# HTTP/2
# the first request
:method: GET
:scheme: https
:authority: www.example.com
:path: /resource

# and a consecutive request to the same server just requires
:path: /new_resource
```

### Server Push
HTTP/2 breaks away from the strict request-response semantics and enables one-to-many and server-initiated push workflows that open up a world of new interaction possibilities.

Why would we need such a mechanism in a browser? A typical web application consists of dozens of resources, all of which are discovered by the client by examining the document provided by the server. As a result, why not eliminate the extra latency and let the server push the associated resources ahead of time? The server already knows which resources the client will require; that’s server push. Each pushed resource is a stream that allows it to be individually multiplexed, prioritized, and processed by the client. Pushed resources can be prioritized by the server and declined by the client.

> Chrome disabled HTTP/2 push in Chrome 106 citing low use, and recommending the `rel="preload"` and 103 Early hints as a replacement. Firefox also intend to disable HTTP/2 Push on all platforms.