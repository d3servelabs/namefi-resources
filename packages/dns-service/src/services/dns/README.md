# DNS

This folder contains DNS service modules for the shared DNS service package. Keep
provider-specific details behind focused helpers and expose stable operations to
callers.

## File Relationships

- Service modules hold business operations that are reused by routers, jobs, or workflows.
- Provider-specific details should stay behind small helpers so callers see stable service behavior.

## Structure

```text
packages/dns-service/src/services/dns/
|-- README.md
|-- links/
|-- park-gate/
|-- dns-request-handler.test.ts
|-- dns-request-handler.ts
|-- dns-request-handler.types.ts
|-- dns-request-question.test.ts
|-- dns-request-question.ts
|-- dns-response-utils.ts
|-- factory.ts
|-- helpers.ts
|-- managed-records.test.ts
|-- managed-records.ts
|-- parking.ts
|-- service.ts
|-- ... 1 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
