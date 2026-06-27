# Host

This folder contains EPP host command builders and response handlers. Host commands
manage nameserver host objects used by registries.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/epp-client/src/client/commands/host/
|-- README.md
|-- check.ts
|-- create.ts
|-- delete.ts
|-- index.ts
|-- info.ts
|-- types.ts
|-- update.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
