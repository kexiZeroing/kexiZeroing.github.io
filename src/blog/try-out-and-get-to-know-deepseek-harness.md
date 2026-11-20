---
title: "Try out and get to know DeepSeek Harness"
description: ""
added: "Nov 20 2026"
tags: [AI]
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

https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.md
