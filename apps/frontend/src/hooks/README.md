# Hooks

This folder contains reusable frontend React hooks. Hooks here should keep browser side
effects explicit, preserve server/client boundaries, and avoid pulling heavy
dependencies into shared app shell code.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/frontend/src/hooks/
|-- README.md
|-- post-auth-intent/
|-- use-allowed-chains.ts
|-- use-analytics.ts
|-- use-animated-list.ts
|-- use-auth.ts
|-- use-buy-nfsc.ts
|-- use-cart-row.ts
|-- use-cart.ts
|-- use-change-nameservers-progress.ts
|-- use-consent-identify-utils.ts
|-- use-consent-identify.test.ts
|-- use-consent-identify.ts
|-- use-deferred-section-load.ts
|-- use-dismissed-announcements.ts
|-- ... 42 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
