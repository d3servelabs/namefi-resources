# x402 Shared

This folder contains shared x402 types and utilities used across backend helpers and
route integrations. Keep protocol constants and shared schemas here so callers stay
aligned.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/x402/shared/
|-- README.md
|-- constants.ts
|-- html-builder.ts
|-- scripts.ts
|-- styles.ts
|-- types.ts
|-- viem-loader.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
