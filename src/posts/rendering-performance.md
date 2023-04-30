---
layout: "../layouts/BlogPost.astro"
title: "Rendering performance"
slug: rendering-performance
description: ""
added: "Oct 16 2021"
tags: [web]
updatedDate: "Mar 26 2023"
---

One factor contributing to a poor user experience is how long it takes a user to see any content rendered to the screen. **First Contentful Paint (FCP)** measures how long it takes for initial DOM content to render, but it does not capture how long it took the largest (usually more meaningful) content on the page to render. **Largest Contentful Paint (LCP)** measures when the largest content element in the viewport becomes visible. It can be used to determine when the main content of the page has finished rendering on the screen. 

### Optimize your server
> Use **Time to First Byte (TTFB)** to measure your server response times.

Instead of just immediately serving a static page on a browser request, many server-side web frameworks need to create the web page dynamically. This could be due to pending results from a database query or because components need to be generated into markup by a UI framework. Many **web frameworks that run on the server have performance guidance** that you can use to speed up this process.

If the content on your web page is being hosted on a single server, your website will load slower for users that are geographically farther away because their browser requests literally have to travel around the world. Consider [using a CDN](https://web.dev/content-delivery-networks) to ensure that your users never have to wait for network requests to faraway servers.

If your HTML is static and doesn't need to change on every request, **caching** can prevent it from being recreated unnecessarily. Configure reverse proxies to serve cached content or act as a cache server when installed in front of an application server. Configure and manage your cloud provider's (Firebase, AWS, Azure) cache behavior. 

For many sites, images are the largest element in view when the page has finished loading. 1) Compress images. 2) Convert images into newer formats. 3) Consider using an image CDN.

### Establish third-party connections early
Server requests to third-party origins can also impact LCP. Use `rel="preconnect"` to inform the browser that your page intends to establish a connection as soon as possible. You can also use `dns-prefetch` to resolve DNS lookups faster.

```html
<link rel="preconnect" href="https://example.com">
<link rel="dns-prefetch" href="https://example.com">
```

Modern browsers try their best to anticipate what connections a page will need, but they cannot reliably predict them all. The good news is that you can give them a hint. Adding `rel=preconnect` to a `<link>` informs the browser that your page intends to establish a connection to another domain, and that you'd like the process to start as soon as possible. Resources will load more quickly because the setup process has already been completed by the time the browser requests them.  But it's ultimately up to the browser to decide whether to execute them. (Setting up and keeping a connection open is a lot of work, so the browser might choose to ignore resource hints or execute them partially depending on the situation.)

While `dns-prefetch` only performs a DNS lookup, `preconnect` establishes a connection to a server. This process includes DNS resolution, as well as establishing the TCP connection, and performing the TLS handshake. If a page needs to make connections to many third-party domains, preconnecting all of them is counterproductive. **The preconnect hint is best used for only the most critical connections. For all the rest, use `<link rel=dns-prefetch>` to save time on the first step, the DNS lookup**.

> The logic behind pairing these hints is because support for `dns-prefetch` is better than support for `preconnect`. Browsers that don’t support `preconnect` will still get some added benefit by falling back to `dns-prefetch`. Because this is an HTML feature, it is very fault-tolerant. If a non-supporting browser encounters a `dns-prefetch` hint—or any other resource hint—your site won’t break.

### Render blocking JavaScript and CSS
Before a browser can render any content, it needs to parse HTML markup into a DOM tree. The HTML parser will pause if it encounters any external stylesheets (`<link rel="stylesheet">`) or synchronous JavaScript tags (`<script src="main.js">`). Scripts and stylesheets are both render blocking resources which delay FCP, and consequently LCP. (Additionally, if CSS appears before a script, the script will not be executed until the CSSOM is created because JavaScript can also interact with the CSSOM.) Defer any non-critical JavaScript and CSS to speed up loading of the main content of your web page.

**Minify CSS**, if you use a module bundler or build tool, include an appropriate plugin to minify CSS files on every build. Use the `Coverage` tab in Chrome DevTools (`cmd + shift + p`, then type 'coverage') to **find any unused CSS** on your web page. **Inlining important styles** eliminates the need to make a round-trip request to fetch CSS. If you cannot manually add inline styles to your site, use a library to automate the process.

> Take font inlining as an example, Next.js and Angular have support for inlining Google and Adobe fonts. They will download the content of `<link rel='stylesheet' href='https://fonts.googleapis.com/xxx' />` at build time, and inline it's content (replace link tag with a style tag) at serve/render time. This eliminates the extra round trip that the browser has to make to fetch the font declarations.

If you know that a particular resource should be prioritized, use `<link rel="preload">` to fetch it sooner. By preloading a certain resource, you are telling the browser that you would like to fetch it sooner than the browser would discover it because you are certain that it is important for the current page. (**Preloading is best suited for resources typically discovered late by the browser**). The browser caches preloaded resources so they are available immediately when needed. It doesn't execute the scripts or apply the stylesheets. Supplying the `as` attribute helps the browser set the priority of the prefetched resource according to its type and determine whether the resource already exists in the cache.

```html
<link rel="preload" as="script" href="script.js">
<link rel="preload" as="style" href="style.css">
<link rel="preload" as="image" href="img.png">

<!-- use `crossorigin` to ensure CORS because font requests are CORS requests -->
<link
  rel="preload"
  href="/path/to/font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Another one, `<link rel="prefetch">` is a low priority resource hint that allows the browser to fetch resources in the background (idle time) that might be needed later, and store them in the browser's cache. It is helpful when you know you’ll need that resource on a subsequent page, and you want to cache it ahead of time.

There’re six `<link rel>` tags that instruct the browser to preload something: [Preload, prefetch and other <link> tags](https://3perf.com/blog/link-rels/)

> Resource hints like `preconnect` and `dns-prefetch` are executed as the browser sees fit. The `preload`, on the other hand, is mandatory for the browser. Modern browsers are already pretty good at prioritizing resources, that's why it's important to use `preload` sparingly and only preload the most critical resources.

For script tags, **`<script async>`** downloads the file during HTML parsing and will pause the HTML parser to execute it when it has finished downloading. Async scripts are executed as soon as the script is loaded, so it doesn't guarantee the order of execution. **`<script defer>`** downloads the file during HTML parsing and will only execute it after the parser has completed. Defer scripts are guaranteed to execute in the order that they appear in the document. Typically you want to use `async` where possible, then `defer` then no attribute. 

Chrome 107 comes with a new `renderBlockingStatus` field on ResourceTiming entries. Use it to find and monitor all the render blocking resources in a page.
```js
// get all resources
window.performance.getEntriesByType('resource')
  // filter out the blocking ones and log their names
  .filter(({renderBlockingStatus}) => renderBlockingStatus === 'blocking')
  .forEach(({name}) => console.log(name))
```

### Best practices for fonts

- https://web.dev/font-best-practices
- https://www.lydiahallie.io/blog/optimizing-webfonts-in-nextjs-13
- https://github.com/system-fonts/modern-font-stacks

A font stack is a list of fonts in the CSS font-family declaration. The fonts are listed in order of preference that you would like them to appear in case of a problem, such as a font not loading. A font stack usually ends with a generic font classification (`serif` or `sans-serif`).

Before diving into best practices for font loading it's important to understand how `@font-face` works and how this impacts font loading. The `@font-face` declaration is an essential part of working with any web font. At a minimum, it declares the name that will be used to refer to the font and indicates the location of the corresponding font file.

```css
@font-face {
  font-family: "Open Sans";
  src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");
}

h1 {
  font-family: "Open Sans"
}
```

A common misconception is that a font is requested when a `@font-face` declaration is encountered—this is not true. By itself, `@font-face` declaration does not trigger font download. Rather, a font is downloaded only if it is referenced by styling that is used on the page. In other words, in the example above, `Open Sans` would only be downloaded if the page contained a `<h1>` element.

Most sites would strongly benefit from inlining font declarations and other critical styling in the `<head>` of the main document rather than including them in an external stylesheet. This allows the browser to discover the font declarations sooner as the browser doesn't need to wait for the external stylesheet to download. Note that inlining the font files themselves is not recommended. Inlining large resources like fonts is likely to delay the delivery of the main document.

If your site loads fonts from a third-party site, it is highly recommended that you use the `preconnect` resource hint to establish early connections with the third-party origin. To preconnect the connection that is used to download the font file, add a separate preconnect resource hint that uses the `crossorigin` attribute. Unlike stylesheets, font files must be sent over a CORS connection.

```html
<head>
  <!-- These link tags should be placed as early in the document as possible. -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</head>
```

Font files typically include a large number of glyphs for all the various characters they support. But you may not need all the characters on your page and can reduce the size of font files by subsetting fonts. The [unicode-range](https://developer.mozilla.org/docs/Web/CSS/@font-face/unicode-range) descriptor in the `@font-face` declartion informs the browser which characters a font can be used for. It is commonly used to serve different font files depending on the language used by page content.

```css
@font-face {
  font-family: "Open Sans";
  src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2");
  unicode-range: U+0025-00FF;
}
```

The fastest font to deliver is a font that isn't requested in the first place. A **system font** is the default font used by the user interface of a user's device. System fonts typically vary by operating system and version. Because the font is already installed, the font does not need to be downloaded. To use the system font in your CSS, list `system-ui` as the font-family.

When faced with a web font that has not yet loaded, the browser is faced with a dilemma: should it hold off on rendering text until the web font has arrived? Or should it render the text in a fallback font until the web font arrives? Different browsers handle this scenario differently. By default, Chromium-based and Firefox browsers will block text rendering for up to 3 seconds if the associated web font has not loaded; Safari will block text rendering indefinitely. This behavior can be configured by using the [font-display](https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display) attribute, which informs the browser how it should proceed with text rendering when the associated web font has not loaded.

### More to read
- Web Performance 101: https://3perf.com/talks/web-perf-101/
- A collection of the best practices that the Chrome DevRel team believes are the most effective ways to improve Core Web Vitals performance in 2023: https://web.dev/top-cwv-2023
- Web Performance Snippets: https://github.com/nucliweb/webperf-snippets
