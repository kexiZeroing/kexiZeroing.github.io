---
title: "Simple frontend router"
description: ""
added: "Aug 18 2020"
tags: [code]
updatedDate: "Mar 26 2023"
---

Change URL without refreshing the page:
- hashchange event
- HTML5 history API

### Router based on hashchange
```html
<body>
  <ul>
    <li><a href="#/home">home</a></li>
    <li><a href="#/about">about</a></li>

    <div id="routeView"></div>
  </ul>

  <script>
    window.addEventListener('DOMContentLoaded', onLoad);
    window.addEventListener('hashchange', onHashChange);

    var routerView = null;

    // hashchange event need to be triggered manually after page loads
    function onLoad () {
      routerView = document.querySelector('#routeView');
      onHashChange();
    }

    function onHashChange () {
      switch (location.hash) {
        case '#/home':
          routerView.innerHTML = 'Home';
          return;
        case '#/about':
          routerView.innerHTML = 'About';
          return;
        default:
          return;
      }
    }
  </script>
</body>
```

### Router based on History API
```html
<body>
  <ul>
    <li><a href='/home'>home</a></li>
    <li><a href='/about'>about</a></li>

    <div id="routeView"></div>
  </ul>

  <script>
    window.addEventListener('DOMContentLoaded', onLoad);
    window.addEventListener('popstate', onPopState);

    var routerView = null;

    function onLoad () {
      routerView = document.querySelector('#routeView');
      onPopState();

      var linkList = document.querySelectorAll('a[href]');
      linkList.forEach(el => el.addEventListener('click', function (e) {
        // prevent default behavior for <a> tag
        e.preventDefault();
        // pushState(state, unused, url)
        // 1. adds an entry to the browser's session history stack
        // 2. browser won't attempt to load this URL after a call to pushState()
        history.pushState(null, '', el.getAttribute('href'));
        onPopState();
      }))
    }

    function onPopState () {
      switch (location.pathname) {
        case '/home':
          routerView.innerHTML = 'Home';
          return;
        case '/about':
          routerView.innerHTML = 'About';
          return;
        default:
          return;
      }
    }
  </script>
</body>
```

While SPAs have been able to bring you this feature via the History API (or in limited cases, by adjusting the site's #hash part), it's a clunky API developed long-before SPAs were the norm, and the web is crying out for a completely new approach. [The Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api), launched in Chrome 102, is a proposed API that completely overhauls this space, rather than trying to simply patch History API's rough edges.
