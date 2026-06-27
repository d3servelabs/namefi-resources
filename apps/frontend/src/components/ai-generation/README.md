# AI Generation

This folder contains React UI components for ai generation. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/ai-generation/
|-- README.md
|-- shared/
|-- ai-tabs.tsx
|-- animation-generator.tsx
|-- animation-tab.tsx
|-- derivative-flow-context.tsx
|-- gallery-pending-context.tsx
|-- generation-usage-state.ts
|-- generation-usage.test.ts
|-- generation-usage.tsx
|-- generations-column.tsx
|-- image-grid.tsx
|-- logo-generator.tsx
|-- logo-tab.tsx
|-- poster-generator.tsx
|-- ... 3 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
