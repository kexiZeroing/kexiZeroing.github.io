---
layout: "../layouts/BlogPost.astro"
title: "Unlock the power of Generative UI"
slug: unlock the power of generative-ui
description: ""
added: "Apr 16 2024"
tags: [AI, web]
---

The Vercel AI SDK is an open-source library designed to help developers build conversational streaming user interfaces. With the release of the [AI SDK 3.0](https://vercel.com/blog/ai-sdk-3-generative-ui), developers can move beyond plaintext and markdown chatbots to give LLMs rich, component-based interfaces.

1. With the introduction of [Function Calling](https://platform.openai.com/docs/guides/function-calling), you have been able to build applications that are able to fetch realtime data.
2. By using React Server Components, you can now stream UI components directly from LLMs without the need for heavy client-side JavaScript.

> The new APIs in the AI SDK 3.0 rely on React Server Components and React Server Actions which are currently implemented in Next.js. The AI SDK seamlessly integrates interface rendering capabilities through the `ai/rsc` package.

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

Let's explain the above code in more detail.

The `render` function is a powerful helper function to create a streamable UIs from an LLM response. - By default, it will stream the text content of the LLM response wrapped with a React Fragment tag. You can also customize the React component streamed for text responses by using the `text` key.
- It also allows you to map OpenAI-compatible model with Function Calls to React Server Components using the `tools` key. Each tool specified also accepts a nested `render` function for returning React components *(map each tool to a UI component)*. If you use a generator signature, you can `yield` React Nodes and they will be sent as distinct updates to the client. This is very powerful for loading states and agentic, multi-step behaviors.

The AI SDK introduces two new concepts: `AIState` and `UIState`.
- `AIState` is a JSON representation of all the context the LLM needs to read. For a chat app, AIState generally stores the textual conversation history between the user and the assistant. `AIState` by default, can be accessed/modified on both Server and Client.
- `UIState` is what the application uses to display the UI. It is a fully client-side state and can keep data and UI elements returned by the LLM. This state can be anything, but can't be accessed on the server.

The AI state represents the context of the conversation provided to the language model and is often an array of chat messages. Sometimes, like if the user is filling out a form or interacting with a UI element like a slider, you need to update the language models context with the new information. You can mutate the AI state on the client using the `useAIState` hook.

```js
export default function Page() {
  const [aiState, setAIState] = useAIState();
 
  // Whenever the slider changes, we need to update the local value state
  // and the history so the LLM also knows what's going on.
  function onSliderChange(event) {
    const newValue = Number(event.target.value);
    setValue(newValue);
 
    // Insert a hidden history info to the list.
    const info = {
      id,
      role: "system",
      content: `[User has changed value to ${newValue}]`,
    };
 
    // If the last AI state already contains an instance of this slider, update it.
    // If it doesn't exist, append it to history.
    if (aiState[aiState.length - 1]?.id === id) {
      setAIState([...aiState.slice(0, -1), info]);
    } else {
      setAIState([...aiState, info]);
    }
  }

  return ...
}
```

In many cases, the interface you render will need to request updates from the server. For example, a weather app might need to request the latest weather data every 5 minutes, or a button press should execute a search. To accomplish this, you can pass Server Actions to your UI components and call them as needed.

```js
async function handleUserMessage(userInput) {
  'use server';
  // https://sdk.vercel.ai/docs/api-reference/generative-ui/create-streamable-ui
  const card = createStreamableUI(<Spinner />);
 
  async function getCityWeather() {
    card.update(
      <>
        Analyzing...
        <WeatherCardSkeleton />
      </>,
    );

    const res = await callLLM(
      `Return the city name from the user input: ${userInput}`,
    );

    const temperature = await getCityTemperature(res.city);
    card.done(
      <>
        Here's the weather of {res.city}:
        <WeatherCard
          city={res.city}
          temperature={temperature}
          refreshAction={async () => {
            'use server';
            return getCityTemperature(res.city);
          }}
        />
      </>,
    ); 
  }
 
  getCityWeather();

  return ...
}
```

### More to explore
- https://sdk.vercel.ai/docs/concepts/ai-rsc
- https://gemini.vercel.ai/
- https://github.com/miurla/morphic
- https://github.com/krzysztoff1/generative-ui
