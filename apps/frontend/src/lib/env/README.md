# Env

This folder contains frontend environment-schema modules and per-context configuration.
Keep client-safe values separate from server-only values, and update validation when
introducing new environment variables.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/frontend/src/lib/env/
|-- README.md
|-- configs/
|-- consts.ts
|-- index.ts
|-- load.ts
|-- schema.ts
|-- secrets.ts
|-- validate-secrets.ts
|-- validate.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
