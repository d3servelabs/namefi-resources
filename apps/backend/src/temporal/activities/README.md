# Activities

This folder contains backend Temporal activity implementations. Activities do the
side-effectful work for workflows, including database, registrar, notification, and
indexing operations.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/activities/
|-- README.md
|-- default/
|-- domain/
|-- helpers/
|-- hunt/
|-- indexers/
|-- migration/
|-- mint/
|-- order-helpers/
|-- shared/
|-- free-claim-guard.test.ts
|-- free-claim-guard.ts
|-- free-claim.activities.ts
|-- free-claims-correction.activities.ts
|-- greet.activities.ts
|-- ... 24 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
