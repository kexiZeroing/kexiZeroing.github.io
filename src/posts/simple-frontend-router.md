---
layout: "../layouts/BlogPost.astro"
title: "Simple frontend router"
slug: simple-frontend-router
description: ""
added: "Aug 18 2020"
tags: [code]
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
