---
name: content-authoring
description: Write (draft) and translate Namefi resources content — blog posts, glossary terms, TLD pages — in namefi-resources. Use this whenever drafting new English content OR translating English content into the other locales (especially bulk batches), and before publishing. Covers the model/scale choices, the en-first drafting playbook, the per-locale translation rules, a hard-won translation error catalog (Arabic-heavy), the post-translation QA + verification workflow, and the dev-vs-prod publish cadence. Complements the authoritative rules in `.claude/rules/content.md`, the `cross-link` skill, and the `namefi-resource-images` skill.
---

# content-authoring

The playbook for **drafting and translating** Namefi resources content. This is the *how-to + lessons*;
the **authoritative rules live in [`.claude/rules/content.md`](../../../.claude/rules/content.md)** (and
`.claude/rules/glossary.md` for glossary). When they conflict, the rules file wins — update it, then this skill.

Related skills: **`cross-link`** (internal link graph), **`namefi-resource-images`** (illustrations).

## Golden rules (don't relearn these the hard way)

- **English is the source of truth.** Author in `en` first; translate *from English*, never language→language.
- **Draft AND translate with Claude — never Gemini.** The Gemini tooling was deleted (`translate-blog.ts`/
  `generate-blog.ts`, the `@google/generative-ai` dep, `translate-blog.yml`). There is no batch translate script;
  translation is one focused Claude pass per locale.
- **Locales are repo-defined and growing** (`en ar de es fr hi zh`, and `ta`/others are being added). Don't hardcode
  the list — derive it from the content tree / `content.md`.
- **Only act on Cursor Bugbot** in review; ignore CodeRabbit. Never force-push a shared branch without approval.

## Model & scale (learned 2026-06-26, the expensive way)

- **Use the latest Claude Sonnet (`claude-sonnet-4-6`) for drafting and translation agents — NOT Opus.** In a workflow,
  pass `agent(prompt, { model: 'sonnet', ... })`. Sonnet is more than enough for content/translation and far cheaper.
  A large Opus fan-out (177 translation agents) burned the Claude **session/usage limit** mid-run ("session limit ·
  resets 1pm PT") and had to be split across the reset. Reserve Opus for orchestration/judgement, not bulk content.
  (Codified in `content.md` → Translations § "Model:".)
- **Throttle concurrency.** ~16 concurrent agents trips Anthropic 429s; ~7 is usually safe; the user may ask for **2**
  to be safe. Run in sequential batches (`await parallel(pair)` per chunk) + a 3-pass retry loop for stragglers
  (429s, "connection closed", session-limit). Expect transient failures and re-run only the failed (slug, locale) pairs.
- **A truncated agent leaves artifacts.** A run killed mid-write can leave a partial file ending in `</content>` /
  `</invoke>` / tool tags. Always scan after (see QA below); the body is often complete — strip the trailing tag lines
  rather than re-translating.

## Drafting (English-first)

1. One Claude writer per post. Read `domain-flipping.md` (or a sibling) first for house voice.
2. **Verify every citation** by fetching a public 200 page; use inline `#:~:text=` fragments + a
   `## Sources and further reading`. Never ship unverified domainer claims (drop-cycle days, UDRP test, fees).
3. Frontmatter: `title`, `date`, `language: en`, `tags`, `authors: ['namefiteam']`, `description` (≤155),
   `keywords` (10–15), `ogImage`, + taxonomy `cluster`/`series`/`seriesOrder`/`format`.
   **`seriesOrder` must be a positive integer (1-based)** — astra's build rejects `0`; standalone `data:validate`
   does NOT catch it (build-only failure). Keep series order contiguous.
4. Internal links per the `cross-link` skill. Illustrations per `namefi-resource-images`.

## Translation (one Claude pass per locale)

Per `content.md`. Translate FRESH from the EN source — don't read/copy the old locale file (re-translations):

- Set `language: <locale>`. **Translate** `title`, `description`, `keywords`. Keep **verbatim**: `date`, `tags`,
  `authors`, `draft`, `cluster`, `series`, `seriesOrder`, `format`, `ogImage` (image path).
- **`ar` = modern Egyptian Arabic register** (not MSA). **`zh` titles are maintainer-reviewed** — pick the canonical
  term deliberately from `content/termbase.json`.
- **Internal links:** rewrite the prefix `/en/…` → `/<locale>/…`, **never change the slug**. Anchor text = the linked
  term's canonical title in that locale (use `termbase.json`).
- **Keep verbatim:** citation URLs (incl. `#:~:text=` fragments), code, brand/protocol/standard names (UDRP, ACPA,
  ICANN, ENS, NFT, ERC-721, OpenSea, Seaport, Afternic, Sedo, GoDaddy, NameBio, SEO), domain names, figures/numbers/dates.
- **Do not ship link-only localization.** A file with `language: <locale>` and localized `/en/` links but English body
  copy is still untranslated. Translate all human-facing content: body prose, headings, image alt text, table/list
  labels, FAQ questions/answers, disclaimers, source notes, `title`, `description`, and `keywords`.
- **Do not collapse full English entries into short locale stubs unless the task explicitly asks for stubs.** Preserve
  the source meaning, examples, caveats, citations, and protocol/domain details. Glossary translations must retain the
  definition's important examples and distinctions (for example EPP status code names and registrar-vs-registry
  differences), not just a generic one-sentence summary.
- YAML: double an apostrophe inside single-quoted scalars (`''`), never backslash. First line must be `---`. No code
  fences, no `<content>`/tool tags anywhere.

### Translation error catalog — what actually goes wrong

These are real defects caught in shipped batches. **The error rate concentrates in Arabic** (the Egyptian register is
the hardest target); EN-derived `de/es/fr/hi/zh` came out structurally clean. So: **always run a dedicated Arabic
accuracy QA pass after any bulk translation** (one Sonnet agent per `ar` file, diffing against the EN, fixing only clear
errors — no restyling). Check for these classes:

- **Untranslated keywords** — the `keywords:` array left byte-identical to English. Detect: compare each locale's
  `keywords:` line to the EN line; identical ⇒ not translated. Fix: translate the human phrases, keep brand/standard
  names. (One batch left 17 files like this; Bugbot flagged 1, a sibling scan found the other 16.)
- **Wrong-sense word choices** (translator picked a literal but wrong meaning):
  - "invented/fake personas" → `المخترعين` (inventors) ✗ → `الوهميين` (fictitious) ✓
  - "squatting *profile*" (risk posture) → `ملف` (a file/document) ✗ → `وضع` (posture) ✓
  - "domain *reseller*" → `بيع بالجملة` (wholesale) ✗ → `إعادة بيع` (reselling) ✓
  - "end-user *premium*" → `عمولة` (commission) ✗ → `علاوة سعر` (price premium) ✓
  - "retired" (e.g. a product) → `قاعدت` (sat) ✗ → `أوقفت` (discontinued) ✓
- **Registrant vs registrar** — the meaning-critical pair. `registrant` = the owner (`صاحب الدومين` / `المسجَّل`, *fatha*);
  `registrar` = the accredited company (`المسجِّل`, *kasra*). Easy to flip; check every occurrence.
- **Meaning-inverting errors** — a negation or comparative rendered as its opposite. Highest-severity:
  - "thinner/thinnest chance/premium" rendered `أرفع` (higher/highest) ✗ → `أضعف` (weaker/thinnest) ✓
  - garbled "never": `تعمر ما تتصرف` (reads like the verb "you build") ✗ → `عمرك ما تتصرف` (you never act) ✓
- **Hallucinated additions** — examples/brands invented and injected that aren't in the EN source, e.g. adding
  "(مثل OpenSea، Blur)" to a *domain* marketplace link (OpenSea/Blur are NFT marketplaces, not domain aftermarkets).
  Translate only what's there; never add specifics the source didn't name.

## QA & verification (run after any batch, before merge)

1. **Artifact scan** all touched files: first line is `---`; frontmatter parses; NO ``` fences; NO `</content>` /
   `</invoke>` / `<parameter` / tool tags (especially the *last* lines — truncation marker); every `](/en/` rewritten
   to `](/<locale>/`; `language:` correct; not truncated (length sanity).
2. **Translation-completeness LQA** for every locale batch:
   - Compare a deterministic ~1% sample against the English source, stratified across touched collections (`blog`,
     `glossary`, `tld`, `partners`, `authors`). Check meaning, frontmatter, FAQ, links, images/alt text, tables, and
     whether prose is natural in the target language.
   - Scan for exact body copies after normalizing `/<locale>/` links back to `/en/`. Exact copies are release-blocking.
   - Scan for high English-word ratios in non-English files; allow brand/protocol/domain names, but investigate whole
     English sentences, English FAQ/frontmatter, or copied TLD sections.
   - For glossary, compare body length/detail against English. Large shrinkage can mean the entry became a stub and
     lost examples, caveats, or protocol-specific details. If a sample catches one, audit sibling entries.
   - If one sampled file has a pattern, search the rest of the same collection/locale for that pattern before shipping.
3. `TMPDIR=/private/tmp bun run data:validate` (pass + ~19 pre-existing warnings) and `bun run lint:mdx`.
   (Fresh worktree? run `bun install` first or eslint can't resolve `@eslint/eslintrc`.)
4. `bun .agents/skills/cross-link/link-audit.ts <paths>` → **0 broken, 0 locale-mismatch** (1 `missing-translation`
   warning is OK — app serves the en fallback).
5. **Dedicated Arabic accuracy QA pass** (see error catalog) — non-negotiable for bulk batches.
6. **Bugbot handling:** it reviews a *sample/diff*, so **one flag often means several siblings** — when it flags an
   issue, grep the rest of the corpus for the same pattern and fix them all. Reply to each thread in a human voice and
   **resolve threads one-by-one as you fix them — never bulk-auto-resolve** (a bulk resolver once closed a thread before
   the fix, hiding a real finding; caught only via the comment-count delta).

### Verification false-positive trap (cost ~2h once — don't repeat)

When verifying a **re-translation** is live (content of an existing page changed, slug unchanged), a naive
`curl … | grep "<translated phrase>"` gives **false positives**: the *old* version (e.g. Gemini's) often shares the
phrase, so the marker matches stale content and you wrongly conclude "deployed."
- Derive a marker that is **provably in the new version AND absent from the prior commit**:
  `git show <oldsha>:content/blog/<L>/<slug>.md | grep -c "<phrase>"` must be **0**, and `git show <newsha>:…` ≥ 1.
- Cross-check `x-vercel-cache` / `age` headers and the prod release tag's submodule pin. A stale page = an old release,
  not a failed build.

## Publish & prod cadence (so "merged" ≠ "live on prod")

namefi.io/r serves the `apps/resources/data` **submodule pin** in namefi-astra — see
`[[namefi-resources-publish-pipeline]]`. Merging in namefi-resources only auto-deploys **dev**:
- Every bump → astra `main` → `deploy-resources.yml` (push to main) deploys **dev** (`namefi.dev/r`).
- **PROD (`namefi.io/r`) only deploys on an `astra-resources/v*` release tag** — created by the daily `0 11 * * *`
  cron (gated by repo var `AUTO_DEPLOY_RESOURCES`) or a manual run. So an overnight merge sits on dev until ~11:00 UTC.
- To ship prod now (a deliberate action; get explicit OK):
  `gh workflow run release-resources.yml --repo d3servelabs/namefi-astra --ref main -f forceRelease=true`
  → tags a release → prod deploy (~13 min end-to-end). Verify with a provably-unique marker (above).

## PR & review

PR body per `.rulesync` standards (Summary/Solution + Test plan + redacted Claude session summary, ISO-8601 UTC).
Drive **Bugbot** to green (act on it, ignore CodeRabbit), then merge per repo policy. The pre-push hook can fail on a
TTY error in non-interactive shells — run the validators by hand and `git push --no-verify`.
