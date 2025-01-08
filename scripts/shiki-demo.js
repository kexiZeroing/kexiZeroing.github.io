// https://shiki.style
// Shiki is a Japanese word for "Style".
// Shiki is a syntax highlighter that uses TextMate grammars and themes, the same engine that powers VS Code.
// Shiki took a different approach by highlighting ahead of time. It ships the highlighted HTML to the client.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import markdownit from 'markdown-it';
import { createHighlighter } from 'shiki';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('import.meta.url:', import.meta.url);
// --> file:///home/users/projects/example.js
console.log('__filename:', __filename);
// --> /home/users/projects/example.js
console.log('__dirname:', __dirname);
// --> /home/users/projects
console.log('directory path:', fileURLToPath(new URL('.', import.meta.url)));
// --> /home/users/projects/

async function main() {
  const highlighter = await createHighlighter({
    themes: ['nord'],
  });

  const md = markdownit({
    html: true,
    highlight: (code, lang) => {
      return highlighter.codeToHtml(code, { lang, theme: 'nord' });
    }
  });
  await highlighter.loadLanguage('javascript') // load the language

  const inputFile = await fs.readFile(path.resolve(__dirname, "../src/blog/state-management-clone.md"), 'utf-8');
  const html = md.render(inputFile);
  const out = `
    <title>Shiki</title>
    ${html}
  `;

  await fs.writeFile(path.resolve(__dirname, "../public/shiki.html"), out);

  console.log('done');
}

main().catch(console.error);