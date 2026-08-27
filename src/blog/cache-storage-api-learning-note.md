---
title: "Cache Storage API learning note"
description: ""
added: "Aug 27 2026"
tags: [js, web]
---

## What it is

Cache Storage is a browser API for storing `Request` to `Response` pairs. It was built for caching network requests, mainly for offline support and PWAs with Service Workers. But you don't need a Service Worker to use it. You can call it directly from the main thread with `window.caches`.

Two main pieces:

- [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage): the global container, accessed through `caches`. It holds multiple named `Cache` objects.
- [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache): one named cache. It stores `Request` to `Response` mappings.

> You never store data directly in `CacheStorage`. You always create a named `Cache` first, and then store data in that cache. For example, Cache "v1" (request /a.js -> response, request /b.js -> response), Cache "v2" (request /c.json -> response), etc.

How it compares to `localStorage`:

|                | localStorage                | CacheStorage                                      |
| -------------- | --------------------------- | ------------------------------------------------- |
| What it stores | Strings only                | Request/Response (can hold body, headers, status) |
| Binary data    | Not supported. Needs base64 | Supported natively (Blob)                         |
| API style      | Synchronous                 | Asynchronous (Promise based)                      |
| Capacity       | About 5-10MB                | Tens to hundreds of MB, based on disk quota       |
| The key        | Any string                  | Must be a Request, or a URL that becomes one      |

## Native API basics

```js
const cache = await caches.open("v1"); // open or create a cache
await cache.put("/foo", new Response(blob)); // store
const resp = await cache.match("/foo"); // read
await cache.delete("/foo"); // delete one entry
const keys = await cache.keys(); // list all keys as Request[]
await caches.delete("v1"); // delete the whole cache
```

One thing to note is that the key is really a `Request` object. A string is just shorthand. Internally the browser runs `new Request(url)` to convert it. That means the key must be a valid URL.

By default, `cache.match()` checks three things before it counts as a match:

1. Full URL, including the query string, unless you pass `ignoreSearch: true`
2. HTTP method, only GET by default, unless you pass `ignoreMethod: true`
3. `Vary` header, if the stored response has one, unless you pass `ignoreVary: true`

```js
cache.match(request, {
  ignoreSearch: true,
  ignoreMethod: true,
  ignoreVary: true,
});
```

## A basic wrapper to understand the core idea

The native API only understands network request semantics. It has no concept of arbitrary keys, no TTL, and no way to attach metadata. To wrap it into something that behaves like localStorage but can store Blobs and support expiry, you need to solve some gaps.

```ts
class SimpleBlobStorage {
  private constructor(private cache: Cache) {}

  static async create(): Promise<SimpleBlobStorage> {
    const cache = await caches.open("blobs");
    return new SimpleBlobStorage(cache);
  }

  async putBlob(key: string, blob: Blob, expiry?: number): Promise<void> {
    const headers = new Headers();
    if (expiry) {
      headers.set("X-Expire", String(Date.now() + expiry)); // fake TTL with a header
    }

    // Blob goes into the Response body
    await this.cache.put(this.toUrl(key), new Response(blob, { headers }));
  }

  async getBlob(key: string): Promise<Blob | undefined> {
    const resp = await this.cache.match(this.toUrl(key));
    if (!resp) return undefined;

    const expire = resp.headers.get("X-Expire");
    if (expire && Date.now() >= parseInt(expire, 10)) {
      return undefined;
    }
    return resp.blob();
  }

  async deleteBlob(key: string): Promise<void> {
    await this.cache.delete(this.toUrl(key));
  }

  private async cleanExpired(): Promise<void> {
    // Nothing removes expired data unless you do it yourself
    const keys = await this.cache.keys();
    const now = Date.now();
    await Promise.all(
      keys.map(async (key) => {
        const resp = await this.cache.match(key);
        const expire = resp?.headers.get("X-Expire");
        if (expire && now >= parseInt(expire, 10)) {
          await this.cache.delete(key);
        }
      }),
    );
  }

  private toUrl(key: string): string {
    return `/${encodeURIComponent(key)}`;
  }
}
```

## Key points to understand

1. **Expired does not mean deleted.** Setting an expiry header only makes `getBlob` refuse to return the data. The bytes are still sitting in storage. Actual removal only happens when you call `cache.delete()` yourself.

2. **You have to trigger cleanup yourself, and think about timing.** The native API never cleans anything automatically. A common pattern is to scan all keys during idle time (`requestIdleCallback`) and delete the expired ones. But if that scan only runs once, at service startup, and not on a recurring timer, anything that expires later during the session will not get cleaned until the next startup (for example a page reload).

3. **The browser has its own fallback, but it is not precise.** Cache Storage is best-effort storage. When disk quota runs low, the browser can evict data on its own, usually LRU based. It might evict data you still care about. Do not treat Cache Storage as reliable long-term storage.

4. **How you encode the key affects matching.** Since the default match compares the full URL, putting your key in the query string means you need to pass `ignoreSearch`. Putting it in the path avoids that extra option.

5. **A Blob carries no filename or metadata.** A `Blob` is just bytes plus a MIME type. It has no `.name`, unlike a `File`. If your app needs to rebuild a named `File` after reading data back out, you need to store that metadata separately, commonly through a custom HTTP header, and reattach it on read.
