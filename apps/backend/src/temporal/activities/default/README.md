# Default

This folder contains Temporal activity implementations for default. Activities do the
side-effectful work for workflows, including database, registrar, notification, and
indexing operations.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/activities/default/
|-- README.md
|-- campaign-candidate-collection.activities.ts
|-- campaign-grant-claims.activities.ts
|-- email-campaigns.activities.ts
|-- email-subscription-sync.activities.ts
|-- get-workflow-url.test.ts
|-- get-workflow-url.ts
|-- index.ts
|-- nonce-collision.activities.test.ts
|-- nonce-collision.activities.ts
|-- nonce-lock.activities.test.ts
|-- nonce-lock.activities.ts
|-- triggerNamefiGptCronJob.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
