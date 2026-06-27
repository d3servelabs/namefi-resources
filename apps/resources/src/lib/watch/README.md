# Watch

This folder contains watch-mode and content-observation helpers for the Resources app.
Modules here support development and validation flows around content data changes.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/resources/src/lib/watch/
|-- README.md
|-- chapters.ts
|-- config.ts
|-- index.ts
|-- schema-org.ts
|-- types.ts
|-- youtube.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
