# Profile

This folder contains React UI components for profile. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/profile/
|-- README.md
|-- security/
|-- account.tsx
|-- api-keys.tsx
|-- contact-accounts.tsx
|-- contact-details.tsx
|-- create-api-key-dialog.tsx
|-- edit-api-key-dialog.tsx
|-- email-subscription-settings.tsx
|-- footer.tsx
|-- header.tsx
|-- profile.tsx
|-- revoke-api-key-dialog.tsx
|-- social-accounts.tsx
|-- tabs.ts
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
