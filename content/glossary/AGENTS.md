# AGENTS.md — glossary authoring conventions

**Scope:** these rules apply when drafting or editing anything under
`content/glossary/`. They are stricter than general resource content because the
glossary is **reference material** and doubles as the site's **canonical
bilingual termbase**. (Repo-wide rules — translation, validation, PR/review,
publishing — live in the root [`AGENTS.md`](../../AGENTS.md).)

When a rule here conflicts with an older plan/GOAL doc, **this file wins**.

---

## 0. Editorial neutrality (the rule that's specific to the glossary)

A glossary entry is **only a glossary entry** — a neutral, accurate definition,
not marketing. **Do not insert Namefi/product promotion**: drop sentences like
"Namefi can…", "On Namefi…", "Namefi's tokenization…", "tokenization is a natural
fit…". Define the term as a neutral reference would.

> This overrides any older glossary template that asked for a "Namefi angle" /
> "house voice" pitch. (Blog and landing content may promote; the glossary does
> not.)

---

## 1. One concept per entry

Never define two things in one entry, and never frame an entry as a comparison
("X vs Y"). If a term covers two concepts, **split it** into one entry each and
cross-link them in the body.

- e.g. `buy-now-vs-make-offer` → `buy-it-now` + `make-offer`;
  `wholesale-vs-retail` → `wholesale-pricing` + `retail-pricing`;
  "Private Key / Public Key" → `private-key` + `public-key`;
  "KYC / AML" → `kyc` + `aml`.
- When you split or rename a slug, **repoint every inbound link** and remove the
  old file (`grep -r "glossary/<old-slug>" content/`).

## 2. Single canonical title

The `title` is **one** name — no parenthetical alternates, no `A / B`, no
examples in the title.

- `Aftermarket` (not `Aftermarket (Secondary Market)`),
  `DAO` (not `DAO (Decentralized Autonomous Organization)`),
  `Short Domain` (not `Short / Numeric Domain (LLLL, NNNN)`).
- Examples that used to sit in the title (`Marketplace (e.g. OpenSea, Blur)`)
  move into the **body**.

## 3. `also_known_as` — STRICT synonyms only

Alternate names go in the frontmatter list field **`also_known_as`** *and* are
mentioned in the body prose ("also called …").

- **Only strict synonyms** — terms that mean *the same thing in this context*.
  Acronym↔expansion and exact synonyms qualify: `Aftermarket` ⇄ `Secondary
  Market`, `Comparable Sales` ⇄ `Comps`, `Buy It Now` ⇄ `BIN`,
  `Wholesale Pricing` ⇄ `Investor Pricing`.
- **Do NOT** list related-but-different terms (put these in the body instead):
  - practitioner vs activity — `Domaining` ✗ `Domainer`
  - subtype vs category — `Short Domain` ✗ `Numeric Domain`
  - firm vs agent — `Domain Broker` ✗ `Domain Brokerage`
  - buyer-side vs seller-side framing — `Reserve Price` ✗ `Minimum Offer`
  - loosely-associated UI labels — `Make Offer` ✗ `Best Offer`
- `also_known_as` is **per-locale**: the `zh` entry lists Chinese synonyms, the
  `en` entry lists English ones. Omit the field entirely when there is no strict
  synonym.

## 4. Declarative one-line `description`

`description` is a **standalone definition sentence**, ≤ 155 chars, plain text,
period-terminated — **not** a "What is X…?" question. It is reused as the SEO
`<meta>` snippet and (in astra) the hover-to-define tooltip.

## 5. Sources — at least two, specific

Every entry carries **≥ 2** `sources`, each a **specific authoritative page**,
not a homepage. Link-check them before committing. Good sources: IETF RFCs,
ICANN/IANA pages, W3C, EIPs/ethereum.org, WIPO/Cornell LII (law), Google Search
Central, Investopedia *term* pages, NameBio, DNJournal, Moz, Cloudflare Learning.
(Investopedia/Cloudflare return `403` to `curl` — anti-bot, the pages are valid;
verify the slug another way.)

## 6. Frontmatter shape (canonical order)

```yaml
title: Aftermarket
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The resale market for already-registered domains, where names are bought and sold between owners.
keywords: ['aftermarket', 'secondary market', 'domain resale', 'domain investing']
also_known_as: ['Secondary Market']   # omit if there is no strict synonym
level: 1                               # 1 = stub, 2 = full article
sources:
  - https://www.investopedia.com/terms/s/secondarymarket.asp
  - https://www.namebio.com/
```

**`level` / `sources` / `also_known_as` / `aliasesByLocale` are build-time-only.**
astra's `normaliseGlossaryFrontmatter` whitelists only
`title/summary/description/tags/authors/date/draft/language/keywords`, so these
extra keys are read by the repo's scripts (via gray-matter) but ignored by the
renderer — safe to add, they don't break the build.

## 7. Body

A short, neutral L1 paragraph: bold the term, define it plainly, weave in any
`also_known_as` synonym, and add **2–4 cross-links** to related glossary terms
(first natural mention only). No product pitch (§0).

## 8. The title IS the canonical term

Each entry's per-locale `title` is the *standard* way to say that concept in that
locale, reused site-wide. Choose it deliberately. **zh titles are reviewed/signed
off by the maintainer**; `ar` uses modern Egyptian Arabic register. After adding
or translating entries, regenerate the termbase: `bun termbase:build`.
