# Configs

This folder contains frontend environment-schema modules and per-context configuration.
Keep client-safe values separate from server-only values, and update validation when
introducing new environment variables.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/frontend/src/lib/env/configs/
|-- README.md
|-- canary.ts
|-- development.ts
|-- local.ts
|-- preview.ts
|-- production.ts
|-- test.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
