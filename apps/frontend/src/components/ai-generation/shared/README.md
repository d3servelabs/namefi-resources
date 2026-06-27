# AI Generation Shared

This folder contains React UI components for ai generation shared. Keep feature-specific
state, helpers, and tests near the component, and promote shared primitives to the
nearest common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/ai-generation/shared/
|-- README.md
|-- base-generation-tab.tsx
|-- base-generator.tsx
|-- form-fields.tsx
|-- gallery-types.ts
|-- gallery-utils.ts
|-- generation-action-buttons.tsx
|-- generation-actions.ts
|-- generation-hooks.test.ts
|-- generation-hooks.tsx
|-- logo-readiness.ts
|-- submit-button.tsx
|-- types.ts
|-- use-derivative-generation-state.ts
|-- use-gallery-data.ts
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
