---
title: "Chrome built-in AI"
description: ""
added: "Jun 21 2025"
tags: [AI]
---

With built-in AI, your website or web application can perform AI-powered tasks, without needing to deploy, manage, or self-host AI models.
- Local processing of sensitive data
- Snappy user experience
- Greater access to AI
- Offline AI usage

You'll access built-in AI capabilities primarily with task APIs, such as a translation API or a summarization API. Task APIs are designed to run inference against the best model for the assignment. In Chrome, these APIs are built to run inference against Gemini Nano with fine-tuning or an expert model.

- https://github.com/webmachinelearning/prompt-api
- https://github.com/webmachinelearning/writing-assistance-apis
- https://github.com/webmachinelearning/translation-api
- https://chrome.dev/web-ai-demos

## Get started
The Prompt API, Summarizer API, Writer API, and Rewriter API download Gemini Nano, which is designed to run locally on desktop and laptop computers. These APIs don't work on mobile devices.

API status:
https://developer.chrome.com/docs/ai/built-in-apis#api_status

There are several built-in AI APIs available at different stages of development. Some are in Chrome stable, others are available to all developers in origin trials, and some are only available to Early Preview Program (EPP) participants.

| API |  Web | Extensions |
| --- | --- | --- |
| Translator API | Chrome 138 | Chrome 138 |
| Language Detector API | Chrome 138 | Chrome 138 |
| Summarizer API | Chrome 138 | Chrome 138 |
| Writer API |  Origin trial |  Origin trial |
| Rewriter API |  Origin trial |  Origin trial |
| Prompt API | In EPP | Chrome 138 |

To confirm Gemini Nano has downloaded and works as intended, open DevTools and type `await LanguageModel.availability();` into the console. This should return `available`.

> If Gemini Nano doesn't work as expect, follow these steps:
> 1. Restart Chrome.
> 2. Go to `chrome://components`
> 3. Confirm that **Optimization Guide On Device Model** is present. This means Gemini Nano is either available or downloading. If there's no version number listed, click **Check for update** to force the download.

## API usage
Before translating text from one language to another, you must first determine what language is used in the given text.

```js
if ('LanguageDetector' in self) {
  // The Language Detector API is available.
}

const languageDetector = await LanguageDetector.create();
const result = await languageDetector.detect("I’m a software engineer and I have a great interest in web development.");

console.log(result[0]);
// {
//   "confidence": 0.9994762539863586,
//   "detectedLanguage": "en"
// }
```

Users can participate in support chats in their first language, and your site can translate it into the language your support agents use, before it leaves the user's device.

```js
if ('Translator' in self) {
  // The Translator API is supported.
}

const translator = await Translator.create({
  sourceLanguage: "en",
  targetLanguage: "de",
  // monitor(m) {
  //   m.addEventListener('downloadprogress', (e) => {
  //     console.log(`Downloaded ${e.loaded * 100}%`);
  //   });
  // },
});
const result = await translator.translate("I’m a software engineer and I have a great interest in web development.");

console.log(result);
// '我是一名软件工程师，我对 Web 开发非常感兴趣。'
```

The Summarizer API can be used to generate different types of summaries in varied lengths and formats, such as sentences, paragraphs, bullet point lists, and more.

```js
if ('Summarizer' in self) {
  // The Summarizer API is supported.
}

const options = {
  sharedContext: 'This is a user’s profile.', // Additional shared context that can help the summarizer.
  type: 'key-points', // key-points (default), tldr, teaser, and headline
  format: 'markdown', // markdown (default) and plain-text
  length: 'medium',  // short, medium (default), and long
};

const summarizer = await Summarizer.create(options);
const result = await summarizer.summarize("I’m a software engineer and I have a great interest in web development. I love building web applications and exploring new technologies. My goal is to create user-friendly and efficient software solutions.");

console.log(result);
// * The user is a software engineer with an interest in web development. 
// * Their goal is to create user-friendly and efficient software solutions. 
// * They enjoy building web applications and exploring new technologies.
// * The text provides a brief introduction to the user's professional background and interests. 
// * The profile lacks further details such as specific projects or accomplishments.
```

With the Prompt API, you can send natural language requests to Gemini Nano in the browser.

```js
await LanguageModel.params();
// {defaultTopK: 3, maxTopK: 8, defaultTemperature: 1, maxTemperature: 2}

const session = await LanguageModel.create();

// Prompt the model and wait for the whole result to come back.
const result = await session.prompt("Write me a poem.");
console.log(result);

// Prompt the model and stream the result:
const stream = session.promptStreaming("Write me a poem.");
for await (const chunk of stream) {
  console.log(chunk);
}
```
