# Migrations

This folder contains Drizzle SQL migrations for the shared database schema. Migration
order and metadata must stay aligned so local, CI, and production database updates apply
consistently.

## File Relationships

- SQL migrations and metadata snapshots must stay in the order produced by the migration tool.
- Regenerate or resolve migration conflicts through the repo migration workflow instead of editing snapshots casually.

## Structure

```text
packages/db/src/migrations/
|-- README.md
|-- meta/
|-- 0000_modern_kronos.sql
|-- 0001_eager_maddog.sql
|-- 0002_lyrical_archangel.sql
|-- 0003_sleepy_la_nuit.sql
|-- 0004_big_red_hulk.sql
|-- 0005_little_joshua_kane.sql
|-- 0006_neat_king_cobra.sql
|-- 0007_bouncy_tempest.sql
|-- 0008_tricky_morbius.sql
|-- 0009_lovely_ben_grimm.sql
|-- 0010_nifty_thunderball.sql
|-- 0011_pale_sharon_carter.sql
|-- 0012_worried_sentry.sql
|-- ... 116 more
```

## Maintenance

Update this README when the generation or import process changes, not for every
generated file churn.
