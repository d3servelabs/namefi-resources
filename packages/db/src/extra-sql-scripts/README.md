# Extra SQL Scripts

This folder contains extra SQL scripts that sit outside the generated migration stream.
Use them for operational or one-off database tasks that need source control but should
not run as normal migrations.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/db/src/extra-sql-scripts/
|-- README.md
|-- 0x-city-campaign-setup.sql
|-- create_constant_function_procedure.sql
|-- create_namefi_nft_views_from_ponder.sql
|-- dedupe_active_notifications.sql
|-- extra-text-array-helpers.sql
|-- pbn_reservations_triggers.sql
|-- rewrite_views_with_new_schema.sql
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
