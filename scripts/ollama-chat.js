// https://github.com/ollama/ollama-js
import ollama from 'ollama'

// const response = await ollama.chat({
//   model: 'gemma:2b', // 'llama2'
//   messages: [{ role: 'user', content: 'Tell me a joke' }],
// })

const message = { role: 'user', content: 'Tell me a joke' }
const response = await ollama.chat({
  model: 'gemma:2b',
  messages: [message],
  stream: true
})

for await (const part of response) {
  process.stdout.write(part.message.content)
}

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