# Routers

This folder contains backend HTTP and route modules outside the main tRPC router tree.
These modules wire service handlers to transport-specific request and response behavior.

## File Relationships

- Router modules define transport-facing API boundaries and compose lower-level services.
- Keep request validation at the boundary and shared business rules in service or lib modules.

## Structure

```text
apps/backend/src/routers/
|-- README.md
|-- dns/
|-- orpc/
|-- altcha.ts
|-- audit-logs-test.ts
|-- availability.ts
|-- browser-logs-proxy.ts
|-- c15t.test.ts
|-- c15t.ts
|-- dnsviz.ts
|-- email-analytics.test.ts
|-- email-analytics.ts
|-- log-level.ts
|-- mcp.ts
|-- mls-rss-proxy.ts
|-- ... 17 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
