# Schedules

This folder contains Temporal schedule definitions and schedule helpers. Schedules
should be small orchestration entrypoints that point at existing workflows and document
cadence-sensitive behavior.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/schedules/
|-- README.md
|-- campaigns/
|-- hunt/
|-- backfill-nft-wallet-users.ts
|-- base-schedule.ts
|-- cart-domains-popular.ts
|-- dnsviz-cleanup.ts
|-- dnsviz-daily-digest.ts
|-- domain-export-tracking.ts
|-- domain-traffic-surge.ts
|-- dream-domain-awaits.ts
|-- email-subscription-sync.ts
|-- export-expiration-daily-report.ts
|-- generate-and-update-data-for-domains.ts
|-- in-flight-nft-tx-cleanup.ts
|-- ... 12 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
