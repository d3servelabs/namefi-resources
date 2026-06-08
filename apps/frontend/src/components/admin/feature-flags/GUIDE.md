# Admin Feature Flags — Guide

Admin-only runtime toggles, backed by URL query parameters via `nuqs`. Use these
when you want to gate an experimental UI path, alternate data source, or debug
affordance behind a per-session, admin-visible switch — without a deploy.

Flags are **not** persisted server-side. They live in the URL, which means:
they are shareable (paste URL with `?ffp_my_domains_my_domains_use_v2=1` to
reproduce state), they reset when the admin clears the param, and they do not
affect non-admin users browsing normal URLs.

---

## Files

- `context.tsx` — `AdminFeatureFlagsProvider`, registry + sheet state
- `register.tsx` — `useRegisterAdminFlags`, `withAdminFlags`
- `use-flag.ts` — `useAdminFeatureFlag` (reads/writes the URL param)
- `sheet.tsx` — `AdminFeatureFlagsSheet` (the UI admins toggle from)
- `@/types/feature-flags` — `FeatureFlagDefinition`, `getQueryParamKeyForFlag`

The sheet is rendered for users with `Permission.VIEW_ADMIN_DASHBOARD`. Open
it from the user dropdown → "AdminFeatureFlags".

---

## Scopes

Every flag has a `scope`:

- **`global`** — visible on every page in the sheet. Use for cross-cutting
  toggles (e.g., "force header warning", "debug logging").
  Query key: `ff_<key>`
- **`page`** — scoped to a page, identified by a stable `pageKey`. The sheet
  shows page flags only while that page is mounted.
  Query key: `ffp_<pageKey>_<key>`

Pick `page` unless the toggle is truly app-wide. Page scope keeps the sheet
tidy and the URL keys unambiguous.

---

## Defining a flag

Declare flags as a module-level constant (stable reference — the registry
dedupes by key, but avoiding re-registration is cheaper):

```ts
import type { FeatureFlagDefinition } from '@/types/feature-flags';

const MY_DOMAINS_FEATURE_FLAGS: FeatureFlagDefinition[] = [
  {
    key: 'my_domains_use_v2',
    label: 'My Domains: use getCurrentUserDomainsV2',
    description:
      'Switch the My Domains query from v1 to v2 (single-query leftJoin variant).',
    scope: 'page',
    pageKey: 'my_domains',
    defaultValue: false,
  },
];
```

Conventions:

- **`key`** — snake_case, unique within the scope. Prefix with the feature
  name so global flags don't collide (e.g., `my_domains_use_v2`, not
  `use_v2`).
- **`pageKey`** — snake_case, stable across renames. It becomes part of the
  query string, so don't change it casually.
- **`defaultValue`** — defaults to `false`. Flags should be off by default.
- **`description`** — one line, plain English. Admins toggling it should
  know what changes.

---

## Using a flag in a component

```tsx
'use client';

import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';

export function MyDomainsContent() {
  useRegisterAdminFlags(MY_DOMAINS_FEATURE_FLAGS);
  const [useV2] = useAdminFeatureFlag(MY_DOMAINS_FEATURE_FLAGS[0]);

  // ... use `useV2` to branch behavior
}
```

Rules:

- Call `useRegisterAdminFlags` once per page (at the top-level page component
  is fine). The registry dedupes by key, so re-registering is safe but
  unnecessary.
- Pass the **same array reference** across renders. Declaring it at module
  scope is the simplest way.
- `useAdminFeatureFlag` returns `[value, setValue]`. `setValue(true)` flips
  the URL param on; `setValue(false)` clears it (via `clearOnDefault`).

### `withAdminFlags` HOC

For cases where you'd rather not mix the hook into the component body:

```tsx
export default withAdminFlags(MyPage, MY_DOMAINS_FEATURE_FLAGS);
```

---

## Pattern: toggling between API versions (v1 ↔ v2)

Useful for rolling out a new backend procedure alongside the old one. Call
whichever tRPC procedure the flag selects and normalize the shape downstream
so the rest of the component doesn't care:

```tsx
const [useV2] = useAdminFeatureFlag(MY_DOMAINS_FEATURE_FLAGS[0]);

const v1QueryOptions = trpc.users.getCurrentUserDomains.queryOptions();
const v2QueryOptions = trpc.users.getCurrentUserDomainsV2.queryOptions();

// Cast: v1 is the superset — v2 is missing `dateTokenized` / `ensRecord`,
// which we shim below. See `my-domains.tsx` for the real call site.
const domainsQueryOptions = (
  useV2 ? v2QueryOptions : v1QueryOptions
) as typeof v1QueryOptions;

const { data: raw } = useSuspenseQuery(domainsQueryOptions);

const domains = useMemo<DomainRow[]>(
  () =>
    raw.map((d) => ({
      ...d,
      dateTokenized: 'dateTokenized' in d ? d.dateTokenized : null,
      dnsStatus: {
        ...d.dnsStatus,
        ensRecord:
          'ensRecord' in d.dnsStatus ? d.dnsStatus.ensRecord : null,
      },
    })),
  [raw],
);
```

Why this shape: `useSuspenseQuery` can't be conditionally enabled, so we
select the options object at runtime. The cast is a deliberate lie to TS —
v2's output omits a few fields — which the `useMemo` normalizes at runtime.
Keep the normalization close to the fetch so downstream code sees one stable
shape.

---

## Pattern: debug / override toggle

For "force this banner to appear" or "always log X":

```ts
const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  {
    key: 'force_header_missing_email_warning',
    label: 'Force Header Missing Email Warning',
    scope: 'global',
    defaultValue: false,
  },
];

const [forceWarning] = useAdminFeatureFlag(FEATURE_FLAGS[0]);
const canShow = forceWarning || (ready && isAuthenticated && !email);
```

---

## Do / Don't

**Do**

- Keep flag definitions next to their only consumer, module-scoped.
- Prefix keys with the feature name.
- Default to `false`. Think of the flag as "opt in to the experiment."
- Delete the flag (and its consumer code) once the experiment ships.

**Don't**

- Don't use these for production feature gating. Anyone with the URL can
  toggle it. They exist for admin-only experimentation and debugging.
- Don't rely on a flag for correctness — all code paths must be valid
  independent of the flag. Flags ship untested combinations; keep both
  branches working.
- Don't reuse a `key` across scopes. The query-param namespace is global
  (`ff_`) vs page-scoped (`ffp_<pageKey>_`), but keeping keys unique across
  the codebase makes them greppable.
- Don't change a `pageKey` or `key` after shipping — existing URLs will
  silently stop working.
