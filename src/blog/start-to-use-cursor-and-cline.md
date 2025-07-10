---
title: "Start to use Cursor, Cline and Gemini CLI"
description: ""
added: "May 27 2025"
tags: [other]
updatedDate: "July 7 2025"
---

## Cursor Get Started
Migrate VS Code settings:
1. `Cmd + Shift + P` and type Cursor Settings (or `Cmd + Shift + J` to open Cursor settings)
2. Navigate to General > Account
3. Under “VS Code Import”, click the Import button

This will transfer your Extensions, Themes, Settings, Keybindings. You can see all keyboard shortcuts by pressing `Cmd + R` then `Cmd + S`.

We made Activity Bar Orientation horizontal by default. If you prefer vertical:
1. `Cmd + Shift + P` -> Preferences: Open Settings (UI)
2. Search for `workbench.activityBar.orientation` and set it to `vertical`

Start exploring Cursor’s AI-powered features:
- Tab: Press `Tab` for intelligent code completions
- CMD-K: Use `Cmd + K` for inline code edits
- Chat: Use `Cmd + I` to open the unified AI interface with Ask, Edit, and Agent modes
​
For models, enabling Auto-select configures Cursor to select the premium model best fit for the immediate task and with the highest reliability based on current demand. This feature can detect degraded output performance and automatically switch models to resolve it.

To view your current usage, you can visit the dashboard at [cursor.com/dashboard](https://www.cursor.com/dashboard)

> Cursor lets you input your own API keys for various LLM providers to send as many AI messages as you want at your own cost. To use your own API key, go to Cursor Settings > Models and enter your API keys.

### Tab
Cursor Tab is our native autocomplete feature. You can accept a suggestion by pressing `Tab`, or reject it by pressing `Esc`.

To turn the feature on or off, hover over “Cursor Tab” icon on the status bar in the bottom right of the application. You can disable Cursor Tab for comments by going to Cursor Settings -> Features -> Cursor Tab and unchecking “Suggestions in Comments”.

In TypeScript project, Tab can automatically import modules and functions from elsewhere in your project, without you having to manually type the import statement.

### Chat (Cmd + I)
Chat (previously “Composer”) is Cursor’s AI assistant that lives in your sidebar, letting you interact with your codebase through natural language.

Sometimes you may want to revert to a previous state of your codebase. Cursor helps you with this by automatically creating checkpoints of your codebase at each request you make, as well every time the AI makes changes to your codebase. To revert to a previous state, you can click the “Restore Checkpoint” button that appears within the input box of a previous request. 

Agent is the default and most autonomous mode in Cursor, designed to handle complex coding tasks with minimal guidance. It has all tools enabled to autonomously explore your codebase, read documentation, browse the web, edit files, and run terminal commands to complete tasks efficiently.

Ask is a “read-only” mode for the Chat made to ask questions, explore, and learn about a codebase. It is a built-in mode in Cursor that has search tools enabled by default.

Manual mode is designed for making targeted code modifications when you know exactly what changes are needed and where. To make use of Manual mode, you need to explicitly mention the files you want to edit using the `@` symbol. *e.g. “In @src/utils/helpers.ts and @src/components/UserProfile.tsx, rename the function `getUserData` to `fetchUserProfile` and update all call sites within these files.”*

### Inline Edit (Cmd + K)
We call the bar that appears when you press `Cmd + K` the “Prompt Bar”. It works similarly to the AI input box for chat, in which you can type normally, or use `@` symbols to reference other context.

If no code is selected when you press `Cmd + K`, Cursor will generate new code based on the prompt you type in the prompt bar. For in-place edits, you can simply select the code you want to edit and type into the prompt bar.

When your changes might affect multiple files or you need more advanced capabilities, use `Cmd + L` to send your selected code to the Agent. This seamlessly transitions your work to Chat mode.

### Context
When a project is opened, each Cursor instance will initialize indexing for that workspace. After the initial indexing setup is complete, Cursor will automatically index any new files added to your workspace to keep your codebase context current. Behind the scenes, Cursor computes embeddings for each file in your codebase, and will use these to improve the accuracy of your codebase answers.

The status of your codebase indexing is under Cursor Settings > Features > Codebase Indexing.

You can control which directories and files Cursor can access by adding a `.cursorignore` file to your root directory. Cursor makes its best effort to block access to files listed in `.cursorignore` from codebase indexing, Tab, Chat, Cmd-K, and `@` symbol references. Files listed in `.cursorindexingignore` will not be included in Cursor’s index but can still be accessed by Cursor’s AI-assisted features.

In Cursors input boxes, you can use `@` symbols by typing `@`. A popup menu will appear with a list of suggestions, and it will automatically filter to only show the most relevant suggestions based on your input.

### Rules
LLMs do not retain memory between completions. Rules solve this by providing persistent, reusable context at the prompt level. When a rule is applied, its contents are included at the start of the model context. Rules apply to both `Chat` and `Cmd-K`.

Project rules live in `.cursor/rules`. Each rule is stored as a file and version-controlled. Each rule file is written in MDC (`.mdc`), a lightweight format that supports metadata and content in a single file.

```mdc
---
description: xxx
globs: **/**
---

...content goes here...
```

You can use `Cmd + Shift + P` > “New Cursor Rule” to create a rule quickly from inside Cursor. This will create a new rule file in the `.cursor/rules` directory. You can also generate rules directly in a conversation using the `/Generate Cursor Rules` command.

> The `.cursorrules` file in the root of your project is still supported, but will be deprecated. We recommend migrating to the Project Rules format for more control, flexibility, and visibility.

You can organize rules by placing them in `.cursor/rules` directories throughout your project structure. For example:

```
project/
  .cursor/rules/        # Project-wide rules
  backend/
    server/
      .cursor/rules/    # Backend-specific rules
  frontend/
    .cursor/rules/      # Frontend-specific rules
```

Nested rules automatically attached when files in their directory are referenced. This is particularly useful in monorepos or projects with distinct components that need their own specific guidance.

- https://github.com/PatrickJS/awesome-cursorrules
- https://cursorlist.com
- https://cursor.directory

### MCP
Think of MCP as a plugin system for Cursor - it allows you to extend the Agent’s capabilities by connecting it to various data sources and tools through standardized interfaces.

Cursor supports two transport types for MCP servers:
- For stdio servers, the command should be a valid shell command that Cursor can run.
- For SSE servers, the URL should be the URL of the SSE endpoint, e.g. `http://example.com:8000/sse`.

The MCP configuration file uses a JSON format with the following structure:

```json
// This example demonstrated an MCP server using the stdio format
// Cursor automatically runs this process for you
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}

// This example demonstrated an MCP server using the SSE format
// The user should manually setup and run the server
// This could be networked, to allow others to access it too
{
  "mcpServers": {
    "server-name": {
      "url": "http://localhost:3000/sse",
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

The Chat Agent will automatically use any MCP tools that are listed under `Available Tools` on the MCP settings page if it determines them to be relevant. To prompt tool usage intentionally, simply tell the agent to use the tool, referring to it either by name or by description. You can also enable or disable individual MCP tools from the settings page to control which tools are available to the Agent.

> MCP servers offer two main capabilities: tools and resources. Tools are available in Cursor today, and allow Cursor to execute the tools offered by an MCP server, and use the output in its further steps. However, resources are not yet supported in Cursor. We are hoping to add resource support in future releases.

## Cline 
Cline is a VS Code extension that brings AI-powered coding assistance directly to your editor.

Plan & Act modes represent Cline’s approach to structured AI development, emphasizing thoughtful planning before implementation. Plan mode is where you and Cline figure out what you’re trying to build and how you’ll build it. In this mode, Cline can read your entire codebase to understand the context, and won’t make any changes to your files. Once you’ve got a plan, you switch to Act mode. This mode allows Cline to execute against the agreed plan and make changes to your codebase.

If you’re new to Cline - for anything you want to do:
- write your prompt, select “plan”, run it.
- once that’s done, assuming you don’t want it to change anything it planned, press “act”.

> Cline doesn't index your codebase (Code doesn't work in chunks and moves fast). Instead, it begins by understanding the architecture. Using ASTs, Cline extracts a high-level map of your code – the classes, functions, methods, and their relationships. No index or embeddings. Just intelligent exploration, building context by following the natural structure of your code.

### Context Window
Context window determines how much information the model can “remember” and process at once during your conversation. This includes your conversation and the assistant’s response. Different models have different context window sizes.

Cline helps you manage this limitation with its Context Window Progress Bar, which shows:
- Input tokens (what you’ve sent to the model)
- Output tokens (what the model has generated)
- A visual representation of how much of your context window you’ve used
- The total capacity for your chosen model

### Cline rules
You can create a rule by clicking the `+` button in the Rules tab. This will open a new file in your IDE which you can use to write your rule. Your rule will be stored in the `.clinerules` directory in your project (if it’s a Workspace Rule) or in the `Documents/Cline/Rules` directory (if it’s a Global Rule).

### `@` Mentions
`@` mentions are one of Cline’s most powerful features, letting you seamlessly bring external context into your conversations. These mentions let you reference files, folders, problems, terminal output, git changes, and even web content directly in your conversations.

1. When you send a message, Cline scans the text for `@` mention patterns using regular expressions.
2. For each detected mention, Cline determines the mention type, fetches the relevant content, and formats the content appropriately.
3. The original message is enhanced with structured data, and this enhanced message with all the embedded content is sent to the AI model.

### Tools
Cline has access to the following tools for various tasks:
- File Operations: `write_to_file`, `read_file`, `search_files`, `list_files`
- Terminal Operations: `execute_command`, `list_code_definition_names`
- MCP Tools: `use_mcp_tool`, `access_mcp_resource`

## Coding agent and agent mode in GitHub Copilot
- Agent mode: a real‑time collaborator that sits in your editor, works with you, and edits files based on your needs.
- Coding agent: an asynchronous teammate that lives in the cloud, takes on issues, and sends you fully tested pull requests while you do other things. *(Requires Copilot Pro+ or Copilot Enterprise)*

**Agent mode** transforms Copilot Chat into an orchestrator of tools (`read_file`, `edit_file`, `run_in_terminal`, etc.). Give it a natural‑language goal—“add OAuth to our Flask app and write tests”—and it plans, edits files, runs the test suite, reads failures, fixes them, and loops until green. You watch the steps, intervene when you like, and keep all changes local.

Where agent mode lives in the IDE, **coding agent** lives in your repos. Assign an issue to Copilot, and it spins up a secure cloud workspace (via GitHub Actions), figures out a plan, edits code on its own branch, runs your tests/linters, and opens a pull request tagging you for review.

Microsoft have released the GitHub Copilot Chat client for VS Code under an open source (MIT) license. So far this is just the extension that provides the chat component of Copilot. The agent instructions can be found in [prompts/node/agent/agentInstructions.tsx](https://github.com/microsoft/vscode-copilot-chat/blob/main/src/extension/prompts/node/agent/agentInstructions.tsx).

### Adding repository custom instructions
Create a `.github/copilot-instructions.md` file in your repository's root directory and add natural language instructions in Markdown format. These instructions will guide Copilot's behavior across your project.

- https://github.com/github/awesome-copilot

> By the way, Claude includes a System Prompts release notes section in its docs. This section logs updates made to the default system prompts used on Claude.ai and in the mobile apps. The system prompt does not affect the API. Check it out here: https://docs.anthropic.com/en/release-notes/system-prompts

## Gemini CLI
Gemini CLI brings the capabilities of Gemini models to your terminal in an interactive Read-Eval-Print Loop (REPL) environment. Gemini CLI consists of a client-side application (`packages/cli`) that communicates with a local server (`packages/core`), which in turn manages requests to the Gemini API and its AI models. Gemini CLI also contains a variety of tools for tasks such as performing file system operations, running shells, and web fetching, which are managed by `packages/core`.

- Query and edit large codebases in and beyond Gemini's 1M token context window.
- Generate new apps from PDFs or sketches, using Gemini's multimodal capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Use tools and MCP servers to connect new capabilities.
- Ground your queries with the Google Search tool, built in to Gemini.

```sh
# CLI Commands: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/commands.md

# Save and resume conversation history
/chat list
/chat save <tag>
/chat resume <tag>

# Replace the entire chat context with a summary. 
# This saves on tokens used for future tasks while 
# retaining a high level summary of what has happened.
/compress

# Display a list of tools that are currently available within Gemini CLI.
# https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/index.md
/tools

# List MCP servers
# Configure the MCP server in `.gemini/settings.json` file
/mcp

# Manage the AI's instructional context
# (hierarchical memory loaded from GEMINI.md files).
/memory add <text to remember>
/memory show
```

Gemini CLI uses `settings.json` files for persistent configuration.
- User settings file at `~/.gemini/settings.json`. Applies to all Gemini CLI sessions for the current user.
- Project settings file at `.gemini/settings.json` within your project's root directory.

Gemini CLI can be run in a non-interactive mode, which is useful for scripting and automation. In this mode, you pipe input to the CLI, it executes the command, and then it exits.

```sh
echo "What is fine tuning?" | gemini

gemini -p "What is fine tuning?"
```

The core system prompt lives in [packages/core/src/core/prompts.ts](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/core/prompts.ts) or read it [here](https://gist.github.com/simonw/9e5f13665b3112cea00035df7da696c6).
