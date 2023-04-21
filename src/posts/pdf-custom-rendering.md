---
layout: "../layouts/BlogPost.astro"
title: "PDF custom rendering"
slug: pdf-custom-rendering
description: ""
added: "Nov 6 2022"
tags: [code]
updatedDate: "Nov 06 2022"
---

When it comes to the Web, almost every modern browser supports viewing of PDF documents natively. But that native component is outside of the developer’s control. You can't disable the Print button, or display only few pages while others require paid membership. 

[PDF.js](https://github.com/mozilla/pdf.js), created by Mozilla Labs, which can render PDF documents in your browser. Most importantly, you as a developer have full control over rendering the PDF document’s pages as per your requirements. But integrating it isn’t as straightforward as it might seem. There is little documentation available on how to integrate certain features like rendering text-layers or annotations, and supporting password protected files. Basic Examples are provided [here](https://mozilla.github.io/pdf.js/examples).

`pdf.js` and `pdf.worker.js` are two main files required by PDF.js, which contain methods to fetch, parse and render a PDF document. `pdf.js` is the main library, which essentially has methods to fetch a PDF document from some URL. PDF.js relies heavily on Web Workers to provide a performance boost by moving CPU-heavy operations, like parsing and rendering, off of the main thread.

- PDF.js automatically detects whether your browser supports Web Workers, and if it does, it will attempt to load `pdf.worker.js` from the same location as `pdf.js`. If the file is in another location, you can configure it using `workerSrc` property right after including the main library.
- The API of PDF.js is quite elegant and easy to use and is heavily based on Promises.

### Basic rendering as canvas
In my demo, PDF.js-related libraries are imported from [UNPKG](https://unpkg.com/browse/pdfjs-dist@3.0.279/). You should check the version of `pdfjs-dist` you imports, since the APIs are different among various PDF.js versions.

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

### Rendering Text-Layers
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
