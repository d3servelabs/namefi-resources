# Orders

This folder contains React UI components for orders. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/orders/
|-- README.md
|-- completion-actions.tsx
|-- finishing-up-inline.tsx
|-- internal-ai-generations.tsx
|-- list-on-marketplace-entry-runtime.tsx
|-- list-on-marketplace-entry.tsx
|-- nft-carousel.tsx
|-- order-details-content.tsx
|-- order-not-found.tsx
|-- order-progress-timeline.tsx
|-- payment-details-summary.tsx
|-- payment-method-details.tsx
|-- post-registration-tasks.tsx
|-- share-order.tsx
|-- single-payment-method-details.tsx
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
