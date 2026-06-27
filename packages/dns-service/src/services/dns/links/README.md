# Links

This folder contains DNS link-provider helpers. Modules map provider-specific link
behavior into the DNS service layer so callers can treat link records consistently.

## File Relationships

- Service modules hold business operations that are reused by routers, jobs, or workflows.
- Provider-specific details should stay behind small helpers so callers see stable service behavior.

## Structure

```text
packages/dns-service/src/services/dns/links/
|-- README.md
|-- cache-helpers.ts
|-- combinators.test.ts
|-- combinators.ts
|-- conditional-resolving-link.ts
|-- helpers.ts
|-- logging-link.ts
|-- lru-cache-link.test.ts
|-- lru-cache-link.ts
|-- mock.ts
|-- park-gate-link.test.ts
|-- park-gate-link.ts
|-- redis-cache-link.test.ts
|-- redis-cache-link.ts
|-- relay-zone-authority-link.test.ts
|-- ... 9 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
