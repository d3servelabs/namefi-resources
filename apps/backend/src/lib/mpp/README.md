# MPP

This folder contains backend Marketplace Protocol Platform helpers. Modules normalize
marketplace payloads, shared types, and integration behavior used by API and workflow
layers.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/mpp/
|-- README.md
|-- helpers.test.ts
|-- helpers.ts
|-- register-domain.test.ts
|-- register-domain.ts
|-- sign-in.test.ts
|-- sign-in.ts
|-- source-did.test.ts
|-- source-did.ts
|-- verify-only.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
