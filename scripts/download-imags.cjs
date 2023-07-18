const fs = require('fs');
const path = require('path');
const https = require('https');

const srcPath = path.join(__dirname, "../src/posts");
const allImageUrls = [];

function throughDirectory (dir) {
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    if (fs.statSync(absPath).isDirectory()) {
      return throughDirectory(absPath);
    } else {
      editFileContent(absPath);
    }
  });
  downloadImages();
}

throughDirectory(srcPath);

function editFileContent(file) {
  if(!file.endsWith('.md')) return;

  const data = fs.readFileSync(file, 'utf8');
  const images = data.match(/https:\/\/tva1\.sinaimg\.cn.*\.(jpg|png)/gi);
  if (images) {
    allImageUrls.push(...images)
  }
}

function downloadImages() {
  const dest = path.join(__dirname, "images");
  if (!fs.existsSync(dest)){
    fs.mkdirSync(dest);
  }

  allImageUrls.map(url => {
    const filename = url.match(/[\w-]+.(jpg|png)/g);
    const file = fs.createWriteStream(`${dest}/${filename}`);

    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close();
      });
    });
  })
}
