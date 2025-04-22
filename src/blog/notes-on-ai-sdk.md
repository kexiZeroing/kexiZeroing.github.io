---
title: "Notes on AI SDK"
description: ""
added: "Apr 22 2025"
tags: [AI]
---

This is my learning notes from the [Vercel AI SDK Masterclass](https://www.youtube.com/watch?v=kDlqpN1JyIw) tutorial by Nico Albanese.

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
