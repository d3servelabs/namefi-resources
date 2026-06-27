# Contact

This folder contains registrar contact data types. These modules model registrant,
admin, technical, and billing contact payloads shared by provider implementations.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/lib/data/types/contact/
|-- README.md
|-- contact-info.ts
|-- contact-privacy.ts
|-- contact-type.ts
|-- country-code.ts
|-- domain-contacts.ts
|-- extra-param.ts
|-- index.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
