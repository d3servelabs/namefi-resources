# Docs

This folder contains the top-level MDX documentation pages for the API client docs site.
Numeric prefixes control navigation order, while nested folders hold longer guided
flows.

## File Relationships

- Markdown or MDX files are reader-facing documentation, usually ordered by filename or folder grouping.
- Keep navigation, links, and generated/imported source structure in sync when moving pages.

## Structure

```text
apps/api-client-docs/content/docs/
|-- README.md
|-- 03-getting-started/
|-- 01-installation.mdx
|-- 02-authentication.mdx
|-- 02a-eip712-signing.mdx
|-- 02b-siwe-authentication.mdx
|-- 02c-prepare-auth-requests.mdx
|-- index.mdx
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
