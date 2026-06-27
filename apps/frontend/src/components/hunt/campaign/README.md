# Campaign

This folder contains React UI components for hunt campaign. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/hunt/campaign/
|-- README.md
|-- hero-background/
|-- campaign-community.tsx
|-- campaign-countdown.tsx
|-- campaign-domain-item.tsx
|-- campaign-domains-list.tsx
|-- campaign-hero.tsx
|-- campaign-how-it-works.tsx
|-- campaign-why-vote.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
