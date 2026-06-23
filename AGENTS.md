# AGENTS.md — working conventions for `namefi-resources`

This repo holds the **content** that powers the Namefi resources site (blog,
glossary, TLD pages, partners, authors, careers). It is consumed as the
`apps/resources/data` submodule inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

This file is the source of truth for **how to author and change content here**.
It captures decisions the maintainer (zzn) has made over multiple sessions, so
future agents (and people) follow the same rules without re-litigating them.
When a rule here conflicts with an older plan/GOAL doc, **this file wins** —
update the plan, not the rule.

---

## 0. Golden rules

- **Editorial neutrality.** Resource content — the **glossary especially** — is
  reference material, not marketing. Write neutral, accurate definitions. **Do
  not insert Namefi/product promotion** ("Namefi can…", "On Namefi…", "Namefi's
  tokenization…", "tokenization is a natural fit…"). A glossary entry is only a
  glossary entry. (This overrides any older template that asked for a "Namefi
  angle" / "house voice" pitch.)
- **English is the source of truth.** Author in `en` first; translate from
  English, never chain language→language.
- **Validate before you push:** `bun data:validate` + `bun lint:mdx` +
  cross-link audit (0 broken). See §6.
- **Only act on Cursor Bugbot** in PR review. **Ignore CodeRabbit** entirely.
- **Never force-push** a shared branch without explicit approval.

---

## 1. Glossary conventions (`content/glossary/<locale>/<slug>.md`)

The glossary doubles as the site's **canonical bilingual termbase**. Treat each
entry's per-locale `title` as the *standard* term for that concept in that
locale — chosen deliberately, reused everywhere.

### 1.1 One concept per entry
Never define two things in one entry, and never frame an entry as a comparison
("X vs Y"). If a term covers two concepts, **split it** into one entry each, and
cross-link them in the body.
- e.g. `buy-now-vs-make-offer` → `buy-it-now` + `make-offer`;
  `wholesale-vs-retail` → `wholesale-pricing` + `retail-pricing`;
  "Private Key / Public Key" → `private-key` + `public-key`;
  "KYC / AML" → `kyc` + `aml`.
- When you split or rename a slug, **repoint every inbound link** and remove the
  old file (grep `glossary/<old-slug>` across `content/`).

### 1.2 Single canonical title
The `title` is **one** name — no parenthetical alternates, no `A / B`, no
examples in the title.
- `Aftermarket` (not `Aftermarket (Secondary Market)`),
  `DAO` (not `DAO (Decentralized Autonomous Organization)`),
  `Short Domain` (not `Short / Numeric Domain (LLLL, NNNN)`).
- Examples that used to sit in the title (`Marketplace (e.g. OpenSea, Blur)`)
  move into the **body**, not the title.

### 1.3 `also_known_as` — strict synonyms only
Alternate names go in a frontmatter list field **`also_known_as`** *and* are
mentioned in the body prose ("also called …").
- **Only put STRICT synonyms here** — terms that mean *the same thing in this
  context*. Acronym↔expansion and exact synonyms qualify:
  `Aftermarket` ⇄ `Secondary Market`, `Comparable Sales` ⇄ `Comps`,
  `Buy It Now` ⇄ `BIN`, `Wholesale Pricing` ⇄ `Investor Pricing`.
- **Do NOT** list related-but-different terms. These are **not** synonyms and
  belong in the body, not `also_known_as`:
  - a practitioner vs the activity — `Domaining` ✗ `Domainer`;
  - a subtype vs the category — `Short Domain` ✗ `Numeric Domain`;
  - a firm vs the agent — `Domain Broker` ✗ `Domain Brokerage`;
  - a buyer-side vs seller-side framing — `Reserve Price` ✗ `Minimum Offer`;
  - loosely-associated UI labels — `Make Offer` ✗ `Best Offer`.
- `also_known_as` is **per-locale**: the `zh` entry lists the term's Chinese
  synonyms, the `en` entry lists English ones.

### 1.4 Declarative one-line `description`
`description` is a **standalone definition sentence**, ≤155 chars, plain text,
period-terminated — **not** a "What is X…?" question. It is reused as the SEO
`<meta>` snippet and (in astra) the hover-to-define tooltip.

### 1.5 Sources: at least two, specific
Every entry carries **≥ 2** `sources`, each a **specific authoritative page**,
not a homepage. Link-check them before committing. Good sources: IETF RFCs,
ICANN/IANA pages, W3C, EIPs/ethereum.org, WIPO/Cornell LII (law), Google Search
Central, Investopedia *term* pages, NameBio, DNJournal, Moz, Cloudflare Learning.
(Investopedia/Cloudflare return `403` to `curl` — that's anti-bot, the pages are
valid; verify the slug another way.)

### 1.6 Frontmatter shape (canonical order)
```yaml
title: Aftermarket
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The resale market for already-registered domains, where names are bought and sold between owners.
keywords: ['aftermarket', 'secondary market', 'domain resale', 'domain investing']
also_known_as: ['Secondary Market']   # omit the field entirely if there is no strict synonym
level: 1                               # 1 = stub, 2 = full article
sources:
  - https://www.investopedia.com/terms/s/secondarymarket.asp
  - https://www.namebio.com/
```
**`level` / `sources` / `also_known_as` / `aliasesByLocale` are build-time-only.**
astra's `normaliseGlossaryFrontmatter` whitelists only
`title/summary/description/tags/authors/date/draft/language/keywords`, so these
extra keys are read by the repo's scripts (via gray-matter) but ignored by the
renderer — safe to add, they don't break the build. (Surfacing them in the UI
needs a loader change in astra.)

### 1.7 Body
A short, neutral L1 paragraph: bold the term, define it plainly, weave in any
`also_known_as` synonym, and add **2–4 cross-links** to related glossary terms
(first natural mention only). No product pitch (§0).

---

## 2. Translations & the termbase

- **Translate with Claude** (one focused pass per locale), **not** a Gemini batch
  script. There is no `translate-glossary` program — it was removed for implying
  a workflow we don't use. Use the existing `content/termbase.json` as the
  reference for canonical per-locale titles + anchor text.
- The translated **`title` is the canonical term** for that concept in that
  locale, reused site-wide. Pick it deliberately. **zh titles are reviewed/signed
  off by the maintainer**; **`ar` uses modern Egyptian Arabic register** (not
  MSA), the natural register for a tech/business reader.
- Rewrite internal links `/en/…` → `/<locale>/…`; **never change the slug**.
  A link's anchor text = the linked term's canonical title in that locale.
- Keep verbatim: citation URLs (incl. `#:~:text=` fragments), code, brand names,
  domain names, and figures (`GoDaddy`, `ICANN`, `.com`, `$30`, `BIP-39`, …).
- After translating, regenerate the termbase (`bun termbase:build`).

---

## 3. Cross-linking

Use the `.agents/skills/cross-link/` tooling. Discipline:
- Link the **first natural mention only**; don't over-link.
- Inbound links are **curated, ≤ 5 "most relevant" pages per term** — dense but
  not link-stuffed.
- Every internal link must resolve: `bun .agents/skills/cross-link/link-audit.ts
  <paths>` → **0 broken, 0 locale-mismatch**.

---

## 4. SEO / i18n

- Each language serves **its own page** — self-canonical + `hreflang` +
  `x-default`. Do not canonicalize a translated page back to English.
- Keep OG/Twitter metadata server-rendered (handled by astra); content just
  needs good `title`/`description`/`keywords`.

---

## 5. Tooling (run from repo root)

| command | what it does |
|---|---|
| `bun data:validate` | frontmatter + date validation (blocking errors; warnings OK) |
| `bun lint:mdx` | eslint over `content/**/*.{md,mdx}` |
| `bun termbase:build` / `termbase:check` | (re)generate / verify `content/termbase.json` |
| `bun glossary:mentions` | per-term distinct-post mention counts — the L2-promotion demand metric |
| `bun check:termbase` | advisory linter: flags translated prose using a known non-canonical variant (`aliasesByLocale`) |
| `bun .agents/skills/cross-link/link-audit.ts <paths>` | verify internal links (0 broken) |

`scripts/glossary-fs.ts` is the shared `.md`/`.mdx` resolver used by
build-termbase + glossary-mentions — keep them agreeing on one file per slug.

> Shell notes for agents: the dev shell is often **fish** (`for x in $var` does
> not word-split — use `bash -c`); subprocesses can eat stdin in loops (add
> `</dev/null`); the lefthook pre-push can fail with a TTY "device not configured"
> error in non-interactive shells — run the validators by hand and push with
> `git push --no-verify`.

---

## 6. Validation, PRs, and publishing

1. **Per change:** `bun data:validate` + `bun lint:mdx` + `link-audit` (0 broken).
2. **PR description:** a Summary/Solution section, a Test plan, and — when a
   Claude session authored it — a redacted Claude session summary with ISO-8601
   UTC timestamps. No secrets/PII.
3. **Review:** act only on **Cursor Bugbot**; **ignore CodeRabbit**. Drive Bugbot
   to green, address real findings, then merge (a non-author approval or admin
   override per repo policy).
4. **Publish:** merging to `main` auto-dispatches an `apps/resources/data`
   submodule bump to **astra dev**. Production is a **deliberate** release
   (`release-resources` workflow) — verify the release tag pins your merged
   resources `HEAD` before trusting prod (watch for the release-race).

---

## 7. Content scope

- `content/glossary/` — reference terms (this file's main focus).
- `content/blog/` — articles; organized by cluster/series taxonomy (validated by
  astra's `taxonomy.ts`); illustrations via the image-gen recipe.
- `content/tld/` — per-TLD pages (see `prompts/tld-page.md`).
- `content/{partners,authors,careers}/` — supporting content.

Every collection is **English-first, then translated to all 7 locales**
(`en ar de es fr hi zh`).
