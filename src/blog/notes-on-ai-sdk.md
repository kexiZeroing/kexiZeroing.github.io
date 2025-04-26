---
title: "Notes on AI SDK"
description: ""
added: "Apr 22 2025"
tags: [AI]
updatedDate: "Apr 24 2025"
---

This is my learning notes from the [Vercel AI SDK Masterclass](https://www.youtube.com/watch?v=kDlqpN1JyIw) tutorial by Nico Albanese.

> AI SDK is like an ORM for LLMs. It provides a simple interface to interact with different LLM providers, making it easy to switch between them without changing your code.

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
const main = async () => {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: "Please come up with 3 definitions for AI agents.",
    schema: z.object({
      definitions: z.array(z.string().describe("Use as much jargon as possible. It should be completely incoherent.")),
    }),
  })
  console.log(result.object.definitions)
}
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
 
main()
```

Now we need to map these queries to web search results. We use [Exa](https://exa.ai) for this.

```js
import Exa from 'exa-js'
 
const exa = new Exa(process.env.EXA_API_KEY)
 
type SearchResult = {
  title: string
  url: string
  content: string
}
 
const searchWeb = async (query: string) => {
  const { results } = await exa.searchAndContents(query, {
    numResults: 1,
    livecrawl: 'always', // not use cache
  })
  return results.map(
    (r) =>
      ({
        title: r.title,
        url: r.url,
        content: r.text,
      }) as SearchResult
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
