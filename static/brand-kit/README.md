# Namefi Brand Kit

This package contains Namefi logo and motion assets for approved references, editorial use, partnership materials, and product integrations.

## Included Assets

Every SVG logo asset is also included as:

- `png` - transparent raster export at the source SVG's intrinsic pixel size.
- `webp` - transparent lossless WebP export at the source SVG's intrinsic pixel size.
- `jpg` - high-quality JPEG export at the source SVG's intrinsic pixel size. JPEG does not support alpha, so these files are flattened onto a contrast-safe matte.

Logo dimensions:

- `namefi-logotype` - 132 x 43.
- `namefi-logotype-mono*` - 90 x 28.
- `namefi-compact*` - 34 x 24.
- `namefi-lottie-wordmark*` - 80 x 24.

Files:

- `assets/namefi-logotype.svg` - primary green Namefi logotype.
- `assets/namefi-logotype-mono.svg` - single-color source logotype.
- `assets/namefi-logotype-mono-green.svg` - green mono logotype.
- `assets/namefi-logotype-mono-ink.svg` - dark ink mono logotype.
- `assets/namefi-logotype-mono-white.svg` - white mono logotype.
- `assets/namefi-compact.svg` - compact mark exported from the first frame of the Namefi Lottie asset.
- `assets/namefi-compact-mono.svg` - single-color source compact mark.
- `assets/namefi-compact-white.svg` - white compact mono mark.
- `assets/namefi-compact-black.svg` - black compact mono mark.
- `assets/namefi-lottie-wordmark.svg` - final-frame wordmark exported from the Namefi Lottie asset.
- `assets/namefi-lottie-wordmark-mono.svg` - single-color final-frame wordmark.
- `assets/namefi_to_nfi.json` - animated Lottie mark that expands from compact mark to wordmark.

## Icon / Favicon Assets

Square and tight-cut versions of the compact `Nfi` mark (first Lottie frame),
intended for favicons, app icons, and avatars. Provided in `svg`, `png`, `webp`,
and `jpg`, on transparent and solid-black backgrounds.

- `namefi-compact-square*` - the mark centered in a 1:1 square with a uniform
  safe-area margin (the mark never touches an edge, so every edge is the
  variant's own background; the most common icon slot). PNG/WEBP/JPG at `32`,
  `64`, `128`, `256`, `512`, `1024`, `2048`, and `4096` px (e.g.
  `namefi-compact-square-256.png`).
- `namefi-compact-cut*` - the mark cut tight to its artwork (no padding, ~1.35:1).
  PNG/WEBP/JPG sized by width: `64w`, `128w`, `256w`, `512w`, `1024w`, `2048w`,
  `4096w` (e.g. `namefi-compact-cut-512w.png`).
- `*-black*` files place the mark on an opaque black background; files without
  `-black` are transparent. The `svg` of each is resolution-independent.

JPEG cannot store transparency, so transparent variants are flattened onto a
light matte and the black variants onto black.

## Full-Mark Square & Round Badges

Square and round versions of the full "Namefi" lockup (`namefi-logotype`, as
opposed to the compact `Nfi` icon above), for slots that want the full
wordmark rather than just the mark. Two families:

**Note on the letterforms:** the Namefi wordmark renders each letter as its
own tile with the letterform cut out as negative space — the letter shows
whatever sits *behind* it, not a fixed color. On a transparent canvas this
reads as tinted tiles with see-through letter shapes; on an opaque card
background, the letters pick up the card's own color. This is intentional
and is why the card family below always pairs a card color with a
contrasting mono tile color — the pairing is what makes the letters read
clearly.

- **Crop family** (`namefi-full-square*` / `namefi-full-round*`) — transparent
  canvas, safe-area only, no visible border. Same concept as
  `namefi-compact-square`/`-cut` above, extended to a round-safe variant and
  to the mono colorways:
  - `namefi-full-square` / `-square-white` / `-square-ink` — standard safe-area
    margin (mark never touches the square's edge).
  - `namefi-full-square-cut` / `-square-cut-white` / `-square-cut-ink` — tight
    crop, no added margin.
  - `namefi-full-round` / `-round-white` / `-round-ink` — standard margin
    sized against the *inscribed circle* (not just the square), so the mark
    clears a circular crop, not only a square one.
  - `namefi-full-round-cut` / `-round-cut-white` / `-round-cut-ink` — tightest
    crop that still clears a circle.
  - Single native-resolution PNG/WEBP/JPG per file (these are safe-area
    guides for design/dev use, not upload targets, so no size ladder).
- **Card family** (`namefi-full-square-card-*` / `namefi-full-round-card-*`) —
  opaque background badge with generous fixed padding (a colored card should
  never let the mark approach its own edge). 3 background colors, each paired
  with the contrasting mono tile color: `black` (white tiles), `white`
  (ink tiles), `green` (`#1cd17d`, white tiles).
  - Square cards come in 3 corner styles: `sharp` (square corners), `rounded`
    (~12% corner radius), `squircle` (~32% corner radius — a large-radius
    rounded rect, the common design-tool approximation of a superellipse, not
    a true one).
  - Round cards (`namefi-full-round-card-black/white/green`) use an actual
    circular background, not a rounded rect.
  - PNG/WEBP/JPG at `32`, `64`, `128`, `256`, `512`, `1024`, `2048`, `4096` px
    (e.g. `namefi-full-square-card-rounded-green-512.png`) — these are meant
    for direct upload as an avatar or app icon.

## Name Usage

Spell the brand name as `Namefi` in running text. Do not write `NameFi` or `NameFI`. Use `NAMEFI` only where full capitalization is required.

## Trademark And Usage Notice

The Namefi name, logos, marks, visual identity, and related brand assets are trademarks or trade dress of Namefi or its affiliates. Namefi reserves all rights in and to these assets.

Use of these assets is subject to ordinary trademark practice and any written brand or partner guidelines provided by Namefi. Do not use the assets in a way that suggests sponsorship, endorsement, affiliation, or approval by Namefi unless you have written permission.

Do not alter, distort, recolor, outline, animate, combine, or place the marks in a way that could confuse users or weaken the distinctiveness of the Namefi brand. Use mono-color variants only where a single-color mark is needed for contrast, production, or partner-lockup constraints.

This package does not grant ownership rights, trademark rights, or any license beyond the limited permission to use the included assets in accordance with applicable Namefi brand guidance and trademark law.
