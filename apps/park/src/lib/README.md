# Park Library

This folder contains Park app utilities for host handling, SEO metadata, and
parked-domain behavior. Keep public-domain assumptions explicit because this app runs
behind multiple hostnames.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/park/src/lib/
|-- README.md
|-- env/
|-- ai.ts
|-- frontend-url.ts
|-- indexing-policy.test.ts
|-- indexing-policy.ts
|-- metadata.ts
|-- opensea-listing.ts
|-- origin.ts
|-- relay.test.ts
|-- relay.ts
|-- request.ts
|-- structured-data.ts
|-- theme.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
