---
title: "Add watermark to images"
description: ""
added: "Dec 1 2022"
tags: [code]
updatedDate: "July 21 2024"
---

Image watermarking is the process of placing an overlay text on top of the original image, usually in one of the corners. The first approach shown below is primarily based on the HTML5 `<canvas>` element while the second one uses [watermark.js](https://brianium.github.io/watermarkjs) library, which requires just a few lines of code.

## Use HTML Canvas 
Below is a simple example to show that how it works, and there is also a real world example of [image-watermark-tool](https://github.com/unilei/image-watermark-tool) you can check out.

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
      const file = e.target.files[0];
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
      const metrics = context.measureText(watermarkText);
      context.fillText(watermarkText, canvasWidth - metrics.width - 20, canvasHeight - 20);

      return canvas.toDataURL();
    }
  </script>
</body>
```

The `HTMLCanvasElement.toDataURL()` method returns a data URL containing a representation of the image. The desired file format *(`image/png`, `image/jpeg` or `image/webp`)* and image quality *(a number between 0 and 1 indicating the image quality)* may be specified. If the file format is not specified, then the data will be exported as `image/png`.

> Data URLs, URLs prefixed with the `data:` scheme, allow content creators to embed small files inline in documents. They are composed of four parts: a prefix (`data:`), a MIME type, an optional base64 token if non-textual, and the data itself: `data:[<mediatype>][;base64],<data>`
> 
> `toDataURL()` encodes the whole image in an in-memory string. For larger images, this can have performance implications, and may even overflow browsers' URL length limit when assigned to `HTMLImageElement.src`. You should generally prefer `HTMLCanvasElement.toBlob()` instead, in combination with `URL.createObjectURL()`.

Additionally, we want to convert the `dataURL` we receive from the drawing canvas to a `Blob`, then the `Blob` to a `File` with the file name and type specified.

```js
async function save(dataURL: string) {
  const blob = await fetch(dataURL).then(res => res.blob())
  const file = new File([blob], `drawing.jpg`, { type: 'image/jpeg' })

  const form = new FormData()
  form.append('drawing', file)

  // Upload the file to the server
  await $fetch('/api/upload', {
    method: 'POST',
    body: form
  })
  .then(() => navigateTo('/'))
  .catch((err) => alert(err.data?.message || err.message))
}
```

```js
// https://advanced-cropper.github.io/vue-advanced-cropper/
<Cropper
  class="cropper"
  :src="imageSrc"
  :stencil-props="{
    aspectRatio: 16 / 9
  }"
  ref="cropperRef"
/>

const handleCropSubmit = () => {  
  const { canvas } = cropperRef.value.getResult()
  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('file size:', blob.size / 1024 + 'KB')
        // new File(fileBits, fileName, options)
        const file = new File([blob], 'cropped-image.png', { type: 'image/png' })
        handleFileUpload(file)
      }
    }, 'image/png')
  }
};
```

## Use third-party library

```js
// Use the library `watermark.js` in the browser.
// image as watermark
watermark(['/img/shepherd.jpg', '/img/logo.png'])
  .image(watermark.image.lowerRight())
  .then(function (img) {
    document.getElementById('composite-image').appendChild(img);
  });

// text as watermark
watermark(['/img/field.jpg'])
  .image(watermark.text.lowerRight('MyPhoto', '28px serif', '#fff', 0.5))
  .then(function (img) {
    document.getElementById('text').appendChild(img);
  });
```
