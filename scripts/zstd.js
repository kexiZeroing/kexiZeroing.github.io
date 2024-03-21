import { ZstdInit, ZstdSimple } from '@oneidentity/zstd-js';
import * as fzstd from 'fzstd';
import fs from 'fs/promises';

(async () => {
  await ZstdInit();

  try {
    // replace `data.json` with your file
    const jsonContent = await fs.readFile('data.json', 'utf-8');
    const jsonData = Buffer.from(jsonContent);

    // Compress using ZstdSimple and save the compressed data to a new file
    const compressedSimpleData = ZstdSimple.compress(jsonData);
    await fs.writeFile('compressed.zst', compressedSimpleData);
    console.log('Compression successful.');

    // Decompress and write to another file
    // const decompressedData = ZstdSimple.decompress(compressedSimpleData);
    // await fs.writeFile('decompressed.json', decompressedData);

    // Aother way: Decompress using fzstd
    const rawContent = await fs.readFile('compressed.zst');
    const arr = new Uint8Array(rawContent); 
    const decomDataArr = fzstd.decompress(arr);
    let decomDataJsonStr = '';

    if (decomDataArr.length) {
      decomDataJsonStr = utf8ArrayToStr(decomDataArr);      
    } 
    console.log(decomDataJsonStr)
  } catch (error) {
    console.error(error);
  }
})();

function utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
              ((char2 & 0x3F) << 6) |
              ((char3 & 0x3F) << 0));
        break;
    }
  }

  return out;
}
