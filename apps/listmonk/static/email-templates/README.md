# Email Templates

This folder contains static email template assets for the Listmonk deployment. Templates
are synced into the Listmonk static bundle and should be updated with the corresponding
campaign or transactional copy.

## File Relationships

- Direct files in this folder are peers for the same feature, docs, or asset family.
- Prefer small local additions here; move shared behavior upward only when multiple folders need it.

## Structure

```text
apps/listmonk/static/email-templates/
|-- README.md
|-- base.html
|-- campaign-status.html
|-- default-archive.tpl
|-- default-visual.json
|-- default-visual.tpl
|-- default.tpl
|-- import-status.html
|-- sample-tx.tpl
|-- smtp-test.html
|-- subscriber-data.html
|-- subscriber-optin-campaign.html
|-- subscriber-optin.html
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
