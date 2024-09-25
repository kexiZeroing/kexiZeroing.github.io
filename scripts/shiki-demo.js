import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import markdownit from 'markdown-it';
import { createHighlighter } from 'shiki';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const inputFile = await fs.readFile(path.resolve(__dirname, "../src/posts/state-management-clone.md"), 'utf-8');
  const html = md.render(inputFile);
  const out = `
    <title>Shiki</title>
    ${html}
  `;

  await fs.writeFile(path.resolve(__dirname, "../public/shiki.html"), out);

  console.log('done');
}

main().catch(console.error);