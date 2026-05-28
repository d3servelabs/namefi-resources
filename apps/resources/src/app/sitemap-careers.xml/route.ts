import { getCareerEntriesForLocale } from '@/lib/content';
import { renderSitemapXml } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';
import type { MetadataRoute } from 'next';

export const revalidate = 86400;

export function GET() {
  const baseUrl = resolveBaseUrl();
  const entries = getCareerEntriesForLocale('en');

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/r/en/careers`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...entries.map((entry) => ({
      url: `${baseUrl}/r/en/careers/${entry.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  const xml = renderSitemapXml(sitemapEntries);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
