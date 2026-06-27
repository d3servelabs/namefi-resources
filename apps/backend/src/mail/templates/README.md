# Mail Templates

This folder contains transactional email template modules. Templates compose shared mail
components, export preview props, and should keep recipient-specific data explicit for
tests and previews.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/mail/templates/
|-- README.md
|-- autorenew-daily-report-detailed.tsx
|-- autorenew-daily-report.tsx
|-- autorenew-daily-report.types.ts
|-- base-email-template.tsx
|-- cart-domains-popular-variant-2.tsx
|-- cart-domains-popular-variant-3.tsx
|-- cart-domains-popular-variant-4.tsx
|-- cart-domains-popular.tsx
|-- dnssec-deferred-ds-outcome.tsx
|-- domain-export-complete.tsx
|-- domain-export-failed.tsx
|-- domain-export-pending.tsx
|-- domain-renew-failed-to-charge.tsx
|-- domain-renew-report.tsx
|-- ... 21 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
