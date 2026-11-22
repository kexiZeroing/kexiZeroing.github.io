---
title: "Try out and get to know DeepSeek Harness"
description: ""
added: "Nov 20 2026"
tags: [AI]
updatedDate: "Nov 22 2026"
---

DeepSeek Harness is an open-source agent harness, built on an everything-is-a-plugin architecture and powered by Cordis.

## Agent instructions

Every agent framework answers the same question: _how does the model learn about "this project, this machine, this user" without a human pasting context into every chat._

```
# Instructions
- `~/.dsh/AGENTS.md`
- `~/.agents/AGENTS.md`
- `<project-root>/AGENTS.md`
- `<project-root>/CLAUDE.md`
- `<project-root>/AGENTS.local.md` (overlay, loaded after the base files)
- `<project-root>/packages/app/AGENTS.md`

# Skills
~/.dsh/skills/<name>/SKILL.md
~/.agents/skills/<name>/SKILL.md
<project-root>/.dsh/skills/<name>/SKILL.md
<project-root>/.agents/skills/<name>/SKILL.md
```

DSH finds the project root by walking upward from the working directory and taking the first directory that contains `.git`. The first hit is the project root. If no `.git` exists anywhere up the tree, the working directory itself is treated as the root.

Subdirectory files won't auto-load. If you later add `foo/AGENTS.md`, it stays invisible until a read/write/edit actually reaches `foo/`, and it won't be part of the session's baseline.

Within one candidate group, files whose trimmed content is byte-identical are rendered only once. So a `CLAUDE.md` that is a copy of `AGENTS.md` does not double the token cost, and the same applies to `~/.agents/AGENTS.md` and `~/.dsh/AGENTS.md` if their contents are identical.

DSH has no built-in long-term memory file. There is no `MEMORY.md`, `memory.json`, or vector store that the harness reads on startup.

### Built-in skills

If you type `/` and look for Skills section, you can find built-in skills: `dsh-doc` (how DSH itself works), `office` (router for Office/PDF work), `office-docx`, `office-xlsx`, `office-pptx`.

`@deepseek-ai/dsh-skill-office` is a plugin package that ships four skills as folders inside its `assets/` directory. When the plugin loads, it reads each `SKILL.md` and adds those skills to the skill catalog. A row in `@deepseek-ai/dsh-web-app/cordis.patch.yml` is what loads that plugin in the first place.

### PTC mode

PTC (Programmatic tool calling) mode has the same capabilities as the standard mode but lets the model orchestrate several tool calls in one TypeScript program. Instead of emitting individual tool calls and waiting for each round trip, the model writes a program that composes, filters, or parallelizes multiple tool calls in one pass. That's where the token savings can come from, but a failed multi-call can erase that advantage.

> Code Mode is an experimental new feature in Claude Code. It enables Claude to perform multi-step tool calls by writing and running JavaScript. Rather than calling one tool at a time (e.g. Bash, Read, or Edit) and waiting to see the result before deciding what to do next, Code Mode allows Claude to write a simple script to run multiple commands in parallel, passing arguments and filtering outputs for subsequent tool calls to reduce context.
>
> For example, rather than passing large amounts of raw search data into the context window or having to make a large number of sequential calls to perform the same refactoring across dozens of files, Claude can orchestrate these tasks programmatically in a single pass.

### Automation tasks

There is a "Automation tasks" tab in the sidebar. It is DSH’s built-in scheduled task feature.

A task has four parts: a name, an instruction, a repeat rule (once, every N minutes/hours/days/weeks, monthly, or a custom rule), and a run target. At each due time the Host delivers the instruction as a message to a conversation: the same conversation every time (reuse), one new conversation created at the first run.

## What's in `.dsh/`

Here is everything DSH needs to persist that isn't your project. Default location `~/.dsh`, overridable via `$DSH_HOME` at launch.

```
~/.dsh/
├── AGENTS.md               ← global instructions
├── profiles/desktop/       ← how the harness is wired
      ├── cordis.yml        ← empty root entry list. never edit.
      ├── cordis.patch.yml  ← the real config (model, UI settings, plugins)
├── sessions/               ← conversation logs, per workspace
├── storages/               ← UI state (workspace list, caches)
├── dsh-runtimes/           ← downloaded node/python/pnpm payloads
├── .credentials.yaml       ← API keys for providers
└── .anonymous-user-id
```

`sessions/<encoded-cwd>/session-<uuid>/session.v4.jsonl.zstd` is the replayable log. You rarely open it, but it's what "resume session" and compaction read.

`profiles/desktop/cordis.patch.yml` is the file you'll edit most (you can open it from _Settings - Open configuration file_). It's a list of patch entries applied on top of the bundled tree. For example, it sets: model `deepseek-flash` at `high` effort, locale `en`, UI transcript detail, and disables the deepseek session-log plugin. There are two patch layers: `~/.dsh/profiles/desktop/cordis.patch.yml` for one profile and `~/.dsh/cordis.patch.yml` for global settings on the machine.

## MCP configuration

The [@deepseek-ai/dsh-mcp-client](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md) plugin bridges external MCP servers into the normal tool list. Each server contributes tools named: `mcp__<serverName>__<toolName>`.

Edit `~/.dsh/profiles/desktop/cordis.patch.yml`, append one entry per server. When you start DSH, it reads the bundle list from `~/.dsh/profiles/desktop/package.json` → `dsh-base`, `dsh-web-app`, and loads each bundle's rows including one named `mcp-manager`. It then applies your `~/.dsh/profiles/desktop/cordis.patch.yml`. If your file contains `id: mcp-manager`, it finds the matching row in the list above and replaces its config with yours.

```yaml
- id: mcp-manager
  config:
    servers:
      # stdio
      filesystem:
        transport: stdio
        command: npx
        args:
          [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/Users/kexi/Documents",
          ]
        env:
          NODE_OPTIONS: --max-old-space-size=2048
        enabled: true

      # streamable-http
      context7:
        transport: streamable-http
        url: https://mcp.context7.com/mcp
        headers:
          CONTEXT7_API_KEY: "${credential:CONTEXT7_API_KEY}"
        enabled: true
```

Actually there are two ways to attach an MCP server with different ownership. The one described above keeps a list of servers and connects each one for you. You can change that list later from the Settings screen. Turn one off, add one, restart one, see if it's connected. You can do all that while the app is running. Use this way when it's your personal machine and you'll add servers over time.

The other one is that the server isn't a name on a list. It's part of how the app is built. You screw it in with `insert`:

```yaml
- insert:
    - id: mcp-github
      name: "@deepseek-ai/dsh-mcp-client"
      config: { ... }
```

Then it becomes a second, independent MCP path, running alongside the manager, invisible in Settings, not toggleable. To change it, you edit the file and reload. It's fixed and used when a headless/CI deployment must have a fixed server set.

## Cordis plugin framework

[Cordis](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.md) is the plugin framework: a small runtime where every capability is a plugin mounted into a shared context.

### Create your first plugin

Creator mode - Customize DSH through conversation. Let the agent write plugins that add features or UI, or combine tools and prompts to create your own mode.

```
Create a plugin that will register a new tool, and it will be just a Hello World tool that greets someone by their name.
```

It will ask your approval to write:

```
Allow this operation with danger-full-access permissions: plugin_manager {"action":"install_bundle","target":"/xxx/deepseek-harness/default-workspace/hello-tool"}. Profile changes persist across sessions; installed Host code runs outside the workspace sandbox.
```

The results create a self-contained Host-only bundle at `default-workspace/hello-tool/`

- `package.json`: Bundle manifest that exports for the module, declares `dsh.bundle.patch`
- `cordis.patch.yml`: Inserts one Host row, `id: hello-tool` → `@local/hello-tool`
- `index.js`: Registers the hello tool on `ctx.tools`
- `locale/{en,zh}.json`: Localized title and description for the plugin page

```
Use the hello tool to greet Andy

# Tool call
IN
{
  "name": "Andy"
}
OUT
Hello, Andy!
```

The Hello tool plugin will appear in the UI. Click Plugins in the sidebar to find the "Installed plugins", where you can see all the plugins you've installed and enable or disable them.

**Three different things stacked on top of each other:**

- A tool is a runtime object: `{ name, description, parameters, output, execute }` registered in the tool registry (`ctx.tools`). It only exists while a plugin that registers it is loaded.
- A plugin is a JS module exporting `apply(ctx)`. DSH's loader (Cordis) mounts it, calls `apply`, and disposes everything the plugin registered when it unloads. That's why `index.js` returns the disposer from `ctx.tools.register(...)`.
- A bundle is an installable package: a directory with a `package.json` declaring `dsh.bundle.patch`, whose YAML patch inserts plugin rows into the profile's composed config.

> The directory is a bundle. Inside it, `index.js` is the plugin, and that plugin registers the tool.
>
> `package.json` says `dsh.bundle.patch`, and `cordis.patch.yml` adds a row called `hello-tool`. That row is what you see in Plugins _(Plugins page in Settings)_, with its title, description, and icon. The row names a module `@local/hello-tool`. DSH runs that file’s `apply(ctx)`, which calls `ctx.tools.register({ name: 'hello' })`.

### Let the agent create one

Select "Creator mode"

```
Build a small plugin called Focus Timer.

Add a "Focus timer" action to the sidebar footer. It must not appear under the composer.
Clicking it opens a Focus timer page in the right panel:
set 1–180 minutes, Start, show mm:ss with a progress ring, Stop, and at zero
animate a burst around the clock with "Time's up".
```

It ships a bundle package which is a folder with a manifest that says “I have Web UI”, a switch that enables it, an empty server side, and a client file the page loads.

- `package.json` — the label on the box. Two parts matter:
  - `dsh.bundle.patch` → “here is the file that turns me on.”
  - `dsh.client` → “I also have UI code”, `platform: "web"` means run in the Web page.
- `cordis.patch.yml` — adds one row that makes DSH load the plugin.
- `client.js` — the sidebar button, the right-panel page, the timer. The DSH page loads it with `window.__ModuleLoader__.load(...)`.
