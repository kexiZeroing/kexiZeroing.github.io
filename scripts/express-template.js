import express from "express";

let app = express();
app.use(express.static("public"));
// parsing the URL-encoded data with the `querystring` library (when false) or the `qs` library (when true).
// test the differences: https://stackblitz.com/edit/node-xa27zd?file=index.js
app.use(express.urlencoded({ extended: true }));

let projects = [
  {
    id: "abc",
    name: "project 1",
    description: "this is project 1",
  },
  {
    id: "xyz",
    name: "project 2",
    description: "this is project 2",
  },
  {
    id: "lmno",
    name: "project 3",
    description: "this is project 3",
  },
];

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(html`
    <body class="main">
      <header>
        <h1>Hello</h1>
      </header>
      <div class="layout-container">
        <a href="/nav">Projects Page</a>
      </div>
    </body>
  `);
  res.end();
});

app.get("/nav", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(html`
    <nav>
      <p><a href="/new">New Project</a></p>
      <ul>
        ${projects
          .map(
            project =>
              html`<li>
                <a href="/project/${project.id}/">${project.name}</a>
              </li>`,
          )
          .join("")}
      </ul>
    </nav>
  `);
  res.end();
});

app.all("/new", async (req, res) => {
  if (req.method === "POST") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let project = {
      id: Math.random().toString().slice(2, 8),
      name: req.body.name,
      description: req.body.description,
    };
    projects.unshift(project);
    res.writeHead(303, { Location: `/project/${project.id}/` });
    res.end();
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(html`
    <h1>New Project</h1>
    <form method="post" onsubmit="this.btn.disabled = true">
      <p>
        <label for="name">Name</label><br />
        <input type="text" name="name" id="name" />
      </p>
      <p>
        <label for="desc">Description</label><br />
        <textarea name="description" id="desc"></textarea>
      </p>
      <p>
        <button name="btn" type="submit">Create</button>
      </p>
    </form>
  `);
  res.end();
});

app.get("/project/:id", (req, res) => {
  let project = projects.find(project => project.id === req.params.id);

  if (!project) {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("Project not found");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(html`
    <h1>${project.name}</h1>
    <p>${project.description}</p>
  `);
  res.end();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function html(strings, ...values) {
  let body = "";
  for (let i = 0; i < strings.length; i++) {
    body += strings[i];
    if (values[i]) {
      body += values[i];
    }
  }
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Hello</title>
    </head>
    ${body}
  </html>
  `;
}
