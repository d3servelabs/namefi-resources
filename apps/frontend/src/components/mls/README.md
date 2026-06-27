# Mls

This folder contains React UI components for mls. Keep feature-specific state, helpers,
and tests near the component, and promote shared primitives to the nearest common parent
only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/mls/
|-- README.md
|-- domain-feed-listings.tsx
|-- mls-domain-display.test.ts
|-- mls-domain-display.ts
|-- mls-feed.tsx
|-- mls-handle-feed.tsx
|-- mls-report-listing-dialog.tsx
|-- mls-sale-card-theme.test.ts
|-- mls-sale-card-theme.ts
|-- mls-sale-card.tsx
|-- mls-seller-tier-badge.tsx
|-- mls-sellers-directory.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
