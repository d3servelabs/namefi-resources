# x402 Helpers

This folder contains x402 helper modules for backend payment-gated request flows.
Helpers keep protocol parsing, response construction, and payment metadata handling out
of route handlers.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/x402/helpers/
|-- README.md
|-- constants.ts
|-- facilitator.ts
|-- index.ts
|-- network.ts
|-- payment-option.ts
|-- payment-payload-encryption.ts
|-- protocol.ts
|-- secrets.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
