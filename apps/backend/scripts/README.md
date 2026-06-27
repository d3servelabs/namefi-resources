# Scripts

This folder contains backend-focused operational and maintenance scripts. Most scripts
are run through backend or root `package.json` commands so they inherit the expected
Bun, environment, and working-directory conventions.

## File Relationships

- Direct files in this folder are peers for the same feature, docs, or asset family.
- Prefer small local additions here; move shared behavior upward only when multiple folders need it.

## Structure

```text
apps/backend/scripts/
|-- README.md
|-- bundle-workflows.ts
|-- cleanup-workflows.ts
|-- curl-availability.sh
|-- curl-tlds.sh
|-- migrate-namefi-feed-from-labs.ts
|-- README-migrate-legacy-orders.md
|-- setup-headers-for-gcloud-loudbalancers.sh
|-- temporal-search-attributes.sh
|-- terminal-utils.ts
|-- test-dns.ts
|-- test-individual-workflows.ts
|-- test-map-attachment.ts
|-- test-map-render.ts
|-- validate-workflow-exports.ts
|-- ... 2 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
