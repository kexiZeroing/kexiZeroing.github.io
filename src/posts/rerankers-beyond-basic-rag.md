---
layout: "../layouts/BlogPost.astro"
title: "Rerankers – Beyond basic RAG"
slug: rerankers-beyond-basic-rag
description: ""
added: "Jun 16 2024"
tags: [AI]
updatedDate: "Jun 28 2024"
---

There is more to RAG than putting documents into a vector DB and adding an LLM on top. That can work, but it won't always. We are performing a semantic search across many text documents, however, the retrieval may return relevant information below our `top_k` cutoff. The metric we would measure here is **recall**, which measures how many relevant documents are retrieved out of the total number of relevant documents in the dataset. We may hack the metric and get perfect recall by returning everything.

Unfortunately, we can't do that because LLMs have the limited context window size. **LLM recall** refers to the ability of an LLM to find information from the text placed within its context window. Research shows that LLM recall degrades as we put more tokens in the context window. LLMs are also less likely to follow instructions as we stuff the context window.

The solution to this issue is to maximize retrieval recall by retrieving plenty of documents and then maximize LLM recall by minimizing the number of documents that make it to the LLM. To do that, we reorder retrieved documents and keep just the most relevant for our LLM — to do that, we use reranking.

## The Role of Rerankers
A reranking model — also known as a cross-encoder — is a type of model that, given a query and document pair, will output a similarity score. We use this score to reorder the documents by relevance to our query.

Search engineers have used rerankers in **two-stage retrieval systems** for a long time. In these two-stage systems, a first-stage model (an embedding model) retrieves a set of relevant documents from a larger dataset. Then, a second-stage model (the reranker) is used to rerank those documents retrieved by the first-stage model. Note that rerankers are slow, and retrievers are fast.

## Why We Need Rerankers
Rerankers are much more accurate than embedding models (e.g., limited semantic understanding, dimensionality constraints).

The intuition behind a bi-encoder's inferior accuracy is that bi-encoders must compress all of the possible meanings of a document into a single vector — meaning we lose information. Additionally, bi-encoders have no context on the query because we don't know the query until we receive it (we create embeddings before user query time).

On the other hand, a reranker can receive the raw information directly into the large transformer computation, meaning less information loss. Because we are running the reranker at user query time, we have the added benefit of analyzing our document's meaning specific to the user query — rather than trying to produce a generic, averaged meaning.

## Cross-Encoders
A cross-encoder is a type of neural network architecture used in NLP tasks, particularly in the context of sentence or text pair classification. Its purpose is to evaluate and provide a single score for a pair of input sentences, indicating the relationship or similarity between them. This departure from vector embeddings allows for a more nuanced understanding of the relationships between data points.

It's important to note that cross-encoders require a pair of "items" for every input, making them unsuitable for handling individual sentences independently. In the context of search, a cross-encoder is employed with each data item and the search query to calculate the similarity between the query and the data object.

**Cross-encoders are more accurate than bi-encoders but they don't scale well, so using them to re-order a shortened list returned by semantic search is the ideal use case.** Bi-Encoders are used whenever you need a sentence embedding in a vector space for efficient comparison. Cross-Encoders would be the wrong choice for these application: Clustering 10,000 sentence with CrossEncoders would require computing similarity scores for about 50 Million sentence combinations, which takes about 65 hours. With a Bi-Encoder, you compute the embedding for each sentence, which takes only 5 seconds.

> MS MARCO Passage Retrieval is a large dataset with real user queries from Bing search engine with annotated relevant text passages.

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

[Sentence Transformers](https://www.sbert.net) (a.k.a. SBERT) is the go-to Python module for accessing, using, and training state-of-the-art text and image embedding models. It can be used to compute embeddings using Sentence Transformer models (bi-encoder) or to calculate similarity scores using Cross-Encoder models.

> Beyond the Basics of Retrieval for Augmenting Generation: https://parlance-labs.com/talks/rag/ben.html

## Rerank API
At a high level, a rerank API is a language model which analyzes documents and reorders them based on their relevance to a given query.

JinaAI Reranker (1 million free tokens): https://jina.ai/reranker

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

Cohere offers an API for reranking documents: https://cohere.com/blog/rerank

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
