# Contributing Guide

Thanks for contributing to Posty App.

## Add a New Blog Post

1. Create a new Markdown file in `blog-app/post/`.
2. Use this filename pattern to avoid collisions:
   - `YYYYMMDD-your-post-title.md` (example: `20260623-my-first-post.md`)
3. Add front matter at the top:

```md
---
title: My Post Title
date: 2026-06-23
---
```

4. Write your content in Markdown below the front matter.
5. Keep titles clear and dates in `YYYY-MM-DD` format.

## Preview Locally

1. Go to `blog-app/`.
2. Install dependencies: `npm install`
3. Start the app: `npm start`
4. Open `http://localhost:3000` and confirm your post appears on the home page and opens correctly.

## Open a Pull Request

1. Create a branch from `main`.
2. Commit your changes with a clear message.
3. Push your branch to GitHub.
4. Open a Pull Request to `main`.
5. In the PR description, include:
   - What post you added
   - Any screenshots if formatting is important
   - Confirmation that local preview works

## Content Checklist

- File is in `blog-app/post/`
- Front matter includes `title` and `date`
- Markdown renders correctly
- No unrelated file changes
