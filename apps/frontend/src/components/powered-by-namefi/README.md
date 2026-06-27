# Powered By Namefi

This folder contains React UI components for powered by namefi. Keep feature-specific
state, helpers, and tests near the component, and promote shared primitives to the
nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/powered-by-namefi/
|-- README.md
|-- DomainDetailsCard.tsx
|-- DomainTable.tsx
|-- DomainTableSkeleton.tsx
|-- EditDomainDialog.tsx
|-- OrdersDataTable.tsx
|-- OrdersTableSkeleton.tsx
|-- RecentOrdersList.tsx
|-- ReservedWordsManager.tsx
|-- RevenueBar.tsx
|-- RevenueLine.tsx
|-- RevenuePie.tsx
|-- RevenueSkeleton.tsx
|-- RsuiteRangePicker.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
