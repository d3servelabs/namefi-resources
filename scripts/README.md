# Content maintenance scripts

Validation and generated-data tools for the Resources content repository. Run them from the repository root using the package scripts.

```text
scripts/
  validate-data.ts          Frontmatter and date checks
  validate-data.test.ts     English-only and selective translation fixtures
  build-termbase.ts         Published glossary titles and aliases
  build-termbase.test.ts    Draft exclusion regression
  glossary-fs.ts            Shared glossary source resolution
  check-tld-faq-sync*       Frontmatter/body FAQ consistency
  other scripts            Related content, priorities, and assets
```

The termbase generator excludes draft English entries and draft translations. This also keeps draft contributor READMEs out of the public canonical vocabulary. Run `bun test scripts/build-termbase.test.ts` and `bun termbase:check` after changing it.

The validator fixtures accept English-only and selective translation coverage
while retaining malformed-metadata, wrong-locale, and broken-target failures.
`bun data:test` runs the validator, termbase, and FAQ regression tests; the normal
`bun data:validate` command runs these before validating the corpus. The separate
`bun links:test` suite covers link prefixes and ordered relationship slugs.
See the [validation commands](../README.md#validation) for corpus-wide checks.
