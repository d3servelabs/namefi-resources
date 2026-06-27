# Marketplace Orders

This folder contains React UI components for my domains marketplace orders. Keep
feature-specific state, helpers, and tests near the component, and promote shared
primitives to the nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/my-domains/marketplace-orders/
|-- README.md
|-- format.ts
|-- marketplace-orders-tab.tsx
|-- my-listing-card.tsx
|-- my-offer-card.tsx
|-- use-domain-details.ts
|-- use-maker-orders.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
