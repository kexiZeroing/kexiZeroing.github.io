---
title: "Harness engineering guide"
description: ""
added: "Apr 12 2026"
tags: [AI]
updatedDate: "May 18 2026"
---

Harness engineering keeps coming up in conversations, yet most of us encounter it in our daily work without fully recognizing it.

```
OpenClaw (AGENTS.md) -- LLM -- Cowork/Claude Code (CLAUDE.md)
```

## How agents can run for a long time

- https://www.aihero.dev/getting-started-with-ralph
- https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum
- https://www.reddit.com/r/vibecoding/comments/1ql7pbs/how_do_people_leave_agents_coding_overnight
- https://github.com/agrimsingh/ralph-wiggum-cursor

Ralph is a technique for autonomous AI development that treats LLM context like memory: `while :; do cat PROMPT.md | agent ; done` The same prompt is fed repeatedly to an AI agent. Progress persists in files, not in the LLM's context window. When context fills up, you get a fresh agent with fresh context.

```sh
# https://www.youtube.com/watch?v=_IK18goX4X8
# https://github.com/mattpocock/course-video-manager/blob/main/plans/ralph.sh
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  result=$(claude --permission-mode acceptEdits -p "@plans/prd.json @progress.txt \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first in the list. \
2. Check that the types check via npm run typecheck and that the tests pass via npm run test. \
3. Update the PRD with the work that was done. \
4. Append your progress to the progress.txt file. \
Use this to leave a note for the next person working in the codebase. \
5. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>. \
")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations, exiting."
    exit 0
  fi
done
```

## What is harness engineering

Harness engineering is about building a complete working environment around the model so it produces reliable results.

Harness engineering is an engineering paradigm that engineers stop writing code and instead design environments, clarify intent, and build feedback loops so AI agents can work reliably.

Harness Engineering is not about writing better prompts. It's about designing the system around the model so the agent always knows where it is, what it has done, and what it needs to do next. Even after the context window resets completely.

```
  https://github.com/walkinglabs/learn-harness-engineering
  ┌─────────────────────────────────────────────────────────────────┐
  │                        THE HARNESS                              │
  │                                                                 │
  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
  │   │ Instructions │  │    State     │  │   Verification       │  │
  │   │              │  │              │  │                      │  │
  │   │ AGENTS.md    │  │ progress.md  │  │ tests + lint         │  │
  │   │ CLAUDE.md    │  │ feature_list │  │ type-check           │  │
  │   │ feature_list │  │ git log      │  │ smoke runs           │  │
  │   │ docs/        │  │ session hand │  │ e2e pipeline         │  │
  │   └──────────────┘  └──────────────┘  └──────────────────────┘  │
  │                                                                 │
  │   ┌──────────────┐  ┌──────────────────────────────────────┐    │
  │   │    Scope     │  │         Session Lifecycle            │    │
  │   │              │  │                                      │    │
  │   │ one feature  │  │ init.sh at start                     │    │
  │   │ at a time    │  │ clean-state checklist at end         │    │
  │   │ definition   │  │ handoff note for next session        │    │
  │   │ of done      │  │ commit only when safe to resume      │    │
  │   └──────────────┘  └──────────────────────────────────────┘    │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

The key ideas that kept appearing across sources (https://www.reddit.com/r/ClaudeAI/comments/1s9jm0d/i_had_claude_read_every_harness_engineering_guide):

- Separate generation from evaluation. Agents are reliably bad at grading their own work. A standalone skeptical evaluator is far easier to tune than making a generator self-critical.
- Context windows are the constraint; structured files are the solution. Task lists, progress notes, and git history bridge the gap between sessions.
- One task per session.
- Verify before building. Always run a baseline check at session start. Compounding bugs across sessions is one of the most common failure modes.
- Strip harness complexity with each model upgrade. Every component encodes an assumption about what the model can't do. These go stale fast.

> Asked Claude to build a minimal harness following the [best-practices](https://github.com/celesteanders/harness/blob/main/docs/best-practices.md) file, using the `AskUserQuestion` tool to interrogate about your preferences before writing a line of code.

Every session should be able to answer three questions just by reading files:

- What is the goal?
- What is done?
- What is next?

Feature lists, progress logs, git history, docs are the foundation.

Agents have a habit of saying "Done" when things are actually broken. The fix is giving the agent real tools to test its own work like running the app, checking the UI, catching bugs end to end. Not just saying it worked. Actually proving it.

### AI harness talk by Tejas

- https://www.youtube.com/watch?v=C_GG5g38vLU
- https://github.com/TejasQ/basically-ai-harness

### OpenAI harness engineering

https://openai.com/index/harness-engineering

1. Throughout the development process, humans never directly contributed any code. This became a core philosophy for the team: no manually-written code.

2. When something failed, the fix was almost never “try harder.” Because the only way to make progress was to get Codex to do the work, human engineers always stepped into the task and asked: “what capability is missing, and how do we make it both legible and enforceable for the agent?”

3. We regularly see single Codex runs work on a single task for upwards of six hours (often while the humans are sleeping).

4. We tried the “one big `AGENTS.md`” approach. It failed in predictable ways:
   - Context is a scarce resource. A giant instruction file crowds out the task, the code, and the relevant docs—so the agent either misses key constraints or starts optimizing for the wrong ones.
   - Too much guidance becomes non-guidance. When everything is “important,” nothing is.
   - It rots instantly. A monolithic manual turns into a graveyard of stale rules. Agents can’t tell what’s still true, humans stop maintaining it, and the file quietly becomes an attractive nuisance.
   - It’s hard to verify.

5. So instead of treating `AGENTS.md` as the encyclopedia, we treat it as the table of contents. The repository’s knowledge base lives in a structured `docs/` directory treated as the system of record. A short `AGENTS.md` (roughly 100 lines) is injected into context and serves primarily as a map, with pointers to deeper sources of truth elsewhere.

6. From the agent’s point of view, anything it can’t access in-context while running effectively doesn’t exist. Knowledge that lives in Google Docs, chat threads, or people’s heads are not accessible to the system. Repository-local, versioned artifacts (e.g., code, markdown, schemas, executable plans) are all it can see.

7. The repository operates with minimal blocking merge gates. Pull requests are short-lived. Test flakes are often addressed with follow-up runs rather than blocking progress indefinitely. In a system where agent throughput far exceeds human attention, corrections are cheap, and waiting is expensive.

8. Humans always remain in the loop, but work at a different layer of abstraction than we used to. We prioritize work, translate user feedback into acceptance criteria, and validate outcomes. When the agent struggles, we treat it as a signal: identify what is missing—tools, guardrails, documentation—and feed it back into the repository, always by having Codex itself write the fix.

### Claude harness engineering

https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

1. The agent tended to try to do too much at once—essentially to attempt to one-shot the app. Often, this led to the model running out of context in the middle of its implementation, leaving the next session to start with a feature half-implemented and undocumented. The agent would then have to guess at what had happened, and spend substantial time trying to get the basic app working again.

2. A second failure mode would often occur later in a project. After some features had already been built, a later agent instance would look around, see that progress had been made, and declare the job done.

3. We addressed these problems using a two-part solution:
   - Initializer agent: The very first agent session uses a specialized prompt that asks the model to set up the initial environment: an `init.sh` script, a `claude-progress.txt` file that keeps a log of what agents have done, and an initial git commit that shows what files were added.
   - Coding agent: Every subsequent session asks the model to make incremental progress, then leave structured updates.

4. To address the problem of the agent one-shotting an app or prematurely considering the project complete, we prompted the initializer agent to write a comprehensive file of feature requirements expanding on the user’s initial prompt. These features were all initially marked as “failing” so that later coding agents would have a clear outline of what full functionality looked like. After some experimentation, we landed on using JSON for this, as the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files.

5. The next iteration of the coding agent was then asked to work on only one feature at a time. Once working incrementally, it’s still essential that the model leaves the environment in a clean state after making a code change. In our experiments, we found that the best way to elicit this behavior was to ask the model to commit its progress to git with descriptive commit messages and to write summaries of its progress in a progress file. This allowed the model to use git to revert bad code changes and recover working states of the code base.

6. One final major failure mode that we observed was Claude’s tendency to mark a feature as complete without proper testing. Absent explicit prompting, Claude tended to make code changes, and even do testing with unit tests or curl commands against a development server, but would fail recognize that the feature didn’t work end-to-end.
