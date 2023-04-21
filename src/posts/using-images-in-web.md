---
layout: "../layouts/BlogPost.astro"
title: "Using images in web"
slug: using-images-in-web
description: ""
added: "Oct 12 2021"
tags: [web]
updatedDate: "Jan 23 2023"
---

## Image file types
First, there are two types of compression: Lossless and Lossy.
- **Lossless** means that the image is made smaller, but at no detriment to the quality. You can save the image over and over and never lose any data. All the original data can be recovered when the file is uncompressed.
- **Lossy** means the image is made even smaller, but at a detriment to the quality. If you saved an image in a Lossy format over and over, the image quality would get progressively worse and worse.

There are also different color depths: Indexed color and Direct color.
- **Indexed** means that the image can only store a limited number of colors (usually 256).
- **Direct** means that you can store millions of colors. The term "true color" is sometimes used to mean direct color. It is also often used to refer to all color depths greater or equal to 24.
  
Then, there are differences between bitmap and vector images.
- **Bitmap (or raster)** images are stored as a series of pixels. Each pixel is actually a very small square that is assigned a color, and then arranged in a pattern to form the image. When you zoom in on a bitmap image you can see the individual pixels that make up that image.
- **Vector** images are not based on pixel, but instead use mathematical formulas to draw lines and curves that can be combined to create an image. When a vector image is scaled up, the image is re-drawn using the mathematical formula, so the resulting image is just as smooth as the original.

### BMP
BMP is an old format. It is lossless but there's also little to no compression at all, meaning saving as BMP results in very large file sizes. It could be both indexed and direct, but the file sizes are so unnecessarily large that nobody ever really uses this format.

### GIF
GIF uses lossless compression. The file sizes are much smaller than BMP, because good compression is actually used, but it can only store an indexed color depths. This means that for most use cases, there can only be a maximum of 256 different colors in the file. GIF images can also be animated and have transparency.

### JPEG
JPEG images were designed to make detailed photographic images as small as possible by removing information that the human eye won't notice. As a result it's a lossy format. It stores direct color depth and so is great for photographs, but the lossy compression means it's bad for logos and line drawings: Not only will they look fuzzy, but such images will also have a larger file-size compared to GIFs.

### PNG-8 
PNG-8 (the indexed version of PNG) is really a good replacement for GIFs. It is also lossless. However, it cannot support animation like GIFs, and it has some support issues with very old browsers. The main thing that PNG-8 does better than GIFs is having support for alpha-transparency.

### PNG-24
PNG-24 is a great format that combines lossless encoding with direct color. Unfortunately PNG-24 files will still be bigger than JPEGs (for photos), and GIFs/PNG-8s (for logos and graphics). They are not intended to replace JPEG images. A photograph saved as a PNG-24 will likely be at least 5 times larger than a equivalent JPEG image, with very little improvement in visible quality. Just like PNG-8, PNG-24 supports alpha-transparency too.

### SVG
SVG is different than all the above in that it's a vector file format (the above are all raster). This means SVG is perfect for logos and icons you wish to retain sharpness on Retina screens or at different sizes. It also means a small SVG logo can be used at a much larger size without degradation in image quality. SVG file sizes are often tiny, even if they're visually very large, which is great. However, it does depend on the complexity of the shapes used, and SVGs require more computing power than raster images because mathematical calculations are involved in drawing the curves and lines.

### Webp
WebP is an image format developed and first released by Google in 2010. It supports encoding images in both lossless and lossy formats, making it a great alternative format to both PNG or JPEG. WebP lossless images are 26% smaller in size compared to PNGs. WebP lossy images are 25-34% smaller than comparable JPEG images. It also supports transparency and animation.

WebP is natively supported in Google Chrome, Firefox, Edge, the Opera browser, and by many other tools and software libraries. (Safari will support WebP in version 14 for macOS Big Sur, iPadOS 14, iOS 14, which is expected to be released in 2020).

> We can use `<picture>` element to rescue. IE doesn't support `<picture>`, but this still works as intended. This is because when the browser finds an element it doesn't understand, it treats it as a `<div>`. So what we get are a bunch of `<div>` and an `<img>` tag.

To check if it's actually working, the best trick is to right-click and "Save as…". On Chrome, you should get a "Google WebP" file format, whereas on Safari or IE you should get a "JPEG". Google has created a suite of tools to help us work with WebP files. One of those tools is **cwebp**, which lets us convert other image formats to WebP.

### AVIF
WebP is on the verge of replacing JPEG and PNG as the best image to use on the web thanks to Safari 14 finally supporting it. However, an even better image format, AVIF, is already looking to replace it.

AVIF outperformed both JPEG and WebP. Companies like Netflix and Facebook want AVIF to become an image format standard on the web. They provided numerous visual examples that showed how AVIF was a preferred image format compared to JPEG. It’s currently only supported by Chrome. Hopefully AVIF won’t take ten years to get adopted by all major browsers like it did for WebP. Regardless, webmasters can use the AVIF image format now by using the same `srcset` attribute used for WebP.

## Responsive images
This is where the `img` tag's `sizes` and `srcset` attributes come to into play. The TL;DR of these attributes is that it allows you to tell the browser different versions of your image for different screen widths and what size the image should be for a given set of media queries.

```html
<!-- Different sizes -->
<img srcset="elva-fairy-480w.jpg 480w,
             elva-fairy-800w.jpg 800w"
     sizes="(max-width: 600px) 480px,
            800px"
     src="elva-fairy-800w.jpg"
     alt="Elva dressed as a fairy">

<!-- Same size, different resolutions -->
<img srcset="elva-fairy-320w.jpg,
             elva-fairy-480w.jpg 1.5x,
             elva-fairy-640w.jpg 2x"
     src="elva-fairy-640w.jpg"
     alt="Elva dressed as a fairy">

<!-- Use modern image formats boldly -->
<picture>
  <source srcset="photo.avif" type="image/avif">
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg" alt="Description" width="360" height="240">
</picture>

<!-- Only play the GIF if the user doesn't have reduced motion turned on -->
<picture>
  <source srcset="underconstruction.gif" media="(prefers-reduced-motion: no-preference)">
  <img src="underconstruction.png" alt="Under construction" />
</picture>
```

**`srcset`** defines the set of images we will allow the browser to choose between. We write an image filename, a space, and the image's intrinsic width in pixels (`480w`) — note that this uses the `w` unit not `px`.

The browser will look at its device width and work out which media condition in the `sizes` list is the first one to be true (`sizes` is not needed for different resolutions). Then look at the slot size given to that media query, and load the image referenced in the `srcset` list that has the same size as the slot or, if there isn't one, the first image that is bigger than the chosen slot size. The last slot width has no media condition which is the default when none of the media conditions are true.

`<picture>` allows browsers to skip images they do not recognize, you can include images in your order of preference. **The browser selects the first one it supports**. The features — `srcset/sizes/<picture>` — are all supported in modern desktop and mobile browsers (including Microsoft's Edge browser, although not Internet Explorer.)

Read more about best practices for web images:
- https://github.com/nucliweb/image-element
- https://ausi.github.io/respimagelint/docs.html
- https://web.dev/browser-level-image-lazy-loading

## Vue lazy-load images
Lazy-load images and videos. It makes sense to only load the resources that your users need at that moment. Postpone loading images and videos that are off-screen at first, and lazy load them later.
- [Vue-Lazyload](https://github.com/hilongjw/vue-lazyload)
- [v-lazy-image](https://github.com/alexjoverm/v-lazy-image)
- [vue-content-loader](https://github.com/egoist/vue-content-loader)

## Compress images

**HTMLCanvasElement `toBlob` method**  
```js
/**
 * 压缩图片
 * @param img 被压缩的img对象
 * @param type 压缩后转换的文件类型
 * @param mx 触发压缩的图片最大宽度限制
 * @param mh 触发压缩的图片最大高度限制
 * @param quality 图片质量
 */
 function compressImg(img, type, mx, mh, quality = 1) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const { width: originWidth, height: originHeight } = img
    // 最大尺寸限制
    const maxWidth = mx
    const maxHeight = mh
    // 目标尺寸
    let targetWidth = originWidth
    let targetHeight = originHeight
    if (originWidth > maxWidth || originHeight > maxHeight) {
      if (originWidth / originHeight > 1) {
        // 宽图片
        targetWidth = maxWidth
        targetHeight = Math.round(maxWidth * (originHeight / originWidth))
      } else {
        // 高图片
        targetHeight = maxHeight
        targetWidth = Math.round(maxHeight * (originWidth / originHeight))
      }
    }
    canvas.width = targetWidth
    canvas.height = targetHeight
    context?.clearRect(0, 0, targetWidth, targetHeight)

    context?.drawImage(img, 0, 0, targetWidth, targetHeight)
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
    canvas.toBlob(function(blob) {
      resolve(blob)
    }, type || 'image/png', quality) 
  })
}
```

**Automate compression workflow**  
The [Tinify API](https://tinypng.com/developers/reference/nodejs) allows you to compress and optimize WebP, JPEG and PNG images. It is designed as a REST service.
