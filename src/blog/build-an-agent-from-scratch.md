---
title: "Build an agent from scratch"
description: ""
added: "Mar 22 2025"
tags: [AI]
---

> This post is organized using an LLM based on [Kam Lasater's talk](https://kamlasater.com/talks/agents-2025) and [the accompanying code](https://github.com/mfdtrade/agent-talk-2025).

At its core, an agent can be defined with this simple equation:

```
agent = llm + memory + planning + tools + while loop
```

Let's explore how each component works by building a minimalist but functional agent system from scratch.

## The Core Components

### 1. The LLM: The Agent's Brain

Everything starts with a language model. Here's a simple OpenAI API call that forms our foundation:

```javascript
async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "developer", content: "You are a helpful assistant..."},
      { role: "user", content: "What is your name?" }
    ],
    model: "gpt-4o",
  });

  console.log(completion.choices[0]);
}
```

By itself, this is just a chat completion - not yet an agent.

### 2. The Tool Ecosystem

Tools allow an agent to interact with the world beyond just generating text. Here's how we define our tools:

```javascript
export const functions = {
  searchGoogle,
  addTodos,
  markTodoDone,
  checkTodos,
  checkGoalDone,
  browseWeb
}

// import { zodFunction } from "openai/helpers/zod";
// zodFunction({
//   name: "...",
//   description: "...",
//   parameters: z.xx
// })
export const configsArray = [
  searchGoogleToolConfig,
  addTodosToolConfig,
  markTodoDoneToolConfig,
  checkTodosToolConfig,
  checkGoalDoneToolConfig,
  browseWebToolConfig
]
```

Each tool has an implementation function and a configuration that describes it to the LLM. Let's look at a specific tool example:

```javascript
export async function browseWeb({url}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0...',
      'Accept': 'text/html,application/xhtml+xml...'
    }
  });
    
  const html = await response.text();
  const $ = cheerio.load(html);
    
  // Clean up HTML by removing unnecessary elements
  $("script, style, nav, footer, iframe, .ads").remove();

  // Extract title and main content and convert to markdown
  const title = $("title").text().trim() || $("h1").first().text().trim();
  const mainContent = $("article, main, .content, #content, .post").first().html() 
    || $("body").html();
  const content = turndown.turndown(mainContent || "");
  
  return `---\ntitle: '${title}'\n---\n\n${content}`;
}

export const browseWebToolConfig = zodFunction({
  name: "browseWeb",
  description: "Visit a URL and return a markdown version of the browsed page content.",
  parameters: z.object({
    url: z.string().describe("The url of the web page to go get and return as markdown.")
  })
})
```

This setup gives the LLM a rich description of what the tool does and the parameters it needs, while also enforcing type safety through Zod schemas.

### 3. The Execution Loop

The heart of our agent is this recursive function that creates the execution loop:

```javascript
export async function completeWithTools(args) {
  const completion = await openai.chat.completions.create(args)

  if (completion.choices[0].message.tool_calls) {
    const toolCalls = completion.choices[0].message.tool_calls;
    args.messages.push(completion.choices[0].message);

    await Promise.all(toolCalls.map(async (toolCall) => {
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const result = await tools.functions[toolCall.function.name](toolArgs);

      args.messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result
      });
    }))

    return completeWithTools(args)
  }
  
  return completion
}
```

This function:
1. Calls the LLM with the current conversation state
2. If the LLM decides to use tools, it:
   - Executes each tool with its arguments
   - Adds both the tool call and results to the conversation context
   - Recursively calls itself again
3. If no tools are called, it returns the final completion

This recursion creates a natural "while" loop that continues until the LLM decides it has completed the task.

### 4. Planning Through Todo Lists

Our agent uses a simple todo list system for planning:

```javascript
let todos = []
const done = []

export function addTodos({newTodos}) {
  todos.push(...newTodos)
  const delim = '\n  - '
  console.log(`Todo list:${delim}${todos.join(delim)}`)
  return `Added ${newTodos.length} to todo list. Now have ${todos.length} todos.`
}

export function markTodoDone({todo}) {
  if (todos.includes(todo)) {
    todos = todos.filter(item => item !== todo)
    done.push(todo)
    return `Marked the following todo as done:\n  ${todo}`
  } else {
    return `Todo list doesn't include todo:\n  ${todo}`
  }
}

export function checkTodos({}) {
  if (todos.length > 0) {
    return JSON.stringify(todos)
  } else {
    return "The todo list is empty."
  }
}
```

This creates external state that persists across LLM calls, giving the agent a way to track progress.

### 5. Self-Evaluation With LLM-as-Judge

The final key piece is the agent's ability to evaluate its own success:

```javascript
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod';

export async function checkGoalDone({goal, answer}) {
  const resp = await completeWithTools({
    model: "gpt-4o",
    messages: [{
      role: "developer",
      content: prompt
    },{
      role: "user",
      content: `## Request: ${goal}\n\n## Answer: ${answer}`,
    }],
    response_format: zodResponseFormat(
      z.object({
        done: z.boolean().describe('Does the answer satisfies the request?'),
        feedback: z.array(z.string()).describe('If not done, an array of specific actionable todos that are needed to be done to complete the request')
      }
    ), "doneResponseSchema")
  })

  const check = JSON.parse(resp.choices[0].message.content)
  return JSON.stringify(check)
}
```

This function uses another LLM call to judge whether the goal has been met, returning both a completion status and specific feedback if the task isn't done.

## Putting It All Together

Here's how we wire all these components into a complete agent system:

```javascript
const prompt = `
You are a helpful assistant working for a busy executive.
Your tone is friendly but direct, they prefer short clear and direct writing.
You try to accomplish the specific task you are given.
You can use any of the tools available to you.
Before you do any work you always make a plan using your Todo list.
You can mark todos off on your todo list after they are complete.

You summarize the actions you took by checking the done list then create a report.
You always ask your assistant to checkGoalDone. If they say you are done you send the report to the user.
If your assistant has feedback you add it to your todo list.
`

async function main() {
  const completion = await completeWithTools({
    messages: [
      { role: "developer", content: prompt },
      { role: "user", content: goal}
    ],
    model: "gpt-4o",
    tool_choice: "auto",
    tools: tools.configsArray,
    store: false
  });

  const answer = completion.choices[0].message.content
  console.log(`Answer: ${answer}`);
}
```

The system prompt instructs the LLM to:
1. Make a plan using the todo list
2. Check the current todo list
3. Use tools to accomplish the tasks
4. Mark tasks as done
5. Check if the goal is complete
6. Either report back or add new todos based on feedback

This creates a complete agent lifecycle:

```
                        +-------------------+
                        |  User Input Goal  |
                        +--------+----------+
                                 |
                                 v
                   +------------------------------+
                   |      System Initialization   |
                   | (Load prompt, configure LLM) |
                   +-------------+----------------+
                                 |
                                 v
              +------------------------------------+
              |           Planning Phase           |
              | Process goal → addTodos() → Create |
              |            task list               |
              +---------------+--------------------+
                              |
                              v
              +-------------------------------------+
              |          Begin Execution Loop       |
+------------>|   checkTodos() → Select next task   |<--------------+
|             +---------------+---------------------+               |
|                             |                                     |
|                             v                                     |
|             +-------------------------------------+               |
|             |           Tool Selection            |               |
|             | Choose appropriate tool for task    |               |
|             +---------------+---------------------+               |
|                             |                                     |
|                             v                                     |
|             +-------------------------------------+               |
|             |        Tool Execution (LLM Call)    |               |
|             | completeWithTools() → Execute tool  |               |
|             +---------------+---------------------+               |
|                             |                                     |
|                             v                                     |
|             +-------------------------------------+               |
|             |       Process Tool Results          |               |
|             | Add to conversation, update context |               |
|             +---------------+---------------------+               |
|                             |                                     |
|                             v                                     |
|             +-------------------------------------+               |
|             |         Task Completion             |               |
|             |   markTodoDone() → Update status    |               |
|             +---------------+---------------------+               |
|                             |                                     |
|                             v                                     |
|            +----------------------------------------+             |
|            | All Tasks Done? ------>  No -----------+-------------+
|            |                    |                   |
|            |                    v                   |
|            |                   Yes                  |
|            |                    |                   |
|            +--------------------+-------------------+
|                                 |
|                                 v
|            +----------------------------------------+
|            |          Self-Evaluation               |
|            |   Summarize actions → Create report    |
|            |   checkGoalDone() → Evaluate success   |
|            +------------------+-------------------+
|                               |
|                               v
|            +------------------+-------------------+
+------------+     Goal Complete? ---> No           |
             |                    |                 |
             |                    v                 |
             |                   Yes                |
             |                    |                 |
             +--------------------+-----------------+
                                  |
                                  v
                          +------------------+
                          |  Deliver Report  |
                          |    to User       |
                          +------------------+
```

## Conclusion

Understanding the fundamental components of agents helps demystify what's happening when you use more complex agent frameworks. At their core, agents are simply:

- An LLM that can make decisions
- Tools that extend its capabilities
- A planning mechanism to organize work
- A loop that continues until goals are met
- Memory to track state and progress
