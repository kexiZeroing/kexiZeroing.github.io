---
layout: "../layouts/BlogPost.astro"
title: "Notes on domain-specific ChatGPT"
slug: notes-on-domain-specific-chatgpt
description: ""
added: "Mar 25 2023"
tags: [AI]
updatedDate: "May 7 2024"
---

## What are Vector Embeddings?
Vector embeddings are one of the most fascinating and useful concepts in machine learning. They are central to many NLP, recommendation, and search algorithms. ML algorithms, like most software algorithms, need numbers to work with. Sometimes we have a dataset with columns of numeric values or values that can be translated into them. Other times we come across something more abstract like an entire document of text. We create vector embeddings, which are just lists of numbers, for data like this to perform various operations with them. A whole paragraph of text or any other object can be reduced to a vector.

There is something special about vectors that makes them so useful. This representation makes it possible to translate semantic similarity as perceived by humans to proximity in a vector space. In other words, when we represent real-world objects and concepts such as images, audio recordings, news articles, and user profiles as vector embeddings, the semantic similarity of these objects and concepts can be quantified by how close they are to each other as points in vector spaces.

<img alt="sentence_embeddings" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vOhrAly1hcc5elwuuoj313s0e075k.jpg" width="550" />

We train models to translate objects to vectors. A deep neural network is a common tool for training such models. The resulting embeddings are usually high dimensional (up to two thousand dimensions) and dense (all values are non-zero). For text data, models such as Word2Vec, GloVe (Global Vectors for Word Representation), and BERT transform words, sentences, or paragraphs into vector embeddings. Images can be embedded using models such as convolutional neural networks (CNNs).

### Tokens and Embeddings
Tokens are the basic units of data processed by LLMs. In the context of text, a token can be a word, part of a word (subword), or even a character — depending on the tokenization process.

In the context of GPT-2, each piece of text is represented by the ID of the corresponding token in the final vocabulary. If a word is not in the vocabulary, it’s broken down into smaller tokens that are in the vocabulary. The key point is that the assignment of token IDs is not arbitrary but based on the frequency of occurrence and combination patterns in the language data the model was trained on.

```py
# Tokens are vectors based on a specific tokenizer.
# Online playground for OpenAPI tokenizers: https://tiktokenizer.vercel.app

import tiktoken
 
tokenizer=tiktoken.encoding_for_model("gpt-4")
 
text = "Apple is a fruit"
 
token=tokenizer.encode(text)
print(token)
# [27665, 374, 264, 14098]
 
decoded_text = tokenizer.decode(token)
print(decoded_text)
# Apple is a fruit
```

Token IDs are a straightforward numerical representation of tokens. It is a basic form of vectorization. They do not capture any deeper relationships or patterns between the tokens.

Embeddings are advanced vector representations of tokens. They try to capture the most nuance, connections, and semantic meanings between tokens. Each embedding is generally a series of real numbers on a vector space computed by a neural network. They are the “real inputs” of LLMs.

Embeddings are, in fact, a subset of the model’s weights. They are the weights associated with the input layer (in the case of feedforward networks) or the embedding layer (in models like Transformers).

```py
from langchain_openai.embeddings import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()
embedded_query = embeddings.embed_query("Who is Mary's sister?")

print(f"Embedding length: {len(embedded_query)}") # Embedding length: 1536
print(embedded_query) # [-0.0013594045786472937, -0.03437049808954925, ...]
```

## OpenAI’s text embeddings API
An embedding is a vector (list) of floating point numbers. The distance between two vectors measures their relatedness. Small distances suggest high relatedness and large distances suggest low relatedness.

To get an embedding, send your text string to the embeddings API endpoint along with a choice of embedding model ID (e.g., `text-embedding-ada-002`). The response will contain an embedding, which you can extract, save, and use.

```js
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const response = await openai.createEmbedding({
  model: "text-embedding-ada-002",
  input: "The food was delicious and the waiter...",
});
```

- How can I retrieve K nearest embedding vectors quickly? For searching over many vectors quickly, we recommend using a vector database (e.g. [Pinecone](https://www.pinecone.io), a fully managed vector database).
- Which distance function should I use? We recommend cosine similarity. OpenAI embeddings are normalized to length 1.

> In data analysis, cosine similarity is a measure of similarity between two non-zero vectors defined in an inner product space. Cosine similarity is the cosine of the angle between the vectors; that is, it is the dot product of the vectors divided by the product of their lengths.

## Storing OpenAI embeddings in Postgres with pgvector
[pgvector](https://github.com/pgvector/pgvector) is an open-source vector similarity search for Postgres. Once we have generated embeddings on multiple texts, it is trivial to calculate how similar they are using vector math operations like cosine distance. A perfect use case for this is search. Your process might look something like this:

1. Pre-process your knowledge base and generate embeddings for each page.
2. Store your embeddings.
3. Build a search page that prompts your user for input.
4. Take user's input, generate a one-time embedding, then perform a similarity search against your pre-processed embeddings.
5. Return the most similar pages to the user.

`pgvector` introduces a new data type called `vector`. We create a column named `embedding` with the `vector` data type. The size of the vector defines how many dimensions the vector holds. OpenAI's `text-embedding-ada-002` model outputs 1536 dimensions, so we will use that for our vector size. We also create a text column named `content` to store the original document text that produced this embedding. Depending on your use case, you might just store a reference (URL or foreign key) to a document here instead.

```sql
create table documents (
  id bigserial primary key,
  content text,
  embedding vector (1536)
);
```

ChatGPT doesn't just return existing documents. It's able to assimilate a variety of information into a single, cohesive answer. To do this, we need to provide GPT with some relevant documents, and a prompt that it can use to formulate this answer.

One of the biggest challenges of OpenAI's `text-davinci-003` completion model is the 4000 token limit. This makes it challenging if you wanted to prompt GPT-3 to answer questions about your own custom knowledge base that would never fit in a single prompt. Embeddings can help solve this by splitting your prompts into a two-phased process:

1. Query your embedding database for the most relevant documents related to the question.
2. Inject these documents as context for GPT-3 to reference in its answer.

```js
// https://supabase.com/blog/openai-embeddings-postgres-vector

// Generate a one-time embedding for the query itself
const embeddingResponse = await openai.createEmbedding({
  model: 'text-embedding-ada-002',
  input,
})

const [{ embedding }] = embeddingResponse.data.data

// Fetching whole documents for this simple example.
// `match_documents` is a function to perform similarity search over embeddings
const { data: documents } = await supabaseClient.rpc('match_documents', {
  query_embedding: embedding,
  match_threshold: 0.78, // Choose an appropriate threshold for your data
  match_count: 10, // Choose the number of matches
})

// https://platform.openai.com/tokenizer
const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
let tokenCount = 0
let contextText = ''

// Concat matched documents
for (let i = 0; i < documents.length; i++) {
  const document = documents[i]
  const content = document.content
  const encoded = tokenizer.encode(content)
  tokenCount += encoded.text.length

  // Limit context to max 1500 tokens (configurable)
  if (tokenCount > 1500) {
    break
  }

  contextText += `${content.trim()}\n---\n`
}

const prompt = stripIndent`${oneLine`
  You are a very enthusiastic Supabase representative who loves
  to help people! Given the following sections from the Supabase
  documentation, answer the question using only that information,
  outputted in markdown format. If you are unsure and the answer
  is not explicitly written in the documentation, say
  "Sorry, I don't know how to help with that."`}

  Context sections:
  ${contextText}

  Question: """
  ${query}
  """

  Answer as markdown (including related code snippets if available):
`

const completionResponse = await openai.createCompletion({
  model: 'text-davinci-003',
  prompt,
  max_tokens: 512, // Choose the max allowed tokens in completion
  temperature: 0, // Set to 0 for deterministic results
})
```

> Language models don't see text like you and I, instead they see a sequence of tokens. Byte pair encoding (BPE) is a way of converting text into tokens used in GPT.
> - It's reversible and lossless, so you can convert tokens back into the original text.
> - It compresses the text: the token sequence is shorter than the bytes corresponding to the original text. On average, in practice, each token corresponds to about 4 bytes.
> - It attempts to let the model see common subwords. For instance, "ing" is a common subword in English, so BPE encodings will often split "encoding" into tokens like "encod" and "ing" (instead of e.g. "enc" and "oding"). Because the model will then see the "ing" token again and again in different contexts, it helps models generalise and better understand grammar.
> - It ensures that the most common words are represented as a single token while the rare words are broken down into two or more subword tokens. (Looking for the most frequent pairing, merge them, and perform the same iteration again and again until we reach our token limit or iteration limit.)

### Domain-specific ChatGTP Starter App
[This starter app](https://github.com/gannonh/gpt3.5-turbo-pgvector) uses embeddings to generate a vector representation of a document, and then uses vector search to find the most similar documents to the query. The results of the vector search are then used to construct a prompt for GPT-3, which is then used to generate a response. The response is then streamed to the user.

Creating and storing the embeddings: See [pages/embeddings.tsx](https://github.com/gannonh/gpt3.5-turbo-pgvector/blob/master/pages/embeddings.tsx) and [pages/api/generate-embeddings.ts](https://github.com/gannonh/gpt3.5-turbo-pgvector/blob/master/pages/api/generate-embeddings.ts)
- Web pages are scraped, stripped to plain text and split into 1000-character documents.
- OpenAI's embedding API is used to generate embeddings for each document using the `text-embedding-ada-002` model.
- The embeddings are then stored in a Supabase postgres table using `pgvector`.

Responding to queries: See [pages/api/docs.ts](https://github.com/gannonh/gpt3.5-turbo-pgvector/blob/master/pages/api/docs.ts) and [utils/OpenAIStream.ts](https://github.com/gannonh/gpt3.5-turbo-pgvector/blob/master/utils/OpenAIStream.ts)
- A single embedding is generated from the user prompt.
- That embedding is used to perform a similarity search against the vector database.
- The results of the similarity search are used to construct a prompt for GPT-3.
- The GTP-3 response is then streamed to the user.

```js
// generate and store embeddings from a list of input URLs
const { method, body } = req;
const { urls } = body;
const documents = await getDocuments(urls);

for (const { url, body } of documents) {
  const input = body.replace(/\n/g, " ");

  const embeddingResponse = await openAi.createEmbedding({
    model: "text-embedding-ada-002",
    input
  });

  const [{ embedding }] = embeddingResponse.data.data;

  await supabaseClient.from("documents").insert({
    content: input,
    embedding,
    url
  });
}

const docSize: number = 1000;  // embedding doc sizes

async function getDocuments(urls: string[]) {
  const documents = [];
  for (const url of urls) {
    const response = await fetch(url);
    const html = await response.text();
    // https://github.com/cheeriojs/cheerio
    const $ = cheerio.load(html);
    const articleText = $("body").text();

    let start = 0;
    while (start < articleText.length) {
      const end = start + docSize;
      const chunk = articleText.slice(start, end);
      documents.push({ url, body: chunk });
      start = end;
    }
  }
  return documents;
}
```

## GPT and LangChain Chatbot for PDF docs
[gpt4-pdf-chatbot-langchain](https://github.com/mayooear/gpt4-pdf-chatbot-langchain) uses LangChain and Pinecone to build a chatGPT chatbot for large PDF docs.

LangChain is a framework that makes it easier to build scalable LLM apps and chatbots. For example, An [LLMChain](https://docs.langchain.com/docs/components/chains/llm-chain) is the simplest type of chain, and is used widely in other chains, so understanding it is important. We can construct an LLMChain which takes user input, formats it with a [PromptTemplate](https://js.langchain.com/docs/modules/prompts/prompt_templates), and then passes the formatted response to an LLM.

```js
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

const model = new OpenAI({ temperature: 0.9 });
const template = "What is a good name for a company that makes {product}?";
const prompt = new PromptTemplate({
  template: template,
  inputVariables: ["product"],
});

const chain = new LLMChain({ llm: model, prompt: prompt });

const res = await chain.call({ product: "colorful socks" });
console.log({ res });
```

Convert your PDF to embeddings:

<img alt="pdf-to-embeddings" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vOhrAly1hccg4ncf7vj32140fu0x9.jpg" width="800" />

```js
// https://github.com/mayooear/gpt4-pdf-chatbot-langchain/blob/main/scripts/ingest-data.ts

/* load raw docs from the pdf file in the directory */
// https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
const loader = new PDFLoader(filePath);
const rawDocs = await loader.load();

/* split text into chunks */
// https://js.langchain.com/docs/modules/indexes/text_splitters/examples/recursive_character
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await textSplitter.splitDocuments(rawDocs);

/* create and store the embeddings in the vectorStore */
// https://js.langchain.com/docs/modules/models/embeddings/integrations
const embeddings = new OpenAIEmbeddings();

// https://github.com/hwchase17/langchainjs/pull/112
const pinecone = new PineconeClient();
await pinecone.init({
  environment: process.env.PINECONE_ENVIRONMENT,
  apiKey: process.env.PINECONE_API_KEY,
});
// An index is the highest-level organizational unit of vector data in Pinecone. 
// It accepts and stores vectors, serves queries over the vectors it contains, 
// and does other vector operations over its contents.
const index = pinecone.Index(PINECONE_INDEX_NAME); // change to your own index name

/* embed the PDF documents */
const chunkSize = 50;
for (let i = 0; i < docs.length; i += chunkSize) {
  const chunk = docs.slice(i, i + chunkSize);
  await PineconeStore.fromDocuments(
    index,
    chunk,
    embeddings,
  );
}
```

## An AI of Dan Abramov using RAG (Retrieval Augmented Generation)
https://github.com/TejasQ/danGPT

1. Turn the query into a vector using the same embeddings model.
2. Search the vector database for the most similar vectors to the query vector, or vectors "near" the query vector in dimensional space.
3. Retrieve many original texts from the most similar vectors.
4. Take those original texts and feed them as context into a generative AI model,such as OpenAI's `gpt-3.5-turbo`.
5. The generative AI model then generates a response based on the context it was given, prentending to be Dan.

```js
export const text2vec = async (texts: string[]) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    dimensions: 1024,
    input: texts,
  });

  return embedding.data.map((d) => d.embedding);
};

export const search = async (query: string) => {
  const astraClient = new AstraDB(
    process.env.ASTRA_DB_APPLICATION_TOKEN,
    process.env.ASTRA_DB_API_ENDPOINT
  );
  const collection = await astraClient.collection('danGPT');
  const [$vector] = await text2vec([query]);
  const results = (
    await collection
      .find({}, { sort: { $vector }, limit: 100, includeSimilarity: true })
      .toArray()
  ).filter((r) => r.$similarity > 0.7);

  return results;
};
```

> Run a local LLM with Ollama and open-source models: Looking at the specs for the [llama2 7b model](https://ollama.com/library/llama2), I was certain that my M1 Macbook with only 8 GB memory would even run it. But it did, just very slowly. The easiest approach to interacting with LLMs using Ollama is via the CLI `ollama run <MODEL_NAME>`.

## Vector Store
Vector Databases Explained: https://vercel.com/guides/vector-databases

[Chroma](https://docs.trychroma.com) provides a vector store and embedding database that can run seamlessly during local development to power the applications. [Faiss](https://github.com/facebookresearch/faiss) is a library for efficient similarity search and clustering of dense vectors. Both Chroma and FAISS are easy to work with locally.

<img alt="vectorstore" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vOhrAly1hd08amw1npj30u00z9djx.jpg" width="700">
