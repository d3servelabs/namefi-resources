# Workflows

This folder contains AI workflow modules. Workflows should keep model-facing prompts,
orchestration steps, and typed outputs organized by use case.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/ai/src/workflows/
|-- README.md
|-- digest-animation-workflow.ts
|-- logo-animation-workflow.test.ts
|-- logo-animation-workflow.ts
|-- logo-workflow.ts
|-- marketing-workflow.test.ts
|-- marketing-workflow.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
