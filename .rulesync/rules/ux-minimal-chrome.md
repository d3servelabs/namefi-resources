---
targets:
  - '*'
root: false
description: Trigger when building or reviewing UI — keep chrome minimal, never block the user's view or waste space
globs:
  - apps/frontend/src/**/*.tsx
  - apps/resources/src/**/*.tsx
  - packages/ui/src/**/*.tsx
cursor:
  alwaysApply: false
  description: Keep UI chrome minimal — never block the user's view or waste space
---

# UX Principle: Minimal Chrome

**Don't add anything that blocks the user's view or takes space unless it earns
its place.** Every divider, background, shadow, border, padding block, banner,
or container is a cost — in attention, in vertical space (especially on mobile),
and in visual noise. Default to *less*; add chrome only when it solves a real,
nameable problem.

## Before adding a visual element, name the problem it solves

If you can't state what would break without it, remove it. Common offenders:

- **Dividers / borders** to "separate" regions that are already visually
  distinct (different background, spacing, or position). The gap is the
  separator — you usually don't need a line too.
- **Opaque backgrounds** on an element that sits on a same-colored surface, or
  that nothing ever overlaps/scrolls behind. If there's nothing to mask, the
  background is dead weight.
- **Shadows / scrims** added "for depth" where there is no layering. A shadow
  implies one thing floats over another; don't imply it if it doesn't.
- **Wrapper bars / headers / footers** that exist only to hold one control.
  Give the control its layout (spacing, safe-area, sizing) directly instead of
  wrapping it in a styled "bar."
- **Fixed banners / toolbars** that eat viewport height the user needs for the
  actual content — particularly painful on short mobile viewports.

## Guidance

- **Prefer space over lines.** Use spacing and grouping to separate content
  before reaching for a border or background.
- **Maximize the content area.** On small screens, vertical space is scarce —
  don't spend it on decoration. Keep trust-critical content (amounts, network,
  fees) visible; cut chrome, not information.
- **Layout wrappers should be invisible.** A container that only positions a
  control (e.g. a pinned action area) should carry layout utilities
  (`shrink-0`, padding, safe-area insets) and nothing decorative.
- **A natural cut-off is its own affordance.** Content clipped at a scroll edge
  already hints "there's more" — you rarely need an extra fade/shadow/line to
  say so.
- **When in doubt, remove it and look.** If the UI reads fine without the
  element, it was unnecessary.

## Example (this repo)

The NFSC swap dialog pins its primary action in a region below the scrollable
body. That region is a *pure layout wrapper* — `shrink-0` + horizontal padding +
`pb-[max(1.5rem,env(safe-area-inset-bottom))]` — with **no** divider, background,
or shadow: nothing scrolls behind it, so there's nothing to separate or mask.
See `apps/frontend/src/components/dialogs/nfsc-swap-dialog-utils.ts`
(`SWAP_DIALOG_ACTION_BAR_CLASSNAME`).
