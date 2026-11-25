---
title: "Server-sent events with examples"
description: ""
added: "Mar 26 2023"
tags: [js]
updatedDate: "Nov 25 2026"
---

Ways to implement real-time updates before SSE:

- In polling, client makes the request to the server repeatedly in hope for new data. Just wrap your API call with `setInterval`. Long polling means that instead of sending a response immediately, server waits until it has some new data for client.
- WebSockets are initiated via an HTTP request for a handshake, and if accepted, the connection is upgraded to the WebSocket protocol over the existing TCP connection. They are faster because connection is kept alive and no additional headers are sent with each request. But this is also makes it a bit harder to scale.

## Using server-sent events

With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page. These incoming messages can be treated as _Events + data_. You'll need a bit of code on the server to stream events to the front-end, but the client side code works almost identically to websockets in part of handling incoming events.

`EventSource` is a browser API that allows the client to receive real-time updates from the server over a long-lived HTTP connection. It uses a simple text-based protocol called [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to send data from the server to the client in a unidirectional way. The client can listen to the SSE events using the `EventSource` API, and receive updates as they happen in real-time.

- An `EventSource` instance opens a **persistent connection** to an HTTP server which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.
- Unlike WebSockets, server-sent events are unidirectional; that is, data messages are delivered in one direction, from the server to the client. That makes them an excellent choice when there's no need to send data from the client to the server in message form. For example, handling things like social media status updates or news feeds.
- One potential downside of using Server-Sent Events is the limitations in data format. Since SSE is restricted to transporting UTF-8 messages, binary data is not supported. **When not used over HTTP/2, another limitation is the restricted number of concurrent connections per browser**. With only six concurrent open SSE connections allowed at any given time, opening multiple tabs with SSE connections can become a bottleneck.

```js
const express = require("express");
const app = express();

app.get("/real-time-updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

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

app.listen(3000, () => console.log("Listening on port 3000..."));
```

```html
<body>
  <h1>Random Numbers:</h1>
  <ul id="numbers"></ul>

  <script>
    const numbers = document.getElementById("numbers");

    const eventSource = new EventSource(
      "http://localhost:3000/real-time-updates",
    );

    // eventSource.addEventListener('message', (event) => {}, false)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      numbers.innerHTML += `<li>${data.number}</li>`;
    };

    eventSource.onerror = () => console.log("Something went wrong.");

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
import { fetchEventSource } from "@microsoft/fetch-event-source";

const ctrl = new AbortController();
await fetchEventSource("/api/sse", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    foo: "bar",
  }),
  signal: ctrl.signal,
  onopen(response) {},
  onclose() {},
  onmessage(message) {},
});
```

> The browser's built-in `EventSource` API has several limitations:
>
> - Can't set custom headers (like `Authorization`)
> - Only supports GET requests
> - Doesn't work with the Fetch API
> - No support for async iteration

[parse-sse](https://github.com/sindresorhus/parse-sse) is a lightweight parser that allows you to parse SSE from a standard `Response` object using web platform standards. Perfect for consuming streaming APIs from OpenAI, Anthropic, and other services.

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
      const suspensePromises = [];

      controller.enqueue(encoder.encode('<html lang="en">'));
      controller.enqueue(encoder.encode("<head>"));
      // Load the code to allow "unsuspense"
      controller.enqueue(
        enconder.encode('<script src="unsuspense.js"></script>'),
      );
      controller.enqueue(encoder.encode("</head>"));
      controller.enqueue(encoder.encode("<body>"));

      // Add a placeholder (suspense)
      controller.enqueue(
        encoder.encode('<div id="suspensed:1">Loading...</div>'),
      );

      // Load the content - without "await"
      suspensePromises.push(
        computeExpensiveChunk().then((content) => {
          // enqueue the real content
          controller.enqueue(
            encoder.encode(
              `<template id="suspensed-content:1">${content}</template>`,
            ),
          );
          // enqueue the script to replace the suspensed content to the real one
          controller.enqueue(
            encoder.encode(`<script>unsuspense('1')</script>`),
          );
        }),
      );

      controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));
      controller.enqueue(encoder.encode("</body>"));
      controller.enqueue(encoder.encode("</html>"));

      // Wait for all suspended content before closing the stream
      await Promise.all(suspensePromises);

      controller.close();
    },
  }),
);
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

### DeepSeek chat-demo usage

```ts
export type ServerSentEvent = {
  event: string;
  data: string;
  // The `id` field is omitted in this simplified version.
  // It is only needed for resuming a stream with `Last-Event-ID`.
};

/** CRLF, LF, or CR */
const LINE_BREAK = /\r\n|\r|\n/g;

export class ServerSentEventDecoder {
  private buffer = ""; // Text received but not yet terminated by a line break.
  private data = ""; // Accumulated `data:` value for the event currently being parsed.
  private hasData = false;
  private eventType = "";

  /**
   * Feed one decoded text chunk.
   * Returns every event completed by this chunk: zero, one, or many.
   */
  push(text: string): ServerSentEvent[] {
    this.buffer += text;
    const events: ServerSentEvent[] = [];
    let lineStart = 0;

    LINE_BREAK.lastIndex = 0;
    // Walk every line break found in the buffer.
    for (
      let match = LINE_BREAK.exec(this.buffer);
      match;
      match = LINE_BREAK.exec(this.buffer)
    ) {
      // A trailing CR may be the first half of CRLF; wait for the next chunk.
      if (match[0] === "\r" && LINE_BREAK.lastIndex === this.buffer.length) {
        break;
      }

      const event = this.processLine(this.buffer.slice(lineStart, match.index));
      if (event) {
        events.push(event);
      }
      lineStart = LINE_BREAK.lastIndex;
    }

    this.buffer = this.buffer.slice(lineStart);
    return events;
  }

  /*
   * Example trace
   *
   * push 1
   *   input   : 'event: content_block_delta\n'
   *   buffer+ : 'event: content_block_delta\n'
   *   exec 1  : index 26, line 'event: content_block_delta'
   *             eventType = 'content_block_delta', lineStart = 27
   *   exec 2  : null
   *   slice   : this.buffer.slice(27) -> ''
   *   state   : data = '', hasData = false, eventType = 'content_block_delta'
   *   return  : []
   *
   * push 2
   *   input   : 'data: {"type":"content_block_delta",'
   *   buffer+ : 'data: {"type":"content_block_delta",'
   *   exec 1  : null (no line break)
   *   slice   : no complete line, buffer unchanged
   *   state   : data = '', hasData = false, eventType = 'content_block_delta'
   *   return  : []
   *
   * push 3
   *   input   : '"index":0,"delta":{"type":"text_delta","text":"你"}}\n\n'
   *   buffer+ : 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你"}}\n\n'
   *   exec 1  : index 87, line 'data: {...}'
   *             data = '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你"}}'
   *             hasData = true, lineStart = 88
   *   exec 2  : index 88, line ''
   *             dispatch() -> event, lineStart = 89
   *   exec 3  : null
   *   slice   : this.buffer.slice(89) -> ''
   *   state   : data = '', hasData = false, eventType = ''
   *   return  : [{
   *               event: 'content_block_delta',
   *               data: '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你"}}',
   *             }]
   */

  end(): ServerSentEvent[] {
    // Flush the trailing CR that push() deferred because it might be half of CRLF.
    const event = this.buffer.endsWith("\r")
      ? this.processLine(this.buffer.slice(0, -1))
      : null;

    this.buffer = "";
    this.data = "";
    this.hasData = false;
    this.eventType = "";
    return event ? [event] : [];
  }

  private processLine(line: string): ServerSentEvent | null {
    // An empty line terminates the current event.
    if (line === "") {
      return this.dispatch();
    }
    // Split at the first colon. Everything after it is the value.
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    switch (field) {
      case "data":
        // Multiple data lines are joined with "\n".
        this.data = this.hasData ? `${this.data}\n${value}` : value;
        this.hasData = true;
        break;
      case "event":
        this.eventType = value;
        break;
      default:
        break;
    }

    return null;
  }

  /**
   * A blank line was reached: emit the accumulated event.
   */
  private dispatch(): ServerSentEvent | null {
    const event: ServerSentEvent | null = this.hasData
      ? {
          event: this.eventType || "message",
          data: this.data,
        }
      : null;

    this.data = "";
    this.hasData = false;
    this.eventType = "";
    return event;
  }
}

/**
 * Read a byte stream and yield complete SSE events one by one.
 * This layer knows nothing about JSON or the chat protocol.
 */
export async function* readServerSentEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ServerSentEvent> {
  const reader = stream.getReader();
  const textDecoder = new TextDecoder();
  const decoder = new ServerSentEventDecoder();
  let finished = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        finished = true;
        yield* decoder.push(textDecoder.decode());
        yield* decoder.end();
        return;
      }

      // stream: true tells the decoder more data may follow, so an incomplete
      // multi-byte character is kept buffered until the next chunk.
      yield* decoder.push(textDecoder.decode(value, { stream: true }));
    }
  } finally {
    if (!finished) {
      reader.cancel().catch(() => {});
    }
    reader.releaseLock();
  }
}
```

```ts
const response = await fetch("https://api.deepseek.com/anthropic/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  },
  body: JSON.stringify({
    model: "deepseek-flash",
    system: "You are a chat bot.",
    messages: [{ role: "user", content: "hello" }],
    thinking: { type: "disabled" },
    safety_check: { level: "high" },
    tools: [],
    stream: true,
  }),
});

let answer = "";

for await (const { data } of readServerSentEvents(response.body)) {
  const payload = JSON.parse(data);

  if (
    payload.type === "content_block_delta" &&
    payload.delta.type === "text_delta"
  ) {
    answer += payload.delta.text;
    console.log(answer);
  }

  if (payload.type === "message_stop") break;
}
```

```json
# Event sequence with thinking enabled

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"用户问的是..."}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"需要先解释..."}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"signature_delta","signature":"msg_abc"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}
```

> A thinking block is not ordinary text. When it is sent back to the server, the server must verify that the thinking was actually generated by the server. The signature is that proof. The client only concatenates it, stores it, and sends it back unchanged during continuation.
