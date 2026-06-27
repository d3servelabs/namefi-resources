# Email Batch

This folder contains React UI components for admin email batch. Keep feature-specific
state, helpers, and tests near the component, and promote shared primitives to the
nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/admin/email-batch/
|-- README.md
|-- add-to-email-batch-button.tsx
|-- bulk-email-modal.tsx
|-- floating-batch-button.tsx
|-- handlebars-help-modal.tsx
|-- types.ts
|-- use-email-batch.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
