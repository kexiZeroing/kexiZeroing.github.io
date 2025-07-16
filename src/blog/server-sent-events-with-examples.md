---
title: "Server-sent events with examples"
description: ""
added: "Mar 26 2023"
tags: [js]
updatedDate: "July 15 2025"
---

Ways to implement real-time updates before SSE:
- In polling, client makes the request to the server repeatedly in hope for new data. Just wrap your API call with `setInterval`. Long polling means that instead of sending a response immediately, server waits until it has some new data for client.
- WebSockets are initiated via an HTTP request for a handshake, and if accepted, the connection is upgraded to the WebSocket protocol over the existing TCP connection. They are faster because connection is kept alive and no additional headers are sent with each request. But this is also makes it a bit harder to scale.

## Using server-sent events
With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page. These incoming messages can be treated as *Events + data*. You'll need a bit of code on the server to stream events to the front-end, but the client side code works almost identically to websockets in part of handling incoming events.

`EventSource` is a browser API that allows the client to receive real-time updates from the server over a long-lived HTTP connection. It uses a simple text-based protocol called [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to send data from the server to the client in a unidirectional way. The client can listen to the SSE events using the `EventSource` API, and receive updates as they happen in real-time.

- An `EventSource` instance opens a **persistent connection** to an HTTP server which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.
- Unlike WebSockets, server-sent events are unidirectional; that is, data messages are delivered in one direction, from the server to the client. That makes them an excellent choice when there's no need to send data from the client to the server in message form. For example, handling things like social media status updates or news feeds.
- One potential downside of using Server-Sent Events is the limitations in data format. Since SSE is restricted to transporting UTF-8 messages, binary data is not supported. **When not used over HTTP/2, another limitation is the restricted number of concurrent connections per browser**. With only six concurrent open SSE connections allowed at any given time, opening multiple tabs with SSE connections can become a bottleneck.

```js
const express = require('express');
const app = express();

app.get('/real-time-updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const id = Date.now();

  setInterval(() => {
    const data = {
      id,
      number: Math.floor(Math.random() * 100),
    };

    // Use `res.write()` to send data to client.
    // If we use `res.send()` or `res.end()` it will close the connection.
    // `res.send()` is in Express, not in Node.js
    res.write(`id: ${data.id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 1000);
});

app.listen(3000, () => console.log('Listening on port 3000...'));
```

```html
<body>
  <h1>Random Numbers:</h1>
  <ul id="numbers"></ul>

  <script>
    const numbers = document.getElementById('numbers');

    const eventSource = new EventSource('http://localhost:3000/real-time-updates');

    // eventSource.addEventListener('message', (event) => {}, false)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      numbers.innerHTML += `<li>${data.number}</li>`;
    };

    eventSource.onerror = () => console.log('Something went wrong.');

    // We also have a `close` method that can be used to close the connection anytime.
  </script>
</body>
```

```
# Minimum viable SSE response
> GET /stream/hello HTTP/1.1

< HTTP/1.1 200 OK
< Content-Type: text/event-stream

# Events sperated by two newline characters \n\n
# `id` and `event` fields are optional, while `data` is required.
< data: Hello\n\n

< data: Are you there?\n\n

# Custom named events with event identifiers
< id: 1
< event: status
< data: {"msg": "hi"}\n\n
```

### Client-side considerations
When an SSE connection drops, the browser automatically reconnects and sends the last event ID it received via the "Last-Event-ID" header. The server uses this to determine which events to send, avoiding duplicates. The EventSource API handles this automatically as long as you:
1. Include the `id:` field in your SSE format
2. Support "Last-Event-ID" header on your server

> The `id:` line sets the event ID for a particular message. When the browser receives it, it automatically stores the value in the background. If `id` is omitted, the browser does not track any event ID and will not send a Last-Event-ID on reconnect.

With the default browser EventSource API, you can only make GET requests, and you cannot pass in a request body and custom request headers. [fetch-event-source](https://github.com/Azure/fetch-event-source) from Azure provides a better API for making Event Source requests. It works by making a fetch request to a streaming endpoint and reading the response using a `ReadableStream`. As data arrives, it decodes the chunks and parses them using the SSE format.

```js
import { fetchEventSource } from '@microsoft/fetch-event-source';

const ctrl = new AbortController();
await fetchEventSource('/api/sse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    foo: 'bar'
  }),
  signal: ctrl.signal,
  onopen(response) { },
  onclose() { },
  onmessage(message) { },
});
```

## Server-side streams
Streaming is the action of rendering data on the client progressively while it's still being generated on the server. As data arrives in chunks, it can be processed without waiting for the entire payload. This can significantly enhance the perceived performance of large data loads or slow network connections. Streaming is the basis for HTML5 server-sent events.

What if one wanted to build a server which responded with a message every second? This can be achieved by combining `ReadableStream` with `setInterval`. Additionally, by setting the content-type to `text/event-stream` and prefixing each message with `"data: "`, Server-Sent Events make for easy processing using the EventSource API.

```js
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const msg = new TextEncoder().encode("data: hello\n\n");

serve(async (_) => {
  let timerId;
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

`TextEncoder` is used here to convert a string into binary data, so it can be used with APIs that expect binary chunks. **`Uint8Array` is how you work with binary data in JavaScript.**

`TextEncoder` and `TextDecoder` are used to convert between strings and Uint8Arrays. TextEncoder only supports UTF-8 encoding, while TextDecoder can support various encodings.

```js
const text = "hello";
// Converts string to Uint8Array using UTF-8 encoding
const encoded = new TextEncoder().encode(text);
console.log(encoded); // Uint8Array: [104, 101, 108, 108, 111]

// Decode: Uint8Array -> string
const decoder = new TextDecoder();
const decoded = decoder.decode(encoded);
console.log(decoded); // 'hello'
```

### React Suspense and streaming HTML updates
One of the practices that has many performance benefits is to change the HTML content during streaming. A clear example is React Suspense. The idea is to show empty content (placeholder, skeleton, or spinner) while loading the rest of the HTML. Once the server has the missing content then in streaming-time it changes it. (Browsers are smart enough to execute small JS scripts during streaming.)

```js
// Refer to: https://aralroca.com/blog/html-node-streaming
return new Response(
  new ReadableStream({
    async start(controller) {
      const suspensePromises = []

      controller.enqueue(encoder.encode('<html lang="en">'))
      controller.enqueue(encoder.encode('<head>'))
      // Load the code to allow "unsuspense"
      controller.enqueue(
        enconder.encode('<script src="unsuspense.js"></script>')
      )
      controller.enqueue(encoder.encode('</head>'))
      controller.enqueue(encoder.encode('<body>'))

      // Add a placeholder (suspense)
      controller.enqueue(
        encoder.encode('<div id="suspensed:1">Loading...</div>')
      )

      // Load the content - without "await"
      suspensePromises.push(
        computeExpensiveChunk().then((content) => {
          // enqueue the real content
          controller.enqueue(
            encoder.encode(
              `<template id="suspensed-content:1">${content}</template>`
            )
          )
          // enqueue the script to replace the suspensed content to the real one
          controller.enqueue(encoder.encode(`<script>unsuspense('1')</script>`))
        })
      )

      controller.enqueue(encoder.encode('<div class="foo">Bar</div>'))
      controller.enqueue(encoder.encode('</body>'))
      controller.enqueue(encoder.encode('</html>'))

      // Wait for all suspended content before closing the stream
      await Promise.all(suspensePromises)

      controller.close()
    },
  })
)
```

## Download streamed data using vanilla JavaScript
- Consume Web streams from OpenAI using vanilla JavaScript: https://umaar.com/dev-tips/269-web-streams-openai/
- Parsing Server-Sent Events from an API: https://gist.github.com/simonw/209b46563b520d1681a128c11dd117bc

```js
const url = "https://api.openai.com/v1/chat/completions";
const apiKey = `your_api_key_here`;
// Create an AbortController to control and cancel the fetch request, 
// when the user hits the stop button.
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

const decoder = new TextDecoder();

for await (const chunk of response.body) {
  const decodedChunk = decoder.decode(chunk);

  // Clean up the data
  const lines = decodedChunk
    .split("\n") // Split by newline because server sends SSE lines
    .map((line) => line.replace("data: ", ""))
    .filter((line) => line.length > 0)
    .filter((line) => line !== "[DONE]")
    .map((line) => JSON.parse(line));

  for (const line of lines) {
    const {
      choices: [
        { 
          delta: { content },
        },
      ],
    } = line;

    if (content) {
      // It is faster, avoids re-parsing existing content
      document.querySelector("#content").append(content);
    }
  }
}
```
