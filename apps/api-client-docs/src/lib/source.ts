import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader, multiple } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import type { TOCItemType } from 'fumadocs-core/toc';
import { openapiPlugin, openapiSource } from 'fumadocs-openapi/server';
import type { ComponentType } from 'react';
import { openapi } from '@/lib/openapi';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
    openapi: await openapiSource(openapi, {
      baseDir: 'openapi',
      groupBy: 'tag',
    }),
  }),
  {
    baseUrl: '/docs',
    plugins: [lucideIconsPlugin(), openapiPlugin()],
  },
);

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

type SourcePageData = InferPageType<typeof source>['data'];

type DocsPageData = Extract<SourcePageData, { type: 'docs' }> & {
  body: ComponentType<{ components?: Record<string, unknown> }>;
  getText: (mode: 'processed' | 'raw') => Promise<string>;
  toc?: TOCItemType[];
};

function isDocsPageData(data: SourcePageData): data is DocsPageData {
  return data.type === 'docs' && 'body' in data && 'getText' in data;
}

export async function getLLMText(page: InferPageType<typeof source>) {
  if (page.data.type === 'openapi') {
    // e.g. return the stringified OpenAPI schema
    return JSON.stringify(page.data.getSchema().bundled, null, 2);
  }

  if (!isDocsPageData(page.data)) {
    return `# ${page.data.title}`;
  }

  const docsPageData = page.data;
  const processed = await docsPageData
    .getText('processed')
    .catch(() => docsPageData.getText('raw'));

  return `# ${page.data.title}

${processed}`;
}
