# namefi-resources — agent guide

This repo holds the **content** behind the Namefi resources site (blog, glossary,
TLD pages, partners, authors, careers), consumed as the `apps/resources/data`
submodule inside [`d3servelabs/namefi-astra`](https://github.com/d3servelabs/namefi-astra).

The authoritative content/workflow rules live in
[`.claude/rules/content.md`](.claude/rules/content.md) (English-first authoring,
translation, cross-linking, validation, publishing). Read it before changing
content. Drafting and translation playbooks live in the skills under
[`.agents/skills/`](.agents/skills/).

## Production releases

When the user asks you to "do a prod release", "prod promotion", or similar,
assume they mean to use the existing release/deploy GitHub Actions workflow
checked into `.github/workflows/` for this repo or its publishing path. It is
fine to use `gh workflow run` or `gh run watch` only to dispatch and observe that
checked-in workflow; do not replace the workflow with ad hoc local or `gh`
commandline release steps unless the user explicitly asks for that.

## Images — always use the `namefi-resource-images` skill

**Whenever you are asked to generate or revise a cover image (OpenGraph/Twitter
card) or any illustration for content in this repo, use the
[`namefi-resource-images`](.agents/skills/namefi-resource-images/SKILL.md)
skill — every time, no exceptions.** Do not invent a different visual style or a
one-off generation pipeline.

That skill is the single source of truth for the house style and ships the two
generators to use:

- `og-cover.sh` — cover/OG cards → `content/assets/<slug>-og.jpg` (1200×630).
- `inline-illustration.sh` — inline article illustrations →
  `content/assets/<slug>-NN-<name>.jpg`.

House style in one line: **vivid flat-vector editorial illustration on a warm
cream `#F6F4EC` dot-grid background, full bleed, brand-inspired colors, crisp
model-rendered text, official Namefi logo composited top-right on covers, with an
empty bottom band reserved for social-caption overlays** — generated with
ChatGPT Image 2 (`gpt-image-2`). See the skill for the exact prompt template,
layout map, logo handling, and the mandatory per-image visual QC.

## Validate before pushing

`TMPDIR=/private/tmp bun run data:validate` + `bun run lint:mdx`, and confirm
every referenced image asset exists. See `.claude/rules/content.md` for the full
validation/publish cadence.
