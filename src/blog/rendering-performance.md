---
title: "Rendering performance"
description: ""
added: "Oct 16 2021"
tags: [web]
updatedDate: "July 19 2025"
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
For at least half of the origins with poor LCP, the TTFB of 2,270 milliseconds alone nearly guarantees that the LCP can't be faster than the 2.5 second "good" threshold. Additionally, the median site with poor LCP spends nearly four times longer waiting to start downloading the main LCP image than it does actually downloading it, highlighting that slow server response and delayed resource fetching are major factors in poor LCP performance.

Instead of just immediately serving a static page on a browser request, many server-side web frameworks need to create the web page dynamically. This could be due to pending results from a database query or because components need to be generated into markup by a UI framework. Many web frameworks that run on the server have performance guidance that you can use to speed up this process.

> The Server Timing API lets you pass request-specific timing data from your server to the browser using response headers. Chrome display Server-Timing entries in the Performance tab (in the waterfall timeline), helping identify slow server components.
> 
> For example, you can indicate how long it took to look up data in a database for a particular request, which can be useful in debugging performance issues caused by slowness on the server. The Server-Timing header can contain one or more metrics, separated by commas (`Server-Timing: db;dur=53, app;dur=47.2`). Each metric has a name, an optional duration, and an optional description. These components are separated by semi-colons.

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
Generally speaking, when loading resources into web pages, there are three possible blocking states: Non-blocking, Render blocking, and Parser blocking.

- Stylesheets block rendering but not parsing. It needs styles to correctly render the content.
- Classic scripts block parsing (and therefore also rendering). The browser stops parsing the HTML entirely until the script is downloaded, parsed, and executed.
- Adding `async`, `defer` or `type=module` attributes allows HTML parsing and initial rendering to begin earlier than a classic script. But only `defer` and `type="module"` guarantee they won’t interfere with rendering.

For script tags, **`<script async>`** downloads the file during HTML parsing and will pause the HTML parser to execute it when it has finished downloading. Async scripts are executed as soon as the script is loaded, so it doesn't guarantee the order of execution. **`<script defer>`** downloads the file during HTML parsing and will only execute it after the parser has completed. The good thing about defer is that you can guarantee the order of the script execution. *When you have both async and defer, `async` takes precedence and the script will be async.*

If you know that a particular resource should be prioritized, use `<link rel="preload">` to fetch it sooner. By preloading a certain resource, you are telling the browser that you would like to fetch it sooner than the browser would discover it because you are certain that it is important for the current page. **Preloading is best suited for resources typically discovered late by the browser**. The browser caches preloaded resources so they are available immediately when needed. It doesn't execute the scripts or apply the stylesheets. Supplying the `as` attribute helps the browser set the priority of the prefetched resource according to its type and determine whether the resource already exists in the cache.

```html
<link rel="preload" as="script" href="script.js">
<link rel="preload" as="style" href="style.css">
<link rel="preload" as="image" href="img.png">
```

Another one, `<link rel="prefetch">` is a low priority resource hint that allows the browser to fetch resources in the background (idle time) that might be needed later, and store them in the browser's cache. It is helpful when you know you’ll need that resource on a subsequent page, and you want to cache it ahead of time.

Tools can be used:
- [quicklink](https://github.com/GoogleChromeLabs/quicklink)
- [Guess.js](https://github.com/guess-js/guess)
- [InstantClick](http://instantclick.io)

> In Next.js production environment, whenever `<Link>` components appear in the browser's viewport, Next.js automatically prefetches the code for the linked route in the background. By the time the user clicks the link, the code for the destination page will already be loaded in the background, and this is what makes the page transition near-instant.
>
> You can opt out of prefetching by setting the `prefetch` prop to `false` on the `<Link>` component. 

Resource hints like `preconnect` and `dns-prefetch` are executed as the browser sees fit. The `preload`, on the other hand, is mandatory for the browser. Modern browsers are already pretty good at prioritizing resources, that's why it's important to use `preload` sparingly and only preload the most critical resources.

The `fetchpriority` attribute (available in Chrome 101 or later) is a hint and not a directive. Fetch Priority can also complement `preload`. Include the `fetchpriority` attribute when preloading several resources of the same type and you're clear about which is most important. **The browser assigns a high priority to any render-blocking resource by default.**

> Summary:
> - Warm connections to origins: `rel=preconnect`. Don’t preconnect Too Many Origins.
> - Fetch late-found resources: `rel=preload`
> - Fetch next-page navigations: `rel=prefetch`
> - Read more: [Preload, prefetch and other <link> tags](https://3perf.com/blog/link-rels).

For images loading, the `decoding=async` attribute of the `<img>` is one of the most misunderstood things out there. Images are not typically render-blocking and if they were the web would be a very slow and painful place to be. **Modern browsers all decode images off the main thread** leaving it free for other stuff, and decoding images is very fast compared to network downloads. Don’t worry about setting it. Leave it to the default and move on to more important things. Stop propagating this myth that this is a magic attribute to speed up your images in any noticeable way. Other attributes like `loading=lazy` (on offscreen images only) and `fetchpriority=high` (on important images only) will have a much larger impact.

> When an image appears to load gradually from top to bottom, it's because it's being downloaded sequentially (the byte stream is arranged top-down). As data arrives, the browser begins rendering the image line by line. Decoding plays a role but is typically fast enough not to be noticeable.

@addyosmani [JavaScript Loading Priorities in Chrome](https://addyosmani.com/blog/script-priorities):
<img alt="JavaScript Loading Priorities" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/addyosmani.com_blog_script-priorities%20(1).png" width="800">

### The DOMContentLoaded event
The `DOMContentLoaded` event fires once all of your deferred JavaScript (`<script defer>` and `<script type="module">`) has finished running. It doesn't wait for other things like images, subframes, and async scripts to finish loading.

- The `DOMContentLoaded` as measured and emitted by the Navigation Timing API is actually referred to as `domContentLoadedEventStart`.
- `domContentLoadedEventEnd` event captures the time at which all JS wrapped in a `DOMContentLoaded` event listener has finished running.
- `domInteractive` is the event before `domContentLoadedEventStart`. This is the moment the browser has finished parsing all synchronous DOM work. Basically, the browser is now at the `</html>` tag and ready to run your deferred JavaScript.

```js
window.addEventListener('load', (event) => {
  const timings = window.performance.timing;
  const start   = timings.navigationStart;

  console.log('Ready to start running `defer`ed code: ' + (timings.domInteractive - start + 'ms'));
  console.log('`defer`ed code finished: ' + (timings.domContentLoadedEventEnd - start + 'ms'));
  console.log('`defer`ed code duration: ' + (timings.domContentLoadedEventStart - timings.domInteractive + 'ms'));
  console.log('`DOMContentLoaded`- wrapped code duration: ' + (timings.domContentLoadedEventEnd - timings.domContentLoadedEventStart + 'ms'));
});
```

### The Speculation Rules API
A page can be prerendered in one of four ways, all of which aim to make navigations quicker:
1. When you type a URL into the Chrome omnibox, Chrome may automatically prerender the page for you, if it has high confidence you will visit that page. (View Chrome's predictions for URLs in the `chrome://predictors` page)
2. When you use the bookmarks bar, Chrome may automatically prerender the page for you on holding the pointer over one of the bookmark buttons.
3. When you type a search term into the Chrome address bar, Chrome may automatically prerender the search results page, when instructed to do so by the search engine.
4. Sites can use the Speculation Rules API, to programmatically tell Chrome which pages to prerender. This replaces what `<link rel="prerender"...>` *(deprecated)* used to do and allows sites to proactively prerender a page based on speculation rules on the page.

Developers can insert JSON instructions onto their pages to inform the browser about which URLs to prerender. Speculation rules can be added in either the `<head>` or the `<body>` of the main frame. To specify the pages you want prerendered, you can use two types of rules:
- URL List Rules: Use a list of URL strings to specify which pages to prerender.
- Document Rules: Use conditions to determine when a page should be prerendered.

The speculation rules API allows you to specify an `eagerness` setting to control when a page is prerendered.
- immediate: The page is prerendered or prefetched immediately.
- moderate: The page is prerendered or prefetched when the user hovers over a link for 200 milliseconds.
- conservative: The page is prerendered or prefetched when the user initiates a click on the link.

Speculation rules can also be used to just prefetch pages, without a full prerender. You can think of prefetching as a lighter version of prerendering. Prefetch speculation rules only prefetch the document, not its subresources.

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
> 3. At present, speculation rules are restricted to pages opened within the same tab, but we are working to reduce that restrictions. By default prerender is restricted to same-origin pages.

### Back/forward cache
bfcache has been supported in both Firefox and Safari for many years. Since Chrome version 96, bfcache is enabled for all users across desktop and mobile. bfcache is an in-memory cache that stores a complete snapshot of a page (including the JavaScript heap) as the user is navigating away. With the entire page in memory, the browser can quickly restore it if the user decides to return.

Some common reasons why bfcache might not work:
- The page has unload or beforeunload event handlers.
- The page keeps active connections (WebSocket, media streams).
- The page is using `Cache-Control: no-store`.

If you want to check if your page is eligible for bfcache, Chrome DevTools has a bfcache indicator in the Performance tab. The `pageshow` event fires right after the `load` event when the page is initially loading and any time the page is restored from bfcache. The `pageshow` event has a `persisted` property, which is true if the page was restored from bfcache and false otherwise.

### Best practices for fonts

- https://web.dev/font-best-practices
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

> If you're not into fonts and just want a nice sans-serif font, use `font-family: system-ui, sans-serif;` and move on with your life.

When faced with a web font that has not yet loaded, the browser is faced with a dilemma: should it hold off on rendering text until the web font has arrived? Or should it render the text in a fallback font until the web font arrives? Different browsers handle this scenario differently. By default, Chromium-based and Firefox browsers will block text rendering for up to 3 seconds if the associated web font has not loaded; Safari will block text rendering indefinitely. This behavior can be configured by using the [font-display](https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display) attribute, which informs the browser how it should proceed with text rendering when the associated web font has not loaded.

### More to read
- Web Performance 101: https://3perf.com/talks/web-perf-101/
- A collection of the best practices that the Chrome DevRel team believes are the most effective ways to improve Core Web Vitals performance: https://web.dev/articles/top-cwv
- Web Performance Snippets: https://github.com/nucliweb/webperf-snippets
- Get All That Network Activity Under Control with Priority Hints: https://www.macarthur.me/posts/priority-hints
- Get your `<head>` in order: https://github.com/rviscomi/capo.js
- Inline your app's critical CSS and lazy-load the rest: https://github.com/GoogleChromeLabs/critters
- Blazing Fast Websites with Speculation Rules: https://www.debugbear.com/blog/speculation-rules