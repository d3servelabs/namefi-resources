import type { MetadataRoute } from 'next';
import { i18n, type Locale } from '@/i18n-config';
import { resolveBaseUrl } from '@/lib/site-url';
import { buildSitemapEntries } from '@/lib/sitemap';

function resolveLocale(lang: string): Locale {
  return i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for metadata routes.
export default async function sitemap(context?: {
  params?: { lang?: string };
}): Promise<MetadataRoute.Sitemap> {
  const lang = context?.params?.lang ?? i18n.defaultLocale;
  const locale = resolveLocale(lang);
  const baseUrl = resolveBaseUrl();
  return buildSitemapEntries(baseUrl, [locale]);
}
