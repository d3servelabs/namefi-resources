---
name: namefi-resource-images
description: Create, regenerate, or QC Namefi resources images — OpenGraph/Twitter cover cards (content/assets/<slug>-og.jpg) and inline article illustrations (content/assets/<slug>-NN-name.jpg) for blog posts, TLD pages, and other content in namefi-resources. Use this whenever generating or revising any cover image or illustration for content in this repo.
---

# namefi-resource-images

The single source of truth for generating Namefi resources imagery: cover/OG
cards and inline article illustrations. **Always use this skill (and its two
scripts) when asked to generate a cover image or an illustration for content in
this repo** — do not invent a different style.

## House style (non-negotiable)

A **vivid, colorful, flat-vector editorial illustration** — clean, friendly,
modern infographic, the opposite of stock-photo or antique/etched art:

- **Background:** warm off-white cream `#F6F4EC` filling the ENTIRE frame edge
  to edge (full bleed, no border, no frame), overlaid with a subtle faint
  light-gray dot grid.
- **Subject:** rich, full-color, using **accurate brand-inspired colors** for
  whatever the piece is about (Buffer blue, Snapchat yellow, a confident web
  blue for `.com`, etc.). Simple flat shapes, a clear single visual analogy,
  calm negative space.
- **Never:** photographs, 3D renders, drop shadows, heavy gradients, dark or
  blurred backgrounds, dark-blue/purple-dominant palettes, isometric pixel-art.
  Per the user's standing aesthetic: light background, no dark-blue/purple, no
  pixel-art.
- **Text in art:** short, crisp, correctly spelled. The model (ChatGPT Image 2 /
  `gpt-image-2`) renders headings, subtitles and small labels itself — it is
  good at legible text — so we pass the exact strings and let it draw them. Do
  **not** post-overlay title text with PIL.
- **Model:** `gpt-image-2`, `quality: "high"`. Covers generate at `1216x640`;
  inline illustrations at `1536x1024`.

## Conventions

- **Covers:** `content/assets/<slug>-og.jpg`, final **1200×630**, progressive
  JPEG. The slug must match the content file (`content/blog/en/<slug>.md`,
  `content/tld/en/<slug>.md`, …).
- **Inline images:** `content/assets/<slug>-NN-<name>.jpg`, **1200×675** (16:9)
  unless another ratio is needed; referenced from Markdown as
  `![descriptive alt text](../../assets/<file>.jpg)`. A referenced file MUST
  exist before the content is built (the resources app statically imports it).
- **Namefi logo:** always the **official** logotype, never model-drawn. Source:
  `namefi-astra/main/apps/resources/public/logotype.svg`, rasterized with
  `rsvg-convert`. It goes **TOP-RIGHT** on **both covers and inline
  illustrations** (so a corner is reserved empty for it at generation time). On
  covers, the bottom ~22% is additionally kept empty as bleed for the caption
  X/Twitter overlays along the bottom edge.
- **No cutoff, generous bleed.** On every image the scene must stay compact and
  centered with a comfortable empty cream margin all around — nothing (object,
  label, plant, coin, character, letter) may touch, run off, or be clipped by any
  edge. Do not fill the frame edge-to-edge with content.
- File sizes: covers ~90–200 KB, inline ~60–180 KB.

## The two scripts (use these)

Both read `OPENAI_API_KEY` from the environment. `namefi-resources` has no
Infisical project, so inject the key from **namefi-astra's** Infisical, running
from a dir that has its `.infisical.json`:

```bash
cd ~/ws/d3servelabs/namefi-astra/main
~/dotfiles/tools/infisical/with-secret.sh --match '^OPENAI_API_KEY$' --as OPENAI_API_KEY -- \
  bash <repo>/.agents/skills/namefi-resource-images/og-cover.sh \
    <repo>/content/assets/<slug>-og.jpg \
    "Headline line 1" "Headline line 2" "Subtitle." \
    "Scene: the visual analogy, brand colors, simple flat shapes."
```

- **`og-cover.sh <out_jpg> <h1> <h2> <subtitle> <visual>`** — the cover/OG card
  harness. Encodes the strict layout map (headline upper-left, subtitle below,
  illustration centered, **top-right logo reserve**, **empty bottom bleed
  band**), generates at 1216×640, resizes to 1200×630, composites the real
  logotype top-right, saves progressive JPEG q92.
- **`inline-illustration.sh <out_jpg> <scene> [heading] [--no-logo] [--size WxH]`**
  — full-bleed inline illustration in the same flat-vector style. Optional short
  heading top-left + the Namefi logo **top-right** (use `--no-logo` for purely
  decorative scenes). Enforces compact-centered scene with no edge cutoff.
  Default 1200×675.

Batch covers by reading a TSV of `<file>\t<h1>\t<h2>\t<subtitle>\t<visual>` and
calling `og-cover.sh` per row (≤4 in parallel is comfortable).

### Writing good `<visual>` prompts

Name a single concrete analogy and the brand colors; let the headline carry the
explanation. Examples that produced the shipped set:

- Buffer: *"Buffer blue social scheduling cards, a bank statement, calendar
  pages, and an arrow from BufferApp.com to Buffer.com, bright startup-office
  palette."*
- `.com` TLD: *"a lineup of domain address bars where a large crowned blue
  `.com` bar stands tallest over shorter `.net/.org/.io/.ai` bars, a globe and
  connection lines behind, cursor on `.com`."*

For brand-adjacent stories use brand-inspired colors and motifs (tags, arrows,
storefronts, keys, receipts, maps) — **not** exact trademark logo recreations.

## Per-image visual QC (mandatory)

Image models are non-deterministic; open every generated file and check:

1. **Bleed / margin** — cream runs to all four edges with no border/frame, AND
   the scene floats inside a generous empty cream margin (nothing crammed to the
   edges).
2. **No cutoff** — headline, subtitle, every label, object, plant, coin and
   character is fully inside the frame; nothing touches or is clipped by an edge.
   This applies to **covers and inline illustrations alike**.
3. **Logo** — official logotype sits **TOP-RIGHT** on empty cream (covers and
   inline both), not overlapping any subject/text; it is the real logo, not
   model-drawn.
4. **Bottom bleed (covers)** — a cover's bottom ~22% is empty cream (room for the
   social caption); nothing important sits there.
5. **Spelling** — all in-image text correct and matches the intended strings.

If an image fails, regenerate just that one (tweak the prompt: pull content
toward center, reinforce the empty reserves, shorten/relocate text), re-inspect,
and **cap at 3 attempts** — then report which image and which check kept failing
rather than shipping a broken one. Note any regeneration in the PR.

## Validate & PR

- After referencing new images: `TMPDIR=/private/tmp bun run data:validate` +
  `bun run lint:mdx`, and confirm every referenced asset exists at the exact
  path. Verify cover dimensions are 1200×630.
- For image PRs, list changed files, note any regenerations and why, and keep the
  diff scoped to assets + their Markdown references (+ intentional skill edits).
- Commit only final repo assets — not temp PNGs, prompt files, or response JSON.
