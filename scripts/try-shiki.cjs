const fs = require('fs')
const path = require("path")
const markdown = require('markdown-it')
const shiki = require('shiki')

shiki.getHighlighter({
  theme: 'nord'
}).then(highlighter => {
  const md = markdown({
    html: true,
    highlight: (code, lang) => {
      return highlighter.codeToHtml(code, { lang })
    }
  })

  const html = md.render(fs.readFileSync(path.resolve(__dirname, "../src/posts/react-hooks-clone.md"), 'utf-8'))
  const out = `
    <title>Shiki</title>
    ${html}
  `
  fs.writeFileSync(path.resolve(__dirname, "../public/shiki.html"), out)

  console.log('done')
})