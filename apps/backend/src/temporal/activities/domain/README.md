# Domain

This folder contains Temporal activity implementations for domain. Activities do the
side-effectful work for workflows, including database, registrar, notification, and
indexing operations.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/activities/domain/
|-- README.md
|-- helpers/
|-- autorenew-report-attachments.activities.ts
|-- autorenew-report.activities.ts
|-- bulk-burn.activities.ts
|-- deployment-environment.activities.ts
|-- disable-auto-renewal.activities.ts
|-- dns.activities.ts
|-- dnssec.activities.ts
|-- export-expiration-report.activities.ts
|-- export-tracking-state.test.ts
|-- export-tracking-state.ts
|-- export-tracking.activities.ts
|-- index.ts
|-- parking-tracking.activities.ts
|-- ... 3 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
