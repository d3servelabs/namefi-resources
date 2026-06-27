# Workflows

This folder contains backend Temporal workflow definitions. Workflow code must remain
deterministic and delegate network, database, and other side effects to activities.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/workflows/
|-- README.md
|-- domain-ownership/
|-- generic/
|-- hunt/
|-- migration/
|-- test-workflows/
|-- x402/
|-- admin-update-domain-contacts.workflow.ts
|-- auto-grant-claims.workflow.ts
|-- autorenew-daily-emails.workflow.ts
|-- autorenew-daily-report.workflow.ts
|-- backfill-nft-wallet-users.workflow.ts
|-- broadcast-notification.workflow.ts
|-- bulk-burn-expired-domains.workflow.ts
|-- cart-domains-popular.workflow.ts
|-- ... 71 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
