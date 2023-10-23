---
layout: "../layouts/BlogPost.astro"
title: "How does browser load videos"
slug: how-does-browser-load-videos
description: ""
added: "July 27 2023"
tags: [web]
updatedDate: "July 30 2023"
---

## Basic concepts
HTTP range request is a widely used feature when it comes to file resource. File systems such as S3 have good support for this.

The HTTP 206 Partial Content may be sent from the server when the client has asked for a range (e.g. "give me the first 2MB of video data"). It is vital for downloading data in chunks which avoids fetching unused resources. Look at the outgoing request for a `Range` header (e.g., `Range: bytes=200-1000`).

The Range HTTP request header indicates the part of a document that the server should return. If the server sends back ranges, it uses the 206 Partial Content for the response. If the ranges are invalid, the server returns the 416 Range Not Satisfiable error. The server can also ignore the Range header and return the whole document with a 200 status code if it does not support range requests.

Besides HTTP 206 status code, the server should respond with a `Content-Range` header, specifying the start byte, end byte and total size of the resource. `Content-Length` should be set to the length of the returned range, not the total size of the resource. Note that the server is allowed to change the range that was requested and even ignore the fact that it was a range request.

## How videos load in browsers
By default when using video html tag, the `Range` header with value `bytes=0-` is sent. The client can know whether HTTP partial content is available by checking if the HTTP response header `Accept-Ranges: bytes` is included.

If you load an video, the metadata allows the browser to map a time code to a byte offset in the file. I assume to look up the start and size of the footer data. (If the metadata is placed at the end of the file, it then sends another range request for the footer of the file.) Now that the browser knows the dimension, duration and other important data about the video, it can show the player controls and make a new request to buffer up the video data. *It’s worth noting that MP4 can actually have the necessary metadata at the start, which will save you a round trip and will make your MP4 play earlier.*

Look at this process in detail:

```
1. send request, read the onflight response header, close connection when range support detected

Chrome                                            Server
+------------------------+    ------------>       +-------------------------------------+           
| GET /a.mp4 HTTP/1.1    |   close conn when      | HTTP/1.1 200 OK                     |
| Host: example.com      |    <----x-------       | Accept-Ranges: bytes                |
+------------------------+ range support detected | Content-Length: 828908177           |
                                                  | ...                                 |
                                                  | (body: some first bytes of a.mp4)   |
                                                  +-------------------------------------+

2. send trivial range request, fetch head parts, verify server's support

Chrome                                         Server
+------------------------+   ------------>     +---------------------------------------------+           
| GET /a.mp4 HTTP/1.1    |  close conn when    | HTTP/1.1 206 Partial Content                |
| Host: example.com      |   <----x-------     | Accept-Ranges: bytes                        |
| Range: [bytes=0-]      |   verify success    | Content-Range: bytes 0-828908176/828908177  |
+------------------------+                     | Content-Length: 828908177                   |
                                               | ...                                         |
                                               | (body: some first bytes of a.mp4)           |
                                               +---------------------------------------------+
```

**Note that the data being sent from the server is only a small chunk, even though the `Range` header has value “bytes=0-”.** Chrome and FireFox ask for ranges like `bytes=300-`, can server side return a smaller-range part, other than part from offset 300 to end of file? The answer is yes. When you play the video, browser will send range request for remaining bytes. Both Chrome and FireFox send range request using byte range (i.e `bytes=1867776-`) with last-byte-pos value absent. (The server sends TCP Keep-Alive to keep this TCP connection connected.)

If you skip ahead in the video, the browser will cancel the currently on-going response for the video content. It will then use the the video file’s metadata to map your desired new position to a byte offset and use it for a new range request (`byte=offset-`). When the buffer is full and the browser stops the server from sending more data, the request is technically still on-going, just no data is being sent.

> Some notes about compatibility issues especially on iOS:
> 1. A `<video>` element can use the `play()` method to automatically play without user gestures only when it contains no audio tracks or has its muted property set to true.
> 2. `canplay` and `canplaythrough` do not work in iOS.
> 3. The `play` event is fired when the `paused` property is changed from `true` to `false`, as a result of the `play` method, but that's no guarantee that the video will actually start playing. The `play` method returns a Promise which is resolved when playback has been successfully started.
> 4. HTTP servers hosting media files for iOS must support byte-range requests, which iOS uses to perform random access in media playback. The Safari browser is only asking for the first 2 bytes to be returned from the server initially: `Range: bytes=0-1`.

## MP4 and WebM
MP4 and WebM formats are what we would call pseudo-streaming or "progressive download”. These formats do not support adaptive bitrate streaming (adjusts video quality based on network conditions). If you have ever taken an HTML video element and added a "src” attribute that points to an mp4, most players will progressively download the file. The good thing about progressive downloads is that you don’t have to wait for the player to download the entire file before you start watching. You can click play and start watching while the file is being downloaded in the background. Most players will also allow you to drag the playhead to specific places in the video timeline and the player will use byte-range requests to estimate which part of the file you are attempting to seek. What makes MP4 and WebM playback problematic is the lack of adaptive bitrate support. Every user who watches your content must have enough bandwidth available to download the file faster than it can playback the file.

## M3U8
HTTP Live Streaming sends audio and video as a series of small files, called media segment files. An index file, or playlist, provides an ordered list of the URLs of the media segment files. Index files for HTTP Live Streaming are saved as M3U8 playlists, an extension of the M3U format used for MP3 playlists.

<img alt="m3u8 compatibility" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/51ec8e88-554e-4272-b3de-df878d9dede4.png" width="750">

1. Currently Desktop Safari supports native HLS but Desktop Chrome and Firefox do not. By native in this context, it means the browser can recognise the streaming format or file type when it is included as the source attribute within the HTML5 tag and play it without any further plugins.
2. To allow you play the file back on Chrome, take a look on [hls.js](https://github.com/video-dev/hls.js) project, which solves exactly this problem. It relies on HTML5 video and MediaSource Extensions for playback.

```js
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>
<script>
  if(Hls.isSupported()) {
    var video = document.getElementById('video');
    var hls = new Hls();
    hls.loadSource('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED,function() {
      video.play();
  });
}
</script>
```

## Blob url video streaming

<img alt="blob-url-video" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/12643918-81ad-47c1-8ea2-45205d1f23a9.png" width="500">

All those websites actually still use the video tag. But instead of simply setting a video file in the src attribute, they make use of much more powerful web APIs, the Media Source Extensions (more often shortened to just “MSE”). Complex web-compatible video players are all based on MediaSource and [SourceBuffer](https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer).

Those “extensions” add the MediaSource object to JavaScript. As its name suggests, this will be the source of the video, or put more simply, this is the object representing our video’s data. The `URL.createObjectURL` API allows creating an URL, which will actually refer not to a resource available online, but directly to a JavaScript object created on the client.

> Blob URLs can only be generated internally by the browser. `URL.createObjectURL()` will create a special reference to the Blob object which later can be released using `URL.revokeObjectURL()`. These URLs can only be used locally in the single instance of the browser and in the same session. 

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

> The most common transport protocols used in a web context: 
> - HLS (HTTP Live Streaming): Developed by Apple and used by Twitch. The HLS manifest is called the playlist and is in the m3u8 format *(which are m3u playlist files, encoded in UTF-8)*.
> - DASH (Dynamic Adaptive Streaming over HTTP): Used by YouTube, Netflix or Amazon Prime Video and many others. DASH manifest is called the Media Presentation Description (or MPD).

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
```

## Open-source web video players
- https://github.com/canalplus/rx-player
- https://github.com/video-dev/hls.js
- https://github.com/Dash-Industry-Forum/dash.js
- https://github.com/shaka-project/shaka-player
- https://github.com/bytedance/xgplayer
- https://github.com/DIYgod/DPlayer

## References
- https://www.zeng.dev/post/2023-http-range-and-play-mp4-in-browser
- https://surma.dev/things/range-requests
- https://medium.com/@radhian.amri/video-streaming-using-http-206-partial-content-in-go-4e89d96abdd0
- https://howvideo.works
- https://juejin.cn/post/6844903880774385671
