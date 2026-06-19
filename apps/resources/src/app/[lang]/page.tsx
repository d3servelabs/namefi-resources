import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { resolveBaseUrl } from '@/lib/site-url';
import { resolveTitle } from '@/lib/site-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
  const baseUrl = resolveBaseUrl();
  // SEO: each locale home is self-canonical so it can rank in its own
  // language; hreflang `languages` + `x-default` (below) map the cluster.
  const canonicalUrl = new URL(`/r/${locale}`, baseUrl);
  const rssFeedUrl = new URL(`/r/${locale}/rss.xml`, baseUrl);
  const title = resolveTitle(locale);
  const description = 'Blog posts about Namefi';

  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = new URL(
      `/r/${localeOption}`,
      baseUrl,
    ).toString();
  }
  languageAlternates['x-default'] = new URL('/r/en', baseUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl.toString(),
      languages: languageAlternates,
      types: {
        'application/rss+xml': rssFeedUrl.toString(),
      },
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;

  redirect(`/${locale}/blog`);
}
