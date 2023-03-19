---
layout: "../layouts/BlogPost.astro"
title: "What is Nginx"
slug: what-is-nginx
description: ""
added: "Nov 3 2022"
tags: [devops]
---

Developers started simply using the app as an HTTP server. You can serve your node.js application without using any other web servers. Other web development frameworks in Go, Java and Swift also do this. When you serve a node.js app, note that you are the author of your own web server. Any potential bug in your app is a directly exploitable bug on the internet. Some people are not comfortable with this. Adding a layer of Apache or Nginx in front of your app (proxies the requests to a node.js server) means that you have a battle-tested, security-hardened piece of software on the live internet as an interface to your app.

Nginx (pronounced "engine-x") is open source software for web serving, reverse proxying, caching, load balancing, media streaming, and more. It started out as a web server designed for maximum performance and stability.

### Nginx as a reverse proxy
Many modern web applications written in Node.js or Angular can run with their own standalone server but they lack a number of advanced features like load balancing, security, and acceleration that most of these applications demands. Nginx with its advanced features can act as a reverse proxy while serving the request for a Node.js application. The servers that Nginx proxies requests to are known as **upstream servers**.

> **Forward proxies** are crucial for privacy and security when browsing the internet, accessing geo-restricted content, web scraping, and much more. **Reverse proxies** are important for websites with many visitors daily because they help avoid overloading and are a perfect fit for caching content, SSL encryption.

<img alt="nginx" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vxvgGly1h7rrtzcyydj30ww0magnw.jpg" width="700" >

Create a `server` block that will act as a reverse proxy. **The `proxy_pass` directive in the configuration makes the server block a reverse proxy**. All traffic destined to the domain `SUBDOMAIN.DOMAIN.TLD` and those matches with `location` block will be forwarded to `http://PRIVATE_IP:3000` where the node.js or angular application is running. When Nginx proxies a request, it automatically makes some adjustments to the request headers it receives from the client. To adjust or set headers, we can use the `proxy_set_header` directive. For example, the "Host" header by default will be set to the value of `$proxy_host`, a variable that will contain the domain name or IP address taken directly from the `proxy_pass` directive. It can also be set to `$host` which is equal to the "Host" in the header of the request.

```nginx
server {  
  listen 80;
  server_name SUBDOMAIN.DOMAIN.TLD;
  location / {  
    proxy_pass http://PRIVATE_IP:3000;  
    proxy_http_version 1.1;  
    proxy_set_header Host $host;  
  }  
}
```

### Nginx Load Balancing
Nginx can also be configured to act as a load balancer that can handle a large number of incoming connections and distribute them to separate upstream servers for processing thereby achieving fault tolerance and better performance of deployed applications. To configure Nginx as a load balancer, the first step is to include the `upstream` in the configuration. Once upstream servers have been defined, you just need to refer them in the `location` block by using `proxy_pass` directive. For example, whenever traffic arrives at port 80 for the domain `SUBDOMAIN.DOMAIN.TLD`, Nginx will forward the request to each upstream servers one by one. The default method of choosing an upstream server will be round robin.

- **round robin**: distributes the traffic to upstream servers equally and is the default scheme if you don’t specify. Each upstream server is selected one by one in turn according to the order you place them in the configuration file. 
- **least connected**: assigns the request to the upstream server with the least number of active connections. To configure the least connected load balancing, add `least_conn` directive at the first line within the upstream module.
- **IP hash**: selects an upstream server by generating a hash value based on the client’s IP address as a key. This allows the request from clients to be forwarded to the same upstream server provided it is available and the clients IP address has not changed. Add `ip_hash` directive at the first line within the upstream module.
- **weighted method**: the upstream server with the highest weight is selected most often. This scheme is useful in the situation where the upstream server’s resources are not equal and favors the one with better available resources. Add `weight` directive after the URL parameter in the upstream section.

```nginx
# nginx.conf
# backend_servers is the upstream module name
upstream backend_servers {
  # may specify load balancing method here
  server 10.0.2.144;
  server 10.0.2.42;
  server 10.0.2.44;
}

server {
  listen 80; 
  server_name SUBDOMAIN.DOMAIN.TLD;
  location / {
    proxy_pass http://backend_servers;
    proxy_set_header Host $host;   
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Nginx and API gateway
API gateway is an API management tool that sits between a client and a collection of backend services. It acts as a reverse proxy to accept all API calls, takes request and redirects them to the right service.

It is easier to think about them if you realize they aren't mutually exclusive. Think of an API gateway as a specific type reverse proxy implementation. API gateway can be configured dynamically via API and potentially via UI, while traditional reverse proxy (like Nginx or Apache) is configured via config file and has to be restarted when configuration changes.

> It is not uncommon to see both used in conjunction where the API gateway is treated as an application tier that sits behind a reverse proxy for load balancing and health checking. As you take a basic reverse proxy setup and start adding on more pieces like authentication, rate limiting, dynamic config updates, and service discovery, people are more likely to call that an API gateway.

Typically the types of functions the gateway may provide may include:
- access control, filtering traffic so only authenticated/authorized traffic gets through.
- rate limiting, restricting how much traffic can be sent by each client of the API.
- analytics capture and logging, tracking what's going on on the API.
- security filtering, checking the content on incoming messages for attacks.
- traffic routing, sending traffic to different endpoints in your own infrastructure depending on the sender or the request.

<img alt="gateway" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/e6c9d24ely1h61oh00uc2j20tq14y42a.jpg" width="500" >

API Gateway and Load Balancer are two different things. Load Balancer works at protocol or socket level (eg. tcp, http, or port 3306 etc). Its job is to balance the incoming traffic by distributing it to the destinations with various logics. It doesn't offer features such as authorization checks, authentication of requests etc.

### Nginx command line
NGINX has only a few command-line parameters, and the configuration is done entirely via the configuration file (`/usr/local/etc/nginx/nginx.conf`).

|  |  |
|  ---  | --- |
| nginx             | start NGINX (`brew install nginx`)
| nginx -s stop     | quick shutdown
| nginx -s quit     | graceful shutdown
| nginx -s reload   | reloade the configuration file
| nginx -c filename | specify a configuration file which is not default
| nginx -t          | don’t run, just test the configuration file 
| nginx -v          | print version
| nginx -V          | print NGINX version, compiler version and configure parameters

The tool you'll ever need to configure your NGINX server: https://do.co/nginxconfig