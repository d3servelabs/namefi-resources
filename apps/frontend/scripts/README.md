# Scripts

This folder contains frontend-specific validation and maintenance scripts. Most scripts
are advisory guardrails that scan source files for UI, responsive, localization, or
testing conventions.

## File Relationships

- Direct files in this folder are peers for the same feature, docs, or asset family.
- Prefer small local additions here; move shared behavior upward only when multiple folders need it.

## Structure

```text
apps/frontend/scripts/
|-- README.md
|-- check-i18n-convention.ts
|-- check-i18n-coverage.ts
|-- check-mobile-responsive.ts
|-- check-rtl.ts
|-- check-testid.ts
|-- i18n-scope.ts
|-- mobile-responsive-baseline.json
|-- rtl-baseline.json
|-- testid-baseline.json
|-- wallet-deeplink-check.mjs
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
