---
title: "Notes on Model Context Protocol"
description: ""
added: "Mar 23 2025"
tags: [AI]
updatedDate: "Mar 29 2025"
---

These are my learning notes on the Model Context Protocol, mainly based on [Matt Pocock's tutorial](https://www.aihero.dev/model-context-protocol-tutorial).

APIs power tools like Slack, GitHub, and local filesystems, but LLMs need custom code to access them. The Model Context Protocol (MCP), an open standard by [Anthropic](https://www.anthropic.com/news/model-context-protocol), enables plug-and-play toolsets for seamless integration into applications. It isn't magic — it's a standard way for AI to discover and use tools without learning every API's specific details. An MCP server is like a menu of tools. Each tool has a name, a description, a schema defining what info it needs, and the actual code that makes the API calls. AI applications (like Claude or Cline) can dynamically query these servers to execute tasks such as reading files, querying databases, or creating new integrations.

> How similar is this to tool calling? Tool calling lets LLMs invoke functions to interact with the real world, typically within the same process. MCP enables tool execution in a separate process, either locally or remotely, fully decoupling the server from the client.

### MCP server and client
MCP uses a client-server design where applications can connect to multiple resources. The system has three main parts:
- The Client Side: Making Requests
- The Communication Layer: The Standard Protocol
- The Server Side: Providing Resources

The **MCP client** is the program that's going to access the MCP servers. This might be Claude Desktop, Cursor, Windsurf, or any other application that supports MCP. This host probably uses an LLM of some kind. That LLM will be able to call tools that are defined in the MCP server.

The **MCP server** is the server that's going to be running the tools that the host wants to call. This server could be running locally, or it could be running on a remote server.

The client connects to its server using a **transport**. This transport is responsible for sending messages between the client and the server. There are currently two supported transports. You can communicate via `stdio` - in other words, via the terminal. Or you can communicate through HTTP via server-sent events. This is useful if you want to run your server on a remote machine.

The **protocol** defines JSON message formats, based on JSON-RPC 2.0, for communication between client and server.

```json
// Client sends...
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "createGitHubIssue",
    "arguments": {
      "title": "My Issue",
      "body": "This is the body of my issue",
      "labels": ["bug"]
    }
  }
}

// Server sends back...
{
  "jsonrpc": "2.0",
  "id": 2,
  "content": [
    {
      "type": "text",
      "text": "Issue 143 created successfully!"
    }
  ],
  "isError": false
}
```

### The simplest MCP server

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Weather Service",
  version: "1.0.0",
});

server.tool(
  "getWeather",
  "Get the weather in a city",
  { city: z.string() },
  async ({ city }) => {
    // await fetch('wheather API') 

    return {
      content: [
        {
          type: "text",
          text: `The weather in ${city} is sunny!`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

Connecting to Claude Code: `claude mcp add "weather-example" npx tsx "/path-to-the-file.ts"`

### MCP servers over HTTP
The server can be hosted on the cloud, and the client can communicate with it via an HTTP connection.

```js
// Still use the server we had in the previous example

import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();

let transport: SSEServerTransport | undefined =
  undefined;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400);
    res.json({ error: "No transport" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
```

Run the server: `npx tsx ./path-to-file.ts`

### References and further reading
- https://glama.ai/blog/2024-11-25-model-context-protocol-quickstart
- https://github.com/modelcontextprotocol/servers
- https://github.com/punkpeye/awesome-mcp-servers
- https://www.pulsemcp.com/use-cases
