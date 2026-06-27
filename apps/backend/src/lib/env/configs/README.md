# Configs

This folder contains backend environment configuration schemas. Each module owns a slice
of config validation so runtime code receives typed and validated settings.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/env/configs/
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
