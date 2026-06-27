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
- **Model:** run drafting and translation agents on the **latest Claude Sonnet**
  (`claude-sonnet-4-6`), **not** Opus. Sonnet is sufficient for content/translation
  work and far cheaper; large fan-outs on Opus burn the session/usage limit fast.
  Reserve Opus for orchestration/judgement, not bulk content generation.
- The translated **`title` is the canonical term** for that concept in that
  locale, reused site-wide — pick it deliberately. **zh titles are reviewed/signed
  off by the maintainer**; **`ar` uses modern Egyptian Arabic register** (not
  MSA), the natural register for a tech/business reader.
- Rewrite internal links `/en/…` → `/<locale>/…`; **never change the slug**. A
  link's anchor text = the linked term's canonical title in that locale.
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
