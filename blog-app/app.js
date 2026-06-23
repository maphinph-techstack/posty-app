const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const app = express();
const PORT = process.env.PORT || 3000;
const postsDir = path.join(__dirname, "post");

app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "public")));

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getPosts() {
  await fs.mkdir(postsDir, { recursive: true });
  const files = await fs.readdir(postsDir);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      const fullPath = path.join(postsDir, file);
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = matter(raw);
      const slug = file.replace(/\.md$/, "");
      const title = parsed.data.title || slug.replace(/-/g, " ");
      const date = parsed.data.date || "";
      const excerpt = (parsed.content || "").split("\n").find((line) => line.trim()) || "";

      return {
        slug,
        title,
        date,
        excerpt
      };
    })
  );

  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

async function getPostBySlug(slug) {
  const filePath = path.join(postsDir, `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);

  return {
    slug,
    title: parsed.data.title || slug.replace(/-/g, " "),
    date: parsed.data.date || "",
    html: marked.parse(parsed.content || "")
  };
}

function pageTemplate(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/public/style.css" />
</head>
<body>
  <header class="site-header">
    <h1><a href="/">Simple Markdown Blog</a></h1>
    <nav><a href="/new">New Post</a></nav>
  </header>
  <main class="content">${body}</main>
</body>
</html>`;
}

app.get("/", async (req, res) => {
  try {
    const posts = await getPosts();
    const list = posts.length
      ? posts
          .map(
            (post) => `<article class="card">
  <h2><a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
  <p class="meta">${escapeHtml(post.date)}</p>
  <p>${escapeHtml(post.excerpt)}</p>
</article>`
          )
          .join("\n")
      : "<p>No posts yet. Create one from the New Post page.</p>";

    res.send(pageTemplate("Simple Markdown Blog", `<section>${list}</section>`));
  } catch (error) {
    res.status(500).send(pageTemplate("Error", `<p>${escapeHtml(error.message)}</p>`));
  }
});

app.get("/post/:slug", async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    const body = `<article class="post">
  <h2>${escapeHtml(post.title)}</h2>
  <p class="meta">${escapeHtml(post.date)}</p>
  <div class="post-body">${post.html}</div>
</article>`;

    res.send(pageTemplate(post.title, body));
  } catch (error) {
    res.status(404).send(pageTemplate("Not found", "<p>Post not found.</p>"));
  }
});

app.get("/new", (req, res) => {
  const body = `<section class="form-wrap">
  <h2>Create New Post</h2>
  <form method="post" action="/new" class="post-form">
    <label for="title">Title</label>
    <input id="title" name="title" required />

    <label for="content">Markdown Content</label>
    <textarea id="content" name="content" rows="14" required></textarea>

    <button type="submit">Publish</button>
  </form>
</section>`;

  res.send(pageTemplate("New Post", body));
});

app.post("/new", async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const content = (req.body.content || "").trim();

    if (!title || !content) {
      res.status(400).send(pageTemplate("Validation error", "<p>Title and content are required.</p>"));
      return;
    }

    const slugBase = toSlug(title) || "post";
    const fileName = `${Date.now()}-${slugBase}.md`;
    const filePath = path.join(postsDir, fileName);
    const date = new Date().toISOString().slice(0, 10);

    const markdown = `---\ntitle: ${title}\ndate: ${date}\n---\n\n${content}\n`;

    await fs.mkdir(postsDir, { recursive: true });
    await fs.writeFile(filePath, markdown, "utf8");

    res.redirect(`/post/${encodeURIComponent(fileName.replace(/\.md$/, ""))}`);
  } catch (error) {
    res.status(500).send(pageTemplate("Error", `<p>${escapeHtml(error.message)}</p>`));
  }
});

app.listen(PORT, () => {
  console.log(`Blog app running at http://localhost:${PORT}`);
});
