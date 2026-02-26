---
title: "Core building blocks of powerful agents"
description: ""
added: "Feb 26 2026"
tags: [AI]
---

Learn from the links below (all from Nader Dabit) if you’re curious about what’s happening underneath these powerful agents.

- You Could've Invented OpenClaw: https://gist.github.com/dabit3/bc60d3bea0b02927995cd9bf53c3db32
- You Could've Invented Claude Code: https://gist.github.com/dabit3/f390e6b06d9a682bf1b05c2405d15edb
- Building AI agents with the Claude Agent SDK: https://gist.github.com/dabit3/93a5afe8171753d0dbfd41c80033171d

> You might find it helpful to read this in parallel with my previous post ["Notes on AI SDK (building agents)"](https://kexizeroing.github.io/post/notes-on-ai-sdk/)

## Session Management

```ts
const SESSIONS_DIR = path.join(WORKSPACE, "sessions");

function getSessionPath(sessionKey: string): string {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  return path.join(SESSIONS_DIR, `${sessionKey}.jsonl`);
}

function loadSession(sessionKey: string): Message[] {
  const filePath = getSessionPath(sessionKey);
  const messages: Message[] = [];
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    for (const line of lines) {
      if (line.trim()) {
        try {
          messages.push(JSON.parse(line));
        } catch {
          // skip malformed lines
        }
      }
    }
  }
  return messages;
}

function appendMessage(sessionKey: string, message: Message): void {
  fs.appendFileSync(getSessionPath(sessionKey), JSON.stringify(message) + "\n");
}

function saveSession(sessionKey: string, messages: Message[]): void {
  fs.writeFileSync(
    getSessionPath(sessionKey),
    messages.map((m) => JSON.stringify(m)).join("\n") + "\n",
  );
}
```

> JSONL (JSON Lines) is a text-based data format where each line represents a valid JSON object, making it ideal for storing structured data records.
>
> ```json
> {"name": "John Doe", "age": 30, "city": "New York"}
> {"name": "Jane Smith", "age": 25, "city": "San Francisco"}
> {"name": "Bob Johnson", "age": 35, "city": "Chicago"}
> ```

## Permission Controls

```ts
const SAFE_COMMANDS = new Set([
  "ls",
  "cat",
  "head",
  "tail",
  "echo",
  "pwd",
  "git",
  "node",
  "npm",
]);
const APPROVALS_FILE = path.join(WORKSPACE, "exec-approvals.json");

function loadApprovals(): Approvals {
  if (fs.existsSync(APPROVALS_FILE)) {
    return JSON.parse(fs.readFileSync(APPROVALS_FILE, "utf-8"));
  }
  return { allowed: [], denied: [] };
}

function saveApproval(command: string, approved: boolean): void {
  const approvals = loadApprovals();
  const key = approved ? "allowed" : "denied";

  if (!approvals[key].includes(command)) {
    approvals[key].push(command);
  }
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
}

function checkCommandSafety(
  command: string,
): "safe" | "approved" | "needs_approval" {
  const baseCmd = command.trim().split(/\s+/)[0] || "";

  if (SAFE_COMMANDS.has(baseCmd)) return "safe";

  const approvals = loadApprovals();
  if (approvals.allowed.includes(command)) return "approved";

  return "needs_approval";
}
```

## Tool Execution

```ts
const TOOLS = [
  {
    name: "run_command",
    description: "Run a shell command",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run" },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Read a file from the filesystem",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file (creates directories if needed)",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "save_memory",
    description: "Save important information to long-term memory",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Short label (e.g. 'user-preferences')",
        },
        content: {
          type: "string",
          description: "The information to remember",
        },
      },
      required: ["key", "content"],
    },
  },
  {
    name: "memory_search",
    description: "Search long-term memory for relevant information",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
      },
      required: ["query"],
    },
  },
];

async function executeTool(
  name: string,
  toolInput: Record<string, string>,
): Promise<string> {
  if (name === "run_command") {
    const cmd = toolInput.command;
    const safety = checkCommandSafety(cmd);

    if (safety === "needs_approval") {
      process.stdout.write(`\n Warning: Command requires approval: ${cmd}\n`);
      const answer = await prompt("  Allow? (y/n): ");
      if (answer.trim().toLowerCase() !== "y") {
        saveApproval(cmd, false);
        return "Permission denied by user.";
      }
      saveApproval(cmd, true);
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
      const output = stdout + stderr;
      return output || "(no output)";
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("timed out")) {
        return "Command timed out after 30 seconds";
      }
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (name === "read_file") {
    try {
      return fs.readFileSync(toolInput.path, "utf-8");
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (name === "write_file") {
    try {
      // First ensure dirs exist, then write file
      fs.mkdirSync(path.dirname(toolInput.path), { recursive: true });
      fs.writeFileSync(toolInput.path, toolInput.content, "utf-8");
      return `Wrote to ${toolInput.path}`;
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // long-term memory tools
  if (name === "save_memory") {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    const filepath = path.join(MEMORY_DIR, `${toolInput.key}.md`);
    fs.writeFileSync(filepath, toolInput.content, "utf-8");
    return `Saved to memory: ${toolInput.key}`;
  }

  if (name === "memory_search") {
    const query = toolInput.query.toLowerCase();
    const results: string[] = [];
    if (fs.existsSync(MEMORY_DIR)) {
      for (const fname of fs.readdirSync(MEMORY_DIR)) {
        if (fname.endsWith(".md")) {
          const content = fs.readFileSync(
            path.join(MEMORY_DIR, fname),
            "utf-8",
          );
          const words = query.split(/\s+/);
          if (words.some((w) => content.toLowerCase().includes(w))) {
            results.push(`--- ${fname} ---\n${content}`);
          }
        }
      }
    }
    return results.length
      ? results.join("\n\n")
      : "No matching memories found.";
  }

  return `Unknown tool: ${name}`;
}
```

> Using `{ recursive: true }`: Without it, `mkdirSync` throws an error if the directory already exists (`EEXIST`), or any parent directory in the path doesn't exist yet (`ENOENT`). So it silently succeeds in both cases — same behavior as `mkdir -p` in bash.

## Compaction

```ts
function estimateTokens(messages: Message[]): number {
  // Rough token estimate: ~4 chars per token
  return messages.reduce((sum, m) => sum + JSON.stringify(m).length, 0) / 4;
}

async function compactSession(
  sessionKey: string,
  messages: Message[],
): Promise<Message[]> {
  // ~80% of a 128k window
  if (estimateTokens(messages) < 100_000) return messages;

  const split = Math.floor(messages.length / 2);
  const old = messages.slice(0, split);
  const recent = messages.slice(split);

  process.stdout.write("\nCompacting session history...\n");

  const summary = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content:
          "Summarize this conversation concisely. Preserve key facts, " +
          "decisions, and open tasks:\n\n" +
          JSON.stringify(old, null, 2),
      },
    ],
  });

  const summaryText =
    summary.content[0].type === "text" ? summary.content[0].text : "";

  const compacted: Message[] = [
    {
      role: "user",
      content: `[Conversation summary]\n${summaryText}`,
    },
    ...recent,
  ];

  saveSession(sessionKey, compacted);
  return compacted;
}
```

## Adding a Personality (SOUL.md)

```ts
// A markdown file that defines the agent's identity, behavior, and boundaries.
const SOUL = `
# Who You Are

**Name:** Jarvis
**Role:** Personal AI assistant

## Personality
- Be genuinely helpful, not performatively helpful
- Skip the "Great question!" - just help
- Have opinions. You're allowed to disagree
- Be concise when needed, thorough when it matters

## Boundaries
- Private things stay private
- When in doubt, ask before acting externally
- You're not the user's voice - be careful about sending messages on their behalf

## Memory
Remember important details from conversations.
Write them down if they matter.
`;
```

## Multi-Agent Routing

```ts
function resolveAgent(messageText: string): [string, string] {
  // Route messages to the right agent based on prefix commands
  if (messageText.startsWith("/research ")) {
    return ["researcher", messageText.slice("/research ".length)];
  }
  return ["main", messageText];
}

const AGENTS: Record<string, AgentConfig> = {
  main: {
    name: "Jarvis",
    model: "claude-sonnet-4-5-20250929",
    // Adding a Personality (SOUL.md)
    soul: ["You are Jarvis, a personal AI assistant.", "..."].join("\n"),
    session_prefix: "agent:main",
  },
  researcher: {
    name: "Scout",
    model: "claude-sonnet-4-5-20250929",
    soul: [
      "You are Scout, a research specialist.",
      "Your job: find information and cite sources. Every claim needs evidence.",
      "Use tools to gather data. Be thorough but concise.",
      "Save important findings with save_memory for other agents to reference.",
    ].join("\n"),
    session_prefix: "agent:researcher",
  },
};
```

## Agent Loop

```ts
async function runAgentTurn(
  sessionKey: string,
  userText: string,
  agentConfig: AgentConfig,
): Promise<string> {
  let messages = loadSession(sessionKey);
  messages = await compactSession(sessionKey, messages);

  const userMsg: Message = { role: "user", content: userText };
  messages.push(userMsg);
  appendMessage(sessionKey, userMsg);

  for (let i = 0; i < 20; i++) {
    // Call the AI with full history
    const response = await client.messages.create({
      model: agentConfig.model,
      max_tokens: 4096,
      system: agentConfig.soul,
      tools: TOOLS,
      messages,
    });

    const content = serializeContent(response.content);
    const assistantMsg: Message = { role: "assistant", content };
    messages.push(assistantMsg);
    appendMessage(sessionKey, assistantMsg);

    if (response.stop_reason === "end_turn") {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: ToolResultBlock[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const inputStr = JSON.stringify(block.input).slice(0, 100);
          process.stdout.write(`Tool ${block.name}: ${inputStr}\n`);
          const result = await executeTool(
            block.name,
            block.input as Record<string, string>,
          );

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: String(result),
          });
        }
      }

      const resultsMsg: Message = { role: "user", content: toolResults };
      messages.push(resultsMsg);
      appendMessage(sessionKey, resultsMsg);
    }
  }

  return "(max turns reached)";
}
```

## Cron / Heartbeats

```ts
import * as schedule from "node-schedule";

function setupHeartbeats(): void {
  // Every day at 07:30
  schedule.scheduleJob("30 7 * * *", async () => {
    process.stdout.write("\nHeartbeat: morning check\n");
    try {
      const result = await runAgentTurn(
        "cron:morning-check",
        "Good morning! Check today's date and give me a motivational quote.",
        AGENTS.main,
      );
      process.stdout.write(`${result}\n\n`);
    } catch (e) {
      console.error("Heartbeat error:", e);
    }
  });
}
```

## Claude Agent SDK

If you've built agents with the raw API, you know the pattern: call the model, check if it wants to use a tool, execute the tool, feed the result back, repeat until done. This can get tedious when building anything non-trivial. The SDK handles that loop:

```js
// Without the SDK: You manage the loop
let response = await client.messages.create({...});
while (response.stop_reason === "tool_use") {
  const result = yourToolExecutor(response.tool_use);
  response = await client.messages.create({ tool_result: result, ... });
}

// With the SDK: Claude manages it
// https://platform.claude.com/docs/en/agent-sdk/typescript
for await (const message of query({
  prompt: "...",
  options: {
    model: "claude-opus-4-5-20251101",
    // Build-in tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
    allowedTools: ["Read", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    maxTurns: 250,
    // Structured output
    // outputFormat: {
    //   type: "json_schema",
    //   schema: {
    //     type: "object",
    //     properties: {
    //       action: { type: "string" },
    //       details: { type: "object" }
    //     },
    //     required: ["action"]
    //   }
    // },
    // Subagents
    // agents: {
    //   "security-reviewer": {
    //     description: "...",
    //     prompt: "...",
    //       tools: ["Read", "Grep", "Glob"],
    //       model: "sonnet"
    //     } as AgentDefinition,
    // },
})) {
  switch (message.type) {
    case "system":
      if (message.subtype === "init") {
        console.log("Session ID:", message.session_id);
        console.log("Available tools:", message.tools);
      }
      break;

    case "assistant":
      for (const block of message.message.content) {
        if ("text" in block) {
          console.log(block.text);
        } else if ("name" in block) {
          console.log(`Using tool: ${block.name}`);
        }
      }
      break;

    case "result":
      console.log("Status:", message.subtype);
      console.log("Cost:", message.total_cost_usd);
      break;
  }
}
```
