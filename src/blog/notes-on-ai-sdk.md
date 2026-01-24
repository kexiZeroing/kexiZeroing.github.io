---
title: "Notes on AI SDK (building agents)"
description: ""
added: "Apr 22 2025"
tags: [AI]
updatedDate: "Jan 24 2026"
---

AI SDK is like an ORM for LLMs. It provides a simple interface to interact with different LLM providers, making it easy to switch between them without changing your code. The first part of this post is my learning notes from the [AI Engineer workshop](https://www.youtube.com/watch?v=kDlqpN1JyIw) tutorial by Nico Albanese.

## Generate Text

Make your first LLM call.

```js
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import "dotenv/config";

const main = async () => {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Hello, world!",
  });
  console.log(result.text);
};

main();
```

`generateText` can take either `prompt` or `messages` as input.

```js
const result = await generateText({
  model: openai("gpt-4o-mini"),
  messages: [{ role: "user", content: "Hello, world!" }],
});
```

Changing providers with the AI SDK is as simple as changing two lines of code. We can pick a model that has web search built in, like `perplexity` or `gemini`, and we can even see what sources were used to generate the text.

```js
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import "dotenv/config";

const main = async () => {
  const result = await generateText({
    model: google("gemini-1.5-flash", { useSearchGrounding: true }),
    prompt: "When is the AI Engineer summit in 2025?",
  });

  console.log(result.text);
  console.log(result.sources);
};

main();
```

## Stream Text

```js
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const result = streamText({
  model: openai("gpt-4o"),
  prompt: "Invent a new holiday and describe its traditions.",
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}
```

## Tools (or Function Calling)

At the core, we give the model a prompt and also pass a list of tools that available. Each of these tools will be provided with a name, a description so the model knows when to use it, and any data it requires to run.

```js
import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import "dotenv/config";
import { z } from "zod";

const main = async () => {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: "What's 10 + 5?",
    tools: {
      addNumbers: tool({
        description: "Add two numbers together",
        parameters: z.object({
          num1: z.number(),
          num2: z.number(),
        }),
        execute: async ({ num1, num2 }) => {
          return num1 + num2;
        },
      }),
    },
  });
  console.log(result.toolResults);
  // [
  //   {
  //     type: 'tool-result',
  //     toolCallId: '...',
  //     toolName: 'addNumbers',
  //     args: { num1: 10, num2: 5},
  //     result: 15,
  //   }
  // ]
};

main();
```

Now we only have the tool results and the model hasn't actually answered the question (`result.text` is empty). How can we get the model incorporate the tool results into a generated text answer?

When `maxSteps` is set to a number greater than 1 and the model generates a tool call, the AI SDK will trigger a new generation passing in the tool result until there are no further tool calls or the maximum number of tool steps is reached.

> If you just need the tool's call result, you can directly access it from `message.toolInvocations` (no need for `maxSteps`). It's when you need to feed the result of the tool invocation back to LLM for it to interpret and respond that's when you need `maxSteps`.

```js
const main = async () => {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: "What's 10 + 5?",
    maxSteps: 2,
    tools: {
      addNumbers: tool({
        description: "Add two numbers together",
        parameters: z.object({
          num1: z.number(),
          num2: z.number(),
        }),
        execute: async ({ num1, num2 }) => {
          return num1 + num2;
        },
      }),
    },
  });

  console.log(result.text); // 10 + 5 equals 15.
  console.log(JSON.stringify(result.steps, null, 2));
  // step 1: The model generates a tool call, and the tool is executed.
  // step 2: The tool result is sent to the model, and the model generates a response.
};
```

We can have multiple tools over multiple steps.

```js
const main = async () => {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: "Get the weather in SF and NY, then add them together.",
    maxSteps: 3,
    tools: {
      addNumbers: tool({
        description: "Add two numbers together",
        parameters: z.object({
          num1: z.number(),
          num2: z.number(),
        }),
        execute: async ({ num1, num2 }) => {
          return num1 + num2;
        },
      }),
      getWeather: tool({
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
          city: z.string(),
        }),
        execute: async ({ latitude, longitude, city }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`,
          );

          const weatherData = await response.json();
          return {
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weathercode,
            humidity: weatherData.current.relativehumidity_2m,
            city,
          };
        },
      }),
    },
  });
  console.log(result.steps.length);
  console.log(result.text);
};

main();
```

You may ask we are not providing the `latitude` and `longitude`. It is the inference capablity we can use, so we can let the language model infer these parameters from the context of the conversation.

## Structured Output

There are two ways to generate structured output with the AI SDK. One is using experimental output option with `generateText`, and the other is using `generateObject` function.

```js
const main = async () => {
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Get the weather in SF and NY, then add them together.',
    maxSteps: 3,
    experimental_output: Output.object({
      schema: z.object({ sum: z.string() }),
    }),
    tools: {
      addNumbers: tool({...}),
      getWeather: tool({...}),
    },
  })

  console.log(result.experimental_output)
  // { sum: 27.5 }
}
```

```js
const main = async () => {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: "Please come up with 3 definitions for AI agents.",
    schema: z.object({
      definitions: z.array(z.string()),
    }),
  });
  console.log(JSON.stringify(result.object, null, 2));
  // {
  //   "definitions": [
  //     "An AI agent is ...",
  //     "An AI agent is ...",
  //     "An AI agent is ..."
  //   ]
  // }
};

// Generate an array
const { object } = await generateObject({
  model: openai("gpt-4.1"),
  output: "array",
  schema: z.object({
    name: z.string(),
    class: z
      .string()
      .describe("Character class, e.g. warrior, mage, or thief."),
    description: z.string(),
  }),
  prompt: "Generate 3 hero descriptions for a fantasy role playing game.",
});

// Generate an enum
const { object } = await generateObject({
  model: openai("gpt-4.1"),
  output: "enum",
  enum: ["action", "comedy", "drama", "horror", "sci-fi"],
  prompt:
    "Classify the genre of this movie plot: " +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."',
});
```

## Deep Research

The rough steps will be:

1. Take the initial input
2. Generate search queries
3. Map through each query and
   - Search the web for a relevant result
   - Analyze the result for learnings and follow-up questions
   - If depth > 0, follow-up with a new query

Let's start by creating a function to generate search queries.

```js
const generateSearchQueries = async (query: string, n: number = 3) => {
  const {
    object: { queries },
  } = await generateObject({
    model: openai('gpt-4o'),
    prompt: `Generate ${n} search queries for the following query: ${query}`,
    schema: z.object({
      queries: z.array(z.string()).min(1).max(5),
    }),
  })
  return queries
}

const main = async () => {
  const prompt = 'What do you need to be a D1 shotput athlete?'
  const queries = await generateSearchQueries(prompt)
  // [
  //   'requirements to be a D1 shotput athlete',
  //   'training regimen for D1 shotput athletes',
  //   'qualifications for NCAA Division 1 shotput',
  // ]
}
```

Now we need to map these queries to web search results. We use [Exa](https://exa.ai) for this.

```js
import Exa from 'exa-js'

const exa = new Exa(process.env.EXA_API_KEY)

const searchWeb = async (query: string) => {
  const { results } = await exa.searchAndContents(query, {
    numResults: 1,
    livecrawl: 'always', // not use cache
  })
  return results.map(
    (r) =>({
      title: r.title,
      url: r.url,
      content: r.text,
    })
  )
}
```

Next thing is to give the model two tools, one to search the web, the other to evaluate the relevance of that tool call. This is the most complicated part of entire workflow, also the agentic part of workflow.

```js
const searchAndProcess = async (query: string) => {
  const pendingSearchResults: SearchResult[] = []
  const finalSearchResults: SearchResult[] = []
  await generateText({
    model: openai('gpt-4o'),
    prompt: `Search the web for information about ${query}`,
    system:
      'You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query',
    maxSteps: 5,
    tools: {
      searchWeb: tool({
        description: 'Search the web for information about a given query',
        parameters: z.object({
          query: z.string().min(1),
        }),
        async execute({ query }) {
          const results = await searchWeb(query)
          pendingSearchResults.push(...results)
          return results
        },
      }),
      evaluate: tool({
        description: 'Evaluate the search results',
        parameters: z.object({}),
        async execute() {
          const pendingResult = pendingSearchResults.pop()!
          const { object: evaluation } = await generateObject({
            model: openai('gpt-4o'),
            prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

            <search_results>
            ${JSON.stringify(pendingResult)}
            </search_results>
            `,
            output: 'enum',
            enum: ['relevant', 'irrelevant'],
          })
          if (evaluation === 'relevant') {
            finalSearchResults.push(pendingResult)
          }
          console.log('Found:', pendingResult.url)
          console.log('Evaluation:', evaluation)
          return evaluation === 'irrelevant'
            ? 'Search results are irrelevant. Please search again with a more specific query.'
            : 'Search results are relevant. End research for this query.'
        },
      }),
    },
  })
  return finalSearchResults
}

for (const query of queries) {
  console.log(`Searching the web for: ${query}`)
  const searchResults = await searchAndProcess(query)
}
```

The next step is to generate learnings and follow-up questions, and then add recursion to the `deepResearch` function.

```js
const generateLearnings = async (query: string, searchResult: SearchResult) => {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    prompt: `The user is researching "${query}". The following search result were deemed relevant.
    Generate a learning and a follow-up question from the following search result:

    <search_result>
    ${JSON.stringify(searchResult)}
    </search_result>
    `,
    schema: z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
    }),
  })
  return object
}
```

```js
const deepResearch = async (
  query: string,
  depth: number = 1,
  breadth: number = 3
) => {
  const queries = await generateSearchQueries(query)

  for (const query of queries) {
    console.log(`Searching the web for: ${query}`)
    const searchResults = await searchAndProcess(query)
    for (const searchResult of searchResults) {
      console.log(`Processing search result: ${searchResult.url}`)
      const learnings = await generateLearnings(query, searchResult)
      // call deepResearch recursively with decrementing depth and breadth
    }
  }
}
```

## Building agents with the AI SDK

At its core, an agent can be defined with this simple equation: `agent = llm + memory + planning + tools + while loop`

Below is the code taken from [Vercel Ship 2025 workshop](https://www.youtube.com/watch?v=V55AJYctIAY) also by Nico Albanese, building a coding agent with the new AI SDK 5.

```js
import { generateText, stepCountIs, tool } from "ai";
import z from "zod/v4";
import fs from "fs";

export async function codingAgent(prompt: string) {
  const result = await generateText({
    // The AI Gateway is a proxy service that routes model requests to various AI providers.
    // https://vercel.com/blog/ai-gateway
    model: "openai/gpt-4.1-mini",
    prompt,
    system:
      "You are a coding agent. You will be working with js/ts projects. Your responses must be concise. Always start by listing all the files in the current directory.",
    stopWhen: stepCountIs(10), // loop back up to 10 times until we generate text
    tools: {
      list_files: tool({
        description:
          "List files and directories at a given path. If no path is provided, lists files in the current directory.",
        inputSchema: z.object({
          path: z
            .string()
            .nullable()
            .describe(
              "Optional relative path to list files from. Defaults to current directory if not provided",
            ),
        }),
        execute: async ({ path: generatedPath }) => {
          if (generatedPath === ".git" || generatedPath === "node_modules") {
            return { error: "You cannot read the path: ", generatedPath };
          }
          const path = generatedPath?.trim() ? generatedPath : ".";
          try {
            console.log(`Listing files at '${path}'`);
            const output = fs.readdirSync(path, { recursive: false });
            return { path, output };
          } catch (e) {
            console.error(`Error listing files:`, e);
            return { error: e };
          }
        },
      }),
      read_file: tool({
        description:
          "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
        inputSchema: z.object({
          path: z
            .string()
            .describe("The relative path of a file in the working directory."),
        }),
        execute: async ({ path }) => {
          try {
            console.log(`Reading file at '${path}'`);
            const output = fs.readFileSync(path, "utf-8");
            return { path, output };
          } catch (error) {
            console.error(`Error reading file at ${path}:`, error.message);
            return { path, error: error.message };
          }
        },
      }),
      edit_file: tool({
        description:
          "Make edits to a text file or create a new file. Replaces 'old_str' with 'new_str' in the given file. 'old_str' and 'new_str' MUST be different from each other. If the file specified with path doesn't exist, it will be created.",
          inputSchema: z.object({
            path: z.string().describe("The path to the file"),
            old_str: z
              .string()
              .nullable()
              .describe(
                "Text to search for - must match exactly and must only have one match exactly",
              ),
            new_str: z.string().describe("Text to replace old_str with"),
          }),
          execute: async ({ path, old_str, new_str }) => {
            try {
              const fileExists = fs.existsSync(path);
              if (fileExists && old_str !== null) {
                console.log(`Editing file '${path}'`);
                const fileContents = fs.readFileSync(path, "utf-8");
                const newContents = fileContents.replace(old_str, new_str);
                fs.writeFileSync(path, newContents);
                return { path, success: true, action: "edit" };
              } else {
                console.log(`Creating file '${path}'`);
                fs.writeFileSync(path, new_str);
                return { path, success: true, action: "create" };
              }
            } catch (e) {
              console.error(`Error editing file ${path}:`, e);
              return { error: e, success: false };
            }
          },
      }),
    },
  });

  return {
    response: result.text,
  };
}
```

Note that if you omit `stopWhen`, the tool is called but you get an empty response. The reason is that the language model can generate either text or tool call. It doesn't do both at the same time. So in this case, the language model generates a tool call, we execute the tool and have a tool result. But our step is complete, and by default every request you make with the AI SDK will just be one single step. With the SDK, you can describe the stop conditions for when this loop should stop using `stopWhen` property.

Without the SDK, you have to manually wrap the entire call in a while loop, manage message history, and define some stop conditions.

### The agent loop

_Read from https://openai.com/index/unrolling-the-codex-agent-loop_

At the heart of every AI agent is something called “the agent loop.” As the result of the inference step, the model either (1) produces a final response to the user’s original input, or (2) requests a tool call that the agent is expected to perform. In the case of (2), the agent executes the tool call and appends its output to the original prompt. This output is used to generate a new input that’s used to re-query the model; the agent can then take this new information into account and try again.

This process repeats until the model stops emitting tool calls and instead produces a message for the user. In many cases, this message directly answers the user’s original request, but it may also be a follow-up question for the user.

The journey from user input to agent response is referred to as one turn of a conversation, though this conversation turn can include many iterations between the model inference and tool calls. Every time you send a new message to an existing conversation, the conversation history is included as part of the prompt for the new turn, which includes the messages and tool calls from previous turns. This means that as the conversation grows, so does the length of the prompt used to sample the model. This length matters because every model has a context window, which is the maximum number of tokens it can use for one inference call. Note this window includes both input and output tokens.

You can think of the prompt as a “list of items”. In the initial prompt, every item in the list is associated with a role. The role indicates how much weight the associated content should have and is one of the following values (in decreasing order of priority): system, developer, user, assistant.

- instructions: system message inserted into the model’s context
- tools: a list of tools the model may call while generating a response
- input: a list of text, image, or file inputs to the model

Codex inserts the following items into the input before adding the user message:

1. A message with `role=developer` that describes the sandbox that applies only to the Codex-provided shell tool defined in the tools section. The message is built from a template where the key pieces of content come from snippets of Markdown bundled into the Codex CLI, such as `workspace_write.md` and `on_request.md`.
2. A message with `role=developer` whose contents are the `developer_instructions` value read from the user’s `config.toml` file.
3. A message with `role=user` whose contents are the “user instructions,” which are not sourced from a single file but are aggregated across multiple sources⁠. Contents of `AGENTS.override.md` and `AGENTS.md`, and the skill metadata for each skill if exists.

[Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) is important, as it enables us to reuse computation from a previous inference call. Cache hits are only possible for exact prefix matches within a prompt. To realize caching benefits, place static content like instructions and examples at the beginning of your prompt, and put variable content, such as user-specific information, at the end. This also applies to images and tools, which must be identical between requests.

Our general strategy to avoid running out of context window is to compact the conversation once the number of tokens exceeds some threshold. Specifically, we replace the input with a new, smaller list of items that is representative of the conversation, enabling the agent to continue with an understanding of what has happened thus far. An early implementation of compaction required the user to manually invoke the `/compact` command, which would query the Responses API using the existing conversation plus custom instructions for summarization. Codex used the resulting assistant message containing the summary as the new input for subsequent conversation turns. Now, Codex automatically uses the endpoint to compact the conversation when the `auto_compact_limit` is exceeded.

## AI SDK UI

AI SDK UI provides abstractions that simplify the complex tasks of managing chat streams and UI updates on the frontend, enabling you to develop dynamic AI-driven interfaces more efficiently. With three main hooks — `useChat`, `useCompletion`, and `useObject`.

- The `useChat` hook enables the streaming of chat messages from your AI provider. It manages the states for input, messages, status, error and more for you.
- The `convertToModelMessages` function is used to transform an array of UI messages from the `useChat` hook into an array of `ModelMessage` objects, which are compatible with AI core functions like `streamText`.

> [AI Elements](https://ai-sdk.dev/elements/overview) is a component library and custom registry built on top of shadcn/ui to help you build AI-native applications faster. It provides pre-built components like conversations, messages and more.

```js
// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5-nano"),
    // messages: convertToModelMessages(messages),
    messages: [
      // Here to add system message or few-shot examples
      {
        role: "system",
        content: "You are a helpful coding assistant.",
      },
      ...convertToModelMessages(messages),
    ],
  });

  // Converts the result to a streamed response object with a UI message stream
  return result.toUIMessageStreamResponse();
}
```

```js
"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  // Defaults to DefaultChatTransport with `/api/chat` endpoint.
  // useChat({
  //   transport: new DefaultChatTransport({
  //     api: '/api/chat',
  //   }),
  // });
  const { messages, sendMessage, status, error, stop } = useChat();

  // `messages` is an array of UIMessage
  // [
  //   {
  //     id: "msg-1",
  //     role: "user",
  //     parts: [{ type: "text", text: "What is React?" }],
  //   },
  //   {
  //     id: "msg-2",
  //     role: "assistant",
  //     parts: [{ type: "text", text: "React is a JavaScript library..." }],
  //   },
  //   {
  //     id: "msg-3",
  //     role: "user",
  //     parts: [{ type: "text", text: "Can you give me an example?" }],
  //   }
  // ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div>
      {error && <div>{error.message}</div>}
      {messages.map((message) => (
        <div key={message.id}>
          <div>{message.role === "user" ? "User: " : "AI: "}</div>
          {message.parts.map((part, index) => {
            switch (part.type) {
              case "text":
                return (
                  <div key={`${message.id}-${index}`}>{part.text}</div>
                );
              default:
                return null;
            }
          })}
        </div>
      ))}
      {(status === "submitted" || status === "streaming") && (
        <div>Loading...</div>
      )}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        {status === "submitted" || status === "streaming" ? (
          <button onClick={stop}>Stop</button>
        ) : (
          <button
            type="submit"
            disabled={status !== "ready"}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
```

For tool call UI, The `parts` array of assistant messages contains tool parts with typed names like `tool-getWeather`.

```js
// Check `type ToolUIPart` in ai/dist/index.d.ts
{
  message.parts.map((part, index) => {
    switch (part.type) {
      case "text":
        return <div key={`${message.id}-${index}`}>{part.text}</div>;
      // type: `tool-${NAME}`
      case "tool-getWeather":
        switch (part.state) {
          // [STATE: input-streaming] Receiving weather request...
          // {
          //   "city": "Beijing"
          // }
          case "input-streaming":
            return (
              <div key={`${message.id}-getWeather-${index}`}>
                Receiving weather request...
                <pre>{JSON.stringify(part.input, null, 2)}</pre>
              </div>
            );
          // [STATE: input-available] Getting weather for Beijing...
          case "input-available":
            return (
              <div key={`${message.id}-getWeather-${index}`}>
                Getting weather for {part.input.city}...
              </div>
            );
          // [STATE: output-available] Weather: 80F and sunny
          case "output-available":
            return (
              <div key={`${message.id}-getWeather-${index}`}>
                <div>Weather: {part.output}</div>
              </div>
            );
          case "output-error":
            return (
              <div key={`${message.id}-getWeather-${index}`}>
                Error: {part.errorText}
              </div>
            );
          default:
            return null;
        }
      default:
        return null;
    }
  });
}
```
