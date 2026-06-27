# Dialogs

This folder contains React UI components for dialogs. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/dialogs/
|-- README.md
|-- auth-required-dialog.tsx
|-- email-required-dialog.tsx
|-- mobile-bottom-sheet.ts
|-- nfsc-swap-dialog-utils.test.ts
|-- nfsc-swap-dialog-utils.ts
|-- nfsc-swap-dialog.tsx
|-- request-wallet-connection.tsx
|-- sign-in-chooser-wallet.test.ts
|-- sign-in-chooser-wallet.ts
|-- sign-in-chooser.tsx
|-- use-request-wallet-connection.llms.txt
|-- use-request-wallet-connection.tsx
|-- vote-or-share-choice-dialog.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
