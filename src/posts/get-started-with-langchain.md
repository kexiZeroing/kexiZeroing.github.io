---
layout: "../layouts/BlogPost.astro"
title: "Get started with langchain"
slug: get-started-with-langchain
description: ""
added: "Apr 9 2023"
tags: [AI]
updatedDate: "June 13 2023"
---

ChatGPT isn’t the only way to interact with LLMs. OpenAI and other providers have released APIs allowing developers to interact directly with these models. And this is where LangChain comes in. LangChain is a framework for developing applications powered by language models, making them easier to integrate into applications.

- Homepage: https://langchain.com
- JS/TS Docs: https://js.langchain.com/docs
- Awesome LangChain: https://github.com/kyrolabs/awesome-langchain
- Tutorials on building LLM powered applications: https://www.youtube.com/playlist?list=PLqZXAkvF1bPNQER9mLmDbntNfSpzdDIU5
- Easy to use code snippets for LangChain: https://github.com/JorisdeJong123/LangChain-Cheatsheet
- LangChain integrations hub: https://integrations.langchain.com

<img alt="langchain-components" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vOhrAly1hct713lr8nj314q0u0dmp.jpg" width="650">

### Components: Building Blocks of LangChain
- Schema (Text, Messages, Documents)
- Models (LLMs, Chat Models, Text Embedding Models)
- Prompts (Prompt Templates, Example Selectors, Output Parse)
- Indexes (Loaders, Text Splitters, Vectorstores, Retrievers)
- Memory (Chat Message History)
- Chains (Summarize, Question Answering)
- Agents

### Use-Case Specific Chains: Tailored Solutions
- Personal Assistants
- Question Answering Over Docs
- Chatbots
- Interacting with APIs
- Summarisation
- Extraction

### Examples

`npm install langchain` We currently support LangChain on Node.js 18 and 19. LangChain is written in TypeScript and provides type definitions for all of its public APIs.

```js
// basic_call.ts
import { OpenAI } from "langchain/llms";

export const run = async () => {
  // temperature ranges from 0(deterministic) to 1(max creativity)
  const model = new OpenAI({ temperature: 0.1 });

  const res = await model.call("What is the capital city of France?");
  console.log({ res });
  // output: "Paris"
};
```

"Few shot" are examples provided to the LLM to help it generate a better response. In reality, you would get a user's input and then add it to your prompt before sending it to the large language model.

```js
// few-shot.ts
import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";

export const run = async () => {
  const examples = [
    { country: "United States", capital: "Washington, D.C." },
    { country: "Canada", capital: "Ottawa" },
  ];

  const exampleFormatterTemplate = "Country: {country}\nCapital: {capital}\n";
  // Prompt Templates: manage prompts for LLMs
  const examplePrompt = new PromptTemplate({
    inputVariables: ["country", "capital"],
    template: exampleFormatterTemplate,
  });
  console.log("examplePrompt", examplePrompt.format(examples[0]));
  /* country: United States
     capital: Washington, D.C.
  */

  const fewShotPrompt = new FewShotPromptTemplate({
    /* These are the examples we want to insert into the prompt. */
    examples,
    /* This is how we want to format the examples when we insert them into the prompt. */
    examplePrompt,
    /* The prefix is some text that goes before the examples in the prompt. Usually, this consists of intructions. */
    prefix: "What is the capital city of the country below?",
    /* The suffix is some text that goes after the examples in the prompt. Usually, this is where the user input will go */
    suffix: "Country: {country}\nCapital:",
    /* The input variables are the variables that the overall prompt expects. */
    inputVariables: ["country"],
    /* The example_separator is the string we will use to join the prefix, examples, and suffix together with. */
    exampleSeparator: "\n\n",
    /* The template format is the formatting method to use for the template. Should usually be f-string. */
    templateFormat: "f-string",
  });

  const res = fewShotPrompt.format({ country: "France" });
  console.log({ res });
  /**
   * {
   *    res: 
   *    "What is the capital city of the country below?"
   *    
   *    "Country: United States"
   *    "Capital: Washington, D.C."
   *    
   *    'Country: Canada'
        'Capital: Ottawa'

        'Country: France' 
        'Capital:'
   * }
   */
};
```

LangChain provides a standard interface for using chat models. Chat models are a variation on language models. Rather than expose a "text in, text out" API, chat models expose an interface where "chat messages" are the inputs and outputs.

- `HumanChatMessage`: A chat message that is sent as if from a Human's point of view.
- `AIChatMessage`: A chat message that is sent from the point of view of the AI system to which the Human is corresponding.
- `SystemChatMessage`: A chat message that gives the AI system some information about the conversation. This is usually sent at the beginning of a conversation.
- `ChatMessage`: A generic chat message, with not only a "text" field but also an arbitrary "role" field.

```js
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";

export const run = async () => {
  const chat = new ChatOpenAI();
  // Pass in a list of messages to `call` to start a conversation.
  const response = await chat.call([
    new HumanChatMessage(
      "What is a good name for a company that makes colorful socks?"
    ),
  ]);
  console.log(response);
  // AIChatMessage { text: '\n\nRainbow Sox Co.' }
};
```

Agents are like bots/personal assistants that can take actions using external tools based on instructions from the LLM. Agents use an LLM to determine which actions to take and in what order. To initialize an agent in LangChain, you need to provide a list of tools, an LLM, and the name of the agent to use. For example, the agent, `zero-shot-react-description`, consults the ReAct (Reason + Act) framework to select the appropriate tool and relies only on the tool's description.

LangChain provides the tools you can use out of the box: https://js.langchain.com/docs/modules/agents/tools/integrations/

```js
// agent-basic.ts
import { OpenAI } from "langchain";
import { initializeAgentExecutor } from "langchain/agents";
import { SerpAPI, Calculator } from "langchain/tools";

export const run = async () => {
  const model = new OpenAI({ temperature: 0 });
  // A tool is a function that performs a specific duty
  // SerpAPI for example accesses google search results in real-time
  const tools = [new SerpAPI(), new Calculator()];

  const executor = await initializeAgentExecutor(
    tools,
    model,
    "zero-shot-react-description"
  );
  console.log("Loaded agent.");

  const input = `What are the total number of countries in Africa raised to the power of 3?`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);
  /**
   *  Got output, there are 54 countries in Africa
   *  The number of countries raised to the power of 3
   *  is 157464
   */
};
```

OpenAI’s API is not stateful so each time you sent a request to generate a new chat message, you have to pass back any context that might be necessary to allow the model to answer the query at hand. Gives a chain the ability to remember information from previous interactions. This is useful for chatbots and conversation bots. `ConversationChain` is a simple type of memory that remembers all previous conversations and adds them as context that is passed to the LLM.

```js
// memory.ts
import { OpenAI } from "langchain/llms";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

export const run = async () => {
  const model = new OpenAI({});
  // buffer memory remembers previous conversational back and forths directly
  const memory = new BufferMemory();
  const chain = new ConversationChain({ llm: model, memory: memory });
  const firstResponse = await chain.call({ input: "Hello, I'm John." });
  console.log(firstResponse);
  // {response: " Hi John! It's nice to meet you. My name is AI. What can I help you with?"}
  const secondResponse = await chain.call({ input: "What's my name?" });
  console.log(secondResponse);
  // {response: ' You said your name is John. Is there anything else you would like to talk about?'}
};
```

Embeddings are vector representations of text that computers can understand, analyze, and compare.

```js
// embeddings.ts
import { OpenAIEmbeddings } from "langchain/embeddings";

export const run = async () => {
  /* Embed query from the user */
  const embeddings = new OpenAIEmbeddings();
  const res = await embeddings.embedQuery("Hello world");
  console.log("query vector", res);

  /* Embed documents (converts your text/data to numbers) */
  const documentRes = await embeddings.embedDocuments([
    "Hello world",
    "Bye bye",
  ]);
  console.log({ documentRes });
  //
};
```

Language models limit the amount of text that you can send to them per request. To overcome this challenge, we need to split the text into smaller chunks. The recommended TextSplitter is the `RecursiveCharacterTextSplitter`. This will split documents recursively by different characters - starting with `"\n\n"`, then `"\n"`, then `" "`. This is nice because it will try to keep all the semantically relevant content in the same place for as long as possible.

```js
// recursive_text_splitter.ts
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import path from "path";

export const run = async () => {
  const text = `Hi.\n\nI'm Harrison.\n\nHow? Are? You?\nOkay then f f f f.
    This is a weird text to write, but gotta test the splittingggg some how.\n\n
    Bye!\n\n-H.`;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 10, // max size(chars) of docs chunk
    chunkOverlap: 1, // how much overlap betwen chunks
  });
  const output = splitter.createDocuments([text]);
};
```

Document loaders make it easy to create Documents from a variety of sources. For example, loads data from text files.

- Google Drive Loader: https://github.com/gkamradt/langchain-tutorials/blob/main/loaders/Google%20Drive%20Loader.ipynb
- YouTube Loader: https://github.com/gkamradt/langchain-tutorials/blob/main/loaders/YouTube%20Loader.ipynb

```js
// text_loader.ts
import { TextLoader } from "langchain/document_loaders";

export const run = async () => {
  const loader = new TextLoader(
    "src/document_loaders/example_data/example.txt"
  );
  const docs = await loader.load();
  console.log({ docs });
  /**
  * {
    docs: [
      Document {
        pageContent: 'this is an example text to see how langchain loads raw text.',
        metadata: 
      }
    ]
  }
  */
};
```

Takes input docs and a question sent to LLM for answer based on relevant docs.

> Get past your model's token limit using alternative chain types: https://github.com/gkamradt/langchain-tutorials/blob/main/chains/Chain%20Types.ipynb
>
> - The default `chain_type="stuff"` uses all of the text from the documents in the prompt. (It could exceed the token limit)
> - `chain_type="map_reduce"` separates texts into batches, feeds each batch with the question to LLM separately, and comes up with the final answer based on the answers from each batch.
> - `chain_type="refine"` separates texts into batches, feeds the first batch to LLM, and feeds the answer and the second batch to LLM. It refines the answer by going through all the batches.
> - `chain_type="map-rerank"` separates texts into batches, feeds each batch to LLM, returns a score of how fully it answers the question, and comes up with the final answer based on the high-scored answers from each batch.

```js
// question_answering.ts
import { OpenAI } from "langchain/llms";
import { loadQAChain } from "langchain/chains";
import { Document } from "langchain/document";

export const run = async () => {
  const model = new OpenAI({});
  // question and answer chain
  const chain = loadQAChain(model);
  const docs = [
    new Document({ pageContent: "Rachel went to Harvard" }),
    new Document({ pageContent: "Tom went to Stanford" }),
  ];

  // call the chain with both the doc and question
  const res = await chain.call({
    input_documents: docs,
    question: "Where did rachel go to college",
  });
  console.log({ res });
  /**
   * { res: { text: ' Rachel went to Harvard.' } }
   */
};
```
