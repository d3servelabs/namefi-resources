# Mail Components

This folder contains reusable React Email components for transactional mail. Components
should remain template-safe, accept explicit preview/recipient props where needed, and
avoid hardcoded production-only URLs.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/backend/src/mail/components/
|-- README.md
|-- build-template.tsx
|-- card.tsx
|-- code.tsx
|-- email-action-icon.tsx
|-- email-link-tracking.ts
|-- email-table.tsx
|-- email-tracking-sync.ts
|-- email-tracking.test.ts
|-- email-tracking.tsx
|-- go-to-dashboard.tsx
|-- namefi-email-container.tsx
|-- namefi-footer.tsx
|-- namefi-header.tsx
|-- powered-by-namefi-url-context.tsx
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
