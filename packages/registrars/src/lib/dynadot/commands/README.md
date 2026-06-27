# Commands

This folder contains Dynadot command modules. Each command maps Namefi registrar
operations onto Dynadot request and response shapes.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/registrars/src/lib/dynadot/commands/
|-- README.md
|-- transfer/
|-- cancel_transfer.ts
|-- clear_dnssec.ts
|-- create_contact.ts
|-- domain_info.ts
|-- get_account_balance.ts
|-- get_contact.ts
|-- get_dnssec.ts
|-- get_ns.ts
|-- get_transfer_auth_code.ts
|-- get_transfer_status.ts
|-- index.ts
|-- list_domain.ts
|-- lock_domain.ts
|-- ... 12 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
