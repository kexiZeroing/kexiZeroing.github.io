
const fs = require('fs');
const path = require('path');

const url = require('url');
const https = require('https');
const Buffer = require('buffer').Buffer;

const sizeOf = require('image-size');

const srcPath = path.join(__dirname, "../src/posts");
const allImageUrls = [];
let resHtml = '';

function throughDirectory (dir) {
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    if (fs.statSync(absPath).isDirectory()) {
      return throughDirectory(absPath);
    } else {
      findImages(absPath);
    }
  });
}

throughDirectory(srcPath);
allImageUrls.forEach(getImageSize);

function findImages(file) {
  if(!file.endsWith('.md')) return;

  const data = fs.readFileSync(file, 'utf8');
  const images = data.match(/https:\/\/.*(blog-images\/main).*\.(jpg|png)/gi);
  if (images) {
    allImageUrls.push(...images);
  }
}

let count = 0;
function getImageSize(imgUrl) {
  const options = url.parse(imgUrl)
  
  https.get(options, function (response) {
    const chunks = []
    response.on('data', function (chunk) {
      chunks.push(chunk)
    }).on('end', function() {
      const buffer = Buffer.concat(chunks)
      // { height: 152, width: 506, type: 'jpg' }
      const { height, width } = sizeOf(buffer)

      resHtml += `
        <a
          href="${imgUrl}"
          data-pswp-width="${width}"
          data-pswp-height="${height}"
          target="_blank"
        >
          <img
            src="${imgUrl}"
            alt=""
          />
        </a>`;

        count++;
        console.log(count)
        if (count === allImageUrls.length) {
          console.log(resHtml);
        }
    })
  })
}
