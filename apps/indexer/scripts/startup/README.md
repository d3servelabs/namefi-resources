# Startup

This folder contains startup scripts for the Namefi NFT indexer deployment. Scripts
coordinate schema generation, service readiness, and container boot behavior for
zero-downtime indexer releases.

## File Relationships

- Direct files in this folder are peers for the same feature, docs, or asset family.
- Prefer small local additions here; move shared behavior upward only when multiple folders need it.

## Structure

```text
apps/indexer/scripts/startup/
|-- README.md
|-- Caddyfile
|-- docker-compose-with-migration.yml
|-- docker-compose-without-migration.yml
|-- footer.sh
|-- full.sh
|-- header.sh
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
