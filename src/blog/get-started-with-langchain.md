---
title: "Get started with LangChain"
description: ""
added: "Apr 9 2023"
tags: [AI]
updatedDate: "Feb 9 2025"
---

LangChain is a framework for developing applications powered by language models, making them easier to integrate into applications. LangChain makes it easy to prototype LLM applications and Agents.

- JS/TS Docs: https://js.langchain.com/docs
- Awesome LangChain: https://github.com/kyrolabs/awesome-langchain
- Chat with the LangChain JS/TS documentation: https://github.com/langchain-ai/chat-langchainjs
- Tutorials on building LLM powered applications: https://www.youtube.com/playlist?list=PLqZXAkvF1bPNQER9mLmDbntNfSpzdDIU5
- LangChain JS Tutorial: https://www.youtube.com/playlist?list=PL4HikwTaYE0EG379sViZZ6QsFMjJ5Lfwj

### Components: Building Blocks of LangChain

<img alt="langchain-components" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vOhrAly1hct713lr8nj314q0u0dmp.jpg" width="650">

- Schema (Text, Messages, Documents)
- Models (LLMs, Chat Models, Text Embedding Models)
- Prompts (Prompt Templates, Example Selectors, Output Parse)
- Indexes (Loaders, Text Splitters, Vectorstores, Retrievers)
- Memory (Chat Message History)
- Chains (Summarize, Chatbots, Question Answering)
- Agents (OpenAI functions, ReAct)

### LangChain and LlamaIndex
LlamaIndex is a remarkable data framework aimed at helping you build applications with LLMs by providing essential tools that facilitate data ingestion, structuring, retrieval, and integration with various application frameworks.

There are similarities between LIamaIndex and LangChain in their functionalities including indexing, semantic search, retrieval, and vector databases. They both excel in tasks like question answering, document summarization, and building chatbots.

However, each of them has its unique areas of focus. LangChain, with its extensive list of features, casts a wider net, concentrating on the use of chains and agents to connect with external APIs. On the other hand, LlamaIndex has a narrower focus shining in the area of data indexing and document retrieval. LIamaIndex and LangChain aren’t mutually exclusive. In fact, you can use both in your LLM applications. You can use both LlamaIndex’s data loader and query engine and LangChain’s agents. 

### Examples of using LangChain
The LangChain libraries themselves are made up of several different packages.
- `@langchain/core`: Base abstractions and LangChain Expression Language.
- `@langchain/community`: Third party integrations.
- `langchain`: Chains, agents, and retrieval strategies that make up an application's cognitive architecture.

> The packages and APIs are subject to change. Below code examples are writen in early versions. Be sure to refer to the LangChainJS documentation for more details on specific functionalities.

```js
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

In agents, a language model is used as a reasoning engine to determine which actions to take and in which order. Agents are like bots/personal assistants that can take actions using external tools based on instructions from the LLM. Agents use an LLM to determine which actions to take and in what order.

To initialize an agent in LangChain, you need to provide a list of tools, an LLM, and the name of the agent to use. For example, the agent, `zero-shot-react-description`, consults the ReAct (Reason + Act) framework to select the appropriate tool and relies only on the tool's description.

> LangChain provides the tools you can use out of the box: https://js.langchain.com/docs/integrations/toolkits

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
- WebBaseLoader: https://python.langchain.com/docs/integrations/document_loaders/web_base

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

> Suppose you have a set of documents and want to summarize their content. **Map-reduce** operations are essential for efficient task decomposition and parallel processing. In the map step, the documents are split into batches, and each document is summarized individually using a LLM. Then, in the reduce step, those individual summaries are consolidated into a single global summary. The map step is typically parallelized over the input documents.

### LangChain Expression Language (LCEL)
LangChain Expression Language is a declarative system designed for easily building multi-step computational chains, from simple prototypes to complex, production-level applications. It simplifies the process of setting up complex computational tasks by allowing users to state “what” outcome is needed rather than detailing “how” to achieve it.

```py
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate

template = """
Answer the question based on the context below. If you can't 
answer the question, reply "I don't know".

Context: {context}

Question: {question}
"""

prompt = ChatPromptTemplate.from_template(template)
model = ChatOpenAI(openai_api_key=OPENAI_API_KEY, model="gpt-3.5-turbo")
parser = StrOutputParser()

chain = prompt | model | parser
chain.invoke({
  "context": "Mary's sister is Susana",
  "question": "Who is Mary's sister?"
})

from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

vectorstore = DocArrayInMemorySearch.from_texts(
  [
    "Mary's sister is Susana",
    "John and Tommy are brothers",
    "Patricia likes white cars",
    "Pedro's mother is a teacher",
    "Lucia drives an Audi",
  ],
  embedding=embeddings,
)

retriever = vectorstore.as_retriever()
setup = RunnableParallel(context=retriever, question=RunnablePassthrough())

chain = setup | prompt | model | parser
chain.invoke("What color is Patricia's car?")
```
