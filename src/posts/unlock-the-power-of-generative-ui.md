---
layout: "../layouts/BlogPost.astro"
title: "Unlock the power of Generative UI"
slug: unlock-the-power-of-generative-ui
description: ""
added: "Apr 16 2024"
tags: [AI, react]
updatedDate: "Oct 30 2024"
---

The Vercel AI SDK is an open-source library designed to help developers build conversational streaming user interfaces. With the release of the [AI SDK 3.0](https://vercel.com/blog/ai-sdk-3-generative-ui), developers can move beyond plaintext and markdown chatbots to give LLMs rich, component-based interfaces.

1. With the introduction of [Function Calling](https://platform.openai.com/docs/guides/function-calling), you have been able to build applications that are able to fetch realtime data.
2. By using React Server Components, you can now stream UI components directly from LLMs without the need for heavy client-side JavaScript.

> The new APIs in the AI SDK 3.0 rely on React Server Components and React Server Actions which are currently implemented in Next.js. The AI SDK seamlessly integrates interface rendering capabilities through the `ai/rsc` package.

### Server actions

```js
import { createAI, getMutableAIState, render } from "ai/rsc";
import { z } from "zod";

function Spinner() {
  return <div>Loading...</div>;
}
 
// An example of a flight card component.
function FlightCard({ flightInfo }) {
  return (
    <div>
      <h2>Flight Information</h2>
      <p>Flight Number: {flightInfo.flightNumber}</p>
      <p>Departure: {flightInfo.departure}</p>
      <p>Arrival: {flightInfo.arrival}</p>
    </div>
  );
}
 
// An example of a function that fetches flight information from an external API.
async function getFlightInfo(flightNumber: string) {
  return {
    flightNumber,
    departure: 'New York',
    arrival: 'San Francisco',
  };
}
 
async function submitUserMessage(userInput: string) {
  'use server';
 
  const aiState = getMutableAIState<typeof AI>();
 
  // Update the AI state with the new user message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: userInput,
    },
  ]);
 
  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: 'gpt-4-0125-preview',
    provider: openai,
    messages: [
      { role: 'system', content: 'You are a flight assistant' },
      ...aiState.get()
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done }) => {
      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: "assistant",
            content
          }
        ]);
      }
 
      return <p>{content}</p>
    },
    tools: {
      get_flight_info: {
        description: 'Get the information for a flight',
        parameters: z.object({
          flightNumber: z.string().describe('the number of the flight')
        }).required(),
        render: async function* ({ flightNumber }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner/>
 
          const flightInfo = await getFlightInfo(flightNumber)
 
          // Update the final AI state.
          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "get_flight_info",
              // Content can be any string to provide context to the LLM in the rest of the conversation.
              content: JSON.stringify(flightInfo),
            }
          ]);
 
          // Return the flight card to the client.
          return <FlightCard flightInfo={flightInfo} />
        }
      }
    }
  })
 
  return {
    id: Date.now(),
    display: ui
  };
}
 
// Define the initial state of the AI. It can be any JSON object.
const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];
 
// The initial UI state that the client will keep track of, which contains the message IDs and their UI nodes.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];
 
// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI({
  actions: {
    submitUserMessage
  },
  initialUIState,
  initialAIState
});
```

> Update: `render` has been deprecated in favor of [streamUI](https://sdk.vercel.ai/docs/ai-sdk-rsc/streaming-react-components). Similar to AI SDK Core APIs (like `streamText` and `streamObject`), streamUI provides a single function to call a model and allow it to respond with React Server Components.

Let's explain the above code in more detail.

The `render` function is a powerful helper function to create a streamable UIs from an LLM response.
- By default, it will stream the text content of the LLM response wrapped with a React Fragment tag. You can also customize the React component streamed for text responses by using the `text` key.
- It also allows you to map OpenAI-compatible model with Function Calls to React Server Components using the `tools` key. Each tool specified also accepts a nested `render` function for returning React components *(map each tool to a UI component)*. If you use a generator signature, you can `yield` React Nodes and they will be sent as distinct updates to the client. This is very powerful for loading states and agentic, multi-step behaviors.

The AI SDK introduces two new concepts: `AIState` and `UIState`.
- `AIState` is a JSON representation of all the context the LLM needs to read. For a chat app, AIState generally stores the textual conversation history between the user and the assistant. `AIState` by default, can be accessed/modified on both Server and Client.
- `UIState` is what the application uses to display the UI. It is a fully client-side state and can keep data and UI elements returned by the LLM. This state can be anything, but can't be accessed on the server.

### Client components

```jsx
"use client";

import { useState } from "react";
import { useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";

export default function Home() {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useUIState();
  const { submitUserMessage } = useActions();

  return (
    <div>
      <div>
        {conversation.map((message) => (
          <div key={message.id}>
            {message.role}: {message.display}
          </div>
        ))}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setInput("");
          setConversation((currentConversation) => [
            ...currentConversation,
            { id: nanoid(), role: "user", display: input },
          ]);

          const message = await submitUserMessage(input);

          setConversation((currentConversation) => [
            ...currentConversation,
            message,
          ]);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
        <button>Send Message</button>
      </form>
    </div>
  );
}
```

There is a [13 minute video](https://www.youtube.com/watch?v=UDm-hvwpzBI) on how to build LLM applications through the new Vercel AI SDK.

### More `tools` examples

```js
// https://github.com/browserbase/BrowseGPT
tools: {
  googleSearch: tool({
    description: 'Search Google for a query',
    parameters: z.object({
      toolName: z.string().describe('What the tool is doing'),
      query: z.string().describe('The exact and complete search query as provided by the user. Do not modify this in any way.'),
      sessionId: z.string().describe('The session ID to use for the search. If there is no session ID, create a new session with createSession Tool.'),
      debuggerFullscreenUrl: z.string().describe('The fullscreen debug URL to use for the search. If there is no debug URL, create a new session with createSession Tool.')
    }),
    execute: async ({ query, sessionId }) => {
      // import { chromium } from 'playwright'
      const browser = await chromium.connectOverCDP(
        `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
      );
      const defaultContext = browser.contexts()[0];
      const page = defaultContext.pages()[0];
    
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('load', { timeout: 10000 });
      
      await page.waitForSelector('.g');

      const results = await page.evaluate(() => {
        const items = document.querySelectorAll('.g');
        return Array.from(items).map(item => {
          const title = item.querySelector('h3')?.textContent || '';
          const description = item.querySelector('.VwiC3b')?.textContent || '';
          return { title, description };
        });
      });
      
      const text = results.map(item => `${item.title}\n${item.description}`).join('\n\n');

      const response = await generateText({
        model: anthropic('claude-3-5-sonnet-20240620'),
        prompt: `Evaluate the following web page content: ${text}`,
      });

      return {
        toolName: 'Searching Google',
        content: response.text,
        dataCollected: true,
      };
    },
  }),
  getPageContent: tool({
    description: 'Get the content of a page using Playwright',
    parameters: z.object({
      toolName: z.string().describe('What the tool is doing'),
      url: z.string().describe('The url to get the content of'),
      sessionId: z.string().describe('The session ID to use for the search. If there is no session ID, create a new session with createSession Tool.'),
      debuggerFullscreenUrl: z.string().describe('The fullscreen debug URL to use for the search. If there is no debug URL, create a new session with createSession Tool.')
    }),
    execute: async ({ url, sessionId }) => {
      const browser = await chromium.connectOverCDP(
        `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
      );
      const defaultContext = browser.contexts()[0];
      const page = defaultContext.pages()[0];
    
      await page.goto(url);
    
      const content = await page.content();
      const dom = new JSDOM(content);
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      const text = `${article?.title || ''}\n${article?.textContent || ''}`;

      const response = await generateText({
        model: anthropic('claude-3-5-sonnet-20240620'),
        prompt: `Evaluate the following web page content: ${text}`,
      });

      return {
        toolName: 'Getting page content',
        content: response.text,
      };
    },
  }),
},
```

> `Readability.js` from Mozilla is a standalone version of the readability library used for Firefox Reader View. To parse a document, you must create a new `Readability` object from a DOM document object, and then call `parse()`. This returned `article` object will contain: title, content, textContent, length, excerpt, etc.

### More to explore
- https://chat.vercel.ai/
- https://github.com/miurla/morphic
- https://github.com/krzysztoff1/generative-ui
- https://github.com/TejasQ/gen-ui
