# Indexers

This folder contains Temporal activity implementations for indexers. Activities do the
side-effectful work for workflows, including database, registrar, notification, and
indexing operations.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/activities/indexers/
|-- README.md
|-- reporting/
|-- dnsviz.activities.ts
|-- domain-index.activities.ts
|-- in-flight-nft-tx.activities.ts
|-- index.ts
|-- namefi-gpt-domain-processing.activities.ts
|-- nft-marketplace.activities.ts
|-- ponder-sync.activities.ts
|-- privy-cache.activities.ts
|-- refresh-centralnic-ote2-index.activities.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
