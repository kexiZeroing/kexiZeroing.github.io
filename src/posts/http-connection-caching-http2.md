---
layout: "../layouts/BlogPost.astro"
title: "HTTP connection, caching and HTTP/2"
slug: http-connection-caching-http2
description: ""
added: "Nov 20 2022"
tags: [web]
updatedDate: "Oct 22 2023"
---

## Connection management
HTTP mostly relies on TCP for its transport protocol, providing a connection between the client and the server. Opening each TCP connection is a resource-consuming operation. Several messages must be exchanged between the client and the server. Opening and maintaining connections largely impacts the performance of web applications. In HTTP/1.x, there are several models: short-lived connections, persistent connections, and HTTP pipelining.

The original model of HTTP, and the default one in HTTP/1.0, is **short-lived connections**. Each HTTP request is completed on its own connection; this means a TCP handshake happens before each HTTP request, and these are serialized.

A **persistent connection**, also called keep-alive connection, remains open for a period of time, and can be reused for several requests, saving the need for a new TCP handshake, and utilizing TCP's performance enhancing capabilities. This connection will not stay open forever: idle connections are closed after some time (a server may use the `Keep-Alive` header to specify a minimum time the connection should be kept open). Persistent connections also have drawbacks, even when idling they consume server resources, and under heavy load, DoS attacks can be conducted. In HTTP/1.1, persistence is the default, and the connection header is no longer needed.

By default, HTTP requests are issued sequentially. **Pipelining** is the process to send successive requests, over the same persistent connection, without waiting for the answer. This avoids latency of the connection. Theoretically, performance could be improved if two HTTP requests were to be packed into the same TCP message. **Pipelining has been superseded by a better algorithm, `multiplexing`, that is used by HTTP/2.**

### Domain sharding
In HTTP/1.x, the browser naively queue all HTTP requests on the client, sending one after another over a single, persistent connection. However, this is too slow. Hence, the browser vendors are left with no other choice than to **open multiple TCP sessions in parallel**. How many? In practice, most modern browsers, both desktop and mobile, open up to six connections per host. *(The higher the limit, the higher the client and server overhead, but at the additional benefit of higher request parallelism. Six connections per host is simply a safe middle ground.)*

Domain sharding is used to load resources from multiple domains/subdomains in an attempt to overcome a browser’s limit on the number of concurrent requests it can make, and therefore improving load performance. Browsers distinguish domains by name rather than by IP address. With modern browsers the limit connections for each domain is 6, we can boost the connections to 18 if we use 3 domains. 

But another limit is that browsers have a total limit of concurrent connections regardless of the number of different domains used. And adding multiple domains can, however, introduce performance losses. Web browsers have to perform a DNS lookup on each additional domain and maintain connections to each domain, resulting in slower initial load times. Unless you have a very specific immediate need, **don't use this deprecated technique; switch to HTTP/2 instead**. In HTTP/2, domain sharding is no longer useful and the HTTP/2 connection is able to handle parallel requests very well.

### Always set timeouts when making network calls
Modern applications don’t crash; they hang. One of the main reasons for it is the assumption that the network is reliable. It isn’t. You are leaking sockets if your asynchronous network calls don’t return. Client-side timeouts are as crucial as server-side ones. There is a maximum number of sockets your browser can open for a particular host. If you make network requests that never returns, you are going to exhaust the socket pool. When the pool is exhausted, you are no longer able to connect to the host. As a rule of thumb, always set timeouts when making network calls. And if you build libraries, always set reasonable default timeouts and make them configurable for your clients.

### HTTP and socket
HTTP is an application protocol and used mostly for browsing the internet. HTTP itself can't be used to transport information to/from a remote end point. Instead it relies on an underlying protocol which in HTTP's case is TCP. TCP provides a reliable link between two computers (if packet get lost - it is re-transmitted). TCP itself rides on top of IP, which provides unified addressing to communicate between computers. Basically it means if you are communicating HTTP, you are doing it with TCP/IP underneath.

Sockets are an API that most operating systems provide to be able to talk with the network at the transport layer. A socket API provided by the OS can be accessed using libraries in all programming languages. Plain sockets are more powerful and generic. They run over TCP/IP but they are not restricted to browsers or HTTP protocol. They could be used to implement any kind of communication, but you need to take care of all the lower-level details of a TCP/IP connection.

WebSocket is another application level protocol over TCP protocol. A webSocket runs over a regular socket, but runs its own connection scheme and framing protocol on top of the regular socket.

> You must design your system for scale if you plan to load balance multiple WebSocket servers. Each client connects to one of your servers, where it then opens a persistent WebSocket connection. Because each server has only its own list of connected clients, messages passed to one server must be shared with the other servers somehow. Similarly, when you want to broadcast a message to all clients, all servers must receive and relay it. A typical way to solve this is to store messages in a shared database like Redis or pass messages between servers using a Publish/Subscribe framework like Kafka or RabbitMQ.

### Redirections
In HTTP, redirection is triggered by a server sending a special redirect response to a request. Redirect responses have status codes that start with `3`, and a `Location` header holding the URL to redirect to. When browsers receive a redirect, they immediately load the new URL provided in the `Location` header. **However, browsers always send a `GET` request to that new URL**.

The `301 (Moved Permanently)` status code indicates that the target resource has been assigned a new permanent URI. A user agent may change the request method from `POST` to `GET` for the subsequent request.

The `302 (Found)` status code indicates that the target resource resides temporarily under a different URI. A user agent may change the request method from `POST` to `GET` for the subsequent request. If this behavior is undesired, the `307 (Temporary Redirect)` status code can be used instead.

The `307 (Temporary Redirect)` status code indicates that the target resource resides temporarily under a different URI and the user agent **must not change the request method and post data** if it performs an automatic redirection to that URI.

The `308 (Permanent Redirect)` status code, that is similar to `301 (Moved Permanently)` but does not allow the request method to be changed from `POST` to `GET`.

- When a site resides at `www.example.com`, but accessing it from `example.com` should also work. Redirections for `example.com` to `www.example.com` are thus set up. The server answers with a code `301` with the header `Location: http://www.example.com`.
- Your company was renamed, but you want existing links or bookmarks to still find you under the new name.
- Requests to the `http://` version of your site will redirect to the `https://` version of your site.

> Chrome users who navigate to websites by manually typing a URL often don’t include `http://` or `https://`. In this case, if it was a user’s first visit to a website, Chrome would previously choose `http://` as the default protocol. This was a practical default in the past, when much of the web did not support HTTPS. Starting in version 90, Chrome’s address bar uses `https://` by default.

### Mixed content
An HTTPS page that includes content fetched using cleartext HTTP is called a mixed content page. Pages like this are only partially encrypted, leaving the unencrypted content accessible to sniffers and man-in-the-middle attackers. There are two categories for mixed content: mixed passive/display content and mixed active content.

- *Mixed passive/display content* is content served over HTTP that is included in an HTTPS webpage, but that cannot alter other portions of the webpage. For example, an attacker could replace an image served over HTTP with an inappropriate image or message to the user. (img src attribute, video src attribute, etc.)
- *Mixed active content* is content that has access to all or parts of the Document Object Model of the HTTPS page. This type of mixed content can alter the behavior of the HTTPS page and potentially steal sensitive data from the user. (script src attribute, iframe src attribute, xhr requests, fetch, etc.)

When visiting an HTTPS page in Google Chrome, the browser alerts you to mixed content as errors and warnings in the JavaScript console. Mixed active content is blocked by default.

Content security policy (CSP) is a multi-purpose browser feature that you can use to manage mixed content at scale. The `upgrade-insecure-requests` CSP directive instructs the browser to upgrade insecure URLs before making network requests. As with browser automatic upgrading, if the resource is not available over HTTPS, the upgraded request fails and the resource is not loaded. This maintains the security of your page.

## HTTP caching
The HTTP cache stores a response associated with a request and reuses the stored response for subsequent requests. Proper operation of the cache is critical to the health of the system.

- A private cache is a cache tied to a specific client — typically a browser cache. This cache is especially useful when users hit the "back" button or click a link to see a page they’ve just looked at. If a response contains personalized content and you want to store the response only in the private cache, you must specify a `private` directive: `Cache-Control: private`.

- A shared cache is a cache that stores responses to be reused by more than one user. For example, an ISP might have set up a web proxy as part of its local network infrastructure to serve many users so that popular resources are reused a number of times, reducing network traffic and latency.

> What is Edge Caching? While browser caching (private cache) helps with many requests by the same user, it doesn't solve the issue of many users making requests, because each user has their own browser with their own cache. To fix this, you need a shared cache.
> 
> For example, Cloudflare caches only static assets by default, such as images, fonts, scripts, etc. The HTML containing the page content is not cached, because if you have an e-commerce store, for example, each user will have their own shopping cart, and if you cache that, the next user will see the previous one's items. Sites without dynamic content can opt in to cache everything. This makes it possible for an edge to serve entire pages all by itself, without having to contact your server. This way, you can have a very weak server, yet handle thousands of requests per second, because the load is mainly on the CDN.

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

To ensure that the latest versions of resources will always be transferred, it's common practice to make the default `Cache-Control` value include `no-cache`. In addition, if the service implements cookies or other login methods, and the content is personalized for each user, `private` must be given too.

`max-age=0` means that the response is immediately stale, and `must-revalidate` means that it must not be reused without revalidation once it is stale — so, in combination, the semantics seem to be the same as `no-cache`. But now HTTP/1.1-conformant servers are widely deployed, there's no reason to ever use that combination — you should instead just use `no-cache`.

The `no-cache` directive does not prevent the storing of responses but instead prevents the reuse of responses without revalidation. If you don't want a response stored in any cache, use `no-store`.

`s-maxage` is similar to `max-age` but it applies to proxies (CDN) instead of clients. Web proxy caches work on the same principle, but a much larger scale. Use `public` and `s-maxage` for general resources, which generate shared cache for every user, and only the first user needs to wait on response.

`max-age=600, stale-while-revalidate=30` indicates that it is fresh for 600 seconds, and it may continue to be served stale for up to an additional 30 seconds while an asynchronous validation is attempted. Revalidation will make the cache be fresh again. If no request happened during that period, the cache became stale and the next request will revalidate normally.

`stale-if-error=86400` indicates that the cache can reuse a stale response for an extra 1 day (86400s) when an error is encountered. Here, an error is considered any response with a status code of 500, 502, 503, or 504.

### Freshness and Cache validation
Before the expiration time, the resource is fresh; after the expiration time, the resource is stale. Stale responses are not immediately discarded. HTTP has a mechanism to transform a stale response into a fresh one by asking the origin server. This is called validation. Validation is done by using a conditional request that includes an `If-Modified-Since` or `If-None-Match` request header. The server will respond with `304 Not Modified` if the content has not changed. **Since this response only indicates "no change", there is no response body — there's just a status code — so the transfer size is extremely small.** The response can also include headers that update the expiration time of the cached resource.

- The `ETag` response header is an opaque-to-the-useragent value that can be used as a strong validator. That means the browser does not know what this string represents and can't predict what its value would be. If the `ETag` header was part of the response for a resource, the client can issue an `If-None-Match` in the header of future requests in order to validate the cached resource.

- The `Last-Modified` response header can be used as a weak validator. If the `Last-Modified` header is present in a response, then the client can issue an `If-Modified-Since` request header to validate the cached resource.

In short, by adding `Cache-Control: no-cache` to the response along with `Last-Modified` and `ETag`, the client will receive a `200 OK` response if the requested resource has been updated, or will otherwise receive a `304 Not Modified` response if the requested resource has not been updated.

> Read from the Chromium projects, the HTTP Cache is the module that receives HTTP requests and decides when and how to fetch data from the Disk Cache or from the network. The cache lives in the browser process, as part of the network stack. It should not be confused with Blink's in-memory cache, which lives in the renderer process and it's tightly coupled with the resource loader.

You are looking for [cachified](https://github.com/epicweb-dev/cachified), which wraps virtually everything that can store by key to act as cache with ttl/max-age, stale-while-revalidate, parallel fetch protection and type-safety support.

```ts
import { LRUCache } from 'lru-cache';
import { cachified, CacheEntry } from '@epic-web/cachified';

const lru = new LRUCache<string, CacheEntry>({ max: 1000 });

function getUserById(userId: number) {
  return cachified({
    key: `user-${userId}`,
    cache: lru,
    async getFreshValue() {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/users/${userId}`,
      );
      return response.json();
    },
    /* 5 minutes until cache gets invalid
     * Optional, defaults to Infinity */
    ttl: 300_000,
  });
}

console.log(await getUserById(1));
// > logs the user with ID 1

// 2 minutes later
console.log(await getUserById(1));
// > logs the exact same user-data
// Cache was filled an valid. `getFreshValue` was not invoked

// 10 minutes later
console.log(await getUserById(1));
// > logs the user with ID 1 that might have updated fields
// Cache timed out, `getFreshValue` got invoked to fetch a fresh copy of the user
```

### Revved resources
They are some resources that would benefit the most from caching, but this makes them very difficult to update. This is typical of the resources included and linked from each web pages: JavaScript and CSS files change infrequently, but when they change you want them to be updated quickly.

Web developers invented a technique called `revving`. Infrequently updated files are named in a specific way: a revision (or version) number is added to the filename, and it doesn't need to be a classical version string like `1.1.3`. It can be anything that prevent collisions, like a hash or a date. Each new revision is considered as a resource that never changes and that can have an expiration time very far in the future. In order to have the new versions, all the links to them must be changed. This additional complexity is usually taken care of by the tool chain used by web developers.

## HTTP/2
- Brief History of HTTP: https://hpbn.co/brief-history-of-http
- HTTP/2: https://hpbn.co/http2/

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
With HTTP/1.x, if the client wants to make multiple parallel requests, then multiple TCP connections must be used. This behavior is a consequence of the HTTP/1.x delivery model, which ensures that only one response can be delivered at a time per connection. The new binary framing layer in HTTP/2 removes these limitations, and enables full request and response multiplexing, by allowing the client and server to **break down an HTTP message into independent frames, interleave them, and then reassemble them on the other end**.

<img alt="multiplexing" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h8aquuwp3gj319o0dedhk.jpg" width="700" />

The client is transmitting a DATA frame (stream 5) to the server, while the server is transmitting an interleaved sequence of frames to the client for streams 1 and 3. As a result, there are three parallel streams in flight.

- Interleave multiple requests in parallel without blocking on any one
- Interleave multiple responses in parallel without blocking on any one
- Use a single connection to deliver multiple requests and responses in parallel
- Remove unnecessary HTTP/1.x workarounds such as concatenated files, image sprites, and domain sharding

All HTTP/2 connections are persistent, and only one connection per origin is required. And reduced number of connections is a important feature for improving performance of HTTPS deployments: this translates to fewer expensive TLS handshakes, better session reuse, and an overall reduction in required client and server resources.

### Stream Prioritization
HTTP/2 standard **allows each stream to have an associated weight and dependency**: Each stream may be assigned an integer weight between 1 and 256; Each stream may be given an explicit dependency on another stream. The combination of stream dependencies and weights allows the client to expresses how it would prefer to receive the responses. In turn, the server can use this information to prioritize stream processing by controlling the allocation of CPU, memory, and other resources, and once the response data is available, allocation of bandwidth to ensure optimal delivery of high-priority responses to the client.

> Not all resources have equal priority when rendering a page in the browser: the HTML document itself is critical to construct the DOM; the CSS is required to construct the CSSOM; both DOM and CSSOM construction can be blocked on JavaScript resources; and remaining resources, such as images, are often fetched with lower priority. 

HTTP/1.x must rely on the use of parallel connections, which enables limited parallelism of up to six requests per origin. As a result, requests are queued on the client until a connection is available, which adds unnecessary network latency. It is eliminated in HTTP/2 because the browser can dispatch all requests the moment they are discovered, and the browser can communicate its stream prioritization preference via stream dependencies and weights, allowing the server to further optimize response delivery.

> Why HTTP/2 waterfalls often still look like HTTP/1.x. Why are things are done in sequence rather than in parallel? –––https://csswizardry.com/2023/07/the-http1liness-of-http2
> <img alt="HTTP/2 waterfalls" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/67d48a19-0f75-469e-bb2b-f1227df07314.png" width="600">
>
> ‘when was a file useful?’ is much more important than ‘when was a file discovered?’. The only thing that matters is usefulness. We want files to arrive and be useful as soon as possible. Each of those files is a deferred JS bundle, meaning they need to run in sequence. It turns out that some slightly H/1-like behaviour is still a good idea. Queue, fetch, execute, queue, fetch, execute, queue, fetch, execute with almost zero dead time.

### Header Compression
Each HTTP transfer carries a set of headers that describe the transferred resource and its properties. In HTTP/1.x, this metadata is always sent as plain text *(not compress request and response headers)* and adds 500–800 bytes of overhead per transfer, and sometimes kilobytes more if HTTP cookies are being used. To reduce this overhead and improve performance, HTTP/2 compresses request and response header metadata using the **HPACK** compression format that uses two techniques:

- It allows the transmitted header fields to be encoded via a static Huffman code, which reduces their individual transfer size.
- It requires that both the client and server maintain and update an indexed list of previously seen header fields, which is then used as a reference to efficiently encode previously transferred values.

In HTTP/2, `:method`, `:scheme`, `:authority`, and `:path` are pseudo-header fields. It tries to compress headers and strip headers that are equal to the headers sent in the previous request. 

```
# HTTP/1.x
# the first request
GET /resoure HTTP/1.1
Host: https://example.com

# and a consecutive request
GET /new_resource HTTP/1.1
Host: https://example.com

# HTTP/2
# the first request
:method: GET
:scheme: https
:host: example.com
:path: /resource

# and a consecutive request to the same server just requires
:path: /new_resource
```

### Server Push
HTTP/2 breaks away from the strict request-response semantics and enables one-to-many and server-initiated push workflows that open up a world of new interaction possibilities.

Why would we need such a mechanism in a browser? A typical web application consists of dozens of resources, all of which are discovered by the client by examining the document provided by the server. As a result, why not eliminate the extra latency and let the server push the associated resources ahead of time? The server already knows which resources the client will require; that’s server push. Each pushed resource is a stream that allows it to be individually multiplexed, prioritized, and processed by the client.

All server push streams are initiated via `PUSH_PROMISE` frames. The delivery order is critical: the client needs to know which resources the server intends to push to avoid creating own and duplicate requests for these resources. Pushed resources can be prioritized by the server and declined by the client.
