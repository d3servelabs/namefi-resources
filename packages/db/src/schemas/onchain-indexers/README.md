# Onchain Indexers

This folder contains database schema modules for on-chain indexer data. These schemas
model blockchain-derived records consumed by indexer and application services.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/db/src/schemas/onchain-indexers/
|-- README.md
|-- burned-nfts.ts
|-- domain-ai-analysis.ts
|-- index.ts
|-- namefi-nft-with-pending.ts
|-- namefi-nft.ts
|-- schema-def.ts
|-- transfer-logs.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
