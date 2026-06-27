# Aceternity

This folder contains React UI components for ui aceternity. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/ui/aceternity/
|-- README.md
|-- background-gradient.tsx
|-- comet-card.tsx
|-- container-text-flip.tsx
|-- controlled-glare-card.tsx
|-- glowing-effect.tsx
|-- wobble-card.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
