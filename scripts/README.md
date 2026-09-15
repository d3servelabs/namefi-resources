# Content tooling

Run these scripts from the repository root with Bun, except for the Python
brand-kit asset builder.

- `validate-data.ts` checks frontmatter and related routes in existing files.
  Its fixtures accept English-only and selective translation coverage while
  retaining malformed-metadata, wrong-locale, and broken-target failures.
- `check-tld-faq-sync.ts` keeps structured FAQ answers aligned with page prose.
- `add-related-content.ts` maintains related-content metadata.
- `glossary-fs.ts`, `build-termbase.ts`, `check-termbase.ts`, and
  `glossary-mentions.ts` share glossary data and terminology checks.
- `list-priority.ts` reports editorial priorities;
  `build-brand-kit-assets.py` builds brand-kit assets.

`bun data:test` runs the validator and FAQ regression tests. The separate
`bun links:test` suite covers link prefixes and ordered relationship slugs.
See the [validation commands](../README.md#validation) for corpus-wide checks.
