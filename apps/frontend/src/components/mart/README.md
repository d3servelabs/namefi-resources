# Mart

This folder contains React UI components for mart. Keep feature-specific state, helpers,
and tests near the component, and promote shared primitives to the nearest common parent
only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/mart/
|-- README.md
|-- fulfill-error.test.ts
|-- fulfill-error.ts
|-- marketplace-browser.tsx
|-- mart-buy-now-dialog.tsx
|-- mart-listing-card.tsx
|-- use-collection-listings.ts
|-- use-eth-usd-price.ts
|-- use-fulfill-listing.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
