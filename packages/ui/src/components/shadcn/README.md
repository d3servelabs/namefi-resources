# Shadcn

This folder contains shadcn-style UI primitives shared by Namefi apps. Keep APIs close
to the existing component conventions so app-level UI can compose them predictably.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
packages/ui/src/components/shadcn/
|-- README.md
|-- accordion.tsx
|-- alert-dialog.tsx
|-- alert.tsx
|-- avatar.tsx
|-- badge.tsx
|-- breadcrumb.tsx
|-- button.tsx
|-- calendar.tsx
|-- card.tsx
|-- carousel.tsx
|-- checkbox.tsx
|-- collapsible.tsx
|-- command.tsx
|-- dialog.tsx
|-- ... 23 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
