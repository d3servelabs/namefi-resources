# OG image system — design spec (v10)

Interactive sketch: [`docs/og-layout-sketch.html`](./og-layout-sketch.html) — open it in a browser; it renders all
four renditions at true resolution with toggles for fallback/custom art, 10 locales, output scale, zone overlays,
and a simulated X title overlay. Layout guideline was measured from the live production OG
(`email-sender-reputation-arms-race-og`), which is the visual reference.

## Two types, one layout

- **Custom**: the article has its own focus illustration (Layer 1 = art master).
- **Fallback**: no per-article art (Layer 1 = brand motif background; the 1:1 becomes a plain brand tile).

Same slot geometry either way. Three layers: canvas (art or motif) → localized text → brand wordmark.

## Renditions (output at 2×)

| Rendition | Size @2× | Layout | Consumed by | Declared via |
|---|---|---|---|---|
| 1.91:1 | 2400×1260 | title + subtitle, panoramic focus strip | X, Slack, Discord, LinkedIn, iMessage | `og:image` (first) · `twitter:image` |
| 16:9 | 2400×1350 | same slots, taller focus crop | Google Discover, Article rich results; doubles as hero | Article JSON-LD `image[]` |
| 4:3 | 2400×1800 | same slots, focus shows nearly the full master | Google Article rich results | Article JSON-LD `image[]` |
| 1:1 | 2400×2400 | badge: focus crop above · rule · wordmark band ≈ ⅓ height, **no title** | Google SERP thumb, WhatsApp, Telegram | JSON-LD `image[]` · `og:image` (second) |

Google requirements: all three of 16:9/4:3/1:1 in Article JSON-LD at ≥1200px wide; pages send
`robots: max-image-preview:large`; images crawlable. JPG quality ~75; keep 1:1 under ~300 KB (WhatsApp
drops oversized previews), others under ~500 KB. 3× adds nothing after platform recompression.

## Title-rendition geometry (1200-based coordinate system; multiply by 2 for output)

- Bleed: 60px all sides — croppable, scene/background only.
- X-reserve: bottom 130px — **art OK, our text never** (X stamps its own title chip bottom-left).
- Content margin `m`: 84 (16:9 family) / 96 (4:3).
- Title: ≤2 lines, base 46px bold (shrink-to-fit floor 32), top at y=70, width ≤840.
- Subtitle: one quiet line, 27px at 66% ink, baseline = title last baseline + 46. Truncate with ellipsis.
- Wordmark: real `static/brand-kit/namefi-logotype.svg` at 40px tall, top-right, 64px inset (inside bleed).
  No kicker, no accent rule.
- Focus: full content width (`m` to `W−m`), from subtitle baseline + 34 down to `H−90` (90px clear
  bottom strip). Height therefore flexes with title length — short titles buy a taller scene.
- 1:1 badge: focus crop 900×675 at top, hairline rule (y≈765), wordmark 921×300 centered below
  (band = bottom ~⅓). Fallback 1:1: single 840-wide wordmark centered, nothing else.

## Standard focus asset (the per-article deliverable)

One **16:9 master** per article, ≥1920×1080 (2× of the largest crop), composed as a **wide left-to-right
scene**: subject cluster strung horizontally through the central band, calm top/bottom margins, no text,
no logos. Each rendition crops its own height from it. This makes LLM/image-model generation a fixed,
repeatable prompt template where only the subject description changes, and corner/edge QC automatable.

## i18n

Text is never baked into the art. Per-locale strings (title, subtitle) render in the template with
per-script font stacks (Latin / SC / JP / KR / Devanagari / Tamil / Naskh), CJK per-character wrapping,
and Arabic RTL right-aligned within the same slots. The 1:1 carries no text at all → one file serves all
locales. Per article: 3 renditions × N locales + 1 icon.

## Implementation direction (next step)

React `<OgCard>` component in namefi-astra's resources app + Storybook stories (one per rendition,
controls for locale/type/title), rendered to static JPGs via headless Chrome CDP at
`deviceScaleFactor: 2` (wait for `document.fonts.ready`). Storybook's `iframe.html?id=…` bare render is
the production render surface. Satori was considered and rejected: weak Arabic shaping.
