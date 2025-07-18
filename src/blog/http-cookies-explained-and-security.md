---
title: "HTTP cookies explained and security policy"
description: ""
added: "Nov 16 2022"
tags: [web]
updatedDate: "July 18 2025"
---

An HTTP cookie is a small piece of data that a server sends to the user's web browser. The browser may store it and send it back with later requests to the same server. Typically, it's used to tell if two requests came from the same browser — keeping a user logged-in, for example. It remembers stateful information for the stateless HTTP protocol.

After receiving an HTTP request, a server can send one or more `Set-Cookie` headers with the response. The cookie is stored by the browser, and then the cookie is sent with requests inside a `Cookie` HTTP header. An expiration date or duration can be specified, after which the cookie is no longer sent. Additional restrictions to a specific domain and path can be set, limiting where the cookie is sent.

```
HTTP/2.0 200 OK
Content-Type: text/html
Set-Cookie: yummy_cookie=choco
Set-Cookie: tasty_cookie=strawberry

GET /sample_page.html HTTP/2.0
Host: www.example.org
Cookie: yummy_cookie=choco; tasty_cookie=strawberry
```

Basic HTTP cookie parser and serializer for HTTP servers: https://github.com/jshttp/cookie
- cookie.parse(str, options)
- cookie.serialize(name, value, options)

```js
// Set a new cookie with the name: cookie.serialize(name, value, options)
res.setHeader(
  "Set-Cookie",
  cookie.serialize("name", "value", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  }),
);

// Parse the cookies on the request: cookie.parse(str, options)
var cookies = cookie.parse(req.headers.cookie || "");
```

### Cookie restrictions
```
Set-Cookie: <cookie-name>=<cookie-value>; Max-Age=<number>; Domain=<domain-value>; Secure; HttpOnly

Set-Cookie: sessionId=38afes7a8
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT
Set-Cookie: mykey=myvalue; SameSite=Strict
```

The lifetime of a cookie can be defined in two ways:
- **Session cookies** are deleted when the current session ends. To set session cookies, simply create a cookie without the `Expires` or `Max-Age` attributes. This tells the browser to treat it as a session cookie, which will be removed when the browser is closed.
- **Persistent cookies** remain on the user's device until a specified expiration date. This can be set using the `Expires` attribute (a specific date) or the `Max-Age` attribute (a duration in seconds). If both `Expires` and `Max-Age` are set, the browser will honor `Max-Age` and ignore `Expires`.
 
A cookie with the `Secure` attribute is sent to the server only over the HTTPS protocol, never with unsecured HTTP (except on localhost). Insecure sites `http:` cannot set cookies with the `Secure` attribute. A cookie with the `HttpOnly` attribute is inaccessible to the JavaScript `document.cookie` API; it is sent only to the server.

> Normally localhost should be treated as a secure origin even if not HTTPs. Both Chrome and Firefox fixed issues to allow Secure cookies for localhost. The `https:` requirements are ignored when the `Secure` attribute is set by localhost since Firefox 75 and Chrome 89. However, Safari doesn’t set Secure cookies on localhost, as Firefox and Chrome do.

The `Domain` attribute specifies which hosts are allowed to receive the cookie. If unspecified, defaults to the host of the current document URL, **not including subdomains**. If `Domain` is specified, then **subdomains are always included**. For example, if the value of the `Domain` attribute is "example.com", the user agent will include the cookie in the Cookie header when making HTTP requests to `example.com`, `www.example.com`, and `www.corp.example.com`. If the server omits the `Domain` attribute, the user agent will return the cookie only to the origin server.

The `Path` attribute indicates a URL path that must exist in the requested URL in order to send the Cookie. For example, if `Path=/docs` is set, `/docs`, `/docs/Web/`, `/docs/Web/HTTP` are all matched.

The `SameSite` attribute lets servers require that a cookie shouldn't be sent with cross-origin requests. It takes three possible values: `Strict`, `Lax`, and `None`. With `Strict`, the cookie is sent only to the same site as the one that originated it. In user terms, the cookie will only be sent if the site for the cookie matches the site currently shown in the browser's URL bar. **Even if you navigate from site A to site B, site B’s cookies won’t be sent on that navigation.** `Lax` is similar, with an exception for when the user navigates to a URL from an external site, such as by following a link *(top-level navigation)*. This is the default behavior if the `SameSite` attribute is not specified. `None` has no restrictions on cross-site requests, but requires that the `Secure` attribute must be used as `SameSite=None; Secure`. This is required for third-party cookies.

> `SameSite=Lax` cookies are not sent:
> - A site on another domain makes an AJAX/fetch request using JavaScript to your site won't include Lax (or Strict) cookies.
> - If your site is embedded in an iframe on a site hosted on a different domain, your site won't receive any Lax (or Strict) cookies.
> - If a third-party site loads your images, your Lax (or Strict) cookies are not sent with those image requests.

### Cross-Site Request Forgery (CSRF) attacks
These attacks are possible because web browsers send authentication tokens automatically with every request to the server. It takes advantage of the user's previously authenticated session. An example of a CSRF attack:

1. A user signs into `www.good-banking-site.com`. The server authenticates the user and issues a response that includes an authentication cookie. The site is vulnerable to attack because it trusts any request that it receives with a valid authentication cookie.
2. The user visits a malicious site `www.bad-crook-site.com`. It contains an HTML form similar to the following:
  ```html
  <h1>Congratulations! You're a Winner!</h1>
  <form action="http://good-banking-site.com/api/account" method="post">
    <input type="hidden" name="Transaction" value="withdraw">
    <input type="hidden" name="Amount" value="1000000">
    <input type="submit" value="Click to collect your prize!">
  </form>
  ```
3. The user clicks the submit button. The browser makes the request and automatically includes the authentication cookie for the requested domain `www.good-banking-site.com`. The server has the user's authentication context and can perform any action that an authenticated user is allowed to perform.

**How to prevent CSRF:**
- Use `sameSite` Cookie.
- Determine the origin of the request is coming from. It can be done via `Origin` or `Referer` header.
- Include a CSRF token as a hidden field when the form is submitted. This token is a unique, secret, unpredictable value generated by the server-side and transmitted to the client in such a way that it is included in a subsequent HTTP request made by the client. (e.g. hidden form field, HTTP header)

### Cross-site scripting
Cross-site scripting (XSS) is a security bug that can affect websites. This bug can allow an attacker to add their own malicious JavaScript code onto the HTML pages displayed to the users. The vulnerabilities most often happen when user input is sent to the server, and the server responds back to the user by displaying a page that includes the user input without validation. XSS also can occur entirely in the client-side without data being sent back and forth between the client and server.

- Attackers exploit user inputs that aren’t properly sanitized, inserting scripts into web pages.
- Such scripts can access sensitive data like cookies or session tokens, leading to potential session hijacking.
- The attack can alter the webpage’s Document Object Model (DOM).

A common technique for preventing XSS vulnerabilities is "escaping". The purpose of character and string escaping is to make sure that every part of a string is interpreted as a string primitive, not as a control character or code. Escape certain characters (like `<`, `>`, `&`, and `"`) with HTML entity to prevent them being executed.

A good test string is `>'>"><img src=x onerror=alert(0)>`. If your application doesn't correctly escape this string, you will see an alert and will know that something went wrong. [The Big List of Naughty Strings](https://github.com/minimaxir/big-list-of-naughty-strings) is a list of strings which have a high probability of causing issues when used as user-input data.

> We do not recommend that you manually escape user-supplied data. Instead, we strongly recommend that you use a templating system or web development framework that provides context-aware auto-escaping. If this is impossible for your website, use existing libraries (e.g., [DOMPurify](https://github.com/cure53/DOMPurify), [escape-html](https://github.com/component/escape-html)) that are known to work, and apply them consistently to all user-supplied data.
>
> For example in Vue, whether using templates or render functions, content is automatically escaped. [vue-dompurify-html](https://github.com/LeSuisse/vue-dompurify-html/tree/main/packages/vue-dompurify-html) is a "safe" replacement for the `v-html` directive. The HTML code is sanitized with DOMPurify before being interpreted.

```js
// DOMPurify will strip out everything that contains dangerous HTML
DOMPurify.sanitize('<img src=x onerror=alert(1)//>'); // becomes <img src="x">
DOMPurify.sanitize('<svg><g/onload=alert(2)//<p>'); // becomes <svg><g></g></svg>
DOMPurify.sanitize('<p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>'); // becomes <p>abc</p>
```

It’s recommended to avoid storing any sensitive information in local storage where authentication would be assumed. You can trivially read data stored in local storage with `Object.entries(localStorage)`. This means if your website is vulnerable to XSS attacks, where a third party can run arbitrary scripts, your users’ tokens can be easily stolen. Cookies, on the other hand, can’t be read by client-side JS if you add the `HttpOnly` flag.

Store data inside of your users browser: https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html
- Cookies
- LocalStorage (limited by a 5MB storage cap)
- IndexedDB (Dexie.js is a wrapper library for indexedDB)
- OPFS (native browser storage API that allows web applications to manage files)
- [WASM SQLite](https://github.com/sqlite/sqlite-wasm)

```js
function getLocalStorageSize() {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const item = localStorage.getItem(key);
      // The `size` read-only property of the Blob returns 
      // the number of bytes of data contained within the Blob.
      totalSize += item ? new Blob([item]).size : 0;
    }
  }
  return Math.round(totalSize / 1024) + ' KB';
}
```

### Content Security Policy
Configuring Content Security Policy involves adding the `Content-Security-Policy` HTTP header to a web page and giving it values to control what resources the user agent is allowed to load for that page. CSP is typically set on every HTML page’s HTTP response, and it applies to that entire page. A properly designed Content Security Policy helps protect a page against a cross-site scripting attack. There are specific directives for a wide variety of types of items, so that each type can have its own policy, including fonts, frames, images, audio and video media, scripts, and workers.

```
Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com; img-src 'self' img.example.com; style-src 'self';
```

The above policy permits:
- All content to be loaded only from the site's own origin.
- Scripts to be loaded from the site's own origin and `cdn.example.com`.
- Images from the site's own origin and `img.example.com`
- Styles only from the site's origin.

### Handling Cross-Domain Cookies in iframes
Modern browsers have increasingly strict rules around third-party cookies. To allow cookies in cross-origin iframes, the server must explicitly set the cookie with `SameSite=None; Secure`. However, starting with Chrome 118, there's a gradual rollout to block third-party cookies, regardless of this setting. This change is part of Chrome’s Privacy Sandbox initiative.

A long-term solution is to use **Partitioned Cookies**, officially known as CHIPS (Cookies Having Independent Partitioned State). With CHIPS, if domain A embeds domain C in an iframe, and domain C sets a cookie with the `Partitioned` attribute, that cookie is stored in a partitioned jar specific to the top-level site A. The same iframe embedded under a different site (like B embedding C) will have a completely separate cookie state. These cookies are also not accessible when users directly navigate to domain C.

Alternatively, you can bypass the need for cookies altogether by using JWT for authentication. Domain A can generate a token and pass it to the embedded iframe. The iframe, hosted on domain B, can then include the JWT in requests via an `Authorization` header. This approach avoids cookie restrictions, but requires implementing a proper token validation and refresh mechanism on the server side.
