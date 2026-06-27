# Collectors

This folder contains backend metrics collectors. Collectors gather focused slices of
application, infrastructure, or business telemetry and expose them through the metrics
pipeline.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/metrics/collectors/
|-- README.md
|-- domainsByDnssec.ts
|-- domainsByExpirationBucket.ts
|-- domainsByNameservers.ts
|-- domainsByParent.ts
|-- domainsByRegistrar.ts
|-- durations.ts
|-- expirationMismatch.ts
|-- expiredGt60d.ts
|-- expiredUnburnedNft.ts
|-- INDEX.md
|-- missingInRegistrar.ts
|-- missingNft.ts
|-- orders.ts
|-- parkedSplit.ts
|-- ... 5 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
