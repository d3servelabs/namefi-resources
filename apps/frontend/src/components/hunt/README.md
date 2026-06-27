# Hunt

This folder contains React UI components for hunt. Keep feature-specific state, helpers,
and tests near the component, and promote shared primitives to the nearest common parent
only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/hunt/
|-- README.md
|-- campaign/
|-- domains/
|-- mine/
|-- award-medals.tsx
|-- campaign-domains-list.tsx
|-- domain-awards.tsx
|-- domain-item-skeleton.tsx
|-- domains-list-item.tsx
|-- domains-list.tsx
|-- header-tabs.module.css
|-- header-tabs.tsx
|-- hunt-home.tsx
|-- pagination-control.tsx
|-- submit-domain-dialog.tsx
|-- ... 3 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
