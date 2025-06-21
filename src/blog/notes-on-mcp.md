---
title: "Notes on Model Context Protocol"
description: ""
added: "Mar 23 2025"
tags: [AI]
updatedDate: "May 6 2025"
---

### Historical context: The Path to MCP
Early AI assistants were limited to text generation, unable to interact with external tools or real-time data. The introduction of function calling and plugins in 2023 allowed models to execute code, browse the web, and interact with APIs, marking the shift toward AI agents. However, each integration was fragmented, requiring custom implementations for different tools, making scaling difficult.

MCP, introduced by Anthropic in late 2024, solves this problem by providing a unified protocol for AI-tool interactions. Instead of custom adapters for each tool, MCP allows developers to expose functionality once, making it accessible to any AI supporting MCP. It also eliminates the inefficiencies of tool-specific APIs by offering a structured, self-describing interface. This enables seamless, scalable AI-tool connectivity, much like how USB standardized device connections.

> This isn't something that you couldn't do before. You could technically write a bunch of code to provide any model with relevant function call definitions, and then implement those functions to do the things the model asks for. But for one, this was very tedious. You'd have to figure out how to do it from scratch each time. Each implementation might be different. And this would all be in code, your Claude desktop app couldn't access these functions.

### MCP is not magic
MCP isn't magic — it's a standard way for AI to discover and use tools without learning every API's specific details. An MCP server is like a menu of tools. Each tool has a name, a description, a schema defining what info it needs, and the actual code that makes the API calls. AI applications (like Claude or Cline) can dynamically query these servers to execute tasks such as reading files, querying databases, or creating new integrations.

```
User                App                        LLM               MCP Server

                    ------------ initialize connection   ------------> 
                    <----------- response with available tools -------
--- send query ---->
                    -- send query with MCP tools ->
                    <-- response with tool call ---
                    -------------- send tool call ------------------->
                    <------------ responds with tool response --------
                    ---- send tool response ------>
                    <- response with final answer -
<-- final answer ---                  
```

> How similar is this to tool calling? Tool calling lets LLMs invoke functions to interact with the real world, typically within the same process. MCP enables tool execution in a separate process, either locally or remotely, fully decoupling the server from the client.
> 
> Most MCP servers work "locally" (over a mechanism called `stdio`): you download a copy of the source code and run the code on your own computer. Servers rely on a command line tool either `npx` or `uvx` to download and run the server's code on your local machine.

### MCP server and client
MCP uses a client-server design where applications can connect to multiple resources.

The **MCP host** is the program that's going to access the MCP servers. This might be Claude Desktop, Cursor, Windsurf, or any other application that supports MCP. Any application implementing the MCP protocol to allow connections to MCP servers is a host.

On this host, you're going to run one or multiple **MCP clients** - each client will maintain a relationship to a single MCP server. When the host starts up, each client will connect to an MCP server. See https://www.pulsemcp.com/clients

The **MCP server** is the most interesting concept for 99% of us. The server is the program that exposes a set of capabilities to the host application. If you want to allow a host to read emails, you can connect it to a Gmail MCP Server. If you want the host to post in Slack, you connect it to a Slack MCP Server. If you have some custom functionality you want an LLM to perform, you can build a new MCP server. The server could be running locally, or it could be running on a remote server. See https://www.pulsemcp.com/servers

> You can also check out these [Goose tutorials](https://block.github.io/goose/docs/category/tutorials), showing you exactly how you can use some of the popular MCP servers with Goose, or use Goose's Tutorial extension to get extra help walking you through using or building extensions.

The client connects to its server using a **transport**. This transport is responsible for sending messages between the client and the server. There are currently two supported transports. You can communicate via `stdio` - in other words, via the terminal. Or you can communicate through HTTP via server-sent events. This is useful if you want to run your server on a remote machine.

The **protocol** defines JSON message formats, based on JSON-RPC 2.0, for communication between client and server. The client launches the MCP server as a subprocess. The server reads JSON-RPC messages from its standard input (stdin) and sends messages to its standard output (stdout).

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

```js
// npm i @modelcontextprotocol/sdk zod
// server-logic.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const server = new McpServer({
  name: "Weather Service",
  version: "1.0.0",
});

server.tool(
  "getWeather",
  { city: z.string().describe('The city to get the weather for') },
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
```

The stdio transport enables communication through standard input/output streams. This is particularly useful for local integrations and command-line tools.

```js
// 1. use stdio
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server-logic.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

SSE transport enables server-to-client streaming with HTTP POST requests for client-to-server communication.

```js
// 2. use sse
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server-logic.js";

const app = express();

let transport;
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`MCP SSE Server is running on http://localhost:${port}/sse`);
});
```

Claude Desktop is the first MCP-compatible app, and it's the easiest way to test MCP. Open your Claude Desktop App configuration at `~/Library/Application Support/Claude/claude_desktop_config.json` in a text editor. After updating your configuration file, you need to restart Claude for Desktop. See the [documentation](https://modelcontextprotocol.io/quickstart/user) for more details.

```json
{
  "mcpServers": {
    "weather-example": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/PARENT/FOLDER/weather/build/index.js"
      ]
    }
  }
}
```

For Claude Code (only supports `stdio` transport), you can run it with a single command: `claude mcp add "weather-example" npx tsx "/path-to-the-file.ts"`. This tells Claude that in order to run the file, it should call `npx tsx /path-to-the-file.ts`.

```sh
claude mcp list
# No MCP servers configured.

claude mcp add "weather-example" npx tsx index.ts
# Added stdio MCP server weather-example...

claude mcp list
# weather-example: npx tsx index.ts

claude
# Actually run Claude Code
```

### AI SDK MCP clients
The SDK supports connecting to MCP servers via either stdio (for local tools) or SSE (for remote servers). Once connected, you can use MCP tools directly with the AI SDK. The client exposes a `tools` method for retrieving tools from a MCP server.

```js
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { openai } from '@ai-sdk/openai';

const mcpClient = await createMCPClient({
  transport: {
    type: 'sse',
    url: 'http://localhost:8081/sse',
  },
  name: 'My MCP Server',
});

// The client's tools method acts as an adapter between MCP tools and AI SDK tools.
// https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#using-mcp-tools
const response = await generateText({
  model: openai('gpt-4o'),
  tools: await mcpClient.tools(),
  prompt: 'Find products under $100',
});
```

```js
// Sometimes it's good to hint to the AI that you want it to use tools.
// export default async function getTools() {
//   const tools = await mcpClient.tools();
//   return {
//     ...tools,
//     getProducts,
//     recommendGuitar,
//   };
// }
const SYSTEM_PROMPT = `You are an AI for a music store.

There are products available for purchase. You can recommend a product to the user.
You can get a list of products by using the getProducts tool.

You also have access to a fulfillment server that can be used to purchase products.
You can get a list of products by using the getInventory tool.
You can purchase a product by using the purchase tool.
`;
```

> Update from Anthropic on 2025.5.2:
> Until now, support for MCP was limited to Claude Desktop through local servers. Today, we're introducing Integrations, allowing Claude to work seamlessly with remote MCP servers across the web and desktop apps. Developers can build and host servers that enhance Claude’s capabilities, while users can discover and connect any number of these to Claude.
>
> What this means is that you can bring your own remote MCP server to claude.ai. Users just need a URL to equip the LLM with new tools and capabilities.

### References and further reading
- https://github.com/modelcontextprotocol/typescript-sdk
- https://www.aihero.dev/model-context-protocol-tutorial
- https://glama.ai/blog/2024-11-25-model-context-protocol-quickstart
- https://github.com/modelcontextprotocol/servers
- https://github.com/punkpeye/awesome-mcp-servers
- https://glama.ai/mcp/servers
- https://www.pulsemcp.com
- https://github.com/github/github-mcp-server
- https://github.com/modelcontextprotocol/inspector
- https://github.com/vercel-labs/mcp-for-next.js
- https://github.com/punkpeye/fastmcp