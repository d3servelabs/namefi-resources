# Namefi Feed

This folder contains services for building the Namefi feed. Modules gather, normalize,
and publish feed items from domain, marketplace, and account events.

## File Relationships

- Service modules hold business operations that are reused by routers, jobs, or workflows.
- Provider-specific details should stay behind small helpers so callers see stable service behavior.

## Structure

```text
apps/backend/src/services/namefi-feed/
|-- README.md
|-- admin.service.ts
|-- digest-media.service.test.ts
|-- digest-media.service.ts
|-- digest-targets.service.ts
|-- digest.service.test.ts
|-- digest.service.ts
|-- ingestion.service.ts
|-- listing-visibility.ts
|-- listings.service.test.ts
|-- listings.service.ts
|-- marketplace-lifecycle.service.test.ts
|-- marketplace-lifecycle.service.ts
|-- marketplace-rss.test.ts
|-- marketplace-rss.ts
|-- ... 5 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
