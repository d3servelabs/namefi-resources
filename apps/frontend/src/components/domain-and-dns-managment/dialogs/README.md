# Dialogs

This folder contains React UI components for domain and dns management dialogs. Keep
feature-specific state, helpers, and tests near the component, and promote shared
primitives to the nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/domain-and-dns-managment/dialogs/
|-- README.md
|-- add-edit-records-dialog.tsx
|-- batch-dns-dialog.tsx
|-- delete-records-dialog.tsx
|-- dns-record-form.tsx
|-- edit-dns-records-wrapper.tsx
|-- forwarding-dialog.tsx
|-- nameservers-dialog.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
