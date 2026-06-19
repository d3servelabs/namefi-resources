---
targets:
  - '*'
root: false
description: Trigger when making a desktop-first UI work on phones — adapting tables, dialogs, toolbars, filter panels, or any dense/wide component for a small viewport.
globs:
  - apps/frontend/src/**/*.tsx
  - apps/resources/src/**/*.tsx
  - packages/ui/src/**/*.tsx
cursor:
  alwaysApply: false
  description: Adapt desktop-dense UI (tables, dialogs, toolbars) to mobile-friendly layouts — reuse logic, switch only layout.
---

# Mobile-Responsive UX for Desktop-First Components

A desktop layout that "works" on a phone by horizontally scrolling, overflowing,
or shrinking text below readability is **not** mobile-friendly. When a component
is dense or wide (a data table, a multi-column dialog, a packed toolbar), adapt
its **layout** for small viewports — but keep one source of truth for behavior.

## Core principle: switch layout, reuse logic

Never fork a component into a separate "mobile version" that re-implements the
data, state, or actions. The mobile view should be a different **arrangement** of
the *same* cells, handlers, and state. One bug fix, one behavior — two layouts.

- Detect viewport with the shared hook, not a one-off media query:
  `import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile'`.
- Drive both layouts off the same row model / state. In My Domains the mobile
  cards render from the *same* `table.getRowModel()` rows as the desktop table,
  so sort, search, filter, and pagination keep working unchanged.
- Compose the same cell components in both layouts. `DomainCard`
  (`apps/frontend/src/components/my-domains/domain-card.tsx`) reuses the exact
  column cells the desktop table uses (domain name, actions `⋯` menu, selection
  checkbox, auto-renew/expiry/price, DNS status, owner/chain, Auto-ENS) — only
  the arrangement changes from horizontal columns to a labeled card.

## Tables → cards (the canonical case)

`ExtensibleDataTable`
(`apps/frontend/src/components/table/extensible-data-table.tsx`) has an **opt-in**
mobile path. Prefer it over inventing a new one:

- Pass `renderMobileCard?: (row: Row<TData>) => ReactNode` (and optional
  `cardListHeader`). When provided **and** `useIsMobile()` is true, rows render
  as a vertical stack of cards instead of the horizontally-scrolling `<table>`.
- **Opt-in is mandatory for safety:** tables that don't pass the prop are
  unchanged at every breakpoint. Don't make table mobile-behavior global.
- In card mode the toolbar stacks (full-width search) and the "Columns"
  visibility control is hidden (it's meaningless without columns).
- See `apps/frontend/src/components/my-domains/table.tsx` for the wiring: a
  memoized `renderMobileCard` that maps each row to a `<DomainCard>`.
- Document any deliberate drop. My Domains omits the table's "select-all this
  page" header checkbox on mobile (each card keeps its own checkbox) — that's a
  conscious tradeoff, called out in the PR, not an oversight.

## Centered dialogs → bottom sheets

A centered modal (`top-1/2 left-1/2 -translate-1/2`) floats awkwardly and can
overflow a phone. Dock it to the bottom as a slide-up sheet (the iOS
action-sheet pattern) on `max-sm`, desktop untouched.

- Apply the shared class on `<DialogContent>`:
  `import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet'`
  then `className={cn(MOBILE_BOTTOM_SHEET_DIALOG, …)}`.
- It only adds `max-sm:` overrides, so it composes with the dialog's own
  `sm:max-w-*` etc. The base `DialogContent` pins itself dead-center with high
  specificity, so the overrides use `!` (important) to win the cascade — that's
  intentional, don't strip it.

## Other desktop-dense offenders

- **Fixed pixel widths wider than a phone.** A `w-[400px]` panel overflows a
  375px screen. Make it full width on mobile (`max-sm:w-full` / responsive
  width). See the fix in
  `apps/frontend/src/components/table/table-filter-panel.tsx`.
- **Packed toolbars.** Stack controls vertically on mobile and give search full
  width instead of cramming a desktop row.
- **Tab bars / segmented controls.** Let them wrap rather than overflow.
- **Truncated identifiers.** Long values (addresses, hashes) need a compact
  form on cards — e.g. `AddressWithChain` can always show a short address.

## Always do

- **Respect the safe area.** Bottom-pinned UI (sheets, action bars) needs
  `pb-[max(<base>,env(safe-area-inset-bottom))]` so it clears the home indicator.
- **Keep chrome minimal.** A layout wrapper that only positions a control should
  carry layout utilities (`shrink-0`, padding, safe-area) and nothing
  decorative — no divider/background/shadow unless it masks something. (See the
  `ux-minimal-chrome` rule.)
- **Localize new copy.** New labels added for the mobile layout (e.g. card field
  labels) must land in every locale under `apps/frontend/messages/<locale>/`,
  not just `en`.
- **Verify on a real phone width.** Don't trust desktop devtools alone — check
  at ~390px (iPhone) using `?skip_auth=1` for auth-gated pages (see the
  `local-testing-skip-auth` rule). Confirm: no horizontal scroll, tap targets
  ≥ ~44px, text readable without zoom, sticky/bottom UI clears the safe area.

## Reference

Pattern established in PR
[#4632](https://github.com/d3servelabs/namefi-astra/pull/4632) — "mobile card
layout for My Domains".
