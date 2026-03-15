---
title: "Coding with AI"
description: ""
added: "May 27 2025"
tags: [AI]
updatedDate: "Mar 8 2026"
---

## Get Started with Cursor

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
  Cursor lets you input your own API keys for various LLM providers to send as many AI messages as you want at your own cost. To use your own API key, go to Cursor Settings > Models and enter your API keys.

To view your current usage, you can visit the dashboard at [cursor.com/dashboard](https://www.cursor.com/dashboard)

### Tab

Cursor Tab is our native autocomplete feature. You can accept a suggestion by pressing `Tab`, or reject it by pressing `Esc`.

### Chat (Cmd + I)

Chat (previously “Composer”) is Cursor’s AI assistant that lives in your sidebar, letting you interact with your codebase through natural language.

Sometimes you may want to revert to a previous state of your codebase. Cursor helps you with this by automatically creating checkpoints of your codebase at each request you make, as well every time the AI makes changes to your codebase. To revert to a previous state, you can click the “Restore Checkpoint” button that appears within the input box of a previous request.

Agent is the default and most autonomous mode in Cursor, designed to handle complex coding tasks with minimal guidance. It has all tools enabled to autonomously explore your codebase, read documentation, browse the web, edit files, and run terminal commands to complete tasks efficiently.

Ask is a “read-only” mode for the Chat made to ask questions, explore, and learn about a codebase. It is a built-in mode in Cursor that has search tools enabled by default.

Manual mode is designed for making targeted code modifications when you know exactly what changes are needed and where. To make use of Manual mode, you need to explicitly mention the files you want to edit using the `@` symbol. _e.g. “In @src/utils/helpers.ts and @src/components/UserProfile.tsx, rename the function `getUserData` to `fetchUserProfile` and update all call sites within these files.”_

### Inline Edit (Cmd + K)

We call the bar that appears when you press `Cmd + K` the “Prompt Bar”. It works similarly to the AI input box for chat, in which you can type normally, or use `@` symbols to reference other context.

If no code is selected when you press `Cmd + K`, Cursor will generate new code based on the prompt you type in the prompt bar. For in-place edits, you can simply select the code you want to edit and type into the prompt bar.

When your changes might affect multiple files or you need more advanced capabilities, use `Cmd + L` to send your selected code to the Agent. This seamlessly transitions your work to Chat mode.

### Context

When a project is opened, each Cursor instance will initialize indexing for that workspace. After the initial indexing setup is complete, Cursor will automatically index any new files added to your workspace to keep your codebase context current. Behind the scenes, Cursor computes embeddings for each file in your codebase, and will use these to improve the accuracy of your codebase answers.

The status of your codebase indexing is under Cursor Settings > Features > Codebase Indexing.

You can control which directories and files Cursor can access by adding a `.cursorignore` file to your root directory. Cursor makes its best effort to block access to files listed in `.cursorignore` from codebase indexing, Tab, Chat, Cmd-K, and `@` symbol references.

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
  .cursor/rules/    # Project-wide rules
  backend/
    .cursor/rules/  # Backend-specific rules
  frontend/
    .cursor/rules/  # Frontend-specific rules
```

Nested rules automatically attached when files in their directory are referenced. This is particularly useful in monorepos or projects with distinct components that need their own specific guidance.

- https://github.com/PatrickJS/awesome-cursorrules
- https://cursor.directory

Project rules live in `.cursor/rules` as markdown files. Each rule is a markdown file that you can name anything you want. Cursor supports `.md` and `.mdc` extensions. Use `.mdc` files with frontmatter to specify description and globs for more control over when rules are applied. Unlike project rules, `AGENTS.md` is a plain markdown file without metadata or complex configurations. It's perfect for projects that need simple, readable instructions without the overhead of structured rules.

`AGENTS.md` is an open standard for providing AI coding agents with project-specific context and instructions. It is compatible with a growing ecosystem of AI coding agents. Before `AGENTS.md`, many teams used Cursor-specific rules files to configure AI behavior. `AGENTS.md` provides a vendor-neutral alternative. For large codebases, place `AGENTS.md` files in subdirectories. Agents read the nearest file in the directory tree, so each package can have tailored instructions.

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

### Browser

Cursor Browser is a built-in browser tool that allows Cursor to interact with web applications directly. With Cursor Browser, the agent can navigate pages, fill forms, click elements, inspect console logs, and monitor network requests - all without leaving Cursor.

The agent can read console logs, network requests, and even control the browser to do automated testing for you. You don't have to install any third-party MCP servers, just works. To use Cursor Browser, simply reference the browser in your prompts.

- @browser Fill out forms with test data, click through workflows, test responsive designs, validate error messages, and monitor console for JavaScript errors

- @browser Analyze this design mockup, extract colors and typography, and generate pixel-perfect HTML and CSS code

### Cloud Agents

Cloud agents make it easy to run many agents at once, without requiring your laptop to stay connected to the internet. https://cursor.com/docs/cloud-agent

- Cursor Web: Start and manage agents from [cursor.com/agents](https://cursor.com/agents) on any device
- Cursor Desktop: Select **Cloud** in the dropdown under the agent input
- Slack: Use the `@cursor` command to kick off an agent
- GitHub: Comment `@cursor` on a PR or issue to kick off an agent

Cloud agents run on an isolated Ubuntu machine. We recommend configuring this environment so that the agent has access to similar tools a human developer. Go to [cursor.com/onboard](https://cursor.com/onboard) to configure your environment. Cloud agents onboard themselves onto your codebase and produce merge-ready PRs with artifacts to demo their changes. You can also control the agent's remote desktop to use the modified software and make edits yourself, without checking out the branch locally.

> The local agent model - Cursor, Windsurf, Claude Code in your terminal - is a human and an AI sharing a single environment. You're pair programming. The cloud agent model is delegation. You describe the task, the agent executes it independently, and you get back a PR. These are not competing approaches. They're complementary.

## Bugbot

Bugbot reviews pull requests for bugs and issues (Upgrade to Pro to unlock Bugbot). It runs automatically on each PR update or manually when triggered. Manual trigger by commenting `cursor review` or `bugbot run` on any PR.

> Requires Cursor admin access and GitHub org admin access.
>
> 1. Go to cursor.com/dashboard
> 2. Navigate to the Integrations tab
> 3. Click Connect GitHub
> 4. Follow the GitHub installation flow
> 5. Return to the dashboard to enable Bugbot on specific repositories

Create `.cursor/BUGBOT.md` files to provide project-specific context for reviews. Bugbot always includes the root `.cursor/BUGBOT.md` file and any additional files found while traversing upward from changed files.

Bugbot Autofix automatically spawns a Cloud Agent to fix bugs found during PR reviews. Autofix runs cloud agents on their own machines to test changes and propose fixes directly on your PR. Bugbot will post a comment on the original PR with a preview of the autofix changes, which you can merge using the provided `@cursor` command.

### Plugins

Plugins bundle capabilities like MCP servers, skills, subagents, rules, and hooks that extend agents with custom functionality. They work across the IDE, CLI, and Cloud. Browse community-built plugins or build your own to share with other developers. https://cursor.com/docs/plugins

You can discover and install prebuilt plugins on the [Cursor Marketplace](https://cursor.com/marketplace) or create your own and share them with the community.

- https://cursor.com/marketplace/slack
- https://cursor.com/marketplace/figma
- https://cursor.com/marketplace/glean

## GitHub Copilot

### Coding agent and agent mode

- Agent mode: a real‑time collaborator that sits in your editor, works with you, and edits files based on your needs.
- Coding agent: an asynchronous teammate that lives in the cloud, takes on issues, and sends you fully tested pull requests while you do other things. _(Requires Copilot Pro+ or Copilot Enterprise)_

**Agent mode** transforms Copilot Chat into an orchestrator of tools (`read_file`, `edit_file`, `run_in_terminal`, etc.). Give it a natural‑language goal—“add OAuth to our Flask app and write tests”—and it plans, edits files, runs the test suite, reads failures, fixes them, and loops until green. You watch the steps, intervene when you like, and keep all changes local.

While agent mode lives in the IDE, **coding agent** lives in your repos. Assign an issue to Copilot, and it spins up a secure cloud workspace (via GitHub Actions), figures out a plan, edits code on its own branch, runs your tests/linters, and opens a pull request tagging you for review. Check out https://code.visualstudio.com/docs/copilot/copilot-coding-agent

> Copilot coding agent starts working when you assign a GitHub Issue to Copilot, start a task from the [agents panel](https://github.blog/news-insights/product-news/agents-panel-launch-copilot-coding-agent-tasks-anywhere-on-github), or initiate a task from Copilot Chat in VS Code. From there, the agent opens a draft pull request, pushes commits as it works, and logs key steps along the way so you can track its progress in real time.

[2025-07] Microsoft have released the GitHub Copilot Chat client for VS Code under an open source (MIT) license. So far this is just the extension that provides the chat component of Copilot. The agent instructions can be found in [prompts/node/agent/agentInstructions.tsx](https://github.com/microsoft/vscode-copilot-chat/blob/main/src/extension/prompts/node/agent/agentInstructions.tsx).

[2025-09] GitHub releases the GitHub Copilot CLI, a new entry that brings the power of Copilot directly to the command line. By simply running `copilot`, you enter an interactive session where you can prompt the agent, review its plans, and approve its actions in a conversational turn-based manner. It defaults to Claude Sonnet 4 but you can set `COPILOT_MODEL=gpt-5` to switch to GPT-5. It's billed against your existing GitHub Copilot account.

[2026-01] GitHub Copilot SDK (now in technical preview) allows you to take the same Copilot agentic core that powers GitHub Copilot CLI and embed it in any application. This means instead of wiring your own planner, tool loop, and runtime, you can embed that agentic loop directly into your application and build on top of it for any use case. Get started here: https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md

### Creating custom instructions

Repository-wide custom instructions, which apply to all requests made in the context of a repository. These are specified in a `.github/copilot-instructions.md` file in your repository's root directory.

> Configure your repositories with `.github`: https://cassidoo.co/post/dot-github/

Path-specific custom instructions, which apply to requests made in the context of files that match a specified path. These are specified in one or more `NAME.instructions.md` files within the `.github/instructions` directory in the repository. At the start of the file, create a frontmatter block containing the `applyTo` keyword. Use glob syntax to specify what files or directories the instructions apply to.

You can create one or more `AGENTS.md` files, stored anywhere within the repository. It can be found at the root of a repository or within subdirectories (e.g., `backend/AGENTS.md`, `frontend/AGENTS.md`). This allows for fine-grained control and specialized instructions for different parts of a project.

What happens when you send a prompt in Copilot Chat?

```
System Prompt
(core identity and global rules, tool use instructions, output format instructions)
  ↓
User Prompt
(environment info, workspace info and project file structure)
  ↓
User Prompt
(current date/time, file you added to chat)
  ↓
User Request: "write a function that..."
```

### What are premium requests

Each time you send a prompt in a chat window or trigger a response from Copilot, you’re making a request. Some Copilot features use more advanced processing power and count as premium requests. Copilot Chat uses one premium request per user prompt, multiplied by the model's rate. This includes ask, edit, agent, and plan modes in Copilot Chat in an IDE.

Different models have different premium request multipliers, which can affect how much of your monthly usage allowance is consumed. GPT-5 mini, GPT-4.1 and GPT-4o are the included models, and do not consume any premium requests if you are on a paid plan.

If you use Copilot Free, your plan comes with up to 2,000 inline suggestion requests and up to 50 premium requests per month. All chat interactions count as premium requests.

If you're on a paid plan, you get unlimited inline suggestions and unlimited chat interactions using the included models. Paid plans also receive a monthly allowance of premium requests (300 for Copilot Pro, 1000 for Copilot Enterprise).

- https://docs.github.com/en/copilot/get-started/plans
- https://docs.github.com/en/copilot/concepts/billing/copilot-requests

### Agent Skills

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. At its core, a skill is a folder containing a `SKILL.md` file. This file includes metadata and instructions that tell an agent how to perform a specific task. More at https://agentskills.io/

You can create Agent Skills to teach Copilot how to perform specialized tasks in a specific, repeatable way. Agent Skills are folders containing instructions, scripts, and resources that Copilot automatically loads when relevant to your prompt. Skills support is coming to the stable version of VS Code in early January 2026.

You can write your own skills, or use skills shared by others, such as those in the [anthropics/skills](https://github.com/anthropics/skills) repository.

- https://skills.sh
- https://github.com/anthropics/skills/tree/main/skills
- https://github.com/github/awesome-copilot/tree/main/skills
- https://github.com/mgechev/skills-best-practices

> Skills and MCP
>
> MCP is where capability lives. It's what allows an AI agent to actually do things instead of just talking about them. Skills live at a different layer. Skills are about process and knowledge. They're markdown files that encode how work should be done.
>
> MCP gives agents abilities. Skills teach agents how to use those abilities well.

> [Playwright MCP vs Playwright CLI](https://github.com/microsoft/playwright-mcp)
>
> Modern coding agents increasingly favor CLI–based workflows exposed as SKILLs over MCP because CLI invocations are more token-efficient: they avoid loading large tool schemas and verbose accessibility trees into the model context, allowing agents to act through concise, purpose-built commands.

Skills are a dynamic context that bundles together instructions, scripts, and templates into a modular package. Unlike Rules, Skills are progressively loaded. The model only sees the Skill's name and description at first. If the agent decides the Skill is relevant to your request, it "calls" the skill, loading the full instructions and executing the necessary scripts. Use Skills for complex capabilities the model doesn't natively have, like reading PDF files or interacting with specific database schemas. They expand the agent's powers without bloating the context window or increasing costs when they aren't being used.

Three-level loading pattern to manage context efficiently (progressive disclosure):

| Level | What                                           | When Loaded                | Token Cost              |
| ----- | ---------------------------------------------- | -------------------------- | ----------------------- |
| 1     | `name` + `description` from index              | At startup or when probing | ~100 tokens per skill   |
| 2     | Full `SKILL.md` body                           | When skill is activated    | < 5k tokens recommended |
| 3     | Referenced files (scripts, references, assets) | On demand, as needed       | Unlimited               |

"Making devs finally write docs by calling them “skills” is a clever trick."

- npx skills add vercel-labs/next-skills
- npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
- npx skills add anthropics/skills --skill frontend-design
- npx skills add vuejs-ai/skills
- npx skills add vercel/ai
- npx skills add remotion-dev/skills
- npx skills add addyosmani/web-quality-skills
- npx skills add clerk/skills
- npx skills add shadcn/ui

People also made their own skills collections:

- https://github.com/antfu/skills
- https://github.com/sergiodxa/agent-skills
- https://github.com/JimLiu/baoyu-skills
- https://github.com/intellectronica/agent-skills
- https://github.com/mattpocock/skills
- https://github.com/addyosmani/agent-skills

### Copilot CLI

GitHub Copilot CLI is the terminal-native coding agent that brings the power of GitHub Copilot directly to your command line. It’s an autonomous coding agent that can plan complex tasks, execute multistep workflows, edit files, run tests, and iterate until the job is done. You choose how much control to keep, from approving every action to letting Copilot run fully autonomously.

It is available with /plan, /plugin, /resume, /review, /yolo, /models, multi-model in single request autopilot, custom agents, and much more.

- https://github.blog/changelog/2026-02-25-github-copilot-cli-is-now-generally-available
- https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices
- https://docs.github.com/en/copilot/reference/cli-command-reference

### Plugins and marketplaces

Plugins are installable packages that extend GitHub Copilot CLI with reusable agents, skills, hooks, and integrations.

A marketplace is a registry of plugins that you can browse and install from. You can add a marketplace to your CLI configuration, which allows you to use the CLI to browse and install plugins from that marketplace. Copilot comes with two marketplaces already registered by default: `copilot-plugins` and `awesome-copilot`.

```sh
# Find plugins
/plugin marketplace list
/plugin marketplace browse MARKETPLACE-NAME

# Install from a registered marketplace
/plugin install PLUGIN-NAME@MARKETPLACE-NAME

# Install from a repository on GitHub
# the repository must contain a `plugin.json` file
/plugin install OWNER/REPO
/plugin install URL-OF-GIT-REPO

# Install from a local path
plugin install ./PATH/TO/PLUGIN

# Add a new marketplace
/plugin marketplace add OWNER/REPO
```

- Finding and installing plugins: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing
- Create a plugin: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating

## Claude Code

Claude Code is an agentic command line tool that lives in your terminal, understands your codebase, and helps you code faster through natural language commands.

- It offers IDE integrations, allowing you to use Claude Code directly from your preferred development environment.
- It is also available as a tab within the Claude Desktop application, providing a graphical interface.

Read more at https://adocomplete.com/advent-of-claude-2025

| Command   | Description                         |
| --------- | ----------------------------------- |
| !command  | Execute bash immediately            |
| Esc Esc   | Rewind conversation/code            |
| Ctrl+R    | Reverse search history              |
| Ctrl+S    | Stash current prompt                |
| Shift+Tab | Toggle plan mode                    |
| Ctrl+O    | Toggle verbose mode                 |
| /init     | Generate CLAUDE.md for your project |
| /context  | View token consumption              |
| /stats    | View your usage statistics          |
| /usage    | Check rate limits                   |
| /config   | Open configuration                  |
| /hooks    | Configure lifecycle hooks           |
| /sandbox  | Set permission boundaries           |
| /export   | Export conversation to markdown     |
| /resume   | Resume a past session               |

### Create custom subagents

Subagents are specialized AI assistants that handle specific types of tasks. Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions. When Claude encounters a task that matches a subagent’s description, it delegates to that subagent, which works independently and returns results.

Claude Code includes built-in subagents that Claude automatically uses when appropriate. (Explore, Plan, General-purpose, Bash, etc)

Subagents are defined in Markdown files with YAML frontmatter. You can create them manually or use the `/agents` command.

```
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:

1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

...
```

### Prebuilt plugins through marketplaces

Plugins extend Claude Code with skills, agents, hooks, and MCP servers. Plugin marketplaces are catalogs that help you discover and install these extensions without building them yourself.

```sh
# Install a plugin from the official marketplace
/plugin install plugin-name@claude-plugins-official

# Register the marketplace first
/plugin marketplace add obra/superpowers-marketplace
# Then install the plugin from this marketplace
/plugin install superpowers@superpowers-marketplace

/plugin marketplace list
/plugin marketplace update marketplace-name
/plugin marketplace remove marketplace-name

/plugin disable plugin-name@marketplace-name
/plugin enable plugin-name@marketplace-name
/plugin uninstall plugin-name@marketplace-name
```

> Claude Code doesn't support AGENTS.md now:
>
> - https://github.com/anthropics/claude-code/issues/6235
> - https://github.com/anthropics/claude-code/pull/29835
>
> You can just create a `CLAUDE.md` in your project root with this single line: `@AGENTS.md`. This tells Claude Code to load the full contents of your `AGENTS.md` file as part of its memory.
> Another workaround is to create symbolic link `CLAUDE.md` that refers to `AGENTS.md` using `ln` command.
>
> Similarly, the `.agents/skills/` path is part of the Agent Skills open standard which is a cross-tool standard, but Claude Code uses its own `.claude/` directory structure, not `.agents/`.

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

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    }
  }
}
```

> Tip: Always mention "use context7" at the end of your prompts to make sure the AI uses the Context7 server for the most current documentation and examples.

Gemini CLI can be run in a non-interactive mode, which is useful for scripting and automation. In this mode, you pipe input to the CLI, it executes the command, and then it exits.

```sh
echo "What is fine tuning?" | gemini

gemini -p "What is fine tuning?"
```

The core system prompt lives in [packages/core/src/core/prompts.ts](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/core/prompts.ts) or read it [here](https://gist.github.com/simonw/9e5f13665b3112cea00035df7da696c6).

## Codex

Codex is OpenAI’s coding agent for software development. ChatGPT Plus, Pro, Business, Edu, and Enterprise plans include Codex. https://developers.openai.com/codex

- Codex app: Once you downloaded and installed the Codex app, open it and sign in with your ChatGPT account. Choose a project folder that you want Codex to work in. If you used the Codex app, CLI, or IDE Extension before you’ll see past projects that you worked on.
- Codex extension for your IDE: It appears in the sidebar alongside your other extensions. It starts in Agent mode by default, which lets it read files, run commands, and write changes in your project directory.
- Codex CLI: Install with `npm install -g @openai/codex`. Run codex in your terminal to get started. You’ll be prompted to sign in with your ChatGPT account or an API key.
- Codex in the cloud at [`chatgpt.com/codex`](https://chatgpt.com/codex): Open the environment settings and follow the steps to connect a GitHub repository. You can also delegate a task to Codex by tagging `@codex` in a GitHub pull request comment (requires signing in to ChatGPT).
