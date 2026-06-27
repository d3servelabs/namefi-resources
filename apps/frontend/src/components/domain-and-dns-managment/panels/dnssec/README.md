# DNSSEC

This folder contains React UI components for domain and dns management panels dnssec.
Keep feature-specific state, helpers, and tests near the component, and promote shared
primitives to the nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/domain-and-dns-managment/panels/dnssec/
|-- README.md
|-- custom-delegation-signer-form.tsx
|-- custom-delegation-signer-panel.tsx
|-- custom-delegation-signer-simple-panel.tsx
|-- delegation-signers-table.tsx
|-- dnssec-mode-toggle.tsx
|-- dnssec-panel.tsx
|-- use-dnssec-mode-preference.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
