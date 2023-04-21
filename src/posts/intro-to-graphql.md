---
layout: "../layouts/BlogPost.astro"
title: "Intro to GraphQL"
slug: intro-to-graphql
description: ""
added: "Nov 7 2022"
tags: [web]
updatedDate: "Nov 07 2022"
---

HTTP is commonly associated with REST, which uses "resources" as its core concept. In contrast, GraphQL's conceptual model is an entity graph. It was created by Facebook in 2012 and open-sourced in 2015. GraphQL is not dealing with dedicated resources. Instead everything is regarded as a graph and therefore is connected. You can combine different entities in one query and you are able to specific which attributes should be included in the response on every level.

It is common to fetch more data than you need in REST as each endpoint includes a settled data formation. There are situations where you may need only 2-3 values but you get around 20-25 values as the response. Similarly, with REST it’s comparatively easier to under fetch the dataset, enabling clients to make additional requests to get relevant data. GraphQL provides a declarative syntax that allows clients to specify which fields they need exactly, so the clients can only get what they actually need from the server.

A GraphQL server operates on a single URL endpoint, usually `/graphql`, and all GraphQL requests for a given service should be directed at this endpoint. When receiving an HTTP GET request, the GraphQL query should be specified in the `?query` query string. A standard GraphQL POST request should use the `application/json` content type, and include a JSON-encoded body as the GraphQL query string.

Here are good resources to learn GraphQL:  
- https://www.taniarascia.com/introduction-to-graphql
- https://www.taniarascia.com/graphql-server-node

### GraphQL client and server implementations
- GraphQL.js (https://github.com/graphql/graphql-js): The JavaScript reference implementation of the GraphQL specification. It is a general-purpose library and can be used both in a Node server and in the browser. 

- Apollo Server (https://github.com/apollographql/apollo-server): A set of GraphQL server packages from Apollo that work with various Node.js HTTP frameworks like Express (most popular), Hapi, Koa, etc.

- Express GraphQL (https://github.com/graphql/express-graphql): The reference implementation of a GraphQL API server over an Express webserver. You can use this to run GraphQL in conjunction with a regular Express webserver, or as a standalone GraphQL server.

- Apollo Client (https://github.com/apollographql/apollo-client): It is a fully-featured caching GraphQL client with integrations for React, Angular, and more. It allows you to easily build UI components that fetch data via GraphQL.

- Relay (https://github.com/facebook/relay): Facebook's framework for building data-driven React applications that talk to a GraphQL backend.

- GraphiQL (https://github.com/graphql/graphiql): An interactive in-browser GraphQL IDE intended for development purposes. We can test most of the features of GraphQL server using GraphiQL.
