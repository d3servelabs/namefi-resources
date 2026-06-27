# Admin

This folder contains React UI components for admin. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/admin/
|-- README.md
|-- analytics/
|-- dns-cache/
|-- email-batch/
|-- export-tracking/
|-- feature-flags/
|-- notifications/
|-- user-select-combobox/
|-- admin-guard.tsx
|-- admin-tile-card.tsx
|-- ai-credit-awards.tsx
|-- auto-renewal-domain-card.tsx
|-- auto-renewal-management-cells.tsx
|-- auto-renewal-management.tsx
|-- auto-renewal-workflows-list.tsx
|-- ... 20 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
