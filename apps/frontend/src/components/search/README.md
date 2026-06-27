# Search

This folder contains React UI components for search. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/search/
|-- README.md
|-- destinations.ts
|-- domain-card.tsx
|-- header-omni-search.tsx
|-- lazy-search-results.tsx
|-- make-offer-popover.tsx
|-- pagefind-client.ts
|-- placeholder.tsx
|-- search-input.tsx
|-- search-results.tsx
|-- types.ts
|-- utils.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
