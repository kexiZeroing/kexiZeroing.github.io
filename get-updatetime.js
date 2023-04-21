// This file will add or update `updatedDate` attribute to markdown files frontmatter
// And this file is generated with the help of ChatGPT.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirPath = './src/posts';

const files = fs.readdirSync(dirPath).filter((file) => {
  return path.extname(file) === '.md';
});

files.forEach((file) => {
  const filePath = path.join(dirPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/gm;

  const match = regex.exec(content);
  if (match) {
    const oldFrontmatter = match[1];
    const newDate = new Date(execSync(`git log -1 --format="%aI" ${filePath}`).toString().trim());
    const newDateString = newDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(',', '');
    const newUpdatedDate = `updatedDate: "${newDateString}"`;

    let newFrontmatter = oldFrontmatter.replace(/(updatedDate:\s*")([^"]*)(")?/, newUpdatedDate);

    if (newFrontmatter === oldFrontmatter) {
      newFrontmatter += `\n${newUpdatedDate}`;
    }

    const newContent = content.replace(oldFrontmatter, `${newFrontmatter.trim()}`);
    fs.writeFileSync(filePath, newContent);
  }
});
