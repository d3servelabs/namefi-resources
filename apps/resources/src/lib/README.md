# Resources Library

Server and client helpers shared by Resources routes and components. This
folder owns content loading, taxonomy, metadata, analytics helpers, sitemap
generation, and small formatting utilities.

```text
lib/
  content.ts              # reads Markdown content from apps/resources/data
  taxonomy.ts             # controlled clusters, series, and content formats
  sitemap.ts              # sitemap entry generation and XML serialization
  structured-data.ts      # JSON-LD builders
  resource-*.ts(x)        # collection card metadata and image helpers
  *.(test).ts             # focused unit tests for pure helpers
```

Keep file-system content access inside server-only helpers such as
`content.ts`. Components should consume the normalized entries instead of
reading files directly.
