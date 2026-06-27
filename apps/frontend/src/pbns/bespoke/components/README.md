# Bespoke Components

This folder contains PBNS-specific UI modules and components. Keep bespoke landing-page
logic close to the variant it supports, and share only stable cross-variant primitives.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/pbns/bespoke/components/
|-- README.md
|-- domain-hunt-widget.tsx
|-- footer.tsx
|-- hero.tsx
|-- hunt-section.tsx
|-- landing.tsx
|-- testimonials.tsx
|-- use-cases.tsx
|-- value-proposition.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
