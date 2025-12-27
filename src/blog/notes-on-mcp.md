---
title: "Notes on Model Context Protocol"
description: ""
added: "Mar 23 2025"
tags: [AI]
updatedDate: "July 11 2025"
---

### Historical context: The Path to MCP

Early AI assistants were limited to text generation, unable to interact with external tools or real-time data. The introduction of function calling and plugins in 2023 allowed models to execute code, browse the web, and interact with APIs, marking the shift toward AI agents. However, each integration was fragmented, requiring custom implementations for different tools, making scaling difficult.

MCP, introduced by Anthropic in late 2024, solves this problem by providing a unified protocol for AI-tool interactions. Instead of custom adapters for each tool, MCP allows developers to expose functionality once, making it accessible to any AI supporting MCP. It also eliminates the inefficiencies of tool-specific APIs by offering a structured, self-describing interface. This enables seamless, scalable AI-tool connectivity, much like how USB standardized device connections.

> This isn't something that you couldn't do before. You could technically write a bunch of code to provide any model with relevant function call definitions, and then implement those functions to do the things the model asks for. But for one, this was very tedious. You'd have to figure out how to do it from scratch each time. Each implementation might be different. And this would all be in code, your Claude desktop app couldn't access these functions.
>
> MCP adds another layer: your tools are hosted outside your app, on a separate server. MCP servers make sense when you want your context and tools to be shared across many apps, models, or environments.

### MCP is not magic

MCP isn't magic — it's a standard way for AI to discover and use tools without learning every API's specific details. An MCP server is like a menu of tools. Each tool has a name, a description, a schema defining what info it needs, and the actual code that makes the API calls. AI applications (like Claude or Cline) can dynamically query these servers to execute tasks such as reading files, querying databases, or creating new integrations.

> Most MCP servers work "locally" (over a mechanism called `stdio`): you download a copy of the source code and run the code on your own computer. Servers rely on a command line tool either `npx` or `uvx` to download and run the server's code on your local machine.

### MCP server and client

MCP uses a client-server design where applications can connect to multiple resources.

The **MCP host** is the program that's going to access the MCP servers. This might be Claude Desktop, Cursor, Windsurf, or any other application that supports MCP. Any application implementing the MCP protocol to allow connections to MCP servers is a host.

On this host, you're going to run one or multiple **MCP clients** - each client will maintain a relationship to a single MCP server. The host creates a client instance to communicate with a specific MCP server, and the client handles the low-level details of the protocol.

The **MCP server** is the most interesting concept for 99% of us. The server is the program that exposes a set of capabilities to the host application. If you want to allow a host to read emails, you can connect it to a Gmail MCP Server. If you want the host to post in Slack, you connect it to a Slack MCP Server. If you have some custom functionality you want an LLM to perform, you can build a new MCP server. The server could be running locally, or it could be running on a remote server.

The client connects to its server using a **transport**. This transport is responsible for sending messages between the client and the server. There are currently two supported transports. You can communicate via `stdio` - in other words, via the terminal. Or you can communicate through HTTP via server-sent events. This is useful if you want to run your server on a remote machine.

> Transports are how the model talks to your MCP server. Today, StreamableHTTP is the main one. The model uses standard HTTP to hit a URL and create a connection. Optionally, it also allows the use of SSE on the side for real time notifications. The other popular transport is stdio, used in local or CLI environments where the model and tools share the same process.

The **protocol** defines JSON message formats, based on JSON-RPC 2.0, for communication between client and server. This simple contract allows for incredible flexibility. Your server doesn’t need to know anything about the LLM, and the LLM doesn’t need to know anything about your server’s internal implementation. They just need to speak the common language of MCP.

```json
// Client sends...
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}

// Server sends back...
{
  "jsonrpc": "2.0",
  "id": 1,
  "tools": [
    {
      "name": "createGitHubIssue",
      "description": "Create a GitHub issue",
      "inputSchema": {
        ...
      },
    }
  ]
}

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
  name: "weather-mcp-server",
  version: "1.0.0",
});

server.tool(
  "getWeather",
  "Tool to get the weather for a city",
  { city: z.string().describe("The city to get the weather for") },
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

> The `register*` methods (`registerTool`, `registerPrompt`, `registerResource`) are the recommended approach for new code. The older methods (`tool`, `prompt`, `resource`) remain available for backwards compatibility. The optional `title` field for better UI presentation. The title is used as a display name, while `name` remains the unique identifier.

```js
// Using registerTool (recommended)
server.registerTool(
  "fetch-weather",
  {
    title: "Weather Fetcher",
    description: "Get weather data for a city",
    inputSchema: { city: z.string() },
  },
  async ({ city }) => {
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }],
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
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
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
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
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
import { openai } from "@ai-sdk/openai";
import { experimental_createMCPClient as createMCPClient } from "ai";

const mcpClient = await createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:8081/sse",
  },
  name: "My MCP Server",
});

// The client's tools method acts as an adapter between MCP tools and AI SDK tools.
// https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#using-mcp-tools
const response = await generateText({
  model: openai("gpt-4o"),
  tools: await mcpClient.tools(),
  prompt: "Find products under $100",
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

### Your API is not an MCP

Consider the difference in practice. An API-shaped MCP server might expose four tools, and the LLM has to call each tool in sequence, pass IDs between calls, and handle potential failures at each step. The solution is building tools around complete user goals rather than API capabilities. Instead of four separate tools, create one tool that handles the entire workflow internally.

1. LLMs are terrible at selection from a long list of tools.
2. Your existing API descriptions are probably not ready for LLM consumption.
3. Each conversation starts fresh with no memory of previous conversations. While they can see tool results within the current conversation, they have to figure out the right sequence of tools to use based on what's available. When those tools are low-level API wrappers, the LLM has to orchestrate multiple calls and manage the complexity of chaining them together each time.

Each tool should do one thing and do it well. The `name` and `description` of your tools and their parameters are your primary interface with the LLM. Be clear, concise, and unambiguous. Log every single tool invocation. Record the tool name, the exact parameters it was called with, and the result it returned. This is invaluable for debugging.

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
- https://developer.chrome.com/blog/chrome-devtools-mcp
- https://developer.chrome.com/blog/autofix-runtime-devtools-mcp
- https://developers.openai.com/apps-sdk/build/mcp-server
