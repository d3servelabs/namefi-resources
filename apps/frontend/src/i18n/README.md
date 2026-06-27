# I18n

This folder contains frontend internationalization routing and locale helpers. Keep
locale lists, routing helpers, and dictionary loading behavior aligned with the message
catalogs.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/frontend/src/i18n/
|-- README.md
|-- config.ts
|-- load-messages.ts
|-- locale-actions.ts
|-- messages.d.ts
|-- negotiate.test.ts
|-- negotiate.ts
|-- request.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
