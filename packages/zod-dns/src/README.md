# Zod DNS Source

This folder contains Zod schemas for DNS records and related validation. These modules
provide runtime validation and TypeScript types for DNS consumers.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/zod-dns/src/
|-- README.md
|-- dnssec.ts
|-- index.testing.ts
|-- index.ts
|-- name.test.ts
|-- name.testing.ts
|-- name.ts
|-- record.test.ts
|-- record.testing.ts
|-- record.ts
|-- zone.test.ts
|-- zone.testing.ts
|-- zone.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
