# Export Tracking

This folder contains React UI components for admin export tracking. Keep
feature-specific state, helpers, and tests near the component, and promote shared
primitives to the nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/admin/export-tracking/
|-- README.md
|-- export-status-badge.tsx
|-- export-tracking-card.tsx
|-- export-tracking-cells.tsx
|-- export-tracking-evidence-dialog.tsx
|-- export-tracking-table.tsx
|-- index.ts
|-- status-history-subrow.tsx
|-- types.ts
|-- verify-button.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
