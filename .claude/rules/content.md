# Content & workflow rules — `namefi-resources` (repo-wide)

This repo holds the **content** behind the Namefi resources site (blog, glossary,
TLD pages, partners, authors, careers), consumed as the `apps/resources/data`
submodule inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

These are the standing rules for authoring/changing content here, captured so
agents and people follow the same conventions. When a rule here conflicts with an
older plan/GOAL doc, **this file wins** — update the plan, not the rule.

> **Editing a glossary entry?** Glossary content has its own, stricter rules in
> [`.claude/rules/glossary.md`](glossary.md) — they auto-apply when you touch
> `content/glossary/**`. (Notably: glossary content is editorially neutral, no
> product promotion; one concept per entry; single canonical titles;
> `also_known_as` for strict synonyms only; ≥2 specific sources.)

> **Writing or translating?** The step-by-step playbooks + hard-won lessons live in two skills (this file is
> the rules; the skills are the how-to). **Drafting English content** → the
> [`content-authoring`](../../.agents/skills/content-authoring/SKILL.md) skill (en-first drafting flow,
> citations, frontmatter/taxonomy, post-draft QA). **Translating EN → other locales** → the
> [`article-translation`](../../.agents/skills/article-translation/SKILL.md) skill (the studio method,
> per-locale frontmatter/link rules, the Arabic-heavy translation **error catalog**, the translation
> completeness/QA + verification workflow). The dev-vs-prod publish cadence is in both.

---

## Golden rules

- **English is the source of truth.** Author in `en` first; translate from
  English, never chain language→language. Every collection is English-first,
  then translated across the 10 supported locales (`en es de fr zh-CN ar hi ko
  ja ta`).
- **Validate before you push:** `bun data:validate` + `bun lint:mdx` +
  cross-link audit (0 broken).
- **Bugbot is opt-in, not automatic.** Do **not** run, wait on, or drive Cursor
  Bugbot by default — only when the maintainer explicitly asks for a review.
  When asked, trigger it by commenting `bugbot run` (or `cursor review`) on the
  PR. **Ignore CodeRabbit** entirely, always.
- **Never force-push** a shared branch without explicit approval.

## Fact-auditing existing content

Triggered whenever you fact-check, audit, or correct **already-published** content — a
scheduled sweep, or a reader/customer/vendor-reported error. Same skill as drafting
(`content-authoring` → `article-writing`'s "Auditing existing content" rules), same bar, no
exceptions found in a real incident:

- **Route each claim to the source type that can actually answer it.** A registry/database
  record (e.g. IANA root-zone data) answers "who operates this / is it delegated" — it does
  **not** answer a legal/contractual status (e.g. registration-restriction, dot-brand /
  Specification 13 status), which only the actual registry agreement, a regulator, or the
  operator's own current public statement can confirm. Checking the wrong source and finding
  it "consistent" verifies nothing about a claim that source doesn't cover.
- **A 403/paywall/login-wall/timeout is zero evidence, never a pass-through.** It does not back
  a claim and it does not clear one. Escalate to a real browser render (a page that 403s a bot
  fetch often loads fine in an actual browser — try before giving up) or a different source
  that can answer the same question. If nothing reachable confirms it, say so explicitly —
  **UNVERIFIED**, not silently kept as-is, not reported as "checked."
- **A re-audit means every claim gets checked, not a sample.** Delegating for coverage/speed
  (parallel subagents) is fine; delegating *trust* is not — a subagent's or a prior pass's
  "clean" verdict is a lead to personally follow up on, not a result to forward as your own
  finding. Only say a claim was fact-checked if you personally opened the primary source.
- **Writing quality is not a correctness signal.** Confident, well-hedged, internally
  consistent prose and a fabricated claim read identically from the outside. Judge only
  whether a primary source, actually opened, contains the claim — never let tone raise or
  lower your confidence.

(Root incident: a TLD page asserted a Specification 13 "closed dot-brand" registration
restriction, citing the correct ICANN registry agreement URL — nobody had opened that
document, which contains no Specification 13 at all; a customer was misinformed as a direct
result. A parallel audit of 63 sibling pages marked the page "clean" because it checked IANA,
which cannot answer that claim, and the checker's ICANN fetch 403'd and was dropped instead of
escalated.)

## Translations

- **Translate with Claude** (one focused pass per locale), **not** a Gemini batch
  script. There is no `translate-glossary` program — it was removed for implying a
  workflow we don't use. Use `content/termbase.json` as the reference for
  canonical per-locale titles + anchor text.
- **Model:** run drafting and translation agents on the **latest Claude Sonnet**
  (`claude-sonnet-4-6`), **not** Opus. Sonnet is sufficient for content/translation
  work and far cheaper; large fan-outs on Opus burn the session/usage limit fast.
  Reserve Opus for orchestration/judgement, not bulk content generation.
- The translated **`title` is the canonical term** for that concept in that
  locale, reused site-wide — pick it deliberately. **zh titles are reviewed/signed
  off by the maintainer**; **`ar` uses modern Egyptian Arabic register** (not
  MSA), the natural register for a tech/business reader.
- **Translate for the target's natural register, not word-for-word.** Choose the
  **domain-correct sense** of a polysemous source word (a platform *ecosystem* is
  not the natural *environment*; *finance / financial services* is not *donating*),
  and **don't transliterate a common word that already has an established native
  term** (prefer the native word for "cart total", "product", etc. over a romanised
  borrowing). Keep brand/product/protocol/ticker terms unchanged (Namefi, NFT, ETH,
  BASE, GitHub, blockchain, wallet addresses). **Native-speaker LQA is canonical:**
  when a native reviewer validates a term correction, record it as a forbidden →
  preferred entry in the [`article-translation`](../../.agents/skills/article-translation/SKILL.md)
  skill's per-locale error catalog so it is enforced site-wide, not re-litigated.
- **Establish the locale's borrowing convention first, and ground terms in
  authoritative precedent.** Each foreign term is resolved one of three ways —
  translate to a native word, transliterate into the **native script**, or keep it
  verbatim in the source script — and locales differ in how far they nativise (and
  product-UI register differs from casual/social text). Default: translate ordinary
  words that have a native term, transliterate entrenched borrowings into the native
  script (don't leave them in the source script), and keep verbatim only brand/product
  names and global standard acronyms/tickers/codes. Resolve specific terms against an
  **authoritative, locale-maintained terminology source** — **Microsoft Terminology**
  (a Terminology Search + downloadable `.tbx` on Microsoft Learn; the former *Language
  Portal* is retired) first, plus Apple/Google
  style guides, CLDR, and the product's own existing localized strings — checking the
  language generally, the term's class, and the exact term. Use as guidance, not
  gospel (coverage thins for low-resource languages); reconcile with the product's
  register, and native-LQA stays the final arbiter.
- Rewrite every recognized locale-prefixed internal link to `/<locale>/…`;
  **never change a body-link slug**. Keep the same-locale route even when that
  target translation is missing so the runtime fallback decides what readers
  see. A link's anchor text = the linked term's canonical title in that locale.
- Translated `relatedArticles` and `relatedGlossary` must preserve the English
  source's ordered relationship slugs with only the locale segment changed.
  Never substitute a generic existing localized entry for a missing
  translation; retain the same-slug `/<locale>/…` route for runtime fallback.
- Keep verbatim: citation URLs (incl. `#:~:text=` fragments), code, brand names,
  domain names, and figures (`GoDaddy`, `ICANN`, `.com`, `$30`, `BIP-39`, …).
- **Link-localized English is not a translation.** A translated file must localize
  the human-facing frontmatter and body copy, not only `language:` and `/en/`
  links. This includes `title`, `description`, `keywords`, FAQ questions/answers,
  image alt text, headings, tables, list labels, disclaimers, and source notes.
- **Do not compress full entries into stubs unless the task explicitly asks for
  stubs.** Translations should preserve the source's meaning, examples,
  caveats, citations, and domain/protocol details. Glossary entries especially
  must not drop important protocol examples or term distinctions just because the
  prose is shorter.
- **Run a translation-completeness LQA before calling a locale batch done.** At
  minimum: compare a deterministic ~1% sample against English across every
  touched collection; scan for exact body copies after normalizing locale links;
  scan for unusually high English-word ratio in non-English files; and compare
  glossary body length against English to catch accidental stubs. Any sampled
  exact-copy or stub issue means search the sibling collection for the same
  pattern before shipping.

## Cross-linking & SEO

- Use `.agents/skills/cross-link/`. Link the **first natural mention only**;
  inbound links are **curated, ≤ 5 most-relevant pages per term**. Every internal
  link must resolve: `bun .agents/skills/cross-link/link-audit.ts <paths>` →
  **0 broken, 0 locale-mismatch**.
- Each language serves **its own page** — self-canonical + `hreflang` +
  `x-default`. Never canonicalize a translated page back to English.

## Keyword templates (`keywords:` frontmatter)

- **`content/keyword-templates.json`** is the shared, locale-aware base-pattern
  registry for TLD and glossary `keywords:` boilerplate (see
  [issue #276](https://github.com/d3servelabs/namefi-resources/issues/276)).
  `namefi-astra` expands it at render time and merges it with each page's own
  `keywords:` array (case-insensitive dedupe), so `astra`'s composed
  `<meta keywords>` and visible chip list are the union of the template
  expansion + the page's own list — never a change to this file alone.
- **Shape:** one file, two top-level keys — `tld` and `glossary` — each a map
  of `locale → string[]` phrase patterns. `{tld}` (the bare slug, e.g. `io`)
  and `{term}` (the page's own `title`) are the only placeholders; astra
  substitutes them verbatim.
- **`keywords:` semantics did not change name, only scope.** For a slug+locale
  the registry covers, write **only the 2-5 keywords genuinely unique to that
  page** — the template supplies the rest. A page with no template match (a
  locale the registry doesn't cover yet, or before the registry existed)
  renders its `keywords:` literally, exactly as before — **no re-authoring is
  required** for the existing ~260-file corpus; only newly-authored or
  deliberately-migrated pages need trimming. This is why one field name works
  for both eras: dedupe against a legacy full array just collapses the
  boilerplate that already matches the template output.
- Only include a boilerplate phrase in the registry if it is true for **every**
  page of that content type — e.g. `.{tld} domain` fits both open (`.com`) and
  closed dot-brand (`.abb`) TLDs, but `register .{tld} domain` does not (closed
  TLDs aren't registrable) — keep type-specific phrasing as a page's own extra.
- Translate new locale entries the same way as `termbase.json` (native-LQA
  sign-off, natural register, not word-for-word) — see Translations above.

## Validation, PRs, and publishing

1. **Per change:** `bun data:validate` + `bun lint:mdx` + `link-audit` (0 broken).
2. **PR description:** a Summary/Solution section, a Test plan, and — when a Claude
   session authored it — a redacted Claude session summary with ISO-8601 UTC
   timestamps. No secrets/PII.
3. **Review:** **ignore CodeRabbit** entirely. **Do not trigger or wait on Cursor
   Bugbot unless the maintainer explicitly asks** — the account setting is
   "Run only when mentioned", so a PR gets no automatic Bugbot review. If asked,
   comment `bugbot run` on the PR, then act on real findings. Otherwise rely on
   the local gate (`data:validate`, `lint:mdx`, link-audit) plus CI, and merge
   (non-author approval or admin override per repo policy).
4. **Publish:** merging to `main` auto-dispatches an `apps/resources/data`
   submodule bump. Astra waits for that exact pointer to merge, then publishes
   supported data-only changes to dev followed by production through full-page
   ISR. Unsupported content changes require the normal `release-resources`
   application release.

## Tooling (run from repo root)

| command | what it does |
|---|---|
| `bun data:validate` | frontmatter + date validation (blocking errors; warnings OK) |
| `bun lint:mdx` | eslint over `content/**/*.{md,mdx}` |
| `bun termbase:build` / `termbase:check` | (re)generate / verify `content/termbase.json` |
| `bun glossary:mentions` | per-term distinct-post mention counts — the L2-promotion demand metric |
| `bun check:termbase` | advisory linter: flags translated prose using a known non-canonical variant (`aliasesByLocale`) |
| `bun links:locale` | blocking same-locale route and English-source relationship check for Markdown/MDX plus related-content frontmatter (`--fix` repairs prefixes and relationship routes) |
| `bun links:test` | offline regression fixtures for the deterministic link checker |
| `bun .agents/skills/cross-link/link-audit.ts <paths>` | verify internal links (0 broken) |

> Shell notes for agents: the dev shell is often **fish** (`for x in $var` does
> not word-split — use `bash -c`); subprocesses can eat stdin in loops (add
> `</dev/null`); the lefthook pre-push can fail with a TTY "device not configured"
> error in non-interactive shells — run the validators by hand and push with
> `git push --no-verify`.

## Content scope

- `content/glossary/` — reference terms. **Own rules: [`glossary.md`](glossary.md).**
- `content/blog/` — articles; cluster/series taxonomy (validated by astra's
  `taxonomy.ts`); illustrations via the image-gen recipe.
- `content/tld/` — per-TLD pages (see `prompts/tld-page.md`).
- `content/{partners,authors,careers}/` — supporting content.

## Priority tiers (`priority:` frontmatter)

- **Optional** `priority: P0 | P1 | P2` marks editorial priority for surfacing /
  ordering content (translation order, featuring, SEO focus). Applies to
  glossary, TLD, and blog (incl. FAQ-selected articles). **Absent = P2**
  (normal) — only `P0`/`P1` are written explicitly; don't write `P2`.
- **Same value across all locales** — a concept's priority doesn't change by
  language. Set it on `en`, copy the identical value to every locale's same-slug
  file. `bun data:validate` enforces the `P0/P1/P2` enum.
- Build-time-only metadata; the astra renderer does not consume it yet. Seed
  buckets are signal-derived: glossary by `bun glossary:mentions` demand + `level`,
  TLDs by registration popularity, FAQ by foundational-ness.
