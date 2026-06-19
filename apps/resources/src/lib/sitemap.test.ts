import type { MetadataRoute } from 'next';
import { describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/i18n-config';
import { i18n } from '@/i18n-config';

// `@/lib/sitemap` transitively imports the content modules, which pull in the
// `server-only` guard. Stub it so these pure render/alternate helpers can be
// unit-tested outside a Server Component context.
vi.mock('server-only', () => ({}));

const { createLanguageAlternates, renderSitemapXml } = await import(
  '@/lib/sitemap'
);

const BASE = 'https://namefi.io';

describe('createLanguageAlternates', () => {
  it('emits one entry per locale plus x-default pointing at the default locale', () => {
    const alternates = createLanguageAlternates(
      BASE,
      i18n.locales,
      (locale) => `/r/${locale}/blog`,
    );

    expect(alternates).toBeDefined();
    // Every supported locale is present...
    for (const locale of i18n.locales) {
      expect(alternates?.[locale]).toBe(`${BASE}/r/${locale}/blog`);
    }
    // ...and x-default falls back to the default (English) URL.
    expect(alternates?.['x-default']).toBe(
      `${BASE}/r/${i18n.defaultLocale}/blog`,
    );
  });

  it('omits x-default when the default locale is not among the alternates', () => {
    // A market-native page that has no English counterpart should not claim an
    // English x-default (that URL may not exist).
    const nonDefault = i18n.locales.filter(
      (locale) => locale !== i18n.defaultLocale,
    ) as Locale[];
    const alternates = createLanguageAlternates(
      BASE,
      nonDefault,
      (locale) => `/r/${locale}/tld/cn`,
    );

    expect(alternates).toBeDefined();
    expect(alternates?.['x-default']).toBeUndefined();
  });

  it('returns undefined when there are no locales', () => {
    expect(
      createLanguageAlternates(BASE, [], (l) => `/r/${l}`),
    ).toBeUndefined();
  });
});

describe('renderSitemapXml', () => {
  it('serializes hreflang alternates including x-default as xhtml:link', () => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${BASE}/r/en/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE}/r/en/blog`,
          es: `${BASE}/r/es/blog`,
          'x-default': `${BASE}/r/en/blog`,
        },
      },
    };

    const xml = renderSitemapXml([entry]);

    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(
      `<xhtml:link rel="alternate" hreflang="es" href="${BASE}/r/es/blog" />`,
    );
    expect(xml).toContain(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/r/en/blog" />`,
    );
  });
});
