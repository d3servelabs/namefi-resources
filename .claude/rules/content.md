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

> **Writing or translating?** The step-by-step playbook + hard-won lessons (model/scale choices, the
> en-first drafting flow, per-locale translation rules, a translation **error catalog** [Arabic-heavy],
> the post-batch QA + verification workflow, and the dev-vs-prod publish cadence) live in the
> [`content-authoring`](../../.agents/skills/content-authoring/SKILL.md) skill. This file is the rules;
> that skill is the how-to.

---

## Golden rules

- **English is the source of truth.** Author in `en` first; translate from
  English, never chain language→language. Every collection is English-first, then
  translated to all 7 locales (`en ar de es fr hi zh`).
- **Validate before you push:** `bun data:validate` + `bun lint:mdx` +
  cross-link audit (0 broken).
- **Only act on Cursor Bugbot** in PR review. **Ignore CodeRabbit** entirely.
- **Never force-push** a shared branch without explicit approval.

## Translations

- **Translate with Claude** (one focused pass per locale), **not** a Gemini batch
  script. There is no `translate-glossary` program — it was removed for implying a
  workflow we don't use. Use `content/termbase.json` as the reference for
  canonical per-locale titles + anchor text.
- **Honor explicit provider/model instructions.** If a task owner specifies a
  translation provider/model (for example, Codex-only), that instruction overrides
  the default above for that task. Never silently substitute Claude, Gemini, a
  third-party translation API, or another model/provider.
- **Model:** run drafting and translation agents on the **latest Claude Sonnet**
  (`claude-sonnet-4-6`), **not** Opus. Sonnet is sufficient for content/translation
  work and far cheaper; large fan-outs on Opus burn the session/usage limit fast.
  Reserve Opus for orchestration/judgement, not bulk content generation.
- **Translate fresh from English source; do not summarize.** A translated file
  must preserve the English source's content coverage: headings, section order,
  tables, lists, images/alt text, FAQs, source blocks, citations, and body
  substance. Do not use an existing locale file as the source for a re-translation;
  it may already be truncated, over-compressed, or stylistically contaminated.
- The translated **`title` is the canonical term** for that concept in that
  locale, reused site-wide — pick it deliberately. **zh titles are reviewed/signed
  off by the maintainer**; **`ar` uses modern Egyptian Arabic register** (not
  MSA), the natural register for a tech/business reader.
- Rewrite internal links `/en/…` → `/<locale>/…` when the target exists in that
  locale; **never change the slug**. Fall back to `/en/…` only when the locale
  counterpart does not exist, and make that fallback intentional. A link's anchor
  text = the linked term's canonical title in that locale.
- Keep verbatim: citation URLs (incl. `#:~:text=` fragments), code, brand names,
  domain names, and figures (`GoDaddy`, `ICANN`, `.com`, `$30`, `BIP-39`, …).
- Translate all human-facing metadata: `title`, `description`, `keywords`, FAQ
  questions/answers, visible table labels, headings, and image alt text. Keep
  product/protocol names in English only where local readers expect them. Do not
  leave English SEO residue such as `what is`, `why choose`, `tokenized domain`,
  `blockchain domains`, or `Web3 domains` in localized keyword arrays unless the
  phrase is deliberately part of the local search strategy.

### Translation quality gates

- **Completeness gate before LQA:** compare each translated file against its
  English source. For alphabetic locales, a body that is below ~70% of the English
  word count is presumed truncated or summarized unless the source is a short
  glossary stub. For Chinese, compare heading/section/table/list coverage and line
  shape instead of word ratio. If the file fails this gate, re-translate from
  English; do not attempt a polish-only pass.
- **Random sample every large batch:** after bulk translation, review a fresh
  random 1% sample per locale (minimum 4 files when the locale has hundreds of
  files). Read the sampled files end-to-end against English. If the sample finds
  truncation, broken markdown, repeated English residue, or systemic locale
  grammar issues, expand to deterministic sweeps and treat the batch as not
  production-ready.
- **LQA is not reconstruction.** LQA fixes tone, terminology, grammar, local
  idiom, and minor metadata problems. It does not recover missing content. Missing
  sections, heavily compressed articles, or template-like replacements require
  re-translation from the English source.
- **Markdown/link integrity:** preserve balanced Markdown links, especially
  citation URLs containing parentheses such as Wikipedia paths. Keep `#:~:text=`
  fragments intact. Run MDX lint and link audit; broken links or malformed source
  reference blocks block merge.
- **Locale-specific watch list from prior audits:**
  - Turkish (`tr-TR`): do not hard-append suffixes to Latin abbreviations or TLD
    tokens. Use natural Turkish typography and apostrophes where needed, e.g.
    `.io'dan`, `.ai'ye`, `TLD'yi`, `TLD'dir`, `IANA'da`, `.com'un`, `SEO'yu`,
    `HTTP'yi`. Avoid ASCII-only Turkish in body prose (`yalnizca`, `politikasi`,
    `sektoru`) and avoid English FAQ remnants such as `what is the ...`.
  - Spanish (`es`): audit same-locale links; `/en/tld/...` inside Spanish content
    is only acceptable when the Spanish target is missing. Keep register
    consistent (`tú` vs `usted`) within a page, avoid generic marketing filler,
    and normalize technical borrowings (`TLD`, `NFT`, `UX`, `fees`) deliberately.
  - Chinese (`zh`): body prose may keep expected technical names, but localized
    frontmatter/keywords and TLD pages should not carry English SEO boilerplate
    (`what is`, `why choose`, `tokenized domain`). Reduce translationese where the
    page should read like local editorial/product copy rather than a whitepaper.

## Cross-linking & SEO

- Use `.agents/skills/cross-link/`. Link the **first natural mention only**;
  inbound links are **curated, ≤ 5 most-relevant pages per term**. Every internal
  link must resolve: `bun .agents/skills/cross-link/link-audit.ts <paths>` →
  **0 broken, 0 locale-mismatch**.
- Each language serves **its own page** — self-canonical + `hreflang` +
  `x-default`. Never canonicalize a translated page back to English.

## Validation, PRs, and publishing

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

## Tooling (run from repo root)

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

## Content scope

- `content/glossary/` — reference terms. **Own rules: [`glossary.md`](glossary.md).**
- `content/blog/` — articles; cluster/series taxonomy (validated by astra's
  `taxonomy.ts`); illustrations via the image-gen recipe.
- `content/tld/` — per-TLD pages (see `prompts/tld-page.md`).
- `content/{partners,authors,careers}/` — supporting content.
