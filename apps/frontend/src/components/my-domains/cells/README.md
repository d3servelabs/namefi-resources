# Cells

This folder contains React UI components for my domains cells. Keep feature-specific
state, helpers, and tests near the component, and promote shared primitives to the
nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/my-domains/cells/
|-- README.md
|-- actions-cell.tsx
|-- auto-ens-cell.tsx
|-- date-tokenized-cell.tsx
|-- domain-name-cell.tsx
|-- nft-pending-badge.tsx
|-- renew-pricing-cell.tsx
|-- renewal-cell.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
