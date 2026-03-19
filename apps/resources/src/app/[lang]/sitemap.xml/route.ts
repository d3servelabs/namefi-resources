import type { MetadataRoute } from 'next';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from '@/i18n-config';
import { buildSitemapEntries } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';

const SITEMAP_CACHE_TTL_SECONDS = 3600;

export const dynamic = 'force-dynamic';

function resolveLocale(lang: string): Locale {
  return i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatLastModified(
  value: MetadataRoute.Sitemap[number]['lastModified'],
) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function renderSitemap(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const alternates = Object.entries(entry.alternates?.languages ?? {})
        .map(
          ([hrefLang, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(hrefLang)}" href="${escapeXml(href)}" />`,
        )
        .join('\n');
      const lastModified = formatLastModified(entry.lastModified);
      const parts = ['  <url>', `    <loc>${escapeXml(entry.url)}</loc>`];

      if (alternates) {
        parts.push(alternates);
      }
      if (lastModified) {
        parts.push(`    <lastmod>${lastModified}</lastmod>`);
      }
      if (entry.changeFrequency) {
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (typeof entry.priority === 'number') {
        parts.push(`    <priority>${entry.priority}</priority>`);
      }

      parts.push('  </url>');
      return parts.join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    '</urlset>',
  ].join('\n');
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ lang: string }> },
) {
  const { lang } = await context.params;
  const locale = resolveLocale(lang);
  const entries = buildSitemapEntries(resolveBaseUrl(), [locale]);
  const xml = renderSitemap(entries);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `s-maxage=${SITEMAP_CACHE_TTL_SECONDS}, stale-while-revalidate`,
    },
  });
}
