---
targets:
  - '*'
root: false
description: >-
  Trigger when building or changing UI that must work in both LTR and RTL
  locales (Arabic), or when adding/translating i18n strings — prefer logical
  CSS (start/end) over physical (left/right), set direction from the locale
  registry, and keep bidi-safe.
globs:
  - apps/frontend/src/**/*.tsx
  - apps/resources/src/**/*.tsx
  - apps/frontend/src/app/globals.css
cursor:
  alwaysApply: false
  description: >-
    Prefer logical CSS (start/end) over physical (left/right) and keep layouts
    RTL-safe; set direction from the locale registry.
---

# i18n & RTL: write layouts that flip, not break

This app ships **right-to-left locales** (currently `ar-EG`). Direction is set
once on `<html dir>` from a typed locale registry — `getDirection(locale)` in
`apps/frontend/src/i18n/config.ts` (`localeDirections: Record<Locale, Direction>`),
`localeDirections` + `isRtlLocale` in `apps/resources/src/i18n-config.ts`. Once
`dir="rtl"` is on the document, **the browser, CSS logical properties, and
Tailwind's `rtl:` variants do the mirroring for you — but only if you wrote
direction-relative styles.** Physical `left`/`right` do **not** flip; they stay
pinned and the layout breaks in Arabic.

## The core rule: logical, not physical

When a component uses left/right for position, spacing, or alignment, use the
**start/end** (logical) equivalent so it mirrors automatically. This is the
single most common RTL bug — a control, icon, or animation that visually points
or grows toward the wrong side in Arabic.

| Don't (physical, pinned) | Do (logical, flips) |
|---|---|
| `text-left` / `text-right` | `text-start` / `text-end` |
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `items-start` is fine; physical `justify-` with hard sides | `justify-start` / `justify-end` (these are already logical in Tailwind) |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |
| CSS `padding-left` / `margin-right` / `left:` | `padding-inline-start` / `margin-inline-end` / `inset-inline-start` |
| CSS `border-left` | `border-inline-start` |

**Alignment too, not just spacing.** "Start-align" and "end-align" mean
`text-start`/`text-end` and `items`/`justify` toward the logical start/end —
never hard-code `text-left` for "default" text or `text-right` for "trailing"
content. In RTL the start *is* the right.

### `space-x-*` is a trap — use `gap`

`space-x-*` does **not** set the `gap` property; it injects a *physical*
`margin-left` on every child but the first (via `:not([hidden]) ~ :not([hidden])`),
and that margin does **not** flip in RTL — so inter-item spacing lands on the
wrong side. Migrate to `gap-x-*` (PR #4659 converted 60 tokens). The discipline:

- Only convert `space-x-N` → `gap-x-N` when the **same element also has**
  `flex` / `inline-flex` / `grid` / `inline-grid` (incl. responsive `md:flex`) —
  that element is the container, and `gap` only applies to flex/grid. Preserve
  the value and any variant prefix (`sm:space-x-2` → `sm:gap-x-2`).
- **Leave `space-y-*`** (vertical, RTL-irrelevant) untouched.
- Two legit *physical* `space-x` uses that must NOT be converted: negative
  overlap stacks (`-space-x-2` avatar/icon stacks — there is no negative `gap`),
  and arbitrary `space-x-[6ch]` on a non-flex element like `<pre>`.
- `divide-x` has the same physical-border issue; if used on an RTL surface,
  reach for a `gap` + bordered children or `border-s` instead.

### Animations and transforms are the sharp edge

Transforms and any motion baked into an asset are physical by definition, so
direction-dependent reveal/expand must be mirrored explicitly — and a *fixed
width* hides the bug entirely. The real case in this app (PR #4631, the
expanding Lottie brand mark — `apps/frontend/src/components/brand-logo.tsx`,
`expanding-lottie-mark.tsx`): a sidebar logo that morphs the compact "Nfi" mark
into the full "Namefi" wordmark. Two RTL bugs and their fixes:

- **It expanded toward the wrong side.** The reveal was a *fixed-width canvas*
  with the L→R direction baked into the Lottie asset, so in Arabic it still
  opened left→right instead of from the inline-start (right) edge.
  - Fix 1 — make it a **real width animation** (`transition-[width]` between
    collapsed and expanded), not a static canvas, so there's a direction to
    mirror.
  - Fix 2 — the **double-mirror trick**: `-scale-x-100` on the clip container so
    the reveal grows toward the inline-start, and `-scale-x-100` on the Lottie
    *inside* so the wordmark un-flips and still reads correctly. Net: a leftward
    expand with non-reversed text.
- **The collapsed rail rendered blank in RTL** — the LTR-designed mark got
  clipped out once RTL right-anchored the box. Fix: pin just the mark box to
  `dir="ltr"` and anchor the logo block at the sidebar's **inline-start** edge.
- **Hydration discipline:** the morph fired on mount before `useIsMobile()`
  settled, so the logo animated right after hydration. Gate animation behind an
  effect-set `animationsReady` flag plus a `prevExpanded` ref so **hydration
  snaps to the correct frame and only user toggles animate**; for Lottie, snap
  to the right frame in `onDOMLoaded`.

General rules this case teaches:
- Prefer a logical `transform-origin: inline-start`; if you must use a physical
  origin/translate, gate it behind `rtl:` (e.g. `rtl:-translate-x-full`) or
  compute the sign from `getDirection(locale)` — never assume positive-x =
  forward.
- Pin genuinely LTR-designed sub-art (a logo, a code glyph) to `dir="ltr"` so it
  isn't clipped/reordered, while the *container* stays direction-aware.
- Position movers logically. The sidebar collapse trigger moved from physical
  `left` to **`inset-inline-start`** (`transition-[inset-inline-start]`) so it
  tracks the sidebar edge. Note an **inline `style={{ left }}` ignores `dir`
  entirely** (even more invisible than a physical class) — use
  `style={{ insetInlineStart }}`.

### Directional icons: mirror with `rtl:-scale-x-100` (the one place `rtl:` is required)

A logical class can't fix a glyph, so add `rtl:-scale-x-100` (purely additive,
no-op in LTR; in Tailwind v4 it uses the CSS `scale` property, so it composes
with existing `rotate-*`). A back arrow still pointing left in Arabic points
*forward*.

- **Mirror** horizontal directional glyphs: `ChevronLeft/Right`, `ChevronsLeft`,
  `ArrowLeft/Right`, `PanelLeftIcon` — back buttons, breadcrumbs, pagination,
  step "next", disclosure chevrons.
- **Do NOT mirror:** symmetric glyphs (`ArrowRightLeft` swap icon), vertical-axis
  ones (`ChevronUp/Down`, `ChevronsUpDown`, `ArrowUp/Down`), logos/brand marks,
  checkmarks, and spinners. (A `ChevronDown` mirror is a visual no-op, so an
  unconditional flip on a dynamic `ChevronDown|ChevronRight` alias is safe.)
- **Gotchas:** icon-name greps also match keyboard `event.key === 'ArrowLeft'`
  strings — read context. Grep `*Icon` aliases and local `const Chevron = …`
  too. The `rtl:-scale-x-100` token is easy to silently drop in a merge
  conflict — verify it survives. (PR #4658 mirrored ~36 instances / 27 files.)

If a value genuinely cannot be expressed logically, use Tailwind's `rtl:` /
`ltr:` variants to supply both — never leave only the LTR value.

## Components & tools with physical defaults — override them

- **shadcn `Sheet`/drawer is physical.** Its variants key on `data-[side=left|right]`
  → `left-0`/`right-0`, `border-r/l`, and physical slide animations
  (`slide-in-from-left/right`), and the default `side` is `right`. A mobile
  drawer/sidebar that omits `side` opens from the wrong edge in RTL. Drive it
  from direction: `side={isRtl ? 'right' : 'left'}` so it opens from the
  **inline-start** edge (PR #4656).
- **Client components that branch layout on direction** (e.g. which edge a
  drawer opens) can read it with a small `useDirection()` hook that reads
  `document.documentElement.dir` in an effect — but it returns `null` on the
  server / first render, so tolerate `null` to avoid a hydration mismatch.
  Server components already have the locale: use `getDirection(locale)`.
- **Don't reuse desktop `collapsed` state to gate UI inside the mobile drawer** —
  they're different surfaces. `state === 'collapsed'` also hid the version
  footer inside the open mobile drawer; the fix was `state === 'collapsed' &&
  !isMobile`.

## Migrating an existing codebase (codemod discipline)

Most of an RTL migration is a mechanical physical→logical sweep — do it as a
**safe-mode codemod** that only makes swaps which render **byte-identical in
LTR** (LTR users see zero change; only RTL gains correct behavior). PR #4629
did ~673 such edits across 187 files. Defer anything needing judgment.

- **Guard substring false positives:** `rounded-l` vs `rounded-lg`, `border-l`
  vs `border-l`-in-`lg`; disambiguate before rewriting. Negative margins migrate
  too (`-ml-*` → `-ms-*`).
- **Only rewrite class lists** — never tokens inside strings, identifiers,
  comments, SVG paths, or `event.key` values. Don't touch vertical
  borders/radius (`border-t/b`, `rounded-t/b`).
- For `space-x`→`gap`, gate the substitution on a flex/grid keyword on the line
  (see the `space-x` trap above).
- **Gate the diff:** assert zero physical inline-axis utilities remain and that
  the only non-component file touched is the config/registry.

## Bidi: protect LTR islands inside RTL text

Domain names, addresses, hashes, code, numbers, and brand terms (`Namefi`,
`NFSC`, `0x…`, `example.com`) are LTR runs that sit inside RTL sentences. Without
isolation, adjacent punctuation and digits get reordered and render garbled.

- Wrap LTR data embedded in translated text in `<bdi>` (or `dir="ltr"`), and use
  `dir="auto"` on fields that echo arbitrary user input.
- Keep brand/technical terms in Latin script (don't transliterate `Namefi`,
  `NFT`, `USDC`, `ENS`, tx hashes, chain IDs).

## Direction & locale setup (don't re-invent it)

- **Never set direction with client JS or a media query.** Read it server-side
  from the locale so SSR and hydration agree and there's no direction flash —
  `<html dir={getDirection(locale)}>`.
- **Keep all locale facts in the one registry** (`i18n/config.ts`): `locales`,
  `localeDirections`, `localeLabels`, `localeDateLocales`, `NAMESPACES`. The
  `Record<Locale, …>` types make adding a locale fail to compile until every
  map is filled in — that's intentional; fill them, don't loosen the type.
- **Tailwind v4 ships logical utilities (`ms/me/ps/pe/start/end/border-s/e/...`)
  and `rtl:`/`ltr:` variants natively** — no RTL PostCSS plugin and no
  `tailwind.config` (v4 is CSS-first). The variants are keyed to `[dir=rtl]`, so
  they do nothing until `<html dir>` is set — that one attribute is the switch.
- **Format dates/numbers with `Intl.*` keyed off the per-locale BCP-47 tag**
  (`localeDateLocales`), with an `en` fallback. Never hardcode a formatted date
  or a locale-specific number/currency string; keep frontmatter dates ISO 8601.

## Strings & translation hygiene

- **English is the single source of truth.** Add new keys to `messages/en/*`
  first; translate from English, never chain language→language.
- **Place keys by the hierarchy rule** (`.rulesync/rules/i18n-translation-keys.md`
  when present): generic atom → `common`; cross-feature reusable → `shared`;
  otherwise the feature namespace. Promote a key only on its **second** consumer
  — speculative promotion leaves dead keys.
- **A new UI string means adding the key to every locale.** Rely on the
  compile-time key types (`messages.d.ts`) plus the English-deep-merge runtime
  fallback; don't ship a key that exists only in `en` as a "real" translation.
- **Match tense/person to the screen state.** Don't use present-tense /
  first-person copy ("we're processing…") on a completed or failed screen, and
  don't quote an English button label inside help text when that button is
  translated elsewhere — these are the recurring review findings on translation
  PRs.
- **JSON safety for translators:** never put a raw `"` inside a JSON value; use
  the language's guillemets/quotes (German and French agents break parsing
  otherwise).
- **`ar-EG` targets the Egyptian app register**, not Modern Standard Arabic —
  professional Egyptian as used by local fintech apps, not slang and not Gulf
  MSA.

## Verify before claiming done

- Toggle the locale to `ar-EG` and **look**: nothing pinned to the wrong side,
  no LTR islands garbled, icons/animations mirrored, scrollbars/affordances on
  the start edge. Watch for spacing landing on the wrong side (the `space-x`
  tell) and a mobile drawer opening from the wrong edge.
- **Storybook's locale toolbar does NOT set the `dir` attribute** — wrap RTL
  stories in `<div dir="rtl">` and ship static `…RTL` stories for each
  direction×state combo (static states are what caught the logo hydration bug),
  not just one interactive story.
- Beware **"mobile/responsive" PRs that aren't framed as RTL** — they still
  introduce physical `text-left`/`left-0`/`translateX` debt. Apply the
  logical-class discipline in review regardless of the PR's title.
- Trust **flattened-key parity** (dotted-path set vs `en`) over an agent's
  self-counted key totals — agents miscount their own output.
- Validate ICU with `@formatjs/icu-messageformat-parser` (next-intl's parser),
  not regex — regex produces false positives on text inside plural/select
  branches.
