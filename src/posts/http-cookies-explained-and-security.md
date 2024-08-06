---
layout: "../layouts/BlogPost.astro"
title: "HTTP cookies explained and security policy"
slug: http-cookies-explained-and-security
description: ""
added: "Nov 16 2022"
tags: [web]
updatedDate: "July 21 2024"
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

### Cookie restrictions
```
Set-Cookie: <cookie-name>=<cookie-value>; Max-Age=<number>; Domain=<domain-value>; Secure; HttpOnly

Set-Cookie: sessionId=38afes7a8
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT
Set-Cookie: mykey=myvalue; SameSite=Strict
```

The lifetime of a cookie can be defined in two ways:
- **Session cookies** are deleted when the current session ends. (Some browsers have a session restore feature that will save all tabs and restore them next time the browser is used. Session cookies will also be restored, as if the browser was never closed, which can cause session cookies to last indefinitely long).
- **Permanent cookies** are deleted at a date specified by the `Expires` attribute, or after a period of time in seconds specified by the `Max-Age` attribute. If both `Expires` and `Max-Age` are set, `Max-Age` has precedence.
 
A cookie with the `Secure` attribute is sent to the server only over the HTTPS protocol, never with unsecured HTTP (except on localhost). Insecure sites `http:` cannot set cookies with the `Secure` attribute. A cookie with the `HttpOnly` attribute is inaccessible to the JavaScript `document.cookie` API; it is sent only to the server.

> Normally localhost should be treated as a secure origin even if not HTTPs. Both Chrome (https://bugs.chromium.org/p/chromium/issues/detail?id=1056543) and Firefox (https://bugzilla.mozilla.org/show_bug.cgi?id=1648993) fixed issues to allow Secure cookies for localhost. The `https:` requirements are ignored when the `Secure` attribute is set by localhost since Firefox 75 and Chrome 89. However, Safari doesn’t set Secure cookies on localhost, as Firefox and Chrome do.

The `Domain` attribute specifies which hosts are allowed to receive the cookie. If unspecified, defaults to the host of the current document URL, **not including subdomains**. If `Domain` is specified, then **subdomains are always included**. For example, if the value of the `Domain` attribute is "example.com", the user agent will include the cookie in the Cookie header when making HTTP requests to `example.com`, `www.example.com`, and `www.corp.example.com`. If the server omits the `Domain` attribute, the user agent will return the cookie only to the origin server.

The `Path` attribute indicates a URL path that must exist in the requested URL in order to send the Cookie. For example, if `Path=/docs` is set, `/docs`, `/docs/Web/`, `/docs/Web/HTTP` are all matched.

The `SameSite` attribute lets servers require that a cookie shouldn't be sent with cross-origin requests. It takes three possible values: `Strict`, `Lax`, and `None`. With `Strict`, the cookie is sent only to the same site as the one that originated it. In user terms, the cookie will only be sent if the site for the cookie matches the site currently shown in the browser's URL bar. `Lax` is similar, with an exception for when the user navigates to a URL from an external site, such as by following a link. **This is the default behavior if the `SameSite` attribute is not specified.** `None` has no restrictions on cross-site requests, but requires that the `Secure` attribute must be used: `SameSite=None; Secure`.

> `SameSite=Lax` cookies are not sent:
> - A site on another domain makes an AJAX/fetch request using JavaScript to your site won't include Lax (or Strict) cookies.
> - If your site is embedded in an iframe on a site hosted on a different domain, your site won't receive any Lax (or Strict) cookies.
> - An image on your website is linked to directly in the src attribute of an image from another site.

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
- Include a CSRF token as a hidden field when the form is submitted. This token is a unique, secret, unpredictable value generated by the server-side and transmitted to the client in such a way that it is included in a subsequent HTTP request made by the client.

### Cross-site scripting
Cross-site scripting (XSS) is a security bug that can affect websites. This bug can allow an attacker to add their own malicious JavaScript code onto the HTML pages displayed to the users. The vulnerabilities most often happen when user input is sent to the server, and the server responds back to the user by displaying a page that includes the user input without validation. XSS also can occur entirely in the client-side without data being sent back and forth between the client and server.

A common technique for preventing XSS vulnerabilities is "escaping". The purpose of character and string escaping is to make sure that every part of a string is interpreted as a string primitive, not as a control character or code. Escape certain characters (like `<`, `>`, `&`, and `"`) with HTML entity to prevent them being executed.

A good test string is `>'>"><img src=x onerror=alert(0)>`. If your application doesn't correctly escape this string, you will see an alert and will know that something went wrong. [The Big List of Naughty Strings](https://github.com/minimaxir/big-list-of-naughty-strings) is a list of strings which have a high probability of causing issues when used as user-input data.

> We do not recommend that you manually escape user-supplied data. Instead, we strongly recommend that you use a templating system or web development framework that provides context-aware auto-escaping. If this is impossible for your website, use existing libraries (e.g., [DOMPurify](https://github.com/cure53/DOMPurify), [escape-html](https://github.com/component/escape-html)) that are known to work, and apply them consistently to all user-supplied data.
>
> For example in Vue, whether using templates or render functions, content is automatically escaped. [vue-dompurify-html](https://github.com/LeSuisse/vue-dompurify-html/tree/main/packages/vue-dompurify-html) is a "safe" replacement for the `v-html` directive. The HTML code is sanitized with DOMPurify before being interpreted.

It’s recommended to avoid storing any sensitive information in local storage where authentication would be assumed. You can trivially read all data stored in local storage with `Object.entries(localStorage)`. This means if your website is vulnerable to XSS attacks, where a third party can run arbitrary scripts, your users’ tokens can be easily stolen. Cookies, on the other hand, can’t be read by client-side JS if you add the `HttpOnly` flag.

## Content Security Policy
Configuring Content Security Policy involves adding the `Content-Security-Policy` HTTP header to a web page and giving it values to control what resources the user agent is allowed to load for that page. If the site doesn't offer the CSP header, browsers likewise use the standard same-origin policy. A properly designed Content Security Policy helps protect a page against a cross-site scripting attack. There are specific directives for a wide variety of types of items, so that each type can have its own policy, including fonts, frames, images, audio and video media, scripts, and workers.

[Helmet](https://github.com/helmetjs/helmet) helps secure Express apps by setting HTTP response headers including `Content-Security-Policy`.

```
Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com; img-src 'self' img.example.com; style-src 'self';
```

The above policy permits:
- All content to be loaded only from the site's own origin.
- Scripts to be loaded from the site's own origin and `cdn.example.com`.
- Images from the site's own origin and `img.example.com`
- Styles only from the site's origin.
