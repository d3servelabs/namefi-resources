---
targets:
  - '*'
root: false
description: >-
  Trigger when adding or editing user-facing UI text or translation keys in
  apps/frontend (next-intl, useTranslations/getTranslations, messages catalogs).
globs: []
cursor:
  alwaysApply: false
  description: >-
    Trigger when adding or editing user-facing UI text or translation keys in
    apps/frontend (next-intl, useTranslations/getTranslations, messages
    catalogs).
---
# i18n Translation Key Standards (apps/frontend)

## Core rule

**No user-facing UI label is ever hardcoded.** Every string a real user can read
in an in-scope surface goes through `t('...')` (next-intl), with a key in
`apps/frontend/messages/en/<namespace>.json` and a translation in **every**
locale. English is the source of truth.

In-scope = end-user surfaces. **Out of scope** (may stay hardcoded): admin,
dev-tools, studio, Storybook stories, tests, the resources app, and
**marketing / partner / white-label landing pages** — `components/feature-landing`,
`components/leadgen`, `powered-by-namefi`, and the partner `pbns/*` variants
(`0x-city`, `aave`, `uniswap`, `token-com`, `cv`, `bespoke`); only `pbns/astra`
(Namefi's own landing) is in scope. The checkers skip all of these.

## Where a key goes — decide by first match

| Tier | When | Namespace | Key shape |
|---|---|---|---|
| **`common`** | A context-free atom whose meaning never depends on the feature — generic actions (Save, Cancel, Edit, Delete), status words, Loading, account/balance, Sign In | `common` | `common.actions.save`, `common.status.pending` |
| **`shared`** | A self-contained component reused across ≥2 unrelated features (auth gate, country input, instant-buy modal) | `shared` | `shared.countryInput.label` — follows the **component**, not the call site |
| **feature** | Everything else (the default) | the feature area derived from the component's **codepath** | `domains.dnsRecords.addDialog.title` — key mirrors the component subtree |

1. Generic atom reused across features → **`common`**
2. Belongs to a reusable cross-feature component → **`shared`**
3. Otherwise → the **feature namespace from the codepath**, keyed to mirror the
   component subtree.

### The promotion guard (prevents dead keys)

**Promote a label into `common`/`shared` only on its *second* consumer, never
speculatively.** A `common.*`/`shared.*` key used by only one feature belongs in
that feature's namespace. (Pre-seeding `common.actions.*` ahead of any real reuse
is exactly what produced a batch of dead keys that every locale had to translate.)

## Codepath → namespace map

The namespace for tier-3 keys is the feature area the component lives in. The
mapping is explicit (some dirs don't match their namespace name 1:1):

| Codepath (under `apps/frontend/src`) | Namespace |
|---|---|
| `app/cart/**`, `components/**cart**` | `cart` |
| `app/orders/**`, `components/orders/**` | `orders` |
| `app/profile/**`, `components/profile/**` | `profile` |
| `app/wishlist/**` | `wishlist` |
| `app/free-mints/**`, `components/**free-mint**` | `freeMints` |
| `app/gallery/**` | `gallery` |
| `app/claim/**`, `components/domain-claim*` | `claim` |
| `components/search/**` | `search` |
| `components/my-domains/**`, `components/domain-and-dns-managment/**` | `domains` |
| `components/mls/**` | `feed` |
| `components/payment-method/**` | `payment` / `paymentMethods` |
| `pbns/astra/**` | `landing` / `landingMarketing` |

**Cross-cutting namespaces** — usable from any codepath, no locality constraint:
`common`, `shared`, `nav`, `footer`, `consent`.

## How it is enforced

Two scripts in `apps/frontend` (run from there):

- **`bun run check:i18n`** — blocking. Fails (non-zero, `error:` lines) on:
  missing translations (a key in `en` absent from another locale), unused keys,
  keys used in code but undefined in `en`, orphan keys in a locale, and
  **locality** — a feature namespace bound outside its own codepath (only the
  allowlisted cross-cutting namespaces above are usable from anywhere). This gates
  pre-push and CI; keep it green.
- **`bun run check:i18n:convention`** — advisory (never fails the build). Flags
  hardcoded user-facing strings and `common`/`shared` keys with a single feature
  consumer (demotion candidates). Treat its output as the i18n backlog.

Scope + the codepath→namespace map are single-sourced in
`apps/frontend/scripts/i18n-scope.ts` (shared by both checkers).

### Adding a new feature namespace (checklist)

1. `src/i18n/config.ts` — add it to `NAMESPACES`.
2. `src/i18n/messages.d.ts` — add the `import` + the `Messages` entry.
3. `apps/frontend/scripts/i18n-scope.ts` — add a `FEATURE_RULES` row mapping the
   component's codepath to the namespace (else the **locality** check fails:
   "binds 'x' but its codepath maps to {no feature}").
4. Add `messages/en/<ns>.json` + `messages/_meta/<ns>.json` (description +
   `maxLength`), wire the components to `t()`, run `bun run check:i18n` — the
   `[missing]` list for the 8 non-`en` locales is the translation work order.
5. Translate (one Sonnet-low subagent per locale, writing `messages/<locale>/<ns>.json`),
   then **`bun run check:fix` (biome) on `messages/`** — translator agents emit
   valid JSON but not biome's formatting; the format pass is required before CI.

When you add a locale, update `locales` in `config.ts` (+ the label/date/direction
maps); the checker reads the config as its source of truth.
