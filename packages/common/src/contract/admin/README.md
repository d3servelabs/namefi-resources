# Admin

This folder contains shared admin contract schemas and types. Keep these modules
isomorphic so backend procedures and frontend admin UI agree on validation and payload
shape.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/common/src/contract/admin/
|-- README.md
|-- admin-ai-credits-contract.ts
|-- admin-announcements-contract.ts
|-- admin-auto-renewal-contract.ts
|-- admin-big-query-audit-contract.ts
|-- admin-bulk-burn-contract.ts
|-- admin-contract.ts
|-- admin-dnsviz-contract.ts
|-- admin-domain-details-contract.ts
|-- admin-domain-preferences-contract.ts
|-- admin-email-campaigns-contract.ts
|-- admin-emails-contract.ts
|-- admin-epp-testing-contract.ts
|-- admin-export-tracking-contract.ts
|-- admin-financial-analytics-contract.ts
|-- ... 16 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
