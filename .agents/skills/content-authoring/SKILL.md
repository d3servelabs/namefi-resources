---
name: content-authoring
description: Draft (write) NEW English Namefi resources content — blog posts, glossary terms, TLD pages — in namefi-resources. Use this whenever authoring new English content, before publishing. To TRANSLATE English content into the other locales (single files or bulk batches, plus translation QA), use the `article-translation` skill instead. Covers the model/scale choices, the en-first drafting playbook, citation verification, frontmatter/taxonomy rules, post-draft QA, and the dev-vs-prod publish cadence. Authoritative rules live in `.claude/rules/content.md`.
---

# content-authoring

The playbook for **drafting English** Namefi resources content. This is the *how-to + lessons*;
the **authoritative rules live in [`.claude/rules/content.md`](../../../.claude/rules/content.md)** (and
`.claude/rules/glossary.md` for glossary). When they conflict, the rules file wins — update it, then this skill.

> **Translating, not drafting?** Use the **[`article-translation`](../article-translation/SKILL.md)** skill.
> The full studio method, the per-locale frontmatter/link rules, the Arabic-heavy translation **error catalog**,
> and the translation QA + verification workflow now live there.

Related skills: **`article-translation`** (translate EN → other locales), **`cross-link`** (internal link graph),
**`namefi-resource-images`** (illustrations).

## Golden rules (don't relearn these the hard way)

- **English is the source of truth.** Author in `en` first; everything else is translated *from English*.
- **Draft with Claude — never Gemini.** The Gemini tooling was deleted (`generate-blog.ts`, the
  `@google/generative-ai` dep). Drafting is a focused Claude pass per post.
- **Locales are repo-defined and growing** (`en ar de es fr hi zh`, and `ta`/others are being added). Don't
  hardcode the list — derive it from the content tree / `content.md`.
- **Only act on Cursor Bugbot** in review; ignore CodeRabbit. Never force-push a shared branch without approval.

## Model & scale (per `content.md` — authoritative)

Follow the model convention in `content.md` → Translations §. As of this writing it pins the **latest Claude
Sonnet (`claude-sonnet-4-6`) for content agents, not Opus** — Sonnet is sufficient and far cheaper; large Opus
fan-outs burn the session/usage limit fast. Reserve Opus for orchestration/judgement. When batching writers,
throttle concurrency (~7 concurrent is usually safe; ~16 trips Anthropic 429s) and scan for truncation
artifacts after (a killed agent can leave a file ending in `</content>` / tool tags — strip the trailing lines
rather than rewriting).

## Drafting (English-first)

1. One Claude writer per post. Read `domain-flipping.md` (or a sibling) first for house voice.
2. **Verify every citation** by fetching a public 200 page; use inline `#:~:text=` fragments + a
   `## Sources and further reading`. Never ship unverified domainer claims (drop-cycle days, UDRP test, fees).
3. Frontmatter: `title`, `date`, `language: en`, `tags`, `authors: ['namefiteam']`, `description` (≤155),
   `keywords` (10–15), `ogImage`, + taxonomy `cluster`/`series`/`seriesOrder`/`format`.
   **`seriesOrder` must be a positive integer (1-based)** — astra's build rejects `0`; standalone `data:validate`
   does NOT catch it (build-only failure). Keep series order contiguous.
4. Internal links per the `cross-link` skill. Illustrations per `namefi-resource-images`.

## QA & verification (after drafting, before merge)

1. **Artifact scan** all touched files: first line is `---`; frontmatter parses; NO ``` fences; NO `</content>` /
   `</invoke>` / `<parameter` / tool tags (especially the *last* lines — the truncation marker); length sanity.
2. `TMPDIR=/private/tmp bun run data:validate` (pass + ~19 pre-existing warnings) and `bun run lint:mdx`.
   (Fresh worktree? run `bun install` first or eslint can't resolve `@eslint/eslintrc`.)
3. `bun .agents/skills/cross-link/link-audit.ts <paths>` → **0 broken, 0 locale-mismatch**.
4. **Bugbot handling:** it reviews a *sample/diff*, so **one flag often means several siblings** — when it flags
   an issue, grep the rest of the corpus for the same pattern and fix them all. Reply to each thread in a human
   voice and **resolve threads one-by-one as you fix them — never bulk-auto-resolve** (a bulk resolver once
   closed a thread before the fix, hiding a real finding; caught only via the comment-count delta).

## Publish & prod cadence (so "merged" ≠ "live on prod")

namefi.io/r serves the `apps/resources/data` **submodule pin** in namefi-astra — see
`[[namefi-resources-publish-pipeline]]`. Merging in namefi-resources only auto-deploys **dev**:
- Every bump → astra `main` → `deploy-resources.yml` (push to main) deploys **dev** (`namefi.dev/r`).
- **PROD (`namefi.io/r`) only deploys on an `astra-resources/v*` release tag** — created by the daily `0 11 * * *`
  cron (gated by repo var `AUTO_DEPLOY_RESOURCES`) or a manual run. So an overnight merge sits on dev until ~11:00 UTC.
- To ship prod now (a deliberate action; get explicit OK):
  `gh workflow run release-resources.yml --repo d3servelabs/namefi-astra --ref main -f forceRelease=true`
  → tags a release → prod deploy (~13 min end-to-end). Verify with a provably-unique marker.

## PR & review

PR body per `.rulesync` standards (Summary/Solution + Test plan + redacted Claude session summary, ISO-8601 UTC).
Drive **Bugbot** to green (act on it, ignore CodeRabbit), then merge per repo policy. The pre-push hook can fail on a
TTY error in non-interactive shells — run the validators by hand and `git push --no-verify`.
