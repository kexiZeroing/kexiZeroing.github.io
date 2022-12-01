---
layout: "../layouts/BlogPost.astro"
title: "Image add watermark"
slug: image-add-watermark
description: ""
added: "Dec 1 2022"
tags: [code]
---

Image watermarking is the process of placing an overlay text on top of the original image, usually in one of the corners. The first approach shown below is primarily based on the HTML5 `<canvas>` element while the second one uses [watermark.js](https://brianium.github.io/watermarkjs) library, which requires just a few lines of code.

```html
<body>
  <h1>Add Watermark to Image</h1>
  <p>
    Please upload a image and fill in the watermark text.
  </p>
  <input id="upload" type="file" accept="image/*" />
  <input id="text" type="text" placeholder="watermark text"/>
  <button>generate</button>

  <div id="result" style="visibility: hidden;">
    <h2>Watermaked image with text</h2>
    <img id="watermakedImageWithText" />
  </div>

  <script>
    const fileInput = document.querySelector("#upload");
    const textInput = document.querySelector("#text");
    const button = document.querySelector("button");
    const resultDiv = document.querySelector("#result");
    const originalImage = new Image();

    fileInput.addEventListener("change", async (e) => {
      const [file] = fileInput.files;
      originalImage.src = await fileToDataUri(file);
    });

    button.addEventListener("click", (e) => {
      if (!originalImage.src) return;
      const watermakedImageWithText = document.querySelector("#watermakedImageWithText");
      watermakedImageWithText.src = watermakImageWithText(originalImage, textInput.value.trim());

      resultDiv.style.visibility = "visible";
    });

    function fileToDataUri(field) {
      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
          resolve(reader.result);
        });
        // read the contents of the file
        reader.readAsDataURL(field);
      });
    }

    function watermakImageWithText(originalImage, watermarkText) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const canvasWidth = originalImage.width;
      const canvasHeight = originalImage.height;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // initializing the canvas with the original image
      context.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);

      // adding watermark text in the bottom right corner
      context.globalAlpha = 0.5;
      context.fillStyle = "blue";
      context.font = "bold 40px serif";
      // get width of text
      var metrics = context.measureText(watermarkText);
      context.fillText(watermarkText, canvasWidth - metrics.width - 20, canvasHeight - 20);

      return canvas.toDataURL();
    }
  </script>
</body>
```
