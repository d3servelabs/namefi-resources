# Centralnic

This folder contains the CentralNic registrar adapter. Modules here translate Namefi
registrar operations into CentralNic/EPP behavior and provider-specific data handling.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/registrars/centralnic/
|-- README.md
|-- centralnic-registrar.ts
|-- domain-index.ts
|-- helpers.test.ts
|-- helpers.ts
|-- index.ts
|-- types.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
