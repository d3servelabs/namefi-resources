# Table

This folder contains React UI components for table. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/table/
|-- README.md
|-- components/
|-- filters/
|-- types/
|-- utils/
|-- column-filter.tsx
|-- data-table.tsx
|-- extensible-data-table.tsx
|-- index.ts
|-- server-data-table-v2.tsx
|-- server-data-table.tsx
|-- table-filter-panel.tsx
|-- table-loading-bar.tsx
|-- table-page-selector.tsx
|-- table-page-size-selector.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
