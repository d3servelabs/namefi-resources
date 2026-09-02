# editorial/ — planning artifacts, not published content

This folder holds **editorial planning material**: content catalogs, strategy
memos, backlogs, and any working document that shapes what gets written. It is a
durable, reviewable home for decisions that would otherwise live in a chat log.

## Nothing here is built or published

The Namefi resources site reads **only** `content/` (see
`apps/resources/src/lib/content.ts` in `d3servelabs/namefi-astra`, where
`DATA_ROOT` is `data/content`). This repo's own tooling is scoped the same way:

- `bun run data:validate` walks `content/**` — the frontmatter contract
  (`relatedArticles`, `relatedGlossary`, `relatedTopics`, `relatedSeries`,
  `format`, `cluster`) does **not** apply to files here.
- `bun run lint:mdx` globs `content/**/*.{md,mdx}`.
- The cross-link audit resolves links inside `content/` only.

So a file in `editorial/` can be plain Markdown or a self-contained HTML page
with no frontmatter, and it will never appear on the site, in a sitemap, or in an
RSS feed. Keep it that way: **never** reference a file in this folder from
anything under `content/`.

## Conventions

- **Self-contained files.** An HTML page inlines its own CSS and JS. External
  resources are limited to a Google Fonts stylesheet, so a page opens correctly
  from a `file://` path with no build step and no network beyond fonts.
- **State the as-of date and how numbers were obtained.** Measured counts and
  judgment calls are different things and must be labeled as such.
- **Update in place** for living documents. Git history is the version record.
- Related but separate: `docs/` holds process and initiative plans that are
  written for engineers (validation contracts, per-batch article plans).

## Contents

| File | What it is |
| --- | --- |
| `content-catalog.html` | The content model: four authored axes (subject, format, reader, decay) plus a derived stage, the subject-by-stage grid over the 154 English posts, the series packaging layer, and the backfill plan. Bilingual. Open it in a browser. |
