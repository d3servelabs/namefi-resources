# Migration Metadata

This folder contains Drizzle migration metadata snapshots. These JSON files pair with
SQL migrations and are normally updated by Drizzle tooling rather than edited by hand.

## File Relationships

- SQL migrations and metadata snapshots must stay in the order produced by the migration tool.
- Regenerate or resolve migration conflicts through the repo migration workflow instead of editing snapshots casually.

## Structure

```text
packages/db/src/migrations/meta/
|-- README.md
|-- _journal.json
|-- 0000_snapshot.json
|-- 0001_snapshot.json
|-- 0002_snapshot.json
|-- 0003_snapshot.json
|-- 0004_snapshot.json
|-- 0005_snapshot.json
|-- 0006_snapshot.json
|-- 0007_snapshot.json
|-- 0008_snapshot.json
|-- 0009_snapshot.json
|-- 0010_snapshot.json
|-- 0011_snapshot.json
|-- 0012_snapshot.json
|-- ... 116 more
```

## Maintenance

Update this README when the generation or import process changes, not for every
generated file churn.
