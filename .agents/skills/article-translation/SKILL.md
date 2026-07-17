---
name: article-translation
description: Translate existing Namefi resources content (blog posts, glossary terms, TLD pages) from the English source into the other locales, at professional-studio quality. Use this whenever translating EN content into another locale — single files or bulk batches — and for QA/repair of existing translations. Covers the studio method (brief → mine → audit → translate → bilingual review → monolingual edit → QA → rendered LQA → change management), the per-locale frontmatter/link rules, a hard-won translation error catalog (Arabic-heavy), and the Definition-of-Done gate. Drafting English content is the `content-authoring` skill; authoritative rules live in `.claude/rules/content.md`.
---

# article-translation

The playbook for **translating** Namefi resources content from the English source into the
other locales, at the quality bar of a professional translation studio. This is the *how-to +
lessons*; the **authoritative rules live in [`.claude/rules/content.md`](../../../.claude/rules/content.md)**
(and `.claude/rules/glossary.md` for glossary). When they conflict, the rules file wins — update it, then this skill.

Treating translation as string conversion is the failure mode this skill exists to prevent. The goal is a
constrained editorial publishing workflow: understand the source, reuse terminology and style, translate
with the right level of freedom, preserve structural and semantic coverage, and verify before publication.

Related: **`content-authoring`** (drafting English content), **`cross-link`** (internal link graph),
**`namefi-resource-images`** (illustrations).

## Golden rules (don't relearn these the hard way)

- **English is the source of truth.** Translate *from* `en`, never language→language. Translate **fresh from
  the EN source** — don't read/copy the old locale file (that propagates the prior translation's errors).
- **Translate meaning, not strings.** A faithful translation preserves intent, reader effect, and factual
  claims; it need not preserve English sentence boundaries when the target reads better restructured.
- **Faithful ≠ literal — match the target's natural register.** Especially for product/UI copy: choose the
  *domain-correct* sense of a polysemous word, and use the established native term rather than a transliteration
  of a common word (only brand / protocol / ticker / standard names and code stay in the source script). Stiff,
  formal, or word-for-word prose reads as machine-translated even when it's "accurate". **Native-speaker LQA is
  canonical** — fold a reviewer's validated correction into that locale's glossary/term notes and grep-fix every
  sibling occurrence, rather than re-deciding it per file.
- **Production and validation are separate.** Translation/edit/review produce; validators check coverage,
  structure, links, numbers, code spans. Neither replaces native-language judgement.
- **Locales are repo-defined and growing.** Don't hardcode the list — derive it from the content tree /
  `content.md`.
- **No invented content.** Never add explanatory text, examples, or claims not in the source (the MQM
  "addition" error — as serious as omission), unless the brief explicitly authorizes transcreation.
- **Independent review beats self-review.** The monolingual edit and QA passes should run with a fresh
  context, not the same agent that drafted. Self-review is anchored to its own choices and to the source.
- **Only act on Cursor Bugbot** in review; ignore CodeRabbit. Never force-push a shared branch without approval.

## Model & scale (per `content.md` — authoritative; learned the expensive way)

Follow the model/scale convention in `content.md` → Translations §. As of this writing it pins the **latest
Claude Sonnet (`claude-sonnet-4-6`) for translation agents, not Opus** — Sonnet is sufficient and far cheaper;
a large Opus fan-out (177 agents) burned the session/usage limit mid-run. The rules file is the source of
truth for the current choice; this skill defers to it.

- **Throttle concurrency.** ~16 concurrent agents trips Anthropic 429s; ~7 is usually safe; the user may ask
  for **2**. Run sequential batches (`await parallel(pair)` per chunk) + a 3-pass retry loop for stragglers
  (429s, "connection closed", session-limit). Re-run only the failed `(slug, locale)` pairs.
- **A truncated agent leaves artifacts.** A run killed mid-write can leave a file ending in `</content>` /
  `</invoke>` / tool tags. Always scan after (see QA); the body is often complete — strip the trailing tag
  lines rather than re-translating.

## Workflow

### 1. Translation brief
Before drafting, fix: target locale **variant** (e.g. `zh-CN` vs `zh-TW`, `ar` = modern Egyptian Arabic
register, not MSA); content type (blog / glossary / TLD / policy); purpose (educate/persuade/convert/document);
reader profile; author↔reader relationship; **translation freedom** (faithful / localized adaptation / SEO
transcreation / tightly-constrained technical); and the required **invariants** (see §7).

### 2. Repo & context mining
Inspect for existing norms before drafting: existing translations in the same locale; same series/cluster
articles; `content/termbase.json` (canonical per-locale titles + anchor text); frontmatter conventions; MDX
components; same-locale link patterns; the rules files. **Classify what you find by trust level** — *canonical*
(published & reviewed), *useful* (needs judgement), *suspicious* (likely machine-translated/stale/incomplete),
*forbidden* (known-bad wording). Reuse canonical, never reuse forbidden.

### 3. Source audit
Audit the EN source for high-risk elements: repeated core nouns/verbs/concepts (glossary candidates); ambiguous
pronouns / implied subjects / unclear scope; numbers, percentages, dates, prices, rankings, claims; legal /
compliance / financial / safety-sensitive wording; citations, external links, source/reference blocks;
image alt text, tables, lists, FAQs, blockquotes, code; idioms, humor, metaphors, puns, slogans; SEO-sensitive
titles/descriptions/keywords. **If meaning is unclear, raise translator queries — do not guess silently.**

### 4. Glossary & style setup
Use `content/termbase.json` as the canonical termbase. For terms not yet in it, build a working glossary:
source term, preferred target, usage note, context example, forbidden alternatives, keep-untranslated flag.
**Term matching must tolerate grammatical inflection** (case/gender/number) in languages that inflect, so
consistency checks don't false-flag legitimate word forms. Set a style profile: register, sentence rhythm,
address style, brand posture, and a **local SEO posture (natural target-language search phrases over literal
English)**.

**Establish the locale's borrowing convention** before drafting: for each foreign term decide between (a) a
native translation, (b) transliteration into the **native script**, or (c) keeping it verbatim in the source
script. Locales differ in how aggressively they nativise, and product-UI register differs from casual/social
text. The default that matches well-localized major apps (Apple / Google / Meta): translate ordinary words that
have a native term, transliterate entrenched borrowings into the native script (don't leave a common word in the
source script mid-sentence), and keep verbatim only brand/product names and global standard acronyms/tickers/codes
(the locale's analog of how those apps keep `Wi-Fi`/`USB`/`Bluetooth` while translating everything around them).
**Ground specific renderings in an authoritative, locale-maintained terminology source** — **Microsoft
Terminology** (a Terminology Search + downloadable `.tbx` on Microsoft Learn; the former *Language Portal* is
retired) first, then Apple/Google style guides, CLDR, and
the product's own already-localized strings — checking the language generally, the term's class, and the exact
term. Use these as guidance, not gospel (coverage thins for low-resource languages; the source carries its own
product flavour); reconcile with the product's register, and let native-LQA be the final arbiter. Persist the
resolved choices in the working glossary / `termbase.json` so each term is decided once and reused.

### 5. Segmentation & mapping
Assign stable IDs to source units (frontmatter fields, headings, paragraphs, list items, table rows/cells,
FAQ Q/A, image alt text, blockquotes, source blocks, MDX visible text). Segment IDs are a **review and
coverage tool, not a command to write literal 1:1 sentences** — the target may split, merge, or reorder
sentences within a block when it reads better.

### 6. Translation strategy (depth scales with risk & language resourcing)
**Granularity is constant: translate block-by-block with the full document in context** — whole-document
single-shot drafting is the top trigger of summarizing-omission. What varies is verification depth:
- High-resource languages (`zh es de fr` + `ja ru` when added) can draft then move to segment-level bilingual review.
- Lower-resource / error-prone pairs (e.g. `ar hi`) translate at paragraph/section level with frequent
  glossary + coverage checks.
- **CJK is not judged by whitespace word ratio** — use structural/semantic-unit coverage, character/line
  sanity, and native readability.
- **RTL (`ar`)** needs directionality, punctuation, number, link, and rendered-layout checks.
- **High-risk segments** (legal/compliance/financial/safety/critical numbers) and low-resource pairs add a
  **back-translation spot check**: translate the target segment back to English in a fresh context and confirm
  the meaning round-trips.

### 7. Draft translation — invariants & per-locale rules
- **Frontmatter:** set `language: <locale>`. **Translate** `title`, `description`, `keywords` (translate the
  human phrases; keep brand/standard names). Keep **verbatim**: `date`, `tags`, `authors`, `draft`, `cluster`,
  `series`, `seriesOrder`, `format`, `ogImage` (image path). The translated **`title` is the canonical term**
  for that concept in that locale — pick deliberately from `termbase.json`; **`zh` titles are maintainer-reviewed**.
- **Internal links:** rewrite the prefix `/en/…` → `/<locale>/…`, **never change the slug**. Anchor text = the
  linked term's canonical title in that locale (use `termbase.json`). Prefer same-locale targets; English
  fallback must be intentional, not accidental.
- **Keep verbatim:** citation URLs (incl. `#:~:text=` fragments), code/inline-code, brand/protocol/standard
  names (UDRP, ACPA, ICANN, ENS, NFT, ERC-721, OpenSea, Seaport, Afternic, Sedo, GoDaddy, NameBio, SEO),
  domain names.
- **Numbers:** factual figures (statistics, stated prices, dates, rankings) **preserve their value but
  localize their format** (decimal/thousands separators, currency placement, date order); illustrative example
  numbers may be converted only when the brief authorizes localization.
- **YAML:** double an apostrophe inside single-quoted scalars (`''`), never backslash. First line must be `---`.
  No code fences, no `<content>`/tool tags anywhere.
- Translate **all** visible text: body, alt text, table content, FAQ content, source labels — not just prose.
  **Link-localized English is not a translation:** a file with `language: <locale>` and localized `/en/` links
  but English body copy is still untranslated.
- **Don't compress full entries into stubs** unless the task explicitly asks for stubs. Preserve the source's
  meaning, examples, caveats, citations, and domain/protocol details. Glossary entries especially must retain
  protocol examples and term distinctions (e.g. EPP status-code names, registrar-vs-registry differences), not
  collapse to a one-sentence summary.

### 8. Bilingual review
Source + target together: every source segment has an intentional target counterpart; no claim, caveat,
condition, number, date, URL, code span, or citation dropped or changed; heading hierarchy and intent
preserved; table/list shape preserved unless a documented localization choice explains a change; glossary
terms consistent. Record glossary exceptions and translation notes.

### 9. Monolingual edit (source hidden, fresh context)
Read **only** the target — source hidden, fresh context (reading the source here collapses this back into
another bilingual review and defeats its purpose). Does it read as native, publishable prose? Right register
and author↔reader relationship? Titles/headings natural for the locale? Would a reader trust it as a real
localized article, not a machine translation? This pass is what catches accurate-but-awkward prose.

### 10. Automated QA
Run the deterministic gates (see "QA & verification" below). Classify all findings — from every pass — under a
standard error typology so reports are comparable across reviewers and languages:
- **Categories:** accuracy (mistranslation / omission / addition), fluency (grammar/spelling/punctuation),
  terminology (glossary adherence), locale convention (formats/directionality), style/register.
- **Severity:** S0 critical (wrong/dangerous meaning, dropped claim, broken render), S1 major, S2 minor
  (awkward but correct), S3 nit — the same scale used elsewhere in the house.

### 11. Rendered LQA
Inspect the rendered page, not only the Markdown: desktop + mobile layout, CJK line breaks / RTL direction,
tables/lists/callouts/MDX components, alt text & captions, links & related-content modules, social/SEO
metadata, and any visual overlap / clipped text / awkward wrapping. (Eyeball via headless Chrome over CDP,
per workspace convention.)

### 12. Change management & provenance
On future source updates: track source segments (hash), detect changed/added/deleted/moved units,
**re-translate only changed units** when safe, re-review adjacent context for flow, and **report stale
translations explicitly** rather than letting them silently drift. Record provenance for the output
(production method, date, whether a human/native LQA pass was done, reviewer, source revision) so a
machine-only draft is distinguishable from a reviewed translation. *(Provenance frontmatter fields are a
proposed enhancement — confirm `data:validate` accepts new keys before adding them.)*

## Translation error catalog — what actually goes wrong

Real defects caught in shipped batches. **The error rate concentrates in Arabic** (the Egyptian register is the
hardest target); EN-derived `de/es/fr/hi/zh` came out structurally clean. So: **always run a dedicated Arabic
accuracy QA pass after any bulk translation** (one agent per `ar` file, diffing against the EN, fixing only
clear errors — no restyling). Classes to check:

- **Untranslated keywords** — the `keywords:` array left byte-identical to English. Detect: compare each
  locale's `keywords:` line to EN; identical ⇒ not translated. Fix: translate the human phrases, keep
  brand/standard names. (One batch left 17 files like this; Bugbot flagged 1, a sibling scan found the other 16.)
- **Wrong-sense word choices** (literal but wrong meaning) — pick the *domain-correct* sense of a polysemous
  source word, not the first dictionary hit: a platform *ecosystem* is not a natural *environment*; *finance /
  financial services* is not *donating*; a commerce *product* is not a generic *object/material*. Examples:
  - "invented/fake personas" → `المخترعين` (inventors) ✗ → `الوهميين` (fictitious) ✓
  - "squatting *profile*" (risk posture) → `ملف` (a file/document) ✗ → `وضع` (posture) ✓
  - "domain *reseller*" → `بيع بالجملة` (wholesale) ✗ → `إعادة بيع` (reselling) ✓
  - "end-user *premium*" → `عمولة` (commission) ✗ → `علاوة سعر` (price premium) ✓
  - "retired" (e.g. a product) → `قاعدت` (sat) ✗ → `أوقفت` (discontinued) ✓
- **Registrant vs registrar** — the meaning-critical pair. `registrant` = the owner (`صاحب الدومين` / `المسجَّل`,
  *fatha*); `registrar` = the accredited company (`المسجِّل`, *kasra*). Easy to flip; check every occurrence.
- **Meaning-inverting errors** — a negation or comparative rendered as its opposite. Highest-severity:
  - "thinner/thinnest chance/premium" rendered `أرفع` (higher/highest) ✗ → `أضعف` (weaker/thinnest) ✓
  - garbled "never": `تعمر ما تتصرف` (reads like "you build") ✗ → `عمرك ما تتصرف` (you never act) ✓
- **Hallucinated additions** — examples/brands invented and injected that aren't in the EN, e.g. adding
  "(مثل OpenSea، Blur)" to a *domain* marketplace link (OpenSea/Blur are NFT marketplaces, not domain
  aftermarkets). Translate only what's there; never add specifics the source didn't name.

- **Over-literal register (translationese)** — renders that are word-accurate but read as stiff, formal, or
  machine-translated for the surface. Match the register the surface actually needs: product/UI copy (nav,
  buttons, cart/checkout, totals, CTAs) wants the natural, idiomatic phrasing a native user expects, not
  textbook prose. This is what the monolingual edit (§9) exists to catch; weight it heavily for short UI strings,
  where there is no surrounding context to carry an awkward choice.
- **Gratuitous transliteration** — phonetically romanising a *common* source word that has an established native
  equivalent, instead of using the real target word (a "cart total" or "product" label spelled out by sound
  rather than translated). Only genuine brand / protocol / ticker / standard names and code stay in the source
  script (per §7's keep-verbatim list); ordinary nouns and verbs get the native term.
- **Chinese contributor names** — use the contributor's maintainer-confirmed Chinese name in `zh-CN` display
  copy while preserving the author slug and references: `Fenwei Bian` → `卞芬薇` (not the English display name).

## QA & verification (run after any batch, before merge)

1. **Artifact scan** all touched files: first line is `---`; frontmatter parses; NO ``` fences; NO `</content>` /
   `</invoke>` / `<parameter` / tool tags (especially the *last* lines — the truncation marker); every `](/en/`
   rewritten to `](/<locale>/`; `language:` correct; length sanity (not truncated).
2. `TMPDIR=/private/tmp bun run data:validate` (pass + ~19 pre-existing warnings) and `bun run lint:mdx`.
   (Fresh worktree? run `bun install` first or eslint can't resolve `@eslint/eslintrc`.)
3. `bun .agents/skills/cross-link/link-audit.ts <paths>` → **0 broken, 0 locale-mismatch** (a `missing-translation`
   warning is OK — the app serves the en fallback).
4. **Translation-completeness LQA** for every locale batch:
   - Compare a deterministic ~1% sample against the EN source, stratified across touched collections
     (`blog`, `glossary`, `tld`, `partners`, `authors`) — meaning, frontmatter, FAQ, links, images/alt text,
     tables, and whether prose is natural in the target.
   - Scan for **exact body copies** after normalizing `/<locale>/` links back to `/en/` — exact copies are
     release-blocking.
   - Scan for **high English-word ratios** in non-English files; allow brand/protocol/domain names, but
     investigate whole English sentences, English FAQ/frontmatter, or copied TLD sections.
   - For glossary, compare **body length/detail** against EN — large shrinkage can mean an accidental stub.
   - If one sampled file shows a pattern, search the rest of that collection/locale for it before shipping.
5. `bun check:termbase` — advisory linter; flags translated prose using a known non-canonical variant.
6. **Coverage validator** (semantic translation-unit coverage, [issue #143](https://github.com/d3servelabs/namefi-resources/issues/143))
   — when available, run it to prove structural/unit coverage (missing headings/paragraphs/FAQs, dropped
   citation URLs, table-shape drift). It proves coverage, **not** idiomatic quality — it does not replace the
   human passes above.
7. **Dedicated Arabic accuracy QA pass** (see error catalog) — non-negotiable for bulk batches.
8. **Bugbot handling:** it reviews a *sample/diff*, so **one flag often means several siblings** — when it flags
   an issue, grep the rest of the corpus for the same pattern and fix them all. Reply to each thread in a human
   voice and **resolve threads one-by-one as you fix them — never bulk-auto-resolve** (a bulk resolver once
   closed a thread before the fix, hiding a real finding; caught only via the comment-count delta).

### Verification false-positive trap (cost ~2h once — don't repeat)
When verifying a **re-translation** is live (content of an existing page changed, slug unchanged), a naive
`curl … | grep "<translated phrase>"` gives **false positives**: the *old* version often shares the phrase, so
the marker matches stale content and you wrongly conclude "deployed."
- Derive a marker **provably in the new version AND absent from the prior commit**:
  `git show <oldsha>:content/blog/<L>/<slug>.md | grep -c "<phrase>"` must be **0**, and `git show <newsha>:…` ≥ 1.
- Cross-check `x-vercel-cache` / `age` headers and the prod release tag's submodule pin. A stale page = an old
  release, not a failed build.

## Quality gate (Definition of Done)
A translation is publishable only when: semantic coverage + structural checks pass (no missing units / drift);
glossary/terminology checks pass; same-locale link correctness holds (any en fallback marked intentional); no
open **S0/S1** findings remain; and the required LQA flag is set for content whose risk level needs native
review. Below-target content is reported explicitly, never published silently.

## Publish & prod cadence
namefi.io/r serves the `apps/resources/data` **submodule pin** in namefi-astra — see `[[namefi-resources-publish-pipeline]]`
and the `content-authoring` skill's publish section. Merging here only auto-deploys **dev**; **prod
(`namefi.io/r`) deploys on an `astra-resources/v*` release tag** (daily cron gated by `AUTO_DEPLOY_RESOURCES`,
or a deliberate manual run with explicit OK). Verify with a provably-unique marker (above).

## PR & review
PR body per `.rulesync` standards (Summary/Solution + Test plan + redacted Claude session summary, ISO-8601 UTC).
Drive **Bugbot** to green (act on it, ignore CodeRabbit), then merge per repo policy. The pre-push hook can fail
on a TTY error in non-interactive shells — run the validators by hand and `git push --no-verify`.
