# Factory

This folder contains registrar error factory helpers. Factories normalize
provider-specific failures into typed errors that callers can handle consistently.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/errors/factory/
|-- README.md
|-- from-dynadot.test.ts
|-- from-dynadot.ts
|-- from-epp.test.ts
|-- from-epp.ts
|-- from-r53.test.ts
|-- from-r53.ts
|-- index.ts
|-- transport.test.ts
|-- transport.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
