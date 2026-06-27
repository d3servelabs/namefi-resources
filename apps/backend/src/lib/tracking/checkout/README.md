# Checkout

This folder contains checkout tracking helpers. Modules prepare analytics and
observability events around cart, payment, and order transitions without spreading
tracking details through business logic.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/tracking/checkout/
|-- README.md
|-- analytics-client.test.ts
|-- analytics-client.ts
|-- analytics-parser.ts
|-- analytics-shared.ts
|-- analytics-types.ts
|-- checkout-funnel.ts
|-- checkout-sankey.test.ts
|-- checkout-sankey.ts
|-- context.test.ts
|-- context.ts
|-- events.test.ts
|-- events.ts
|-- index.ts
|-- parse-checkout-flow-raw-report.ts
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
