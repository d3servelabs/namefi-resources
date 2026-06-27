# Resources Library

Server and client helpers shared by Resources routes and components. This
folder owns content loading from the `apps/resources/data` submodule,
taxonomy, metadata, analytics helpers, sitemap generation, structured data,
search, URLs, media helpers, and small formatting utilities.

```text
lib/
  content.ts                  # content loaders and normalized entries
  taxonomy.ts                 # controlled clusters, series, and formats
  sitemap.ts                  # sitemap entry generation and XML serialization
  structured-data.ts          # JSON-LD builders
  resource-meta-items.tsx     # card metadata item builder
  resource-index-preview.ts   # index preview image resolution
  resource-*.ts(x)            # collection card metadata and image helpers
  *.(test).ts                 # focused unit tests for pure helpers
```

- `content.ts` is the content source of truth. It reads MDX/frontmatter from the
  data submodule and exposes typed getters for blog, glossary, partner, career,
  TLD, author, topic, and series pages.
- `site-metadata.ts`, `site-url.ts`, `sitemap.ts`, and `structured-data.ts`
  handle SEO-facing metadata, canonical URLs, sitemap output, and JSON-LD.
- Use slugs from `taxonomy.ts` instead of inventing ad hoc taxonomy strings in
  route code.

Keep file-system content access inside server-only helpers such as
`content.ts`. Components should consume the normalized entries instead of
reading files directly.
