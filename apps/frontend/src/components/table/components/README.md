# Table Components

This folder contains React UI components for table. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/table/components/
|-- README.md
|-- Table.tsx
|-- Tbody.tsx
|-- Td.tsx
|-- TdInner.tsx
|-- Tfoot.tsx
|-- Th.tsx
|-- Thead.tsx
|-- Tr.tsx
|-- TrInner.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
