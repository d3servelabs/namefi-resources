# Types

This folder contains registrar data type definitions. Types here model domain, contact,
availability, registration, and provider payloads used across registrar adapters.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/lib/data/types/
|-- README.md
|-- contact/
|-- dnssec.ts
|-- domain-availability.ts
|-- domain-status.ts
|-- domain.ts
|-- index.ts
|-- nameservers.ts
|-- operation-status.ts
|-- operation-type.ts
|-- operation.ts
|-- price-with-currency.ts
|-- renew-option.ts
|-- suggestions.ts
|-- transfer-status.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
