---
layout: "../layouts/BlogPost.astro"
title: "Simple server-sent events example"
slug: simple-server-sent-events-example
description: ""
added: "Mar 26 2023"
tags: [js]
updatedDate: "June 23 2023"
---

> Read this first: https://vercel.com/blog/an-introduction-to-streaming-on-the-web

## Using server-sent events
With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page. These incoming messages can be treated as Events + data inside the web page.

`EventSource` is a browser API that allows the client (browser) to receive real-time updates from the server over an HTTP connection. It uses a simple text-based protocol called [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to send data from the server to the client in a unidirectional way. The client can listen to the SSE events using the `EventSource` API, and receive updates as they happen in real-time.

> Real-time Updates: [Polling, SSE and WebSockets](https://dev.to/thesanjeevsharma/real-time-updates-polling-sse-and-web-sockets-277i)

- An `EventSource` instance opens a persistent connection to an HTTP server, which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.
- Unlike WebSockets, server-sent events are unidirectional; that is, data messages are delivered in one direction, from the server to the client (such as a user's web browser). That makes them an excellent choice when there's no need to send data from the client to the server in message form. For example, `EventSource` is a useful approach for handling things like social media status updates, news feeds, or delivering data into a client-side storage mechanism like IndexedDB or web storage.

```js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const id = Date.now();

  setInterval(() => {
    const data = {
      id,
      number: Math.floor(Math.random() * 100),
    };
    res.write(`id: ${data.id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 1000);
});

app.listen(3000, () => console.log('Listening on port 3000...'));
```

```html
<!DOCTYPE html>
<html>
<head>
  <title>EventSource Example</title>
</head>
<body>
  <h1>Random Numbers:</h1>
  <ul id="numbers"></ul>

  <script>
    const numbers = document.getElementById('numbers');

    const eventSource = new EventSource('http://localhost:3000/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      numbers.innerHTML += `<li>${data.number}</li>`;
    };
  </script>
</body>
</html>
```

## Server-side streams
What if one wanted to build a server which responded with a message every second? This can be achieved by combining `ReadableStream` with `setInterval`. Additionally, by setting the content-type to `text/event-stream` and prefixing each message with `"data: "`, Server-Sent Events make for easy processing using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

```js
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const msg = new TextEncoder().encode("data: hello\r\n\r\n");

serve(async (_) => {
  let timerId: number | undefined;
  const body = new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        controller.enqueue(msg);
      }, 1000);
    },
    cancel() {
      if (typeof timerId === "number") {
        clearInterval(timerId);
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
});
```

## Download streamed data using vanilla JavaScript

```js
// Create an AbortController to control and cancel the fetch request
// when the user hits the stop button
const controller = new AbortController();

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Tell me a joke" }],
    temperature: 0.6,
    model: "gpt-3.5-turbo",
    max_tokens: 50,
    stream: true,
  }),
  signal: controller.signal,
});

// Create a TextDecoder to decode the response body stream
// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
const decoder = new TextDecoder();

// Iterate through the chunks in the response body using `for-await...of`
for await (const chunk of response.body) {
  const decodedChunk = decoder.decode(chunk);

  // Clean up the data
  const lines = decodedChunk
    .split("\n")
    .map((line) => line.replace("data: ", ""))
    .filter((line) => line.length > 0)
    .filter((line) => line !== "[DONE]")
    .map((line) => JSON.parse(line));

  // Destructuring
  for (const line of lines) {
    const {
      choices: [
        { 
          delta: { content },
        },
      ],
    } = line;

    if (content) {
      document.querySelector("#content").textContent += content;
    }
  }
}
```
