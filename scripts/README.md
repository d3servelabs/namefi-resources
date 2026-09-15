# Content maintenance scripts

Validation and generated-data tools for the Resources content repository. Run them from the repository root using the package scripts.

```text
scripts/
  validate-data.ts          Frontmatter and date checks
  build-termbase.ts         Published glossary titles and aliases
  build-termbase.test.ts    Draft exclusion regression
  glossary-fs.ts            Shared glossary source resolution
  check-tld-faq-sync*       Frontmatter/body FAQ consistency
  check-published-citations.ts  Post-publish citation fragment regression
  other scripts            Related content, priorities, and assets
```

The termbase generator excludes draft English entries and draft translations. This also keeps draft contributor READMEs out of the public canonical vocabulary. Run `bun test scripts/build-termbase.test.ts` and `bun termbase:check` after changing it.

After publishing citation changes, run `bun scripts/check-published-citations.ts <article-url> ...`. This read-only check requires real article HTML and fails when a `#ref-` link has no rendered target. Inline citations can link directly to the original source; HTML-only anchors may be removed by the application renderer.
