# Crypto

This folder contains backend cryptography helpers. Keep signing, verification, key
handling, and encoding utilities isolated here so callers do not duplicate low-level
crypto behavior.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/crypto/
|-- README.md
|-- ens.ts
|-- nonce-collision-detection.test.ts
|-- nonce-collision-detection.ts
|-- rpc-urls.ts
|-- viem-client-factory.ts
|-- viem-clients.ts
|-- x402-viem-clients.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
