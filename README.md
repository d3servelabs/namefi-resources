# NameFi Resources Content

This repository holds the content that powers the resources site (blog posts, glossary, partners, authors, and TLDs). It is consumed as a git submodule at `apps/resources/data` inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

All content lives under the `content/` directory (e.g., `content/blog/en/...`).

## Editing content

- Keep the existing folder structure: `authors/`, `blog/`, `glossary/`, `partners/`, and `tld/`, each with language subfolders inside `content/`.
- Add or edit Markdown/MDX files directly.
- Open a PR to `main` once your changes are ready and merge it.

## Validation

- Run `bun install` once, then:
  - `bun data:validate` to check frontmatter, dates, and the same-locale internal-link invariant.
  - `bun lint:mdx` to lint markdown/MDX frontmatter and formatting.
  - `bun links:locale` for the focused locale-prefix check (`--fix` performs prefix-only repairs and preserves slugs).
  - `bun links:audit` for the full broken-link, missing-locale, and locale-prefix audit.
  - `bun links:test` for deterministic offline regression fixtures.
- CI runs these validation, test, lint, and link-audit gates on every pull request.

Localized content must keep every recognized locale-prefixed internal route in
the file's own locale. For example, an Arabic file must use
`/ar/glossary/example/`, even when the Arabic target file does not exist; the
runtime's English fallback decides what is rendered at that same-locale route.
External URLs, anchors, and internal routes without a recognized locale prefix
are outside this focused check.

## Glossary & termbase tooling

The glossary doubles as the site's **canonical bilingual termbase**: each entry's
per-locale `title` is the *standard* translation of that concept. A few scripts
maintain that contract (run from the repo root):

- `bun termbase:build` — regenerate `content/termbase.json` (the flattened
  `slug → {en, titles, aliasesByLocale}` lookup). `bun termbase:check` verifies it
  is committed up to date.
- `bun glossary:mentions` — per-term distinct-post mention counts (the demand
  metric that gates L1→L2 promotion; reuses the cross-link `link-suggest` INBOUND).
- `bun check:termbase` — advisory linter that flags translated prose using a
  *known* non-canonical variant of a glossary term (tracked per entry in
  `aliasesByLocale`), so content stays consistent with the termbase.

### Build-time-only glossary frontmatter

`astra`'s glossary loader (`normaliseGlossaryFrontmatter`) whitelists a fixed set
of fields, so these extra keys are read by the scripts above (via gray-matter) but
ignored by the renderer — they are safe to add and do **not** break the build:

```yaml
level: 1            # maturity (1 = stub, 2 = full article); drives promotion
sources:            # canonical primary sources for the entry
  - https://www.icann.org/en/accredited-registrars
aliasesByLocale:    # per-locale non-canonical variants to normalise away
  zh: ['注册服务商']
  de: ['Registrierungsdienst']
```

## Automation

- On every push to `main`, a workflow dispatches a `resources-updated` event to `namefi-astra`.
- The main repo then updates the `apps/resources/data` submodule, runs validation, and opens a PR with the new content and merges if all checks succeed.
