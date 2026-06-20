---
targets:
  - '*'
root: false
description: >-
  Trigger when adding or changing rendered UI in the frontend — give
  interactive and identity-bearing elements a stable, hierarchical
  `data-testid` that mirrors the i18n translation-key hierarchy, so tests and
  debugging can refer to any element by a language-independent path instead of
  brittle visible-text selectors.
globs:
  - apps/frontend/src/**/*.tsx
cursor:
  alwaysApply: false
  description: >-
    Give rendered UI a stable hierarchical `data-testid` mirroring the i18n
    key hierarchy; prefer it over text/role selectors for app-specific elements.
---

# Test IDs: stable, hierarchical handles for every rendered element

Locating an element by its **visible text** (`getByText('Sign In')`,
`getByRole('button', { name: /checkout/ })`) breaks the moment that text is
translated — and this app now ships nine locales. A `data-testid` is a
**language-independent, refactor-stable handle**: it survives copy edits,
translation, and re-styling, and it makes a failing test or a console-inspected
node point straight back to the component that owns it.

Treat `data-testid` the way we treat a translation key: **the elements a test
or debugger actually targets get one, and its value is a dotted hierarchical
path that says where the element lives.** Scope it to what earns the cost — see
"What must have a test id" below; a `data-testid` on a decorative element that
nothing ever targets is dead weight (the same logic as the `ux-minimal-chrome`
rule), so don't blanket-tag every node.

## The core rule: mirror the translation-key hierarchy

A test id is **`<namespace>.<section>.<element>`**, dot-separated, kebab-case
leaves — the same shape as an i18n key. Whenever an element already pulls copy
from `useTranslations('<ns>')`, its test id starts with that **same namespace**,
so the id and the key line up one-to-one and you can map either direction.

| Translation key (`messages/<locale>/`) | `data-testid` |
|---|---|
| `cart.summary.checkoutButton` | `cart.summary.checkout-button` |
| `domains.list.empty` | `domains.list.empty` |
| `nav.userMenu.signOut` | `nav.user-menu.sign-out` |

### Namespace selection — same tiers as the i18n hierarchy

Pick the first tier that fits, exactly as for translation keys
(see the i18n hierarchy in `i18n-rtl.md`):

- **Generic, reused atom** (a primitive's own structural parts) → keep it on the
  component, e.g. `table.head`, `dialog.close`. These come from the component,
  not a feature.
- **Cross-feature shared widget** → `shared.<widget>.<element>`
  (e.g. `shared.address.copy-button`).
- **Otherwise the feature namespace** the component already uses for copy →
  `cart.*`, `domains.*`, `search.*`, `nav.*`, `profile.*`, …

Keep the **section** segment meaningful (`summary`, `list`, `row`, `toolbar`,
`empty-state`), not a DOM tag. The leaf is the concrete thing a test clicks,
reads, or asserts on (`checkout-button`, `total`, `error`).

## What must have a test id

Prioritise by test value — tag the things a test or a human debugger needs to
**find, click, read, or assert on**:

1. **Interactive controls** — buttons, links, inputs, selects, checkboxes,
   toggles, tabs, menu items.
2. **Identity / output values** — amounts, totals, balances, network/chain,
   gas/fees, statuses, addresses, the domain name on a card.
3. **Containers a test scopes into** — dialogs, cards, list/table rows, panels,
   toolbars, banners, the empty / loading / error states of a region.

A purely decorative wrapper that nothing ever targets does not need one. When in
doubt about an *interactive* element, add it; a missing id there costs a brittle
text selector later. But don't tag decorative structure just to raise a number.

**Roll out by value, not by file count.** User-facing critical paths
(checkout/cart, search, my-domains, auth) come first; internal/admin pages
(`src/app/admin/**`) are low priority and may stay uncovered indefinitely — the
`check:testid` coverage-gap detector is advisory, not a mandate to tag them all.

## Generated ids — for repeated and primitive elements

Two situations call for **computed** ids rather than hand-written string
literals:

### 1. Repeated instances — suffix with the item's own data, not its DOM order

A list of rows/cards must not give every instance the same id (you could never
target one), and must not key off array index (it shifts when the list
re-sorts). Append a **stable value from the item's data**:

```tsx
// domain cards / table rows
<DomainCard data-testid={`domains.list.row.${domain.name}`} … />
// cart line items
<li data-testid={`cart.item.${tokenId}`} … />
```

Now a test targets exactly one row by the data it already knows.

### 2. Primitive components — generate children from a root namespace

Shared primitives (the `table/` components, dialogs) must **not** hard-code a
generic leaf like `data-testid="tr"` / `"td"` — every table on the page then
renders colliding ids. Instead the primitive takes a **root namespace from its
call site** and *generates* its parts' ids from it, falling back to the generic
default only when no root was supplied:

```tsx
// call site supplies the root once:
<Table data-testid="domains.list">…</Table>
// the primitive derives the subtree:
//   table  → domains.list
//   thead  → domains.list.head
//   tbody  → domains.list.body
//   tr     → domains.list.row     (override per-row with the row's data)
//   td     → domains.list.cell
```

This is the canonical "some are generated" case: **one prop at the call site →
a whole consistent, collision-free subtree.** See
`apps/frontend/src/components/table/` for the reference implementation (the
root flows through the table `Context`, and any element can still be overridden
by passing `data-testid` explicitly, because the primitives spread `{...rest}`
after their generated default).

## Conventions & hygiene

- **Lowercase, dotted namespaces, kebab-case leaves.** `cart.summary.checkout-button`,
  never `cartSummaryCheckoutButton` or `Cart_Summary_CheckoutButton`.
- **Mirror, don't invent, the namespace.** If the component reads
  `useTranslations('search')`, its ids start with `search.`. Don't coin a new
  top-level namespace that has no translation counterpart.
- **Promote a shared leaf only on its second consumer** — same discipline as
  i18n key promotion. Don't pre-emptively park ids under `shared.*`.
- **Never localize or interpolate a test id.** It is an English, stable
  identifier; only the *data suffix* (a domain name, token id) is dynamic.
- **Prefer test ids over text/role selectors** in new Playwright/Vitest specs
  for app-specific elements: `page.getByTestId('cart.summary.checkout-button')`,
  not `getByRole('button', { name: /checkout/ })`. Role/text selectors are
  fine for genuinely generic accessibility assertions, but they regress under
  i18n — which is exactly why this rule exists.

## Verify before claiming done

- Run `bun run --cwd apps/frontend check:testid` — it flags **collisions**
  (the same literal id rendered from more than one place), **non-hierarchical**
  ids (no dot, or a namespace with no translation counterpart), and reports
  **coverage** of interactive elements. It is advisory, not yet CI-gating.
- Spot-check in the browser devtools: an element's `data-testid` should read as
  a path you can trace to its file and its translation key without guessing.
