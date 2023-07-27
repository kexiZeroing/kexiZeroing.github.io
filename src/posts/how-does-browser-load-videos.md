---
layout: "../layouts/BlogPost.astro"
title: "How does browser load videos"
slug: how-does-browser-load-videos
description: ""
added: "July 27 2023"
tags: [web]
---

## Basic Concept
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

## MP4 and WebM
MP4 and WebM formats are what we would call pseudo-streaming or "progressive download”. These formats do not support adaptive bitrate streaming (adjusts video quality based on network conditions). If you have ever taken an HTML video element and added a "src” attribute that points to an mp4, most players will progressively download the file. The good thing about progressive downloads is that you don’t have to wait for the player to download the entire file before you start watching. You can click play and start watching while the file is being downloaded in the background. Most players will also allow you to drag the playhead to specific places in the video timeline and the player will use byte-range requests to estimate which part of the file you are attempting to seek. What makes MP4 and WebM playback problematic is the lack of adaptive bitrate support. Every user who watches your content must have enough bandwidth available to download the file faster than it can playback the file.

M3U8 files are the current industry standard for transferring video over HTTP Live Streaming (HLS). They are usually text files that contain links to the actual data files.

<img alt="m3u8 compatibility" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/51ec8e88-554e-4272-b3de-df878d9dede4.png" width="750">

## References
- https://www.zeng.dev/post/2023-http-range-and-play-mp4-in-browser
- https://surma.dev/things/range-requests
- https://medium.com/@radhian.amri/video-streaming-using-http-206-partial-content-in-go-4e89d96abdd0
- https://howvideo.works
