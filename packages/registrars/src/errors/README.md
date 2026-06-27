# Errors

This folder contains shared registrar error classes, codes, and mapping utilities. Use
these modules to preserve consistent error semantics across registrar integrations.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/errors/
|-- README.md
|-- factory/
|-- base.test.ts
|-- base.ts
|-- codes.ts
|-- decorator.test.ts
|-- decorator.ts
|-- guards.test.ts
|-- guards.ts
|-- index.ts
|-- known.ts
|-- messages.test.ts
|-- messages.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
