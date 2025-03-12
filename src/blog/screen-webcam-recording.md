---
title: "Screen and webcam recording"
description: ""
added: "Oct 14 2022"
tags: [web]
updatedDate: "Jun 21 2023"
---

Let's explore how far browser technology has come in the way of screen sharing and recording, and attempt to create a tool that would allow us to quickly create short-form technical video content. All of this is powered by browser APIs using no external services. The original article is [here](https://formidable.com/blog/2022/screen-webcam-mixing-recording).

This experimental web app is [Clips](https://clips.formidable.dev) and it supports:
- capturing/sharing your screen/window
- capturing your webcam
- capturing your mic audio
- adjusting the position/sizing of the captured screen/webcam on the video canvas
- choosing from different background/layout options, including audio-visualization background
- recording the video in your browser

### Capturing the screen
To allow the user to capture their screen, we can use the `MediaDevices.getDisplayMedia()` method available to us on the `navigator` global in modern browsers.

```js
const captureScreen = async () => {
  // will prompt the user for a screen to share
  const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });
}
```

Now we have reference to a `MediaStream` instance returned from `getDisplayMedia`, and we’ll eventually want to use this stream to draw the captured display onto our canvas. However, the canvas API does not handle any sort of video decoding – so we’ll pass this media stream into an HTML5 `<video>` element as its `srcObject`, and then use a reference to this `<video>` element to draw the video’s pixels onto our canvas via `CanvasRenderingContext2D.drawImage`.

```js
let screenShareVideoRef: HTMLVideoElement;

const captureScreen = async () => {
  const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });

  // connect stream to video element via srcObject
  screenShareVideoRef.srcObject = screenShareStream;
}
```

### Capturing the webcam
We want to allow the user to select which webcam they’d like to use, but in order to do this we need to show the user which webcams are available to choose from. In order to show the user which webcams are available, we first need to request permission to access the list of available webcams.

```js
// list webcam devices
const listWebcamDevices = async () => {
  // first ensure user's given permission to "enumerate" their video devices
  await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  // fetch all devices, and then filter for videoinput devices
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  return allDevices.filter((device) => device.kind === "videoinput");
}

// connect to a specific device by passing `device.deviceId` from the device list
const connectToWebcam = async (deviceId: string) => {
  const webcamStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId }
    }
  });
}
```

> `getUserMedia()` is a powerful feature which can only be used in secure contexts; in insecure contexts, `navigator.mediaDevices` is undefined. A secure context is a page loaded using HTTPS or the `file://` URL scheme, or a page loaded from `localhost`.
>
> In addition, user permission is always required to access the user's audio and video inputs. Only a window's top-level document context for a valid origin can even request permission to use it. Otherwise, the user will never even be asked for permission to use the input devices.

Similar to our screen share stream, we want to use the result of this video stream in our canvas, so we’ll need to pass this stream along to a `<video>` element for decoding for later use in our canvas drawing.

```js
let webcamVideoRef: HTMLVideoElement;

const connectToWebcam = async (deviceId: string) => {
  const webcamStream = await navigator.mediaDevices.getUserMedia(/* ... */);
  // use input stream as src for video element
  webcamVideoRef.srcObject = webcamStream;
}
```

### Capturing the mic
The microphone is another type of “user media”, so we can follow a similar pattern as with capturing the webcam.

```js
// list audio input devices
const listAudioInputDevices = async () => {
  await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true
  });

  // filter for audioinput devices
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  return allDevices.filter((device) => device.kind === "audioinput");
}

// connect to a specific device by passing `device.deviceId` from the device list.
const connectToAudioInput = async (deviceId: string) => {
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: deviceId },
      // we'll use some browser niceties to polish our audio input
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}
```

Since our mic stream does not produce any sort of visuals, we do not need to attach this media stream to any sort of `<video>` or `<audio>` element.

### Combining the screen and webcam streams
At this point we’ve got video streams for our screen share and webcam. We want to combine these two video streams together in a way that we can record the output and add nice visual effects. To do this, we’ll use HTML canvas and `CanvasRenderingContext2D`. We’ll use the `drawImage` method of our canvas context to paint our video streams onto our canvas. Our general approach will be to set up a `requestAnimationFrame` loop for painting our video displays onto our canvas so that our canvas stays up to date with our video streams.

```js
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// kick off the drawing process 
const startDrawing = () => {
  requestAnimationFrame(loop);
}

// requestAnimationFrame loop. Each frame, we draw to the canvas.
const loop = () => {
  draw();	
  requestAnimationFrame(loop);
}

// our drawing function
const draw = () => {
  const { width, height } = canvas;

  // clear out the entire canvas and paint from scratch
  ctx.clearRect(0, 0, width, height);

  // draw our screen share in top-left
  // would need to do real math to get proper aspect ratio.
  ctx.drawImage(screenShareVideoRef, 0, 0, 500, 400);

  // draw our webcam in bottom-right
  // would need to do real math to get proper aspect ratio.
  ctx.drawImage(webcamVideoRef, width - 200, height - 100, 200, 100);
}
```

> The `CanvasRenderingContext2D.drawImage()` method of the Canvas 2D API provides different ways to draw an image onto the canvas. The specification permits any canvas image source, specifically, an `HTMLImageElement`, an `SVGImageElement`, an `HTMLVideoElement` or an `HTMLCanvasElement`.

### Creating a Recording
Once we have our pixels dancing on our canvas, and our microphone audio stream captured, we can start to stitch these together to create an actual recording. Something we could upload to, say, YouTube.

Modern browsers have some support for the `MediaRecorder` API which is an interface for recording media. The `MediaRecorder` API works by consuming a single `MediaStream` and outputting `Blob` chunks over time. We can then use those `Blob` chunks to create a video output.

We need to generate a `MediaStream` from our canvas element, which we can do via the `canvas.captureStream` method – and then combine that with our mic `MediaStream` to create a single combined media stream. To combine `MediaStream` instances, we extract out the `MediaStreamTrack` instances we want to combine together and pass them in an array to the constructor of `MediaStream` to create a new stream with those specific tracks.

```js
// create a MediaStream from our canvas
// the `30` here is frames per second, feel free to set your own FPS
const canvasStream = canvas.captureStream(30);

// combine the canvas stream and mic stream by collecting tracks from each
const combinedStream = new MediaStream([
  ...canvasStream.getTracks(),
  ...micStream.getTracks()
]);
```

Now that we have a combined media stream, we can use the `MediaRecorder` API to record it. The general flow for using the `MediaRecorder` is roughly as follows:
1. create a `MediaRecorder` instance;
2. register a callback to the `MediaRecorder.ondataavailable` event to capture emitted `Blobs` and stored those `Blob` chunks in an array;
3. when the recorder’s `onstop` event is called, use the collected `Blob` chunks to create a video file to be downloaded. You can call `MediaRecorder.stop` manually to stop a recording.

```js
const chunks: Blob[] = [];

// create a recorder
const recorder = new MediaRecorder(combinedStream, {
  // requested media type, basically limited to webm
  mimeType: "video/webm;codecs=vp9"
});

// collect blobs when available
recorder.ondataavailable = (evt) => {
  chunks.push(evt.data);
}

// when recorder stops (via recorder.stop()), handle blobs
recorder.onstop = () => {
  const recordedBlob = new Blob(chunks, { type: chunks[0].type });
  // do something with this blob...
}
```

The `MediaRecorder` `mimeType` option supposedly allows you to specify a media type, but Chromium-based browsers and FireFox [only seem to support webm](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/web_tests/fast/mediarecorder/MediaRecorder-isTypeSupported.html?q=MediaRecorder-isTypeSupported&ss=chromium). This means you’re more-or-less forced into creating `.webm` videos – a video format that’s not as widely adopted as other formats like `.mp4`. Many video editing softwares do not handle `.webm` videos, therefore it’s a struggle to do any sort of post-processing or editing on the generated video files.

The `.webm` video blobs generated from the `MediaRecorder` API in Chromium-based browsers are missing the `duration` video metadata – which means browsers or video players cannot properly seek these videos because they don’t know how long the video is, and many platforms will reject them as uploads. Open source to the rescue. [fix-webm-duration](https://github.com/yusitnikov/fix-webm-duration) is a library that allows you to manually pass in a video duration and it’ll adjust the blob’s metadata accordingly. Therefore, to get a usable video file – you’ll need to manually track the start/end time of the video recording – and then monkey patch the duration metadata accordingly.

```js
import fixWebmDuration from "fix-webm-duration";

// helper to patch our blob
const patchBlob = (blob: Blob, duration: number): Promise<Blob> => {
  return new Promise(resolve => {
    fixWebmDuration(blob, duration, newBlob => resolve(newBlob));
  });
}

// when starting the recording, track the start time
let startTime: number;
recorder.onstart = () => {
  startTime = performance.now();
}

recorder.onstop = async () => {
  const recordedBlob = new Blob(chunks, { type: chunks[0].type });
  
  // manually compute duration, and patch the blob
  const duration = performance.now() - startTime;
  const patchedBlob = patchBlob(recordedBlob, duration);
}
```

> WebM is an open media file format designed for the web. It is an open-source project sponsored by Google. WebM files consist of video streams compressed with the VP8 or VP9 video codec, audio streams compressed with the Vorbis or Opus audio codecs, and WebVTT text tracks. Read more at: https://www.webmproject.org/about/faq
> 
> VP8 and VP9 are highly-efficient video compression technologies developed by the WebM Project; Vorbis and Opus are open-source audio compression technologies.

### Generating a download
To automatically download the blob as a video file, we’ll use the standard technique of using `URL.createObjectURL` to create an object URL, generating an anchor DOM element with this URL as its `href`, simulating a click on that anchor tag (which will trigger a download of the blob), and then discard the anchor tag.

```js
recorder.onstop = async () => {
  const recordedBlob = new Blob(chunks, { type: chunks[0].type });
  const duration = performance.now() - startTime;
  const patchedBlob = patchBlob(recordedBlob, duration);

  // turn the blob into a data URL
  const data = URL.createObjectURL(patchedBlob);
  
  // generate a link, simulate a click on it
  const link = document.createElement("a");
  link.href = data;
  link.download = "recording.webm";
  link.dispatchEvent(
    new MouseEvent("click", { view: window });
  );

  // don't forget to clean up
  setTimeout(() => {
    URL.revokeObjectURL(data);
    link.remove();
  }, 500);
}
```

And there we go! After our recording finishes, we’ve got a `.webm` video file downloading to our Downloads folder.

### MDN docs and links
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
- https://www.mux.com/blog
- https://github.com/alyssaxuu/screenity
- https://github.com/coffeefuelbump/openai-real-time-api-example-corbinbrown
