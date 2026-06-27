# DNS

This folder contains backend DNS service helpers. Modules here coordinate DNS provider
behavior, validation, cache updates, and domain-facing service operations.

## File Relationships

- Service modules hold business operations that are reused by routers, jobs, or workflows.
- Provider-specific details should stay behind small helpers so callers see stable service behavior.

## Structure

```text
apps/backend/src/services/dns/
|-- README.md
|-- dns-request-handler.types.ts
|-- dns-request-question.ts
|-- factory.ts
|-- managed-records.ts
|-- parking.ts
|-- service.ts
|-- vercel-anycast.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
