---
layout: "../layouts/BlogPost.astro"
title: "Rendering performance"
slug: rendering-performance
description: ""
added: "Oct 16 2021"
tags: [web]
updatedDate: "Sep 9 2024"
---

One factor contributing to a poor user experience is how long it takes a user to see any content rendered to the screen. **First Contentful Paint (FCP)** measures how long it takes for initial DOM content to render, but it does not capture how long it took the largest (usually more meaningful) content on the page to render. **Largest Contentful Paint (LCP)** measures when the largest content element in the viewport becomes visible. It can be used to determine when the main content of the page has finished rendering on the screen.

### Core Web Vitals
Core Web Vitals are the subset of Web Vitals that apply to all web pages, should be measured by all site owners, and will be surfaced across all Google tools. The metrics that make up Core Web Vitals will evolve over time. The current set for 2020 focuses on three aspects of the user experience—*loading, interactivity, and visual stability*—and includes the following metrics:

- **Largest Contentful Paint (LCP)**: measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.
- **First Input Delay (FID)**: measures interactivity. To provide a good user experience, pages should have a FID of 100 milliseconds or less.
- **Cumulative Layout Shift (CLS)**: measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.

[Interaction to Next Paint (INP)](https://web.dev/inp/) is a pending Core Web Vital metric that will replace First Input Delay (FID) in March 2024. INP is a metric that assesses a page's overall responsiveness to user interactions by observing the latency of all click, tap, and keyboard interactions that occur throughout the lifespan of a user's visit to a page. *When reacting to user input, a response slower than `200ms` will be perceived as having to wait.*

While the Core Web Vitals are the critical metrics for understanding and delivering a great user experience, there are other vital metrics as well. For example, the metrics **Time to First Byte (TTFB)** and **First Contentful Paint (FCP)** are both vital aspects of the loading experience.
- TTFB is a good measure of your server response times and general back-end health, and issues here may have knock-on effects later down the line.
- FCP is a measure of your Critical Path, and anything after that event is no longer on your Critical Path at all. This is where your Critical Path ends.

> LCP recommendations
> 1. Ensure the LCP resource is discoverable from the HTML source.
> 2. Ensure the LCP resource is prioritized. (Don't lazy-load your LCP image)
> 3. Use a CDN to optimize document and resource TTFB.
> 
> CLS recommendations
> 1. Set explicit sizes on any content loaded from the page.
> 2. Be eligible for bfcache.
> 3. Avoid animations/transitions that use layout-inducing CSS properties. (Never animate using top / bottom / left / right)

The [web-vitals library](https://github.com/GoogleChrome/web-vitals) is a tiny library for measuring all the Web Vitals metrics on real users, in a way that accurately matches how they're measured by Chrome and reported to other Google tools.

Core Web Vitals are based on field metrics or Real User Metrics (RUM). Google uses anonymized data from Chrome users to feedback metrics and makes these available in the Chrome User Experience Report (CrUX).

The fact that RUM data is used, is an important distinction from synthetic or “lab-based” web performance tools like Lighthouse. These tools run page loads on simulated networks and devices and then tell you what the metrics were for that test run. So if you run Lighthouse on your high-powered developer machine and get great scores, that may not be reflective of what the users experience in the real world, and so what Google will use to measure your website user experience.

#### Soft Navigations
The SPA will respond faster than the traditional HTML website because the entire code is already downloaded, the JavaScript is compiled, and no more client-server communication is needed. However, capturing web performance metrics for a dynamic update of a single HTML page (i.e. soft navigation) is not as straightforward as measuring the performance impact of a static URL change where a real HTML page load takes place.

To measure Core Web Vitals for soft navigations, we need a standardized way that can be used for any SPA, irrespective of the technology it was built with. The defining rules to identify soft navigations and the corresponding technical implementations are still in the drafting stage. According to the current version of the specifications, the following dynamic URL updates qualify as soft navigations:
- The navigation is initiated by a user action.
- The navigation results in a visible URL change to the user, and a history change.
- The navigation results in a DOM change.

Google Chrome’s `web-vitals.js` library has an [experimental soft-nav branch](https://github.com/GoogleChrome/web-vitals/tree/soft-navs#report-metrics-for-soft-navigations-experimental) that already includes working code that you can use to report Web Vitals for soft navigations.

### Optimize your server
Instead of just immediately serving a static page on a browser request, many server-side web frameworks need to create the web page dynamically. This could be due to pending results from a database query or because components need to be generated into markup by a UI framework. Many web frameworks that run on the server have performance guidance that you can use to speed up this process.

> The Server Timing API lets you pass request-specific timing data from your server to the browser using response headers. For example, you can indicate how long it took to look up data in a database for a particular request, which can be useful in debugging performance issues caused by slowness on the server. The Server-Timing header can contain one or more metrics, separated by commas (`Server-Timing: db;dur=53, app;dur=47.2`). Each metric has a name, an optional duration, and an optional description. These components are separated by semi-colons.

If the content on your web page is being hosted on a single server, your website will load slower for users that are geographically farther away because their browser requests literally have to travel around the world. Consider [using a CDN](https://web.dev/content-delivery-networks) to ensure that your users never have to wait for network requests to faraway servers.

If your HTML is static and doesn't need to change on every request, **caching** can prevent it from being recreated unnecessarily. Configure reverse proxies to serve cached content or act as a cache server when installed in front of an application server.

For many sites, images are the largest element in view when the page has finished loading. 1) Compress images. 2) Convert images into newer formats. 3) Consider using an image CDN.

### Establish third-party connections early
Server requests to third-party origins can also impact LCP. Use `rel="preconnect"` to inform the browser that your page intends to establish a connection as soon as possible. You can also use `dns-prefetch` to resolve DNS lookups faster.

```html
<link rel="preconnect" href="https://example.com">
<link rel="dns-prefetch" href="https://example.com">
```

Modern browsers try their best to anticipate what connections a page will need, but they cannot reliably predict them all. The good news is that you can give them a hint. Adding `rel=preconnect` to a `<link>` informs the browser that your page intends to establish a connection to another domain, and that you'd like the process to start as soon as possible. Resources will load more quickly because the setup process has already been completed by the time the browser requests them. But it's ultimately up to the browser to decide whether to execute them. (Setting up and keeping a connection open is a lot of work, so the browser might choose to ignore resource hints or execute them partially depending on the situation.)

While `dns-prefetch` only performs a DNS lookup, `preconnect` establishes a full connection (DNS, TCP, TLS) to a server. This process includes DNS resolution, as well as establishing the TCP connection, and performing the TLS handshake. If a page needs to make connections to many third-party domains, preconnecting all of them is counterproductive. **The preconnect hint is best used for only the most critical connections. For all the rest, use `<link rel=dns-prefetch>` to save time on the first step, the DNS lookup**.

### Render blocking JavaScript and CSS
Before a browser can render any content, it needs to parse HTML markup into a DOM tree. The HTML parser will pause if it encounters any external stylesheets (`<link rel="stylesheet">`) or synchronous JavaScript tags (`<script src="main.js">`). Scripts and stylesheets are both render blocking resources which delay FCP, and consequently LCP. (Additionally, if CSS appears before a script, the script will not be executed until the CSSOM is created because JavaScript can also interact with the CSSOM.) Defer any non-critical JavaScript and CSS to speed up loading of the main content of your web page.

**Minify CSS**, if you use a module bundler or build tool, include an appropriate plugin to minify CSS files on every build. Use the `Coverage` tab in Chrome DevTools to **find any unused CSS** on your web page. **Inlining important styles** eliminates the need to make a round-trip request to fetch CSS. If you cannot manually add inline styles to your site, use a library to automate the process.

> Take font inlining as an example, Next.js and Angular have support for inlining Google and Adobe fonts. They will download the content of `<link rel='stylesheet' href='https://fonts.googleapis.com/xxx' />` at build time, and inline it's content (replace link tag with a style tag) at serve/render time. This eliminates the extra round trip that the browser has to make to fetch the font declarations.

If you know that a particular resource should be prioritized, use `<link rel="preload">` to fetch it sooner. By preloading a certain resource, you are telling the browser that you would like to fetch it sooner than the browser would discover it because you are certain that it is important for the current page. **Preloading is best suited for resources typically discovered late by the browser**. The browser caches preloaded resources so they are available immediately when needed. It doesn't execute the scripts or apply the stylesheets. Supplying the `as` attribute helps the browser set the priority of the prefetched resource according to its type and determine whether the resource already exists in the cache.

```html
<link rel="preload" as="script" href="script.js">
<link rel="preload" as="style" href="style.css">
<link rel="preload" as="image" href="img.png">
```

Another one, `<link rel="prefetch">` is a low priority resource hint that allows the browser to fetch resources in the background (idle time) that might be needed later, and store them in the browser's cache. It is helpful when you know you’ll need that resource on a subsequent page, and you want to cache it ahead of time. Prefetching can be achieved through the use of resource hints such as `rel=prefetch` or `rel=preload`, via libraries such as [quicklink](https://github.com/GoogleChromeLabs/quicklink) or [Guess.js](https://github.com/guess-js/guess). *(Before visitors click on a link, they hover over that link. Between these two events, 200 ms to 300 ms usually pass by. [InstantClick](http://instantclick.io) makes use of that time to preload the page, so that the page is already there when you click.)*

> In Next.js production environment, whenever `<Link>` components appear in the browser's viewport, Next.js automatically prefetches the code for the linked route in the background. By the time the user clicks the link, the code for the destination page will already be loaded in the background, and this is what makes the page transition near-instant.

Resource hints like `preconnect` and `dns-prefetch` are executed as the browser sees fit. The `preload`, on the other hand, is mandatory for the browser. Modern browsers are already pretty good at prioritizing resources, that's why it's important to use `preload` sparingly and only preload the most critical resources.

The `fetchpriority` attribute (available in Chrome 101 or later) is a hint and not a directive. Fetch Priority can also complement `preload`. Include the `fetchpriority` attribute when preloading several resources of the same type and you're clear about which is most important. **The browser assigns a high priority to any render-blocking resource by default.**

> Summary:
> - Warm connections to origins: `rel=preconnect`. Don’t preconnect Too Many Origins.
> - Fetch late-found resources: `rel=preload`
> - Fetch next-page navigations: `rel=prefetch`
> - `rel="prerender"` goes a step beyond prefetching and actually renders the whole page as if the user had navigated to it, but keeps it in a hidden background renderer process ready to be used if the user actually navigates there. (*deprecated*)
> - Read more: [Preload, prefetch and other <link> tags](https://3perf.com/blog/link-rels).

For images loading, the `decoding=async` attribute of the `<img>` is one of the most misunderstood things out there. Images are not typically render-blocking and if they were the web would be a very slow and painful place to be. **Modern browsers all decode images off the main thread** leaving it free for other stuff, and decoding images is very fast compared to network downloads. Don’t worry about setting it. Leave it to the default and move on to more important things. Stop propagating this myth that this is a magic attribute to speed up your images in any noticeable way. Other attributes like `loading=lazy` (on offscreen images only) and `fetchpriority=high` (on important images only) will have a much larger impact.

For script tags, **`<script async>`** downloads the file during HTML parsing and will pause the HTML parser to execute it when it has finished downloading. Async scripts are executed as soon as the script is loaded, so it doesn't guarantee the order of execution. **`<script defer>`** downloads the file during HTML parsing and will only execute it after the parser has completed. The good thing about defer is that you can guarantee the order of the script execution. *When you have both async and defer, `async` takes precedence and the script will be async.* @addyosmani has a good summary about [JavaScript Loading Priorities in Chrome](https://addyosmani.com/blog/script-priorities).

<img alt="JavaScript Loading Priorities" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/addyosmani.com_blog_script-priorities%20(1).png" width="800">

#### APIs to help you assess loading performance in the field
Navigation Timing measures the speed of requests for HTML documents. Resource Timing measures the speed of requests for document-dependent resources such as CSS, JavaScript, images, and so on.

```js
// Get Navigation Timing entries:
performance.getEntriesByType('navigation');

// Get Resource Timing entries:
performance.getEntriesByType('resource');
```

Chrome 107 comes with a new `renderBlockingStatus` field on ResourceTiming entries. Use it to find and monitor all the render blocking resources in a page.
```js
// get all resources
window.performance.getEntriesByType('resource')
  // filter out the blocking ones and log their names
  .filter(({renderBlockingStatus}) => renderBlockingStatus === 'blocking')
  .forEach(({name}) => console.log(name))
```

### Common misconceptions about how to optimize LCP
For most pages on the web, the LCP element is an image. It's natural then to assume that the best way to improve LCP is to optimize your LCP image. However, when we started looking at field performance data for users in Chrome, we found that image download time is almost never the bottleneck. Instead, other parts of LCP are a much bigger problem.

LCP sub-part breakdown: Time to First Byte -> Resource load delay -> Resource load duration -> Element render delay 

1. There is not a lot of time being spent in image load duration. In fact, it's the shortest LCP sub-part, in all LCP buckets. The load duration is longer for poor-LCP origins compared to good-LCP origins, but that's still not where time is largely being spent.
2. For at least half of the origins with poor LCP, the TTFB of 2,270 milliseconds alone nearly guarantees that the LCP can't be faster than the 2.5 second "good" threshold.
3. The median site with poor LCP spends almost four times as long waiting to start downloading the LCP image as it does actually downloading it.

### The Speculation Rules API
- https://developer.chrome.com/docs/web-platform/prerender-pages
- https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules

A page can be prerendered in either of two ways, all of which aim to make navigations quicker:
1. When you type a URL into the Chrome omnibox, Chrome may automatically prerender the page for you, if it has high confidence you will visit that page. (View Chrome's predictions for URLs in the `chrome://predictors` page)
2. Sites can use the *Speculation Rules API*, to programmatically tell Chrome which pages to prerender. This replaces what `<link rel="prerender"...>` used to do and allows sites to proactively prerender a page based on speculation rules on the page.

Developers can insert JSON instructions onto their pages to inform the browser about which URLs to prerender. Speculation rules can be added in either the `<head>` or the `<body>` of the main frame. The `moderate` option is a middle ground, and many sites could benefit from the following speculation rule that would prerender a link when holding the pointer over the link for 200 milliseconds or on the pointerdown event.

Speculation rules can also be used to just prefetch pages, without a full prerender. Unlike the older `<link rel="prefetch">` resource hint which just prefetched to the HTTP disk cache, documents loaded via speculation rules are processed in the same way that navigations are (but then not rendered) and are held in memory so will be available quicker to the browser once needed. *Prefetch speculation rules only prefetch the document, not its subresources.*

```html
<script type="speculationrules">
  {
    "prefetch": [
      {
        "source": "document",
        "where": {
          "selector_matches": "a[href^='/']"
        },
        "eagerness": "immediate"
      }
    ],
    "prerender": [
      {
        "source": "document",
        "where": {
          "selector_matches": "a[href^='/']"
        },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

> 1. Speculation rules can be statically included in the page's HTML, or dynamically inserted into the page by JavaScript based on application logic.
> 2. Speculation rules are for full page navigations, not SPAs. SPAs can still benefit for the initial load.
> 3. Prerendering does use additional memory and network bandwidth. Be careful not to over-prerender, at a cost of user resources. Only prerender when there is a high likelihood of the page being navigated to.
> 4. At present, speculation rules are restricted to pages opened within the same tab, but we are working to reduce that restrictions. By default prerender is restricted to same-origin pages.

### The DOMContentLoaded event
The `DOMContentLoaded` event fires once all of your deferred JavaScript (`<script defer>` and `<script type="module">`) has finished running. It doesn't wait for other things like images, subframes, and async scripts to finish loading. If we want to capture this data more deliberately ourselves, we need to lean on the Navigation Timing API, which gives us access to a suite of milestone timings.

- The `DOMContentLoaded` as measured and emitted by the Navigation Timing API is actually referred to as `domContentLoadedEventStart`.
- `domContentLoadedEventEnd` event captures the time at which all JS wrapped in a `DOMContentLoaded` event listener has finished running.
- `domInteractive` is the event immediately before `domContentLoadedEventStart`. This is the moment the browser has finished parsing all synchronous DOM work. Basically, the browser is now at the `</html>` tag and ready to run your deferred JavaScript.

```js
window.addEventListener('load', (event) => {
  const timings = window.performance.timing;
  const start   = timings.navigationStart;

  console.log('Ready to start running `defer`ed code: ' + (timings.domInteractive - start + 'ms'));
  console.log('`defer`ed code finished: ' + (timings.domContentLoadedEventEnd - start + 'ms'));
  console.log('`defer`ed code duration: ' + (timings.domContentLoadedEventStart - timings.domInteractive + 'ms'));
  console.log('`DOMContentLoaded`- wrapped code duration: ' + (timings.domContentLoadedEventEnd - timings.domContentLoadedEventStart + 'ms'));
});

// PerformanceTiming is deprecated
// Use the PerformanceNavigationTiming interface instead
performance.getEntriesByType('navigation')[0]
```

### Back/forward cache
bfcache has been supported in both Firefox and Safari for many years. Since Chrome version 96, bfcache is enabled for all users across desktop and mobile. bfcache is an in-memory cache that stores a complete snapshot of a page (including the JavaScript heap) as the user is navigating away. With the entire page in memory, the browser can quickly restore it if the user decides to return.

1. If a page contains embedded iframes, then the iframes themselves are not eligible for the bfcache. For example, if you navigate to another page within an iframe, but then go back, the browser will go "back" within the iframe rather than in the main frame, but the back navigation within the iframe won't use the bfcache.
2. Because bfcache works with browser-managed navigations, it doesn't work for "soft navigations" within a single-page app.
3. The `pageshow` event fires right after the `load` event when the page is initially loading and any time the page is restored from bfcache. The `pageshow` event has a `persisted` property, which is true if the page was restored from bfcache and false otherwise.
4. The most important way to optimize for bfcache in all browsers is to never use the `unload` event. This event is extremely unreliable. In most browsers, especially on mobile, the code often won't run and it has a negative impact on a site's performance, by preventing the usage of bfcache. Use the `pagehide` event instead.
5. Any pages using `Cache-Control: no-store` won't be eligible for bfcache.
6. When a page is put into the bfcache, it pauses all scheduled JavaScript tasks and resumes them when the page is taken out of the cache. If your page has open IndexedDB connection, in-progress fetch, or open WebSocket connection, we strongly recommend closing connections during the `pagehide` and reopen or reconnect to those APIs during the `pageshow` event when the page is restored from the bfcache.

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
- A collection of the best practices that the Chrome DevRel team believes are the most effective ways to improve Core Web Vitals performance: https://web.dev/articles/top-cwv
- Web Performance Snippets: https://github.com/nucliweb/webperf-snippets
- Get All That Network Activity Under Control with Priority Hints: https://www.macarthur.me/posts/priority-hints
- Get your `<head>` in order: https://github.com/rviscomi/capo.js
- Inline your app's critical CSS and lazy-load the rest: https://github.com/GoogleChromeLabs/critters
