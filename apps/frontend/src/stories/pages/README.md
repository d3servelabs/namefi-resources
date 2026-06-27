# Pages

This folder contains Storybook stories for frontend components and pages. Stories should
exercise realistic states, stay close to the corresponding UI surface, and provide
stable entrypoints for visual verification.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/stories/pages/
|-- README.md
|-- aave-landing.stories.tsx
|-- cart-checkout.stories.tsx
|-- dns-overview-panel.stories.tsx
|-- domain-overview.stories.tsx
|-- landing.stories.tsx
|-- marketplace-panel.stories.tsx
|-- my-domains.stories.tsx
|-- my-orders.stories.tsx
|-- order-completion.stories.tsx
|-- order-details.stories.tsx
|-- order-pending.stories.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
