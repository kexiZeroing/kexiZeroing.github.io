---
title: "Matt Pocock's workflow for AI coding"
description: ""
added: "May 17 2026"
tags: [AI]
---

This post is the learning notes for Matt Pocock's AI Engineer Workshop ([Website](https://www.aihero.dev/ai-engineer-workshop-2026~dwnll), [Youtube](https://www.youtube.com/watch?v=-QFHIoCo-Ko)). It is the repeatable workflow for shipping features with AI coding agents from planning through autonomous execution.

## Use the `/grill-me` skill

Type `/grill-me` into your agent conversation. This invokes the Grill Me skill. The agent will load the skill definition from `.claude/skills/grill-me/SKILL.md` and start asking clarifying questions.

```
Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.
```

## Write a PRD with the `/write-a-prd` skill

You had a conversation with the `/grill-me` skill that clarified what you actually needed to build. Now it's time to turn that conversation into a proper PRD.

Think of a PRD as a conversation artifact. It captures all the decisions you made, all the edge cases you considered, and all the technical tradeoffs you agreed on. This makes it invaluable when you hand off work to an AI agent.

```
This skill will be invoked when the user wants to create a PRD. You may skip steps if you don't consider them necessary.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

5. Once you have a complete understanding of the problem and solution, use the template below to write the PRD. The PRD should be written as a local markdown file at `issues/prd.md`. Create the `issues/` directory if it doesn't exist. Do NOT submit a GitHub issue or call any external service.

Problem Statement
The problem that the user is facing, from the user's perspective.

Solution
The solution to the problem, from the user's perspective.

User Stories
A LONG, numbered list of user stories. This list of user stories should be extremely extensive and cover all aspects of the feature.

Implementation Decisions
A list of implementation decisions that were made.

Testing Decisions
A list of testing decisions that were made.
```

## Turn a PRD into workable issues with the `/prd-to-issues` skill

Now it's time to break that PRD down into independently-workable issues. Each issue should be a single tracer bullet: small enough to implement but complete enough to demonstrate.

The `/prd-to-issues` skill will guide you through this process. It will present a numbered list of potential issues. For each one, it shows:

- The title and description
- Whether it's HITL (human-in-the-loop) or AFK (away-from-keyboard)
- What it depends on (if anything)
- Which user stories it addresses

```
Break a PRD into independently-grabbable issues using vertical slices (tracer bullets), written as local markdown files.

Process
1. Locate the PRD
Ask the user for the PRD file path (e.g. issues/prd.md).

If the PRD is not already in your context window, read it from the file.

2. Explore the codebase (optional)

3. Draft vertical slices
Break the PRD into tracer bullet issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests) - A completed slice is demoable or verifiable on its own - Prefer many thin slices over few thick ones

4. Quiz the user
Present the proposed breakdown as a numbered list. For each slice, show:

Title: short descriptive name
Type: HITL / AFK
Blocked by: which other slices (if any) must complete first
User stories covered: which user stories from the PRD this addresses

5. Create the issue files
For each approved slice, write a markdown file in `issues/` using the naming pattern `issues/NNN-short-title.md` (e.g. issues/001-add-user-auth.md).

Do NOT use `gh issue create` or any GitHub CLI commands. Do NOT reference GitHub issue numbers. Use local filenames for all cross-references.
```

## Running the AFK agent

An autonomous agent can work through your issue backlog. `ralph/prompt.md` is the agent's instruction set. It tells the agent:

- Which issues to work on
- How to prioritize tasks (bugfixes, infrastructure, features, polish, refactors)
- What feedback loops to run (tests, type checking)
- How to commit with meaningful messages

```
# ISSUES

Local issue files from `issues/` are provided at start of context. Parse them to understand the open issues.

You will work on the AFK issues only, not the HITL ones.

You've also been passed a file containing the last few commits. Review these to understand what work has been done.

If all AFK tasks are complete, output <promise>NO MORE TASKS</promise>.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure
3. Tracer bullets for new features
4. Polish and quick wins
5. Refactors

# EXPLORATION

Explore the repo.

# IMPLEMENTATION

Use /tdd to complete the task.

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `npm run test` to run the tests
- `npm run typecheck` to run the type checker

# COMMIT

Make a git commit. The commit message must:

1. Include key decisions made
2. Include files changed
3. Blockers or notes for next iteration

# THE ISSUE

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
```

`ralph/once.sh` script reads your open issues from the `issues/` directory, reads the last 5 commits to understand what's been done, loads the prompt, and passes everything to Claude with permission to make edits.

```sh
#!/bin/bash

issues=$(cat issues/*.md 2>/dev/null || echo "No issues found")
commits=$(git log -n 5 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No commits found")
prompt=$(cat ralph/prompt.md)

claude --permission-mode acceptEdits \
  "Previous commits: $commits Issues: $issues $prompt"
```

## Learn more about Matt's workflow

- https://www.aihero.dev/5-agent-skills-i-use-every-day
- https://github.com/mattpocock/skills
