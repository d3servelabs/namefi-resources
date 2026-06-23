# AGENTS.md — working conventions for `namefi-resources`

This repo holds the **content** that powers the Namefi resources site (blog,
glossary, TLD pages, partners, authors, careers). It is consumed as the
`apps/resources/data` submodule inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

This file is the source of truth for **how to author and change content here**.
It captures decisions the maintainer (zzn) has made over multiple sessions so
future agents (and people) follow the same rules. When a rule here conflicts with
an older plan/GOAL doc, **this file wins** — update the plan, not the rule.

> **Drafting or editing a glossary entry?** The glossary has its own, stricter
> conventions — **read [`content/glossary/AGENTS.md`](content/glossary/AGENTS.md)
> first.** (Notably: glossary content is editorially neutral — no product
> promotion — one concept per entry, single canonical titles, `also_known_as` for
> strict synonyms only, ≥2 specific sources.)

---

## 0. Golden rules (repo-wide)

- **English is the source of truth.** Author in `en` first; translate from
  English, never chain language→language. Every collection is English-first, then
  translated to all 7 locales (`en ar de es fr hi zh`).
- **Validate before you push:** `bun data:validate` + `bun lint:mdx` +
  cross-link audit (0 broken). See §3.
- **Only act on Cursor Bugbot** in PR review. **Ignore CodeRabbit** entirely.
- **Never force-push** a shared branch without explicit approval.

---

## 1. Translations

- **Translate with Claude** (one focused pass per locale), **not** a Gemini batch
  script. There is no `translate-glossary` program — it was removed for implying a
  workflow we don't use. Use `content/termbase.json` as the reference for
  canonical per-locale titles + anchor text.
- The translated **`title` is the canonical term** for that concept in that
  locale, reused site-wide — pick it deliberately. **zh titles are reviewed/signed
  off by the maintainer**; **`ar` uses modern Egyptian Arabic register** (not
  MSA), the natural register for a tech/business reader.
- Rewrite internal links `/en/…` → `/<locale>/…`; **never change the slug**. A
  link's anchor text = the linked term's canonical title in that locale.
- Keep verbatim: citation URLs (incl. `#:~:text=` fragments), code, brand names,
  domain names, and figures (`GoDaddy`, `ICANN`, `.com`, `$30`, `BIP-39`, …).

## 2. Cross-linking & SEO

- Use `.agents/skills/cross-link/`. Link the **first natural mention only**;
  inbound links are **curated, ≤ 5 most-relevant pages per term**. Every internal
  link must resolve: `bun .agents/skills/cross-link/link-audit.ts <paths>` →
  **0 broken, 0 locale-mismatch**.
- Each language serves **its own page** — self-canonical + `hreflang` +
  `x-default`. Never canonicalize a translated page back to English.

## 3. Validation, PRs, and publishing

1. **Per change:** `bun data:validate` + `bun lint:mdx` + `link-audit` (0 broken).
2. **PR description:** a Summary/Solution section, a Test plan, and — when a Claude
   session authored it — a redacted Claude session summary with ISO-8601 UTC
   timestamps. No secrets/PII.
3. **Review:** act only on **Cursor Bugbot**; **ignore CodeRabbit**. Drive Bugbot
   to green, address real findings, then merge (non-author approval or admin
   override per repo policy).
4. **Publish:** merging to `main` auto-dispatches an `apps/resources/data`
   submodule bump to **astra dev**. Production is a **deliberate** release
   (`release-resources` workflow) — verify the release tag pins your merged
   resources `HEAD` before trusting prod (watch for the release-race).

## 4. Tooling (run from repo root)

| command | what it does |
|---|---|
| `bun data:validate` | frontmatter + date validation (blocking errors; warnings OK) |
| `bun lint:mdx` | eslint over `content/**/*.{md,mdx}` |
| `bun termbase:build` / `termbase:check` | (re)generate / verify `content/termbase.json` |
| `bun glossary:mentions` | per-term distinct-post mention counts — the L2-promotion demand metric |
| `bun check:termbase` | advisory linter: flags translated prose using a known non-canonical variant (`aliasesByLocale`) |
| `bun .agents/skills/cross-link/link-audit.ts <paths>` | verify internal links (0 broken) |

> Shell notes for agents: the dev shell is often **fish** (`for x in $var` does
> not word-split — use `bash -c`); subprocesses can eat stdin in loops (add
> `</dev/null`); the lefthook pre-push can fail with a TTY "device not configured"
> error in non-interactive shells — run the validators by hand and push with
> `git push --no-verify`.

## 5. Content scope

- `content/glossary/` — reference terms. **Has its own conventions:
  [`content/glossary/AGENTS.md`](content/glossary/AGENTS.md).**
- `content/blog/` — articles; organized by cluster/series taxonomy (validated by
  astra's `taxonomy.ts`); illustrations via the image-gen recipe.
- `content/tld/` — per-TLD pages (see `prompts/tld-page.md`).
- `content/{partners,authors,careers}/` — supporting content.
