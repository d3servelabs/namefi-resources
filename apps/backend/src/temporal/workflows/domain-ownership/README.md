# Domain Ownership

This folder contains Temporal workflow definitions for domain ownership. Workflow code
must remain deterministic and delegate network, database, and other side effects to
activities.

## File Relationships

- Workflows orchestrate deterministic steps; activities perform side effects.
- Keep shared helpers deterministic when imported by workflow code.

## Structure

```text
apps/backend/src/temporal/workflows/domain-ownership/
|-- README.md
|-- acquire-domain.workflow.ts
|-- domain-setup.workflow.ts
|-- epp-register-or-import.required-action.md
|-- epp-register-or-import.workflow.ts
|-- extend-registration.workflow.ts
|-- prepare-domain-for-export.workflow.ts
|-- sld-register-or-import.workflow.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
