// https://github.com/ollama/ollama-js
import ollama from 'ollama'

const message = { role: 'user', content: 'Tell me a joke' }
const response = await ollama.chat({
  model: 'gemma:2b', // 'llama2'
  messages: [message],
  stream: true
})

for await (const part of response) {
  process.stdout.write(part.message.content)
}

// ==========

// https://ollama.com/library/nomic-embed-text
// ollama.embeddings({
//   model: 'nomic-embed-text',
//   prompt: 'The sky is blue because of rayleigh scattering'
// }).then(embeddings => {
//   console.log(embeddings)
// })

// ==========

// https://js.langchain.com/v0.2/docs/integrations/llms/ollama/
// import { Ollama } from "@langchain/community/llms/ollama";

// const ollama = new Ollama({
//   baseUrl: "http://localhost:11434", // Default value
//   model: "llama2", // Default value
// });

// const stream = await ollama.stream(
//   `Translate "I love programming" into German.`
// );

// const chunks = [];
// for await (const chunk of stream) {
//   chunks.push(chunk);
// }

// console.log(chunks.join(""));

// ==========

// Load data
// https://github.com/hacktronaut/ollama-rag-demo 

// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// import { Chroma } from "@langchain/community/vectorstores/chroma";
// import { TextLoader } from "langchain/document_loaders/fs/text";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// // Get an instance of ollama embeddings
// const ollamaEmbeddings = new OllamaEmbeddings({
//   baseUrl: "http://localhost:11434",
//   model: "tinydolphin"
// });

// // Load data from txt file
// const loader = new TextLoader("./data.txt");
// const docs = await loader.load();

// // Create a text splitter
// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   separators: ['\n\n','\n',' ',''],
//   chunkOverlap: 200
// });

// const output = await splitter.splitDocuments(docs);

// const vectorStore = await Chroma.fromDocuments(output, ollamaEmbeddings, {
//   collectionName: "myLangchainCollection",
//   url: "http://localhost:8000",
// });

// // Search for the most similar document
// const vectorStoreResponse = await vectorStore.similaritySearch("What is langchain", 1);

// console.log("Printing docs after similarity search: ", vectorStoreResponse);
