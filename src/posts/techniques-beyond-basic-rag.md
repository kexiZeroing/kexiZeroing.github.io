---
layout: "../layouts/BlogPost.astro"
title: "Techniques beyond basic RAG"
slug: techniques-beyond-basic-rag
description: ""
added: "Jun 16 2024"
tags: [AI]
updatedDate: "Jul 2 2024"
---

## Reranking
There is more to RAG than putting documents into a vector DB and adding an LLM on top. That can work, but it won't always. We are performing a semantic search across many text documents, however, the retrieval may return relevant information below our `top_k` cutoff. The metric we would measure here is **recall**, which measures how many relevant documents are retrieved out of the total number of relevant documents in the dataset. We may hack the metric and get perfect recall by returning everything.

Unfortunately, we can't do that because LLMs have the limited context window size. **LLM recall** refers to the ability of an LLM to find information from the text placed within its context window. Research shows that LLM recall degrades as we put more tokens in the context window. LLMs are also less likely to follow instructions as we stuff the context window.

The solution to this issue is to maximize retrieval recall by retrieving plenty of documents and then maximize LLM recall by minimizing the number of documents that make it to the LLM. To do that, we reorder retrieved documents and keep just the most relevant for our LLM — to do that, we use reranking.

### The Role of Rerankers
A reranking model — also known as a cross-encoder — is a type of model that, given a query and document pair, will output a similarity score. We use this score to reorder the documents by relevance to our query.

Search engineers have used rerankers in **two-stage retrieval systems** for a long time. In these two-stage systems, a first-stage model (an embedding model) retrieves a set of relevant documents from a larger dataset. Then, a second-stage model (the reranker) is used to rerank those documents retrieved by the first-stage model. Note that rerankers are slow, and retrievers are fast.

### Why We Need Rerankers
Rerankers are much more accurate than embedding models (e.g., limited semantic understanding, dimensionality constraints).

The intuition behind a bi-encoder's inferior accuracy is that bi-encoders must compress all of the possible meanings of a document into a single vector — meaning we lose information. Additionally, bi-encoders have no context on the query because we don't know the query until we receive it (we create embeddings before user query time).

On the other hand, a reranker can receive the raw information directly into the large transformer computation, meaning less information loss. Because we are running the reranker at user query time, we have the added benefit of analyzing our document's meaning specific to the user query — rather than trying to produce a generic, averaged meaning.

### Cross-Encoders
A cross-encoder is a type of neural network architecture used in NLP tasks, particularly in the context of sentence or text pair classification. Its purpose is to evaluate and provide a single score for a pair of input sentences, indicating the relationship or similarity between them. This departure from vector embeddings allows for a more nuanced understanding of the relationships between data points.

It's important to note that cross-encoders require a pair of "items" for every input, making them unsuitable for handling individual sentences independently. In the context of search, a cross-encoder is employed with each data item and the search query to calculate the similarity between the query and the data object.

**Cross-encoders are more accurate than bi-encoders but they don't scale well, so using them to re-order a shortened list returned by semantic search is the ideal use case.** Bi-Encoders are used whenever you need a sentence embedding in a vector space for efficient comparison. Cross-Encoders would be the wrong choice for these application: Clustering 10,000 sentence with CrossEncoders would require computing similarity scores for about 50 Million sentence combinations, which takes about 65 hours. With a Bi-Encoder, you compute the embedding for each sentence, which takes only 5 seconds.

[Sentence Transformers](https://www.sbert.net) (a.k.a. SBERT) is the go-to Python module for accessing, using, and training state-of-the-art text and image embedding models. It can be used to compute embeddings using Sentence Transformer models (bi-encoder) or to calculate similarity scores using Cross-Encoder models.

```py
# https://www.sbert.net/docs/cross_encoder/pretrained_models.html
from sentence_transformers import CrossEncoder
import torch

model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", default_activation_function=torch.nn.Sigmoid())
scores = model.predict([
    ("How many people live in Berlin?", "Berlin had a population of 3,520,031 registered inhabitants in an area of 891.82 square kilometers."),
    ("How many people live in Berlin?", "Berlin is well known for its museums."),
])
# => array([0.9998173 , 0.01312432], dtype=float32)
```

> MS MARCO Passage Retrieval is a large dataset with real user queries from Bing search engine with annotated relevant text passages.

### Rerank API
At a high level, a rerank API is a language model which analyzes documents and reorders them based on their relevance to a given query.

1. JinaAI Reranker (1 million free tokens): https://jina.ai/reranker

```
curl https://api.jina.ai/v1/rerank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jina_api_key_here" \
  -d '{
  "model": "jina-reranker-v2-base-multilingual",
  "query": "Organic skincare products for sensitive skin",
  "documents": [
    "Organic skincare for sensitive skin with aloe vera and chamomile.",
    "New makeup trends focus on bold colors and innovative techniques",
    "Bio-Hautpflege für empfindliche Haut mit Aloe Vera und Kamille",
    "Neue Make-up-Trends setzen auf kräftige Farben und innovative Techniken",
    "Cuidado de la piel orgánico para piel sensible con aloe vera y manzanilla",
    "Las nuevas tendencias de maquillaje se centran en colores vivos y técnicas innovadoras",
    "针对敏感肌专门设计的天然有机护肤产品",
    "新的化妆趋势注重鲜艳的颜色和创新的技巧",
    "敏感肌のために特別に設計された天然有機スキンケア製品",
    "新しいメイクのトレンドは鮮やかな色と革新的な技術に焦点を当てています"
  ],
  "top_n": 3
}'
```

> The Reranker API allows input of a query-doc list and outputs directly the reranked top-k results. This means that, in theory, one could build a search or recommendation system using solely the Reranker—eliminating the need for BM25, embeddings, vector databases, or any pipelines, thus achieving end-to-end functionality.

2. Cohere offers an API for reranking documents: https://cohere.com/blog/rerank

```js
import { CohereRerank } from "@langchain/cohere";
import { Document } from "@langchain/core/documents";

const query = "What is the capital of the United States?";
const docs = [
  new Document({
    pageContent:
      "Carson City is the capital city of the American state of Nevada. At the 2010 United States Census, Carson City had a population of 55,274.",
  }),
  new Document({
    pageContent:
      "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean that are a political division controlled by the United States. Its capital is Saipan.",
  }),
  new Document({
    pageContent:
      "Charlotte Amalie is the capital and largest city of the United States Virgin Islands. It has about 20,000 people. The city is on the island of Saint Thomas.",
  }),
  new Document({
    pageContent:
      "Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district. The President of the USA and many major national government offices are in the territory. This makes it the political center of the United States of America.",
  }),
  new Document({
    pageContent:
      "Capital punishment (the death penalty) has existed in the United States since before the United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states. The federal government (including the United States military) also uses capital punishment.",
  }),
];

const cohereRerank = new CohereRerank({
  apiKey: process.env.COHERE_API_KEY,
  model: "rerank-english-v2.0",
});

const rerankedDocuments = await cohereRerank.rerank(docs, query, {
  topN: 5,
});

console.log(rerankedDocuments);
/**
[
  { index: 3, relevanceScore: 0.9871293 },
  { index: 1, relevanceScore: 0.29961726 },
  { index: 4, relevanceScore: 0.27542195 },
  { index: 0, relevanceScore: 0.08977329 },
  { index: 2, relevanceScore: 0.041462272 }
]
 */
```

3. Mixedbread AI reranking: https://www.mixedbread.ai/docs/quick-start

## Query Transformation
The main idea behind the Query Transformation is that transform the user query in a way that the LLM can correctly answer the question. For instance, if the user asks an ambiguous question, our RAG retriever might retrieve incorrect documents based on the embeddings that are not very relevant to answer the user question, leading the LLM to hallucinate answers.

### Query re-writing (Multi-Query or RAG Fusion)
In multi-query approach, we first use an LLM to generate 5 different questions based on our original question. Once we get the 5 questions, we parallelly retrieve the most relevant 5 documents for each question and create a new document list by taking the unique documents of the union of all the retrieved documents.

```py
prompt = ChatPromptTemplate.from_template(
  """
  You are an intelligent assistant. Your task is to generate 5 questions based on the provided question in different wording and different perspectives to retrieve relevant documents from a vector database. By generating multiple perspectives on the user question, your goal is to help the user overcome some of the limitations of the distance-based similarity search. Provide these alternative questions separated by newlines. Original question: {question}
  """
)
```

In the default multi-query approach, we take the union of all the documents to select only unique documents (same document can be retrieved by multiple questions). However, we did not pay attention to the rank of each docuemnt in the context, which is important to the LLM. In RAG Fusion, while we do exactly the same thing retrieving docuemnts, we use *Reciprocal Rank Fusion (RRF)* to rank the each retrieved document before using them as the context to answer our original question.

### Query decomposition (Least-to-Most prompting or Step-back prompting)
While the multi-query approach helps avoid ambiguities of the user query by writing it in different ways, it will not help when the user query is complex (e.g., a long mathematical computation). As a solution we can break down the original query into multiple sub-problems and answer each sub-problem sequentially/parallelly to derive the answer to our original query.

- **Least-to-Most Prompting**: This allows to break down a complex problem into a series of simpler subproblems and then solve them in sequence. Solving each subproblem is facilitated by the answers to previously solved subproblems.

```py
decompostion_prompt = ChatPromptTemplate.from_template(
  """
  You are a helpful assistant that can break down complex questions into simpler parts. \n
  Your goal is to decompose the given question into multiple sub-questions that can be answerd in isolation to answer the main question in the end. \n
  Provide these sub-questions separated by the newline character. \n
  Original question: {question}\n
  Output (3 queries): 
  """
)

least_to_most_prompt = ChatPromptTemplate.from_template(
  """Here is the question you need to answer:

  \n --- \n {question} \n --- \n

  Here is any available background question + answer pairs:

  \n --- \n {q_a_pairs} \n --- \n

  Here is additional context relevant to the question: 

  \n --- \n {context} \n --- \n

  Use the above context and any background question + answer pairs to answer the question: \n {question}
  """
)
```

- **Step-back prompting**: This involves encouraging the LLM to take a step back from a given question or problem and pose a more abstract, higher-level question that encompasses the essence of the original inquiry.

```py
examples = [
  {
    'input': 'What happens to the pressure, P, of an ideal gas if the temperature is increased by a factor of 2 and the volume is increased by a factor of 8?',
    'output': 'What are the physics principles behind this question?'
  },
  {
    'input': 'Estella Leopold went to which school between Aug 1954 and Nov 1954?',
    'output': "What was Estella Leopold's education history?"
  }
]
example_prompt = ChatPromptTemplate.from_messages(
  [
    ('human', '{input}'), ('ai', '{output}')
  ]
)
few_shot_prompt = FewShotChatMessagePromptTemplate(
  examples=examples,
  example_prompt=example_prompt,
)

final_prompt = ChatPromptTemplate.from_messages(
  [
    ('system', """You are an expert at world knowledge. Your task is to step back and paraphrase a question to a more generic step-back question, which is easier to answer. Here are a few examples:"""),
    few_shot_prompt,
    ('user', '{question}'),
  ]
)
```
