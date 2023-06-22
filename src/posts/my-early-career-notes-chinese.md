---
layout: "../layouts/BlogPost.astro"
title: "My early career notes (in Chinese)"
slug: my-early-career-notes-chinese
description: ""
added: "Apr 24 2016"
tags: [web]
updatedDate: "June 22 2023"
---

> 将早期工作刚接触 Web 开发不久时的笔记（原先记录在印象笔记）中有价值的部分提炼出来，记录在这里成为一篇文章，值得纪念。

每台开发机都是一个完整的环境，包括了 nginx, redis 等，即本地拥有服务器。

动态页面不是请求某一个文件，请求某一个文件只能是静态的（js 也属于是静态资源）。浏览器请求的是一个 url，服务端匹配这个 url，配数据和模板去渲染页面，匹配不到就是 404 错误。如果服务器端有错误（smarty 报错，php 报错，数据库报错等）就会返回 500，这些都是服务器端解析的时候发生的错误，而标签、样式、js 等都会在浏览器端解析。所有页面公用一个模板，符合 MVC，PHP 控制器根据 url 的不同，在渲染页面（即调用模板）时 assign 不同的数据。比如 `bj.fang.lianjia.com/loupan/p_aaa/ `和 `bj.fang.lianjia.com/loupan/p_bbb/` 是两个不同的楼盘页面，PHP 控制器会让这样的 url 都调用同一个模板，页面显示同样的布局和样式，只是数据不同（模板和数据是分离的）。

> 在模板文件中查看 php assign 给 tpl 的变量，比如 `<script type="text/javascript">window.aaa = {json_encode($commentlist)}</script>`

一定要分清哪些是在服务器端做的事情，哪些是在浏览器端做的事情。在服务端的又分为 nginx 和 fastCGI 两部分，fastCGI 是由 CGI（common gateway interface，通用网关接口）发展而来，用来提高 CGI 程序的性能，是 http 服务器（nginx、apache）和动态脚本语言（php）之间的通信接口。

Web server（如 nginx）只是内容的分发者。比如，请求 `/index.html`，那么 server 会去文件系统中找到这个文件，发送给浏览器，这里分发的是静态数据。如果现在请求的是 `/index.php`，nginx 知道这个不是静态文件，需要去找 PHP 解析器来处理，那么它会把这个请求简单处理后交给 PHP 解析器。Nginx 会传哪些数据给 PHP 解析器呢？要有 url、查询字符串、POST 数据、HTTP header，CGI 就是规定要传哪些数据、以什么样的格式传递给后方处理这个请求的协议（是 php 文件的执行环境）。接下来 PHP 解析器会解析 `php.ini` 文件，初始化执行环境，然后处理请求，再以 CGI 规定的格式返回处理后的结果，退出进程。最后 server 再把结果返回给浏览器。

不同的项目在不同的机器中，也可以是一台机器（虚拟主机），每个项目对应不同的端口。也可能是同一端口，此时不能直接访问 ip 地址，需要依靠域名区分，比如 `git.lianjia.com` 和 `wiki.lianjia.com` 在同一台机器上，使用的是同一端口，这个时候只能通过域名区分请求，需要 DNS 解析，根据请求找相应的 nginx 配置文件 `/local/nginx1.7.7/conf/virtualhost/xxx.conf`。Nginx 监听某一端口，按照配置文件的规则（过程中可能会有 url rewrite）定位到某一个 php 文件，然后将环境交给 fastCGI。框架中的入口文件有 `APP_MODE`，可以找到项目的配置文件。PHP 根据项目的配置文件进入到某个模块，再根据模块中配置的路由规则，进入到某个 controller 的某个 action，调用 render 函数将结果返回给 nginx，最终返回给浏览器（返回结果是浏览器可以识别的内容）。

关于 URL Rewrite：
- `abc.com/show_a_product.php?product_id=7`
- `abc.com/products/7/`

The problem with the first URL structure is that it is not memorable, but you can tell from the second URL what you're likely to find on that page. Search engines can split that URL into words, and they can use that information to better determine the content of the page. Unfortunately, the second URL cannot be easily understood by a server without some work on our part. When a request is made for that URL, the server needs to work out how to process that URL so that it knows what to send back to the user. **URL rewriting** is a technique used to "translate" a URL like this into something the server can understand. We need to tell the server to internally redirect all requests for the URL "/products" to "show_a_product.php".
