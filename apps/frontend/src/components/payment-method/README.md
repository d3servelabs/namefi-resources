# Payment Method

This folder contains React UI components for payment method. Keep feature-specific
state, helpers, and tests near the component, and promote shared primitives to the
nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/payment-method/
|-- README.md
|-- add-payment-method-dialog.tsx
|-- add-payment-method-form.tsx
|-- hybrid-payment-card.tsx
|-- hybrid-payment-utils.ts
|-- multi-payment-card.tsx
|-- multi-payment-hints.tsx
|-- nfsc-balance-dialog.tsx
|-- nfsc-orders-list.tsx
|-- payment-methods-manager-placeholder.tsx
|-- payment-methods-manager.tsx
|-- payment-summary.tsx
|-- save-payment-method-dialog.tsx
|-- save-payment-method-form.tsx
|-- select-payment-method-card.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
