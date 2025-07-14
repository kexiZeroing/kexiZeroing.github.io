---
title: "Notes on AI SDK"
description: ""
added: "Apr 22 2025"
tags: [AI]
updatedDate: "July 7 2025"
---

This is my learning notes from the [AI Engineer workshop](https://www.youtube.com/watch?v=kDlqpN1JyIw) tutorial by Nico Albanese.

> AI SDK is like an ORM for LLMs. It provides a simple interface to interact with different LLM providers, making it easy to switch between them without changing your code.

> Here is an Gemini AI SDK Cheatsheet: https://patloeber.com/gemini-ai-sdk-cheatsheet. It has code snippets to start building with Gemini and the AI SDK.

## Generate Text

Make your first LLM call.

```js
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import 'dotenv/config'
 
const main = async () => {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: 'Hello, world!',
  })
  console.log(result.text)
}
 
main()
```

`generateText` can take either `prompt` or `messages` as input.

```js
const result = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [
    { role: 'user', content: 'Hello, world!' },
  ],
})
```

Changing providers with the AI SDK is as simple as changing two lines of code. We can pick a model that has web search built in, like `perplexity` or `gemini`, and we can even see what sources were used to generate the text.

```js
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import 'dotenv/config'
 
const main = async () => {
  const result = await generateText({
    model: google('gemini-1.5-flash', { useSearchGrounding: true }),
    prompt: 'When is the AI Engineer summit in 2025?',
  })

  console.log(result.text)
  console.log(result.sources)
}
 
main()
```

## Stream Text

```js
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
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

  console.log(result.text);  // 10 + 5 equals 15.
  console.log(JSON.stringify(result.steps, null, 2));
  // step 1: The model generates a tool call, and the tool is executed.
  // step 2: The tool result is sent to the model, and the model generates a response.
}
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
    model: openai('gpt-4o-mini'),
    prompt: 'Please come up with 3 definitions for AI agents.',
    schema: z.object({
      definitions: z.array(z.string()),
    }),
  })
  console.log(result.object.definitions)
  // [
  //   'An AI agent is ...',
  //   'An AI agent is ...',
  //   'An AI agent is ...'
  // ]
}
```

Furthermore, we can use the `describe` function to help refine the generation.

```js
await generateObject({
  model: openai("gpt-4o-mini"),
  prompt: "Please come up with 3 definitions for AI agents.",
  schema: z.object({
    definitions: z.array(z.string().describe("Use as much jargon as possible. It should be completely incoherent.")),
  }),
})
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
Below is the code taken from [Vercel Ship 2025 workshop](https://www.youtube.com/watch?v=V55AJYctIAY) also by Nico Albanese, building a coding agent with the new AI SDK 5.

```js
import { generateText, stepCountIs, tool } from "ai";
import z from "zod/v4";
import fs from "fs";

export async function codingAgent(prompt: string) {
  const result = await generateText({
    model: "openai/gpt-4.1-mini",
    prompt,
    system:
      "You are a coding agent. You will be working with js/ts projects. Your responses must be concise.",
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

Note that if you omit `stopWhen`, the tool is called but you get an empty response. The reason is that the language model can generate either text or tool call. It doesn't do both at the same time. So in this case, the language model generates a tool call, we execute the tool and have a tool result. But our step is complete, and by default every request you make with the AI SDK will just be one single step. With the SDK, you can describe the stop conditions for when this loop should stop using `stopWhen` property. *(Without the SDK, you have to manually wrap the entire call in a while loop, manage message history, and define some stop conditions.)*
