# Hunt

This folder contains backend services for domain hunting and wishlist-style flows. Keep
search, ranking, persistence, and notification logic separated so API routers can
compose them predictably.

## File Relationships

- Service modules hold business operations that are reused by routers, jobs, or workflows.
- Provider-specific details should stay behind small helpers so callers see stable service behavior.

## Structure

```text
apps/backend/src/services/hunt/
|-- README.md
|-- award.service.ts
|-- campaign.service.ts
|-- domain.service.ts
|-- helpers.ts
|-- schedule.service.ts
|-- schema.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
