# NameFi Resources Content

This repository holds the content that powers the resources site (blog posts, glossary, partners, authors, and TLDs). It is consumed as a git submodule at `apps/resources/data` inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

All content lives under the `content/` directory (e.g., `content/blog/en/...`).

## Editing content

- Keep the existing folder structure: `authors/`, `blog/`, `glossary/`, `partners/`, and `tld/`, each with language subfolders inside `content/`.
- Add or edit Markdown/MDX files directly; frontmatter is validated by the main repo.
- Open a PR or push to `main` once your changes are ready.

## Validation

- Run `bun install` once, then:
  - `bun data:validate` to check frontmatter and dates.
  - `bun lint:mdx` to lint markdown/MDX frontmatter and formatting.
- CI runs validation and MDX lint on every pull request.

## Automation

- On every push to `main`, a workflow dispatches a `resources-updated` event to `namefi-astra`.
- The main repo then updates the `apps/resources/data` submodule, runs content validation, and opens a PR with the new content.

### Required secret

Set `ASTRA_REPO_TOKEN` (repo scope PAT or GitHub App token with access to `d3servelabs/namefi-astra`) in this repository so the dispatch can succeed.
