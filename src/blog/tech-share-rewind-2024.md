---
title: "Tech Share Rewind 2024"
description: ""
added: "Jan 14 2025"
tags: [web, other]
---

Throughout 2024, I found myself sharing countless tech stories that caught my attention across different social media, primarily focusing on web development and AI - two areas I’m most passionate about. I've compiled these digital breadcrumbs month by month here, and hopefully I can keep this up every year.

## December
- This December, I took part in Advent of Code, Advent of TypeScript, and Debug December, all for the first time. It was an enriching and meaningful experience. My JavaScript solution to Advent of Code 2024 is [here](https://github.com/kexiZeroing/advent-of-code-2024).

- BFCM highlights from Shopify Engineering. Every Black Friday Shopify shows how "boring" technology can be scaled just fine. This year they did 45M queries/sec with MySQL and somewhere around 1.3M request/sec on Rails.

- Try Gemini 2.0 Flash streaming live video. It's free. Give the demo at https://aistudio.google.com/live a go - it lets you stream video and audio directly to Gemini 2.0 Flash and get audio back, so you can have a real-time audio conversation about what you can see with the model.

- Google just released Gemini 2.0 Flash Thinking Experimental, a new AI model that pauses to "think" through complex problems like OpenAI's o1 model, but is free-to-use and works faster.

- OpenAI Realtime API now supports WebRTC—you can add Realtime capabilities with just a handful of lines of code.

- Next.js AI Chatbot 3.1. Editable artifacts/canvas UI for writing and code. Python code execution (via Pyodide and WASM).

- [Debunking the Myth: SSR Isn't Expensive](https://t3.gg/blog/post/ssr-is-not-expensive). SSR costs are low, reduces other cloud costs, and provides a better experience.

- A lot of people miss the real genius behind Bolt from Stackblitz. Yes, it's using AI to build apps, but even with powerful LLMs like Claude 3.5 Sonnet, none of it would be possible without Web Containers *(run Node.js directly in the browser)*.

- [React v19 is now stable](https://react.dev/blog/2024/12/05/react-19).

- Ollama 0.5 is here with [structured outputs](https://ollama.com/blog/structured-outputs). This makes it possible to constrain a model’s output to a specific format defined by a JSON schema.

- Quickly turn a GitHub repository into text for LLMs with Gitingest. Replace "hub" with "ingest" in any GitHub URL for a text version of the codebase.

## November
- Lee Robinson wrote a new post: [Understanding AI](https://leerob.com/n/ai). A brief overview on neural networks and language models.

- AI SDK introduces [the Cookbook](https://sdk.vercel.ai/cookbook). An open-source collection of recipes and guides for building with the AI SDK.

- Motion's brand new home at [motion.dev](https://motion.dev/) and it becomes more than a React library.

- TanStack Start is a full-stack React framework powered by TanStack Router. It provides a full-document SSR, streaming, server functions, bundling, and more, powered by TanStack Router, Vinxi, and Vite. Use TanStack Router for client-side routing and TanStack Start for full-stack routing.

- Vercel has acquired [grep.app](http://grep.app), the fastest code search engine on the planet (of over 500k+ Git repos).

- Access all of Claude's docs concatenated as a [single plain text file](https://docs.anthropic.com/llms-full.txt) that can be fed in to any LLM. You can also access plain text versions of [AI SDK docs](https://sdk.vercel.ai/llms.txt). 

- Claude introduces the Model Context Protocol, which is an open standard that enables developers to build secure, two-way connections between their data sources and AI-powered tools. There is a cool summary quickstart [here](https://glama.ai/blog/2024-11-25-model-context-protocol-quickstart).

- If you need to interact with DOM nodes directly after they rendered, try not to jump to `useRef` + `useEffect` directly, but consider using callback refs instead. React will call your `ref` callback with the DOM node as the argument.

- Next.js Conf 2024.

- [ikea.com](http://ikea.com) is now on Astro.

- Julia Evans wrote [an article](https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library) about importing a frontend Javascript library without a build system. It's so complicated.

## October
- Ask ChatGPT “From all of our interactions what is one thing that you can tell me about myself that I may not know about myself”.

- AI Assistance in Chrome DevTools.

- OpenAI introduces the [Realtime API](https://openai.com/index/introducing-the-realtime-api). It lets you create a persistent WebSocket connection to exchange messages with GPT-4o. 

- StackBlitz introduces bolt.new. Prompt, edit, run and deploy fullstack apps. Add bolt.new in front of any GitHub repo URL, and start building with that repo right away.

- The much improved Vue Devtools v7 has been submitted for review on the Chrome web store under the stable channel, and we are flipping the switch tomorrow. The latest v7 only supports Vue 3.

- [NextMaster](https://next-faster.vercel.app) is an open-source ecommerce Next.js template inspired by McMaster-Carr, optimized for performance with over 1 million products. For the original website, Wes Bos [recorded a video](https://www.youtube.com/watch?v=-Ln-8QM8KhQ) breaking down the McMaster Carr website and the techniques they use to make it so fast.

- Shadcn introduce `sidebar.tsx`——25 components to help you build all kinds of sidebars.

- Lee Robinson [recorded a video](https://www.youtube.com/watch?v=sIVL4JMqRfc) on learning how to deploy Next.js, Postgres, and Nginx to a $4 VPS with Docker. He explains how to use and configure Next.js features like image optimization, caching & ISR, streaming, middleware, server components, and more.

## September
- Google's NotebookLM gives you a personalized AI collaborator that you can read, take notes, and collaborate with it to refine and organize your ideas. Support added for YouTube videos and audio files as new source materials.

- A good article to read: [The State of ES5 on the Web](https://philipwalton.com/articles/the-state-of-es5-on-the-web). For years, we defaulted to transpiling to ES5 in order to support IE. But is that still necessary?

- Wes Bos finds out about `display: contents`. This causes an element's children to appear as if they were direct children of the element's parent, ignoring the element itself. This can be useful when a wrapper element should be ignored when using CSS grid or similar layout techniques.

- Sam Selikoff wrote [an article](https://buildui.com/posts/how-to-control-a-react-component-with-the-url) about How to control a React component with the URL.

- You can create image embeddings with the Nomic API. Same vector space as embeddings produced by Nomic Embed Text.

## August
- Matt Pocock wrote a massive guide to [creating and publishing a package on npm](https://www.totaltypescript.com/how-to-create-an-npm-package).

- v0's new conversational UI. Up-to-date Next.js, React, and web knowledge. Ability to run npm packages like framer-motion. Check out [MS Paint clone](v0.dev/chat/aZ1oz0T).

- Shadcn introduces the new CLI `npx shadcn init`. Install anything from anywhere——add components, themes, hooks, functions, animations, and generated code to your apps.

- Introducing [postgres.new](http://postgres.new), the in-browser Postgres sandbox with AI assistance. With postgres.new, you can instantly spin up an unlimited number of Postgres databases that run directly in your browser.

- Two CSS tips for textareas. Use `field-sizing: content` to make the textarea auto-resize to its content. Use `lh` units to set the height in the font's computed line-height units.

## July
- Anthropic just announced Claude's Artifacts can be published online. Every single piece of content, screenshot, PDF, presentation, etc., can now be turned into an interactive learning game.

- Annual reminder that React's [ComponentProps helper](https://www.totaltypescript.com/react-component-props-type-helper) is still goated, and there are still folks that don't know about it. How do I figure out the type of a component's props? How do I get all the types that a div or span accepts?

- Chrome's new `window​.ai` feature is going to change the web forever. It allows you to run Gemini Nano 100% locally in your browser. The API is experimental, you will need to install Chrome Dev/Canary version 127 or higher, and enable a few flags to get it working.

## June
- Resend puts their company strategy online, sharing on how they approach engineering, design, support, and marketing. For example, [What is our tech stack](https://resend.com/handbook/engineering/what-is-our-tech-stack) is cool.

- [webgpu-whisper](https://huggingface.co/spaces/Xenova/realtime-whisper-webgpu) is a demo of real-time in-browser speech recognition with OpenAI Whisper. The model runs fully on-device using Transformers.js and ONNX Runtime Web, and supports multilingual transcription.

- React Conf 2024. Enhancing Forms with React Server Components by [Aurora Scharff](https://www.youtube.com/watch?v=X9cw4VczYVg). What's new in React 19 by [Lydia Hallie](https://www.youtube.com/watch?v=AJOGzVygGcY).

## May
- Google I/O 2024 - The Gemini era.

- Jina Reader now supports reading arbitrary PDFs from URLs. Simply add r.jina.ai like https://r.jina.ai/https://example.pdf, and you get a nicely parsed text ready for downstream LLMs to consume. Yes, Reader natively supports PDF reading. It is compatible to most PDFs including those with a lot of images, and it's lightning fast.

- Nico Albanese recorded [a video](https://www.youtube.com/watch?v=UDm-hvwpzBI) walking through the new Vercel AI SDK v3.1. Learn how to build AI apps with TypeScript in 13 minutes.

- Guillermo Rauch had a really cool [AI chatbot in Win95 style](https://wingpt.vercel.app). There is also a project [Github95](https://github95.vercel.app) to browse GitHub repos and users with a Windows 95 style.

- Quickly start your chat with Gemini using the new shortcut in the Chrome desktop address bar. Type “@” in the desktop address bar and select Chat with Gemini, and write your prompt.

- We should ship [latency numbers every web engineer should know](https://vercel.com/blog/latency-numbers-every-web-developer-should-know). There are fascinating numbers to be known out there. e.g., the time between hover and click can be 100s of ms where you can be doing anticipatory work.

## April
- Google AI Studio is a web-based environment where developers can write, run, and test prompts using Google’s Gemini models. Additionally, if you want to use the Gemini API, you can get your API key from inside Google AI Studio.

- Gemma is a family of lightweight, state-of-the-art open models in lightweight 7B and 2B sizes, built from the same research and technology used to create the Gemini models.

## March
- We're excited to announce that Chrome for Developers is now available on a `.cn` domain. Find Chrome for Developers for China at [developer.chrome.google.cn](https://developer.chrome.google.cn). Find web.dev for China at [web.developers.google.cn](https://web.developers.google.cn).

- The redesigned [nodejs.org](http://nodejs.org) is live. It has fresh look, comprehensive search, new learning resources, and improved contributor DX.

## February
- Whenever you think of writing `useEffect`, the only sane thing is to NOT do it. Instead, go to the react docs and [re-read the page](https://react.dev/learn/you-might-not-need-an-effect) about why you don't need an effect.

## January
- Una wrote the [2023 in Review](https://una.im/2023-in-review). She has the year reviews starting from 2014.
