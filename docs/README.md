# Docs

This folder contains repository documentation that does not belong to a single app or
package. Prefer linking to deeper guides from here instead of duplicating long
operational or architecture writeups.

## File Relationships

- Direct files in this folder are peers for the same feature, docs, or asset family.
- Prefer small local additions here; move shared behavior upward only when multiple folders need it.

## Structure

```text
docs/
|-- README.md
|-- architecture/
|-- dev-guides/
|-- marketplaces/
|-- postmortem/
|-- product/
|-- rca/
|-- reports/
|-- ast-grep.md
|-- CICD-SETUP.md
|-- DB-MIGRATION-PROCEDURE.md
|-- dev-guides.md
|-- dnsviz-analyses-data-lifecycle.md
|-- email-subscriptions.md
|-- export-tracking-architecture.md
|-- ... 6 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
