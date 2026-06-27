# Namefi

This folder contains Namefi-branded UI components shared by apps. Keep components
framework-friendly and avoid app-specific data fetching in this package.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
packages/ui/src/components/namefi/
|-- README.md
|-- progress-timeline/
|-- brand-icons.tsx
|-- edge-fade-scroll-area.tsx
|-- gradient-card.tsx
|-- namefi-button.tsx
|-- omni-search.tsx
|-- wallet-avatar-fallback.tsx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
