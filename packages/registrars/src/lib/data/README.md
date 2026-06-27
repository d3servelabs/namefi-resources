# Data

This folder contains registrar data helpers and shared constants. Keep normalization
logic here when multiple registrar adapters need the same interpretation of domain data.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/lib/data/
|-- README.md
|-- types/
|-- display.test.ts
|-- dnssec-tlds.ts
|-- index.ts
|-- multi-year-pricing.ts
|-- supports-dnssec.ts
|-- validations.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
