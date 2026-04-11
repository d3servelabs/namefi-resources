import { readFile } from 'node:fs/promises';
import { createOpenAPI } from 'fumadocs-openapi/server';

const OPENAPI_DOC_URL =
  'https://backend.astra.namefi.dev/v-next/openapi/doc.json';

type OpenApiTag = {
  name: string;
  description?: string;
};

type OpenApiOperation = {
  tags?: string[];
};

type OpenApiDocument = {
  tags?: OpenApiTag[];
  paths?: Record<string, Record<string, OpenApiOperation>>;
  webhooks?: Record<string, Record<string, OpenApiOperation>>;
};

async function loadOpenApiDocument(input: string): Promise<OpenApiDocument> {
  if (URL.canParse(input)) {
    const response = await fetch(input);

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI document from ${input}`);
    }

    return response.json();
  }

  return JSON.parse(await readFile(input, 'utf8'));
}

function normalizeOpenApiTags(document: OpenApiDocument): OpenApiDocument {
  const knownTags = new Map(
    (document.tags ?? []).map(
      (tag) => [tag.name, tag] satisfies [string, OpenApiTag],
    ),
  );
  let hasUntaggedOperations = false;

  const collectTags = (
    operations?: Record<string, Record<string, OpenApiOperation>>,
  ) => {
    for (const methods of Object.values(operations ?? {})) {
      for (const operation of Object.values(methods)) {
        const tags = operation.tags?.filter(Boolean) ?? [];

        if (tags.length === 0) {
          hasUntaggedOperations = true;
          continue;
        }

        for (const tag of tags) {
          if (!knownTags.has(tag)) {
            knownTags.set(tag, { name: tag });
          }
        }
      }
    }
  };

  collectTags(document.paths);
  collectTags(document.webhooks);

  if (hasUntaggedOperations && !knownTags.has('unknown')) {
    knownTags.set('unknown', { name: 'unknown' });
  }

  return {
    ...document,
    tags: [...knownTags.values()],
  };
}

export const openapi = createOpenAPI({
  input: async () => ({
    [OPENAPI_DOC_URL]: normalizeOpenApiTags(
      await loadOpenApiDocument(OPENAPI_DOC_URL),
    ),
  }),
});
