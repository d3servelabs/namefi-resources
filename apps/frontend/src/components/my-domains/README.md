# My Domains

This folder contains React UI components for my domains. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/my-domains/
|-- README.md
|-- cells/
|-- marketplace-orders/
|-- action-tooltip.tsx
|-- auto-renew-toggle.tsx
|-- bulk-auto-renew-toggle.tsx
|-- columns.tsx
|-- confetti-celebration.ts
|-- content.tsx
|-- domain-card.tsx
|-- empty-placeholder.tsx
|-- floating-action-panel.tsx
|-- loading-skeletons.tsx
|-- other-wallet-orders-table.tsx
|-- renew-now-modal.tsx
|-- ... 5 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
