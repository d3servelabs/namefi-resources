# Leadgen

This folder contains lead-generation helper logic for backend flows. Modules organize
capture, enrichment, persistence, and downstream routing behavior used by product and
marketing surfaces.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/leadgen/
|-- README.md
|-- order-update.test.ts
|-- order-update.ts
|-- ordering.ts
|-- runs.test.ts
|-- runs.ts
|-- snapshot.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
