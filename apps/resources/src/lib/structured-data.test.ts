import { describe, expect, it } from 'vitest';
import { buildWebsiteJsonLd } from '@/lib/structured-data';

const BASE_URL = 'https://namefi.io';

describe('buildWebsiteJsonLd', () => {
  it('emits a WebSite node with the site name and resources root url', () => {
    const jsonLd = buildWebsiteJsonLd({ baseUrl: BASE_URL, locale: 'en' });

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('WebSite');
    expect(jsonLd.name).toBe('Namefi');
    expect(jsonLd.alternateName).toBe('Namefi Resources');
    expect(jsonLd.url).toBe('https://namefi.io/r/en');
    expect(jsonLd.inLanguage).toBe('en');
  });

  it('keys @id and url per-locale to match the self-canonical i18n strategy', () => {
    const en = buildWebsiteJsonLd({ baseUrl: BASE_URL, locale: 'en' });
    const zh = buildWebsiteJsonLd({ baseUrl: BASE_URL, locale: 'zh' });

    expect(en['@id']).toBe('https://namefi.io/r/en#website');
    expect(zh['@id']).toBe('https://namefi.io/r/zh#website');
    expect(zh.url).toBe('https://namefi.io/r/zh');
    expect(en['@id']).not.toBe(zh['@id']);
  });

  it('embeds the Organization publisher so the Org node is present site-wide', () => {
    const jsonLd = buildWebsiteJsonLd({ baseUrl: BASE_URL, locale: 'en' });
    const publisher = jsonLd.publisher as Record<string, unknown>;

    expect(publisher['@type']).toBe('Organization');
    expect(publisher['@id']).toBe('https://namefi.io/#organization');
  });
});
