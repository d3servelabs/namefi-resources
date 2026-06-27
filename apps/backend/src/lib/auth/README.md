# Auth

This folder contains backend authentication and identity helpers. Modules here bridge
Privy/session data, user records, authorization checks, and request-context identity.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/auth/
|-- README.md
|-- methods/
|-- api-key-auth.ts
|-- api-key-restrictions.test.ts
|-- api-key-restrictions.ts
|-- auth-registry.ts
|-- ecdsa-payload-signature.ts
|-- eip1271-verify.test.ts
|-- eip1271-verify.ts
|-- GUIDE.md
|-- IERC1271.sol
|-- jwt.test.ts
|-- jwt.ts
|-- wallet-auth.test.ts
|-- wallet-auth.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
