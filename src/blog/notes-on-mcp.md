---
title: "Notes on Model Context Protocol"
description: ""
added: "Mar 23 2025"
tags: [AI]
updatedDate: "May 2 2025"
---

### Historical context: The Path to MCP
Early AI assistants were limited to text generation, unable to interact with external tools or real-time data. The introduction of function calling and plugins in 2023 allowed models to execute code, browse the web, and interact with APIs, marking the shift toward AI agents. However, each integration was fragmented, requiring custom implementations for different tools, making scaling difficult.

MCP, introduced by Anthropic in late 2024, solves this problem by providing a unified protocol for AI-tool interactions. Instead of custom adapters for each tool, MCP allows developers to expose functionality once, making it accessible to any AI supporting MCP. It also eliminates the inefficiencies of tool-specific APIs by offering a structured, self-describing interface. This enables seamless, scalable AI-tool connectivity, much like how USB standardized device connections.

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

### MCP server and client
MCP uses a client-server design where applications can connect to multiple resources.

The **MCP host** is the program that's going to access the MCP servers. This might be Claude Desktop, Cursor, Windsurf, or any other application that supports MCP. (LLM + MCP Client)

On this host, you're going to run one or multiple **MCP clients** - each client will maintain a relationship to a single MCP server. When the host starts up, each client will connect to an MCP server. See https://www.pulsemcp.com/clients

The **MCP server** is the server that's going to be running the tools that the host wants to call. This server could be running locally, or it could be running on a remote server. See https://www.pulsemcp.com/servers

> You can also check out these [Goose tutorials](https://block.github.io/goose/docs/category/tutorials), showing you exactly how you can use some of the popular MCP servers with Goose, or use Goose's Tutorial extension to get extra help walking you through using or building extensions.

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
// npm i @modelcontextprotocol/sdk zod

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
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

const transport = new StdioServerTransport();
await server.connect(transport);
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

> Most MCP servers work "locally" (over a mechanism called `stdio`): you download a copy of the source code and run the code on your own computer. Servers rely on a command line tool either `npx` or `uvx` to download and run the server's code on your local machine. With both `npx` and `uvx` working, you're ready to use MCP servers with Claude Desktop.

### MCP servers over HTTP
The server can be hosted on the cloud, and the client can communicate with it via an HTTP connection. This is the mechanism called SSE, which enables an MCP server to be used over the internet. Most MCP servers today do not support this yet.

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

### Create an MCP client that can connect to any MCP server
https://github.com/alejandro-ao/mcp-clients

```ts
// anthropic sdk
import { Anthropic } from "@anthropic-ai/sdk";
import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

// mcp sdk
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class MCPClient {
  private mcp: Client;
  private llm: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.llm = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  // Connect to the MCP
  async connectToServer(serverScriptPath: string) {
    const isJs = serverScriptPath.endsWith(".js");
    const isPy = serverScriptPath.endsWith(".py");
    const command = isPy ? "python3" : process.execPath;  // '/usr/local/bin/node' 

    this.transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
    });
    await this.mcp.connect(this.transport);

    // Register tools
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      };
    });

    console.log(
      "Connected to server with tools:",
      this.tools.map(({ name }) => name)
    );
  }

  async processQuery(query: string) {
    const messages = [
      {
        role: "user",
        content: query,
      },
    ];

    const response = await this.llm.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    const finalText = [];
    const toolResults = [];

    // if text -> return response
    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);
      } else if (content.type === "tool_use") {
        // if tool -> call the tool on mcp server
        const toolName = content.name;
        const toolArgs = content.input;

        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        toolResults.push(result);
        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        );
        messages.push({
          role: "user",
          content: result.content,
        });

        const response = await this.llm.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages,
        });

        finalText.push(
          response.content[0].type === "text" ? response.content[0].text : ""
        );
      }
    }

    return finalText.join("\n");
  }
}
```

> Update on 2025.5.2:
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
- https://github.com/invariantlabs-ai/mcp-scan
- https://github.com/modelcontextprotocol/inspector