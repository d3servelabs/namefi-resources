# Environment Package Source

This folder contains shared environment-loading and validation helpers. Keep server-only
secrets, client-safe values, and runtime defaults clearly separated.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/env/src/
|-- README.md
|-- client.ts
|-- get-env-sync.ts
|-- index.ts
|-- infisical.ts
|-- load-sync.ts
|-- preload-sync.ts
|-- preload.ts
|-- schema.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
