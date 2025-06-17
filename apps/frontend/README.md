# Frontend

## Development

### Environment Setup

1. Copy the environment template:
```bash
cp .env.template .env
```

2. Update the `.env` file with your environment variables:
```
ENVIRONMENT=development    # Options: local, development, production
```

Note: Configuration is managed in two ways:
- Non-secret configuration is version controlled and managed in the codebase
- Secret environment variables are managed through Infisical. You can override any Infisical variables by adding them to your `.env` file.

⚠️ **Security Warning**: Never expose sensitive secrets in the frontend code. Any environment variables used in the frontend will be visible to users. Keep all sensitive operations in the backend.

### Running the Application

To run the frontend in development mode:

```bash
INFISICAL_TOKEN={TOKEN} bun with-env dev
```

---

## Blog & Markdown/i18n Support (2024-06)

### Features
- Blog system powered by Markdown files, supporting multiple languages (currently `en` and `zh`).
- Blog posts are stored in `content/blog/{lang}/` directories as `.md` files.
- Each post supports YAML frontmatter for SEO, title, description, and date.
- Automatic language switcher for posts with multiple language versions.
- Static generation for all blog pages and posts.
- SEO meta tags are generated from frontmatter.
- **No MDX support, only pure Markdown is rendered.**

### Directory Structure
```
content/
  blog/
    en/
      what-is-domain.md
    zh/
      what-is-domain.md
```

### How to Add a Blog Post
1. Create a new `.md` file in the appropriate language folder under `content/blog/`.
2. Use YAML frontmatter for metadata (title, description, date, seo, etc).
3. The slug is the filename (without `.md`).
4. To support multiple languages, create files with the same slug in different language folders.

### Example Frontmatter
```markdown
---
title: What is a Domain Name?
description: A comprehensive guide to understanding domain names.
date: 2024-03-20
seo:
  title: What is a Domain Name?
  description: A comprehensive guide to understanding domain names.
---

正文内容...
```

### Accessing Blog Pages
- Blog index: `/en/blog` or `/zh/blog`
- Blog post: `/en/blog/what-is-domain` or `/zh/blog/what-is-domain`

---
