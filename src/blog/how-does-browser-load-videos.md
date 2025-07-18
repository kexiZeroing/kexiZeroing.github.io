---
title: "How does browser load videos"
description: ""
added: "July 27 2023"
tags: [web]
updatedDate: "July 18 2025"
---

## Range requests
HTTP range request asks the server to send parts of a resource back to a client. Range requests are useful for various clients, including media players that support random access, data tools that require only part of a large file, and download managers that let users pause and resume a download.

The HTTP 206 Partial Content may be sent from the server when the client has asked for a range (e.g. "give me the first 2MB of video data"). It is vital for downloading data in chunks which avoids fetching unused resources. Look at the outgoing request for a `Range` header (e.g., `Range: bytes=200-1000`).

The Range HTTP request header indicates the part of a document that the server should return. If the server sends back ranges, it uses the 206 Partial Content for the response. If the ranges are invalid, the server returns the 416 Range Not Satisfiable error. The server can also ignore the Range header and return the whole document with a 200 status code if it does not support range requests.

Besides HTTP 206 status code, the server should respond with a `Content-Range` header, specifying the start byte, end byte and total size of the resource. `Content-Length` should be set to the length of the returned range, not the total size of the resource. Note that the server is allowed to change the range that was requested and even ignore the fact that it was a range request.

## How videos load in browsers
By default when using video html tag, the `Range` header with value `bytes=0-` is sent. The client can know whether HTTP partial content is available by checking if the HTTP response header `Accept-Ranges: bytes` is included.

If you load an video, the metadata allows the browser to map a time code to a byte offset in the file. It assumes to look up the start and the footer data. (If the metadata is placed at the end of the file, it then sends another range request for the footer of the file.) Now that the browser knows the duration and other important data about the video, it can show the player controls and make a new request to buffer up the video data. *It’s worth noting that MP4 can actually have the necessary metadata at the start, which will save you a round trip and will make your MP4 play earlier.*

Look at this process in detail:

```
1. Initial Request (Range Support Detection)

Chrome                                            Server
+------------------------+    ------------>       +-------------------------------------+           
| GET /a.mp4 HTTP/1.1    |                        | HTTP/1.1 200 OK                     |
| Host: example.com      |                        | Accept-Ranges: bytes                |
+------------------------+                        | Content-Length: 828908177           |
                                                  | ...                                 |
                                                  | (body: some first bytes of a.mp4)   |
                                                  +-------------------------------------+

2. Range Request for Initial Chunk

Chrome                                         Server
+------------------------+   ------------>     +-------------------------------------------+          
| GET /a.mp4 HTTP/1.1    |                     | HTTP/1.1 206 Partial Content              |
| Host: example.com      |                     | Accept-Ranges: bytes                      |
| Range: bytes=0-        |                     | Content-Range: bytes 0-1048575/828908177  |
+------------------------+                     | Content-Length: 1048575                   |
                                               | ...                                       |
                                               | (body: first ~1MB of video data)          |
                                               +-------------------------------------------+
```

**Note that the data being sent from the server is only a small chunk, even though the `Range` header has value “bytes=0-”.** Chrome and FireFox ask for ranges like `bytes=300-`, can server side return a smaller-range part, other than part from offset 300 to end of file? The answer is yes. When you play the video, browser will send range request for remaining bytes. Both Chrome and FireFox send range request using byte range (i.e `bytes=1867776-`) with last-byte-pos value absent.

If you skip ahead in the video, the browser will cancel the currently on-going response for the video content. It will then use the the video file’s metadata to map your desired new position to a byte offset and use it for a new range request (`byte=offset-`).

Browsers will automatically pause playback if decoding fails. If `video.error.code === 3`, it typically means a media decode failure, often related to corrupted video or unsupported codecs.

```js
const video = document.querySelector('video');
video.addEventListener('error', () => {
  console.error('Playback error:', video.error);
});
```

## MP4 and WebM
MP4 and WebM formats are what we would call pseudo-streaming or "progressive download”. These formats do not support **adaptive bitrate streaming** (adjusts video quality based on network conditions). If you have ever taken an HTML video element and added a "src” attribute that points to an mp4, most players will progressively download the file. The good thing about progressive downloads is that you don’t have to wait for the player to download the entire file before you start watching. You can click play and start watching while the file is being downloaded in the background. Most players will also allow you to drag the playhead to specific places in the video timeline and the player will use byte-range requests to estimate which part of the file you are attempting to seek.

## HLS and M3U8
HTTP Live Streaming sends audio and video as a series of small files, called media segment files. An index file, or playlist, provides an ordered list of the URLs of the media segment files. Index files for HTTP Live Streaming are saved as M3U8 playlists, an extension of the M3U format used for MP3 playlists.

<img alt="m3u8 compatibility" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/51ec8e88-554e-4272-b3de-df878d9dede4.png" width="750">

1. HLS (Protocol) defines how video is segmented and delivered over HTTP. (Use m3u8 manifest files to tell players where to find segments)
2. Safari natively supports native HLS, but Chrome and Firefox do not. By native in this context, it means you can set `<video src="something.m3u8">` and the browser handles everything internally, no extra JavaScript or MSE is needed.
3. To allow you play m3u8 files in browsers without native HLS support, here [hls.js](https://github.com/video-dev/hls.js) steps in. It uses MSE to feed these media chunks into the video element.

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>
<script>
  // return false on Safari (MSE may not be used)
  if (Hls.isSupported()) {
    const video = document.getElementById('video');
    const hls = new Hls();

    hls.loadSource('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      video.play();
    });
  }
  // this is the MIME type for HLS m3u8 playlists
  else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    video.addEventListener('loadedmetadata', function () {
      video.play();
    });
  }
</script>
```

### Blob url video streaming

<img alt="blob-url-video" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/12643918-81ad-47c1-8ea2-45205d1f23a9.png" width="500">

All those websites actually still use the video tag. But instead of simply setting a video file in the `src` attribute, they make use of much more powerful web APIs, the Media Source Extensions (more often shortened to just “MSE”). Complex web-compatible video players are all based on MediaSource and [SourceBuffer](https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer).

Those “extensions” add the MediaSource object to JavaScript. As its name suggests, this will be the source of the video, or put more simply, this is the object representing our video’s data. The `URL.createObjectURL` API allows creating an URL, which will actually refer not to a resource available online, but directly to a JavaScript object created on the client.

> MSE lets JavaScript feed video/audio data to the browser’s `<video>` element. It gives developers low-level control to dynamically construct streams in JavaScript, append media chunks using, and switch quality levels manually if needed.

```js
// Create a MediaSource and attach it to the video
const videoTag = document.getElementById("my-video");
const myMediaSource = new MediaSource();
const url = URL.createObjectURL(myMediaSource);
videoTag.src = url;

// 1. add source buffers
const audioSourceBuffer = myMediaSource
  .addSourceBuffer('audio/mp4; codecs="mp4a.40.2"');
const videoSourceBuffer = myMediaSource
  .addSourceBuffer('video/mp4; codecs="avc1.64001e"');

// 2. download and add our audio/video to the SourceBuffers
// fragmented mp4 (the advantage of fragmented MP4 is its ability to support DASH)
fetch("http://server.com/audio.mp4").then(function(response) {
  return response.arrayBuffer();
}).then(function(audioData) {
  audioSourceBuffer.appendBuffer(audioData);
});

// the same for the video SourceBuffer
fetch("http://server.com/video.mp4").then(function(response) {
  return response.arrayBuffer();
}).then(function(videoData) {
  videoSourceBuffer.appendBuffer(videoData);
});
```

What actually happens in the more advanced video players, is that video and audio data are split into multiple “segments”. These segments can come in various sizes, but they often represent between 2 to 10 seconds of content. Instead of pushing the whole content at once, we can just push progressively multiple segments. Now we do not have to wait for the whole audio or video content to be downloaded to begin playback.

```js
// fetch a video or an audio segment, and returns it as an ArrayBuffer
function fetchSegment(url) {
  return fetch(url).then(function(response) {
    return response.arrayBuffer();
  });
}

// fetching audio segments one after another
fetchSegment("http://server.com/audio/segment0.mp4")
  .then(function(audioSegment0) {
    audioSourceBuffer.appendBuffer(audioSegment0);
  })

  .then(function() {
    return fetchSegment("http://server.com/audio/segment1.mp4");
  })
  .then(function(audioSegment1) {
    audioSourceBuffer.appendBuffer(audioSegment1);
  })

  .then(function() {
    return fetchSegment("http://server.com/audio/segment2.mp4");
  })
  .then(function(audioSegment2) {
    audioSourceBuffer.appendBuffer(audioSegment2);
  })

// same thing for video segments
fetchSegment("http://server.com/video/segment0.mp4")
  .then(function(videoSegment0) {
    videoSourceBuffer.appendBuffer(videoSegment0);
  });
```

Many video players have an “auto quality” feature, where the quality is automatically chosen depending on the user’s network and processing capabilities. This behavior is also enabled thanks to the concept of media segments. On the server-side, the segments are actually encoded in multiple qualities, and a web player will then automatically choose the right segments to download as the network or CPU conditions change.

The most common transport protocols used in a web context: 
- HLS (HTTP Live Streaming): Created by Apple. The HLS manifest is called the playlist and is in the m3u8 format *(which are m3u playlist files, encoded in UTF-8)*.
- DASH (Dynamic Adaptive Streaming over HTTP): Used by YouTube, Netflix or Amazon Prime Video and many others. DASH manifest is called the Media Presentation Description (`.mpd` file).

For both HLS and DASH, players are able to dynamically switch between different renditions in real-time on a segment-by-segment basis. They mainly differ in manifest format and segment structure.

### HLS video streaming example
The `.m3u8` file tells the player which segments exist, what their durations are, where to fetch them and other information.

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:4.000000,
0000.ts
#EXTINF:4.000000,
0001.ts
#EXTINF:4.000000,
0002.ts
```

The TARGETDURATION says that each segment should be 4 seconds, and the PLAYLIST-TYPE indicates VOD, meaning video on demand. Each segment is listed with the EXTINF 4.0000, indicating the length of the segment, followed by the filename.

In reality, it is rare to just have one video stream inside your HLS video. You often have many different versions of the same video (360p, 480p, 720p, 1080p...). Each of these formats will have a manifest file as above. But how do you differentiate between each version of the video?

```
#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=880000,RESOLUTION=202x360,CODECS="avc1.66.30,mp4a.40.2"
360/manifest.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1540000,RESOLUTION=270x480,CODECS="avc1.66.30,mp4a.40.2"
480/manifest.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2860000,RESOLUTION=404x720,CODECS="avc1.66.30,mp4a.40.2"
720/manifest.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=4840000,RESOLUTION=608x1080,CODECS="avc1.66.30,mp4a.40.2"
1080/manifest.m3u8
```

The first file of the video delivered to the video player is the master manifest. It is the "menu" that lists all of the streams available to consume. Each version of stream gets its own entry, and they are typically ordered from lowest quality to highest.

HLS also supports fragmented MP4 files. It still requires `.m3u8` manifest files.

```
./audio/
  ├── ./128kbps/
  |     ├── segment0.mp4
  |     ├── segment1.mp4
  |     └── segment2.mp4
  └── ./320kbps/
        ├── segment0.mp4
        ├── segment1.mp4
        └── segment2.mp4

./video/
  ├── ./240p/
  |     ├── segment0.mp4
  |     ├── segment1.mp4
  |     └── segment2.mp4
  └── ./720p/
        ├── segment0.mp4
        ├── segment1.mp4
        └── segment2.mp4

GET /video/720p/init.mp4
GET /video/720p/segment0.mp4
GET /video/720p/segment1.mp4
GET /video/720p/segment2.mp4
```

> A regular MP4 video usually has a single *moov* chunk describing the video and a single *mdat* chunk containing the video. You wouldn’t be able to play a part of the video without having access to the whole video. Fragmented MP4 solves this issue, allowing us to split an MP4 video into segments. The first initialization segment contains the chunk describing the video. What follows are the media segments, each having a separate chunks containing a portion of the video which can be played on its own.

## Video Glossary
**[FFMPEG](https://ffmpeg.org)** stands for Fast Forward Moving Picture Experts Group. It is a free and open source software project that offers many tools for video and audio processing. It's designed to run on a command line interface, and has many different libraries and programs to manipulate and handle video files. Most video programs include FFMPEG as a part of the video processing pipeline. *(FFmpeg powers all online video - Youtube, Facebook, Instagram, Disney+, Netflix etc, all run FFmpeg underneath.)*

WebAssembly enables developers to bring new performant functionality to the web from other languages. [FFmpeg.wasm](https://ffmpegwasm.netlify.app) (WebAssembly / JavaScript port of FFmpeg) is one of a showcasing of the [new functionality](https://web.dev/wasm-libraries/) being made available thanks to WebAssembly. It enables video/audio record, convert and stream right inside browsers. There are two components inside `ffmpeg.wasm`: `@ffmpeg/ffmpeg` and `@ffmpeg/core`. `@ffmpeg/ffmpeg` contains kind of a wrapper to handle the complexity of loading core and calling low-level APIs. `@ffmpeg/core` contains WebAssembly code which is transpiled from original FFmpeg C code with minor modifications.

```js
// AVI to MP4 Demo
import { writeFile } from 'fs/promises';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  ffmpeg.FS('writeFile', 'test.avi', await fetchFile('./test.avi'));
  await ffmpeg.run('-i', 'test.avi', 'test.mp4');
  await fs.promises.writeFile('./test.mp4', ffmpeg.FS('readFile', 'test.mp4'));
  process.exit(0);
})();
```

A **[codec](https://api.video/what-is/codec)** is a hardware or software tool that is used to compress (and decompress) video files. Codec is a blend of coder/decoder. Common video codecs include h.264, h.265, VP8, VP9 and AV1. An efficient codec can deliver high-quality video at lower bitrates.

The **bitrate** of a file is measured by the number of bits being transmitted over a period of time. For video it is typically measured in kilobytes per second (kbps) or megabytes per second (mbps). Video bitrate is often confused with video resolution terms like 720p, 1080p, 4K, etc. Video resolution is the number of pixels that make up an image on your screen; video bitrate is the amount of information per second in video. A higher bitrate results in better quality but also larger file sizes. 

> You can estimate file size from bitrate: 
> File Size (MB) = (Bitrate in Mbps × Duration in seconds) ÷ 8  
> For example, a 10-minute 1080p video at 5 Mbps → 5 × 10 × 7.5 = 375 MB

**VOD(Video on Demand)** refers to prerecorded videos that viewers can watch anytime they choose, unlike live streams which must be watched in real time. Platforms like YouTube, Netflix, and Amazon Prime Video all offer VOD services, allowing users to play, pause, rewind, and rewatch content freely. VOD can be accessed in two main ways: by streaming the video over the internet (usually using formats like M3U8) or by downloading the full video file to a device (commonly as MP4). Since most VOD content is delivered online, a stable internet connection with good bandwidth is important for smooth playback.

**RTMP** stands for Real-Time Messaging Protocol and it's been used for streaming video and audio on the internet for many years owned by Adobe. The RTMP streaming protocol is TCP-based and designed to maintain constant, low-latency connections between a video player and server. The design allows RTMP to provide smooth and reliable streaming for viewers. To send your broadcast to a destination using RTMP, you need the RTMP Server URL as a unique web address that carries your live video stream every time you broadcast, and a Stream Key which is the private code that will allow your RTMP feed to connect to the exact location that you are streaming to.
