# AdminFeatureFlags (nuqs-backed)

- Global flags: scope 'global' → query key ff_<key>
- Page flags: scope 'page', pageKey '<stable-id>' → ffp_<pageKey>_<key>

API
- FeatureFlagsProvider({ globalFlags? })
- useRegisterAdminFlags(flags) or withAdminFlags(Component, flags)
- useFeatureFlag(def) → [value, setValue]
- FeatureFlagsSheet shown to admins; open via user dropdown "AdminFeatureFlags"

Usage
```
useRegisterAdminFlags([
  { key: 'debug_totals', label: 'Debug Totals', scope: 'page', pageKey: 'orders_[id]' },
]);
```
