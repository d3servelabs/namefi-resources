# Providers

This folder contains React UI components for providers. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/providers/
|-- README.md
|-- consent/
|-- analytics.tsx
|-- auth-display-profile.test.ts
|-- auth-display-profile.ts
|-- auth-initial-snapshot.test.ts
|-- auth-initial-snapshot.ts
|-- auth-query-policy.test.ts
|-- auth-query-policy.ts
|-- auth.tsx
|-- cart.tsx
|-- consent-ui-lazy.tsx
|-- deferred-providers.tsx
|-- feedback.tsx
|-- free-mints-guidance.tsx
|-- ... 24 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
