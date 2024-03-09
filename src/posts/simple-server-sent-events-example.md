---
layout: "../layouts/BlogPost.astro"
title: "Simple server-sent events example"
slug: simple-server-sent-events-example
description: ""
added: "Mar 26 2023"
tags: [js]
updatedDate: "Mar 9 2024"
---

Ways to implement real-time updates before SSE:
- In polling, client makes the request to the server repeatedly in hope for new data. Just wrap your API call with `setInterval`. Long polling means that instead of sending a response immediately, server waits until it has some new data for client. *(e.g. Mails dashboard like Gmail)*
- Web Sockets are initiated by an HTTP request for hankshake but later they are upgraded to TCP layer. They are faster because connection is kept alive and no additional headers are sent with each request. But this is also makes it a bit harder to scale. *(e.g., RTC applications)*

## Using server-sent events
With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page. These incoming messages can be treated as *Events + data*. You'll need a bit of code on the server to stream events to the front-end, but the client side code works almost identically to websockets in part of handling incoming events.

`EventSource` is a browser API that allows the client to receive real-time updates from the server over an HTTP connection. It uses a simple text-based protocol called [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to send data from the server to the client in a unidirectional way. The client can listen to the SSE events using the `EventSource` API, and receive updates as they happen in real-time.

- An `EventSource` instance opens a **persistent connection** to an HTTP server, which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.
- Unlike WebSockets, server-sent events are unidirectional; that is, data messages are delivered in one direction, from the server to the client. That makes them an excellent choice when there's no need to send data from the client to the server in message form. For example, handling things like social media status updates or news feeds.
- One potential downside of using Server-Sent Events is the limitations in data format. Since SSE is restricted to transporting UTF-8 messages, binary data is not supported. **When not used over HTTP/2, another limitation is the restricted number of concurrent connections per browser**. With only six concurrent open SSE connections allowed at any given time, opening multiple tabs with SSE connections can become a bottleneck.

```js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

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
</html>
```

```
# Minimum viable SSE response
> GET /stream/hello HTTP/1.1

< HTTP/1.1 200 OK
< Content-Type: text/event-stream

# Events sperated by two newline characters \n\n
< data: Hello\n\n

< data: Are you there?\n\n

# Custom named events with event identifiers
< id: 1
< event: status
< data: {"msg": "hi"}\n\n
```

## Server-side streams
What if one wanted to build a server which responded with a message every second? This can be achieved by combining `ReadableStream` with `setInterval`. Additionally, by setting the content-type to `text/event-stream` and prefixing each message with `"data: "`, Server-Sent Events make for easy processing using the EventSource API.

```js
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const msg = new TextEncoder().encode("data: hello\r\n\r\n");

serve(async (_) => {
  let timerId: number | undefined;
  const body = new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        // Add the message to the stream
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

`start(controller)` method is called immediately when the object is constructed. It aims to get access to the stream source, and do anything else required to set up the stream functionality. The `controller` parameter passed to this method can be used to control the stream's state and internal queue. 

`cancel()` method will be called if the app signals that the stream is to be cancelled (e.g. if `ReadableStream.cancel()` is called).

## Download streamed data using vanilla JavaScript

```js
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
