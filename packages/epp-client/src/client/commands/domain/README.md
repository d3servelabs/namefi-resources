# Domain

This folder contains EPP domain command builders and response handlers. These commands
implement domain lifecycle operations such as check, create, info, renew, transfer, and
update.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/epp-client/src/client/commands/domain/
|-- README.md
|-- check.ts
|-- create.ts
|-- delete.ts
|-- index.ts
|-- info.ts
|-- renew.ts
|-- transfer.ts
|-- types.ts
|-- update.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
