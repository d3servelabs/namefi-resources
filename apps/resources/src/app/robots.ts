import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';
import { resolveBaseUrl } from '@/lib/site-url';

const ROOT_SITEMAP_PATH = '/r/sitemap.xml';

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for metadata routes.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();
  const localeSitemaps = i18n.locales.map(
    (locale) => `${baseUrl}/r/${locale}/sitemap.xml`,
  );
  return {
    rules: [
      {
        userAgent: '*',
      },
    ],
    host: baseUrl,
    sitemap: [`${baseUrl}${ROOT_SITEMAP_PATH}`, ...localeSitemaps],
  };
}
