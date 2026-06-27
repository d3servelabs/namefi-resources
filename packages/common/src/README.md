# Common Package Source

This folder contains the source modules for `@namefi-astra/common`. Code here must stay
isomorphic and dependency-light because it is imported by frontend, backend, and other
packages.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/common/src/
|-- README.md
|-- contract/
|-- types/
|-- ai-generation-credits.test.ts
|-- ai-generation-credits.ts
|-- analytics-parser.ts
|-- announcements-condition.ts
|-- auth-session.ts
|-- centralnic-test-tlds.ts
|-- domain-availability.ts
|-- email-campaigns.ts
|-- google-analytics.test.ts
|-- google-analytics.ts
|-- host-policy.test.ts
|-- host-policy.ts
|-- ... 14 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
