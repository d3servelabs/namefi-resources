# tRPC

This folder contains the backend tRPC server setup, context wiring, router composition,
and shared procedure helpers. Changes here affect the API contract consumed by frontend
and client packages.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/trpc/
|-- README.md
|-- guards/
|-- routers/
|-- base.auth.test.ts
|-- base.ts
|-- contract.ts
|-- index.ts
|-- skip-auth.test.ts
|-- skip-auth.ts
|-- types.ts
|-- utils.test.ts
|-- utils.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
