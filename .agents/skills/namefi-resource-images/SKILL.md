---
name: namefi-resource-images
description: Create, audit, regenerate, or QC Namefi resources images, especially blog OpenGraph covers in content/assets/*-og.* and inline article illustrations. Use this whenever working on Namefi blog/resource cover images, article illustrations, TLD guide images, or logo-safe social cards in the namefi-resources repository.
---

# namefi-resource-images

Use this skill for image work in `namefi-resources`: blog/resource OG covers, inline article illustrations, TLD guide images, and post-generation QA.

## Repository conventions

- Blog covers live at `content/assets/<slug>-og.<ext>`.
- English blog posts live at `content/blog/en/<slug>.md`; prioritize covers whose slug matches an English post.
- Keep inline article images unchanged unless there is an obvious edge cutoff, bad crop, or logo/art collision.
- Official Namefi logo source is the resources app `public/logotype.svg`. In the wider workspace this may be at `namefi-astra/main/apps/resources/public/logotype.svg`; use that official SVG rather than generated logo text.
- Final OG covers should be exactly `1200x630`.

## OG cover generation path

When regenerating covers, prefer this stable pipeline:

1. Generate a raw wide image with the direct OpenAI Image API path using `gpt-image-2`, not the built-in image tool, when explicit API/model control is required.
2. Generate native wide at `1216x640`.
3. Resize directly to `1200x630`.
4. Overlay the official Namefi logo after generation.
5. Keep raw API PNGs under `/tmp/img` or `/tmp/namefi-cover-regen`.
6. Commit only final repo assets, not temp sheets, raw PNGs, virtualenvs, prompts, or generated manifests.

If the API runner environment lacks the OpenAI SDK, use a temporary virtualenv under `/tmp/namefi-cover-regen/venv`; keep dependencies out of the repo.

## Layout guidance

Use a warm off-white cream background (`#F6F4EC`) with a subtle light-gray dot grid for Namefi OG covers unless the surrounding series already has a stronger established art direction.

For generated OG art:

- Headline block: upper-left, roughly `x 80-800`, `y 70-205`.
- Subtitle: below headline, roughly `x 85-970`, `y 215-260`.
- Main illustration: middle band, using center and right-side space so the card does not feel empty.
- Lower visual/domain row, if used: keep it left/middle, roughly `x 120-825`, `y 505-575`.
- Bottom-right logo reserve: keep `x 920-1180`, `y 515-610` free for the real Namefi logo.

The subtle lesson: do not reserve the whole right third. A cover with a safe logo but a dead right side feels unfinished. Put meaningful supporting art in the upper-right and center-right, then protect only the actual bottom-right logo rectangle.

## Logo reserve handling

Prompting alone is not reliable enough for logo-safe batches. Use deterministic post-processing when needed:

- Ask the model to leave the bottom-right logo rectangle empty.
- Inspect the raw output with a red reserve rectangle overlaid.
- If art intrudes into only the logo rectangle but the broader composition is good, clear just that rectangle to cream and lightly re-dot it before placing the official logo.
- Do not clear large areas or the whole right side; that creates the empty-space failure mode.
- Place the official logo centered within the reserve so it sits on calm background and does not cover art, text, route lines, tags, or labels.

## Audit workflow

Before changing images:

1. List all `content/assets/*-og.*`.
2. Map slugs to `content/blog/en/<slug>.md`.
3. Build labeled contact sheets for all OG covers.
4. Make close-up crop sheets for risky regions, especially bottom-right and bottom-left.
5. Mark only actual failures for regeneration.

Visual failure criteria:

- title/subtitle clipped at top or bottom
- lower domain row cut off
- important object touching or clipped by canvas edge
- Namefi logo overlapping text, labels, art, or route lines
- generated fake Namefi logo, fake publisher branding, signature, or watermark
- right side left visibly empty because the prompt over-reserved logo space

After regeneration:

1. Build raw-output contact sheets with the logo reserve rectangle.
2. Resize and overlay the official logo.
3. Build final contact sheets from the actual repo files.
4. Verify every changed OG cover is exactly `1200x630`.
5. Run `TMPDIR=/private/tmp bun run data:validate` and `TMPDIR=/private/tmp bun run lint:mdx`.

## Prompt notes

Keep the prompt strict about exact readable title/subtitle text, but assume the model may still add small diagram labels. Accept compact labels only when they help the visual analogy, are not in the logo reserve, and are not edge-clipped or misspelled. Regenerate or simplify when labels become noisy.

For brand-adjacent case studies, avoid exact trademark logo recreation unless the source already uses it deliberately and the context is clearly nominative. Prefer domain tags, route diagrams, storefront metaphors, maps, ledgers, keys, documents, and transfer flows.

## PR notes

For image-only PRs:

- Include before/after audit notes in the PR body.
- Mention raw API PNG location if relevant.
- List changed cover files.
- Mention validation and dimension checks.
- Keep the diff scoped to regenerated assets and any intentional local skill/docs updates.
