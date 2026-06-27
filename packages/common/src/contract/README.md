# Contract

This folder contains shared contract schemas and inferred types used across apps and
packages. Modules here define API, order, user, domain, and integration payloads that
must remain isomorphic.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/common/src/contract/
|-- README.md
|-- admin/
|-- ai-contract.test.ts
|-- ai-contract.ts
|-- analytics-contract.ts
|-- announcements-contract.ts
|-- api-keys-contract.ts
|-- auth-contract.ts
|-- carts-contract.ts
|-- config-contract.ts
|-- create-contract.ts
|-- dns-cache-contract.ts
|-- dns-records-contract.ts
|-- domain-config-contract.ts
|-- entity-schemas.ts
|-- ... 23 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
