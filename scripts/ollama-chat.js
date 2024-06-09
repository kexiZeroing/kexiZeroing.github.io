// https://github.com/ollama/ollama-js
// ollama run gemma:2b

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
