# Admin Financials Components

This folder contains route-local React components and helpers for the admin financials
page. The files compose the financial tables, filters, overview sections, and shared
types used by that route.

## File Relationships

- TSX files render financials page sections, cells, filters, and table shells.
- Constants, types, table controls, and utilities keep shared page behavior out of the route file.

## Structure

```text
apps/frontend/src/app/admin/financials/_components/
|-- README.md
|-- columns.tsx
|-- constants.ts
|-- detail-tables.tsx
|-- financials-cells.tsx
|-- financials-page.tsx
|-- global-filters-card.tsx
|-- overview.tsx
|-- table-controls.ts
|-- table-shell.tsx
|-- types.ts
|-- utils.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
