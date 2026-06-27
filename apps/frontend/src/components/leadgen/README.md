# Leadgen

This folder contains React UI components for leadgen. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/leadgen/
|-- README.md
|-- leadgen-app.tsx
|-- leadgen-export.test.ts
|-- leadgen-export.ts
|-- leadgen-lead-sections.test.ts
|-- leadgen-lead-sections.ts
|-- leadgen-mailto.test.ts
|-- leadgen-mailto.ts
|-- leadgen-presentation.test.ts
|-- leadgen-presentation.ts
|-- leadgen-run-order.test.ts
|-- leadgen-run-order.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
