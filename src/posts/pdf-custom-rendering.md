---
layout: "../layouts/BlogPost.astro"
title: "PDF custom rendering"
slug: pdf-custom-rendering
description: ""
added: "Nov 6 2022"
tags: [code]
updatedDate: "Jun 30 2023"
---

When it comes to the Web, almost every modern browser supports viewing of PDF documents natively *(the simplest way to embed a PDF into a web page is to use the `<object type="application/pdf">` tag.)* But that native component is outside of the developer’s control. You can't disable the Print button, or display only few pages while others require paid membership.

[PDF.js](https://github.com/mozilla/pdf.js), created by Mozilla Labs, which can render PDF documents in your browser. Most importantly, you as a developer have full control over rendering the PDF document’s pages as per your requirements. But integrating it isn’t as straightforward as it might seem. There is little documentation available on how to integrate certain features like rendering text-layers or annotations, and supporting password protected files.

`pdf.js` and `pdf.worker.js` are two main files required by PDF.js, which contain methods to fetch, parse and render a PDF document. `pdf.js` is the main library, which essentially has methods to fetch a PDF document from some URL. PDF.js relies heavily on Web Workers to provide a performance boost by moving CPU-heavy operations, like parsing and rendering, off of the main thread.

- PDF.js automatically detects whether your browser supports Web Workers, and if it does, it will attempt to load `pdf.worker.js` from the same location as `pdf.js`. If the file is in another location, you can configure it using `workerSrc` property right after including the main library.
- The API of PDF.js is quite elegant and easy to use and is heavily based on Promises.
- Getting started with PDF.js: https://mozilla.github.io/pdf.js/getting_started

## Prebuilt overview

```
├── build/
│   ├── pdf.js                             - display layer
│   ├── pdf.js.map                         - display layer's source map
│   ├── pdf.worker.js                      - core layer
│   └── pdf.worker.js.map                  - core layer's source map
├── web/
│   ├── cmaps/                             - character maps (required by core)
│   ├── compressed.tracemonkey-pldi-09.pdf - PDF file for testing purposes
│   ├── debugger.js                        - helpful debugging features
│   ├── images/                            - images for the viewer and annotation icons
│   ├── locale/                            - translation files
│   ├── viewer.css                         - viewer style sheet
│   ├── viewer.html                        - viewer layout
│   ├── viewer.js                          - viewer layer
│   └── viewer.js.map                      - viewer layer's source map
```

> CMaps (Character Maps) are text files that are used in PostScript and other Adobe products to map character codes to character glyphs in CID fonts. They are mostly used when dealing with East Asian writing systems. This technology is a legacy technology, so it should not be used in pdfs created by modern tools. `pdf.js` needs the CMap file when it wants to display such CID fonts.

## Basic rendering as canvas
In this demo, PDF.js-related libraries are imported from [UNPKG](https://unpkg.com/browse/pdfjs-dist@3.0.279/). You should check the version of `pdfjs-dist` you imports, since the APIs are different among various PDF.js versions.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hello world example</title>
</head>
<body>
  <style>
    canvas {
      border: 1px solid #000;
    }
  </style>
  <div id="container"></div>
  <!-- <canvas id="the-canvas"></canvas> -->

  <script src="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.js"></script>
  <script>
    const url = 'path/to/pdf';

    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js';

    // Asynchronous download PDF
    const loadingTask = pdfjsLib.getDocument(url);
    var container = document.getElementById("container");

    (async () => {
      const pdf = await loadingTask.promise;
      for (var i = 1; i <= pdf.numPages; i++) {
        // Get individual pages in a PDF document
        const page = await pdf.getPage(i);
        // The zoom-level we want PDF document’s pages to render
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const div = document.createElement("div");
        // Set id attribute with page-#{pdf_page_number} format
        div.setAttribute("id", "page-" + (page.pageIndex + 1));
        // This will keep positions of child elements as per our needs
        div.setAttribute("style", "position: relative");
        container.appendChild(div);

        // Prepare canvas using PDF page dimensions
        const canvas = document.createElement("canvas");
        div.appendChild(canvas);
        const context = canvas.getContext("2d");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Render PDF page into canvas context
        const renderContext = {
          canvasContext: context,
          viewport,
        };
        page.render(renderContext);
      }
    })();
  </script>

</body>
</html>
```

## Rendering Text-Layers
PDF.js gives you the ability to render text layers atop PDF pages that have been rendered using canvas. This time you will not only see PDF pages being rendered but you can also select and copy text from them.

According to the up-to-date [example](https://github.com/mozilla/pdf.js/blob/master/examples/components/pageviewer.html) on how to get a text layer, we need to also import `web/pdf_viewer.js` and `web/pdf_viewer.css`.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rendering Text-Layers</title>
  <link rel="stylesheet" href="https://unpkg.com/pdfjs-dist@3.0.279/web/pdf_viewer.css">
</head>
<body>
  <style>
    canvas {
      border: 1px solid #000;
    }
  </style>
  <div id="container"></div>

  <script src="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.js"></script>
  <script src="https://unpkg.com/pdfjs-dist@3.0.279/web/pdf_viewer.js"></script>
  <script>
    const url = 'path/to/pdf';
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js';

    const DEFAULT_URL = url;
    const SCALE = 1.0;
    const container = document.getElementById("container");
    const eventBus = new pdfjsViewer.EventBus();

    // Loading document
    const loadingTask = pdfjsLib.getDocument({
      url: DEFAULT_URL,
    });

    // Display pdf loading progress
    // https://github.com/mozilla/pdf.js/blob/88c7c8b5bfae61a20d7cb5fb27b3749b98a48d02/src/display/api.js#L636
    loadingTask.onProgress = (progressData) => {
      const { loaded, total } = progressData
      console.log('progress: ', loaded / total)
    };

    (async function () {
      const pdfDocument = await loadingTask.promise;

      for (var i = 1; i <= pdfDocument.numPages; i++) {
        // Document loaded, retrieving the page
        const pdfPage = await pdfDocument.getPage(i);
        
        var div = document.createElement("div");
        div.setAttribute("id", "page-" + (pdfPage._pageIndex + 1));
        div.setAttribute("style", "position: relative");
        container.appendChild(div);

        // Creating the page view with default parameters
        const pdfPageView = new pdfjsViewer.PDFPageView({
          container: div,
          id: i,
          scale: SCALE,
          defaultViewport: pdfPage.getViewport({ scale: SCALE }),
          eventBus,
          // We can enable text layers as needed
          textLayerFactory: !pdfDocument.isPureXfa
            ? new pdfjsViewer.DefaultTextLayerFactory()
            : null,
        });

        // Associate the actual page with the view and draw it
        pdfPageView.setPdfPage(pdfPage);
        pdfPageView.draw();
      }
    })();
  </script>

</body>
</html>
```

## PDF viewer
Online demo: https://mozilla.github.io/pdf.js/web/viewer.html

Get the code from https://github.com/mozilla/pdf.js/blob/master/web/viewer.html, and then you can start a local web server to run http://localhost:8888/web/viewer.html

[Options](https://github.com/mozilla/pdf.js/wiki/Viewer-options) for the PDF.js viewer that can be given at URL level:
- `https://mozilla.github.io/pdf.js/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf`
- `https://mozilla.github.io/pdf.js/web/viewer.html#page=2`
- `https://mozilla.github.io/pdf.js/web/viewer.html#zoom=200`

## Annotations to a PDF
To edit a PDF in any meaningful GUI way, you would need to unpack the PDF and render the components (images, formatted text, pages) to the display device; then allow folks to mess with the layout; then re-pack the PDF. You would have to do this perfectly in line with the PDF standards otherwise you may find the downstream consumers of your edited PDF file crash or are unable to render it. It's a very complicated subject.

If you need to annotate the PDF then things are easier. On the server, you need to generate images of the pages of the document, send those to the client, display them to the user, let the user mark them up, capture the co-ordinates of the annotations back to the server and use a server-side PDF library to render the annotations into the PDF. It is achievable, though requires various skillsets for server-side PDF to image manipulation and client side presentation and annotation capture.

> PDF.js provides only viewer. It is designed for reading PDF files, not editing them. Because of that we don't support adding any kind of annotations. However, we do support rendering annotations for viewing.
>
> 页面上展示出来的每一页 PDF 有三层：  
> canvas 预览层（原始 pdf）-> annotationLayer 批注层（使用 svg，记录坐标）-> textLayer 文字层（透明的，在最上层保证文字一直可选）

See also:
- https://github.com/instructure/pdf-annotate.js
- https://github.com/Submitty/pdf-annotate.js
- https://github.com/taoky/pdf-annotate.js
- https://github.com/agentcooper/react-pdf-highlighter
