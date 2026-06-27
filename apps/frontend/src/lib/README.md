# Frontend Library

This folder contains shared frontend utilities, data helpers, and integration modules.
Code here is imported widely, so prefer small leaf modules and avoid side effects that
would inflate client bundles.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/frontend/src/lib/
|-- README.md
|-- datadog/
|-- env/
|-- marketplaces/
|-- mls/
|-- mock/
|-- origin/
|-- perf/
|-- preview-gate/
|-- seo/
|-- trpc/
|-- types/
|-- utils/
|-- analytics-events.ts
|-- auth-token-supplier.ts
|-- ... 43 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
