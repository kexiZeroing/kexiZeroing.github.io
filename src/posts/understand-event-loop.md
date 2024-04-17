---
layout: "../layouts/BlogPost.astro"
title: "Understand the event loop"
slug: understand-the-event-loop
description: ""
added: "Aug 26 2020"
tags: [js]
updatedDate: "Mar 25 2024"
---

## Inside look at a browser
A process can be described as an application's executing program. A thread is the one that lives inside of process and executes any part of its process's program. Chrome has a multi-process architecture and each process is heavily multi-threaded. The **renderer process** is responsible for everything that happens inside of a tab.

In the most simple case, you can imagine each tab has its own renderer process. Because processes have their own private memory space, they often contain copies of common infrastructure. This means more memory usage as they can't be shared the way they would be if they were threads inside the same process. In order to save memory, Chrome puts a limit on how many processes it can spin up. The limit varies depending on how much memory and CPU power your device has, but when Chrome hits the limit, it starts to run multiple tabs from the same site in one process.

In a renderer process, the **main thread** is where a browser processes user events and paints. By default, the browser uses a single thread to run all the JavaScript in your page *(sometimes parts of your JavaScript is handled by worker threads if you use a web worker or a service worker)*, as well as to perform layout, reflows, and garbage collection. This means that long-running JavaScript functions can block the thread, leading to an unresponsive page and a bad user experience. Frame drop happens when the main thread is too busy with running our JavaScript code so it doesn’t get the chance to update the UI so the website freezes.

Compositor and raster threads are also run inside of a renderer processes to render a page efficiently and smoothly. The benefit of compositing is that it is done without involving the main thread.

Everything outside of a tab is handled by the **browser process**. The browser process has threads like the UI thread which draws buttons and input fields of the browser, the network thread which deals with network stack to receive data from the internet, the storage thread that controls access to the files and more. For example, in the process of a navigation flow, the network thread tells UI thread that the data is ready, UI thread then finds a renderer process to carry on rendering of the web page.

> To open the Chrome Task Manager, click on the three dots icon in the top right corner, then select 'More tools' and you can see 'Task Manager’. With this tool, you can monitor all running processes (CPU, memory, and network usage of each open tab and extension) and stop processes that are not responding.
>
> Site Isolation (per-frame renderer processes) is a feature in Chrome that runs a separate renderer process for each cross-site iframe.

## Event loop

<img alt="event-loop" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008vxvgGly1h7ivwcb19zj317a0u0jvw.jpg" width="700" style="display:block; margin:auto">

- **Stack**  
A single call stack in which it keeps track of what function we’re currently executing and what function is to be executed after that. When we execute an infinite loop, everything on the screen just freezes, this is because the main thread is blocked doing the infinite loop and render tasks never get a chance to come in.

- **Heap**  
Objects are allocated in a heap which is just a name to denote a large (mostly unstructured) region of memory.

- **Web APIs**  
A number of powerful functions and interfaces exposed to us by the browser. These web APIs enhance JS and give it the ability to do all the powerful things like Network requests, DOM manipulation, Bluetooth, Location, setTimeout... In case of *callbacks* they will add your callback to the Callback queue, instead, in case of a *then (promise’s method)*, your code will be added to the Job queue.

- **Task Queue**  
Also known as Callback Queue, which is a list of messages to be processed. Each message has an associated callback function which gets called in order to handle the message. Important to remember that when you have a `setTimeout` and a delay, it's not the delay until it gets moved onto the call stack. It's the delay until it gets moved to the task queue.

- **Micro-Task Queue**  
Also known as Job Queue, which is reserved for promise’s thens. It is a prioritized queue, which means "execute this code later (= asynchronously), but as soon as possible (= before the next Event Loop tick)". After executing every task, the event loop will go to microtask queue and check if something is there and if it is then it will execute all of them.

- **Render Queue**  
Takes care of tasks to be done before every screen update or repaints. This process is sometimes referred also as critical rendering path. Browsers generally are set to repaint around 60 times every second (60FPS), but it can happen at this speed only when the main thread is idle or the call stack is empty.

- **Event Loop**  
The Event Loop is a constantly running process and it has one simple job — to monitor the Call Stack and the Queues. If the Call Stack is empty, it will take the first event from the queue and push it to the Call Stack. Node.js and Chrome do not use the same event loop implementation. Chrome/Chromium uses `libevent`, while Node.js uses `libuv`. Check out [A Complete Visual Guide to Understanding the Node.js Event Loop](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop).

**The difference between the task queue and the microtask queue is simple but very important:**
- When executing tasks from the task queue, the runtime executes each task that is in the queue at the moment a new iteration of the event loop begins. Tasks added to the queue after the iteration begins will not run until the next iteration.
- Each time a task exits, and the execution context stack is empty, each microtask in the microtask queue is executed, one after another. The difference is that execution of microtasks continues until the queue is empty—even if new ones are scheduled in the interim. In other words, microtasks can enqueue new microtasks and those new microtasks will execute before the next task begins to run, and before the end of the current event loop iteration.

```javascript
setTimeout(() => console.log(1), 0)
async function async1(){
  console.log(2)
  await async2()  // just syntactic sugar on top of promise
  console.log(3)
}
async function async2(){
  console.log(4)
}
async1()
new Promise((resolve, reject) => {
  console.log(5)
  for (let i = 0; i < 1000; i++) {
    i === 999 && resolve()
  }
  console.log(6)
}).then(() => {
  console.log(7)
})
console.log(8)
/*
output：2 4 5 6 8 3 7 1
*/
```

You may argue that `setTimeout` should be logged first because a task is run first before clearing the microtask queue. Well, you are right. But, no code runs in JS unless an event has occurred and the event is queued as a task. At the execution of any JS file, the JS engine wraps the contents in a function and associates the function with an event `start`, and add the event to the task queue. After emits the program `start` event, the JavaScript engine pulls that event off the queue, executes the registered handler, and then our program runs.

```js
// blocks the rendering (freezes the webpage)
button.addEventListener('click', event => {
  while (true) {}
});

// does NOT block the rendering
function loop() {
  setTimeout(loop, 0);
}
loop();

// blocks the rendering
(function loop() {
  Promise.resolve().then(loop);
})();
```

> `requestAnimationFrame` on the other hand doesn't suffer from such a direction. Indeed, the monitor's signal is what tells when the event loop must enter the "update the rendering" steps. This signal is not bound to the CPU activity and will work as a stable clock. If at one frame rAF callbacks were late by a few ms, the next frame will just have less time in between, but the flag will be set at regular intervals.
