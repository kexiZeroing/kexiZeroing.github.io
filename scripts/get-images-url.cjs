const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const Buffer = require('buffer').Buffer;
const sizeOf = require('image-size');

const srcPath = path.join(__dirname, "../src/posts");
const allImageUrls = [];
let resHtml = '<div class="pswp-gallery" id="my-gallery">';

function throughDirectory(dir) {
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
processImages();

function findImages(file) {
  if (!file.endsWith('.md')) return;

  const data = fs.readFileSync(file, 'utf8');
  const images = data.match(/https:\/\/.*(blog-images\/main).*\.(jpg|jpeg|png)/gi);
  if (images) {
    allImageUrls.push(...images);
  }
}

async function processImages() {
  for (const imgUrl of allImageUrls) {
    await getImageSize(imgUrl);
  }

  console.log(`Total images: ${allImageUrls.length}\n`);
  pbcopy(resHtml + '</div>');
}

function getImageSize(imgUrl) {
  return new Promise((resolve, reject) => {
    const options = url.parse(imgUrl);

    https.get(options, function (response) {
      const chunks = [];

      response.on('data', function (chunk) {
        chunks.push(chunk);
      }).on('end', function () {
        const buffer = Buffer.concat(chunks);
        const { height, width } = sizeOf(buffer);

        // Use astro Image component instead of html <img> tag
        resHtml += `
          <a
            href="${imgUrl}"
            data-pswp-width="${width}"
            data-pswp-height="${height}"
            target="_blank"
          >
            <Image
              src="${imgUrl}"
              alt="${imgUrl}"
              width={${width}}
              height={${height}}
            />
          </a>`;

        console.log(allImageUrls.indexOf(imgUrl) + 1);
        resolve();
      });
    }).on('error', function (error) {
      console.error(`Error fetching ${imgUrl}: ${error.message}`);
      resolve(); // Continue processing other images even if one fails
    });
  });
}

// only for Mac
function pbcopy(data) {
  var proc = require('child_process').spawn('pbcopy');
  proc.stdin.write(data);
  proc.stdin.end();
}
