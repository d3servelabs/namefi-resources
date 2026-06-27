# Workflow Helpers

This folder contains shared Temporal workflow helpers. Keep these helpers deterministic
when they are imported by workflows, and separate activity-only utilities when they need
side effects.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/shared/workflow-helpers/
|-- README.md
|-- await-in-flight-nft-tx-indexed.ts
|-- catch-and-alert-locally.ts
|-- catch-and-escalate-locally.ts
|-- chain-timing.test.ts
|-- chain-timing.ts
|-- checkout-tracking.test.ts
|-- checkout-tracking.ts
|-- critical-alert-with-ticket.ts
|-- decision-gate-adoption-deep-dive.md
|-- decision-gate-adoption.md
|-- decision-gate.md
|-- decision-gate.test.ts
|-- decision-gate.ts
|-- escalating-poller.test.ts
|-- ... 28 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
