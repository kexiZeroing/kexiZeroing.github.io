// https://blog.platformatic.dev/a-guide-to-reading-and-writing-nodejs-streams

// 1. Streams process data in chunks, significantly reducing memory usage.
// 2. All streams in Node.js inherit from the EventEmitter class.
//    Both Writable and Readable streams will store data in an internal buffer.
// 3. The main goal of backpressure is to provide a mechanism for the consumer to throttle the producer,
//    ensuring that the data flow does not exceed what the consumer can handle.
// 4. In Node.js streams, the buffering and flow control is managed through an internal property called ‘highWaterMark’. 

// When you create a new stream instance, it doesn't immediately start producing data.
// When you attach a 'data' event listener (or use other methods like `pipe()`), the stream switches to flowing mode.
// Once in flowing mode, the internal mechanisms of Node.js streams will start calling the `_read` method repeatedly to request more data.
// This process continues until `null` is pushed, signaling the end of the stream.

// `on('data')` event is triggered whenever data is available from the stream.
// It is very fast, as the stream pushes data as quickly as it can handle, 
// making it suitable for high-throughput scenarios.

// `on('readable')` event is triggered when there is data available to read from the stream
// or when the end of the stream has been reached.

import { Readable } from 'stream';

class MyReadableStream extends Readable {
  #count = 0;
  _read(size) {
    this.push(':-)');
    if (this.#count++ === 5) { this.push(null); }
  }
}

// Basic Readable Stream
// const stream = new MyReadableStream();
// stream.on('data', chunk => {
//   console.log(chunk.toString());  
// });

// Managing Backpressure with Pause and Resume
// const stream = new MyReadableStream();
// stream.on('data', chunk => {
//   console.log(chunk.toString());
//   stream.pause();  // Pause receiving data to simulate processing delay
//   setTimeout(() => {
//     stream.resume();  // Resume after 1000ms
//   }, 1000);
// });

// Async Iterators
// const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// async function* generate() {
//   yield 'hello';
//   await sleep(1000);
//   yield ' ';
//   await sleep(1000);
//   yield 'world';
// }

// // `Readable.from()` method is used to convert the generator into a readable stream.
// Readable.from(generate()).on('data', chunk => console.log(chunk));

// Creating a Writable stream
import { Writable } from 'stream';
import { once } from 'events';

class MyWritableStream extends Writable {
  constructor() {
    // the threshold that determines when the stream should stop accepting data.
    super({ highWaterMark: 10 /* 10 bytes */ });
  }
  _write(data, encode, cb) {
    process.stdout.write(data.toString().toUpperCase() + '\n', cb);
  }
}
const stream = new MyWritableStream();

for (let i = 0; i < 10; i++) {
  // The write method attempts to write data to the stream.
  // If the internal buffer is full (exceeds highWaterMark), it returns false.
  // Each 'hello' is 5 bytes here.
  // so, after writing 'hello' twice (10 bytes), the stream will likely return false on the next write call.
  const waitDrain = !stream.write('hello');

  // When write returns false, it means the stream is in a "backed up" state.
  // At this point, you should stop writing and wait for the 'drain' event.
  if (waitDrain) {
    console.log('>> wait drain', i);
    await once(stream, 'drain');
  }
}

stream.end('world');
