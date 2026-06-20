import { describe, expect, it } from 'vitest';
import {
  buildDefinedTermJsonLd,
  buildDefinedTermSetJsonLd,
  buildWebsiteJsonLd,
} from '@/lib/structured-data';

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

describe('buildDefinedTermSetJsonLd', () => {
  it('emits a DefinedTermSet whose members are the glossary terms', () => {
    const jsonLd = buildDefinedTermSetJsonLd({
      name: 'Namefi Glossary',
      description: 'Key concepts.',
      canonicalUrl: 'https://namefi.io/r/en/glossary',
      baseUrl: BASE_URL,
      locale: 'en',
      terms: [
        { name: 'Leasing', url: 'https://namefi.io/r/en/glossary/leasing' },
        { name: 'ICANN', url: 'https://namefi.io/r/en/glossary/icann' },
      ],
    });

    expect(jsonLd['@type']).toBe('DefinedTermSet');
    expect(jsonLd['@id']).toBe(
      'https://namefi.io/r/en/glossary#definedtermset',
    );
    expect(jsonLd.url).toBe('https://namefi.io/r/en/glossary');
    const members = jsonLd.hasDefinedTerm as Array<Record<string, unknown>>;
    expect(members).toHaveLength(2);
    expect(members[0]).toMatchObject({
      '@type': 'DefinedTerm',
      name: 'Leasing',
      url: 'https://namefi.io/r/en/glossary/leasing',
    });
  });
});

describe('buildDefinedTermJsonLd', () => {
  it('links the term back to its locale DefinedTermSet by @id', () => {
    const jsonLd = buildDefinedTermJsonLd({
      name: 'Leasing',
      description: 'Renting a domain while retaining ownership.',
      url: 'https://namefi.io/r/zh/glossary/leasing',
      canonicalUrl: 'https://namefi.io/r/en/glossary/leasing',
      locale: 'zh',
      termSet: {
        name: 'Namefi Glossary',
        url: 'https://namefi.io/r/zh/glossary',
      },
    });

    expect(jsonLd['@type']).toBe('DefinedTerm');
    // @id tracks the page canonical (English) like the page's other nodes...
    expect(jsonLd['@id']).toBe(
      'https://namefi.io/r/en/glossary/leasing#definedterm',
    );
    // ...while url is the actual per-locale page and inLanguage matches it.
    expect(jsonLd.url).toBe('https://namefi.io/r/zh/glossary/leasing');
    expect(jsonLd.inLanguage).toBe('zh');
    const termSet = jsonLd.inDefinedTermSet as Record<string, unknown>;
    expect(termSet['@id']).toBe(
      'https://namefi.io/r/zh/glossary#definedtermset',
    );
  });

  it('omits description when none is provided', () => {
    const jsonLd = buildDefinedTermJsonLd({
      name: 'Leasing',
      url: 'https://namefi.io/r/en/glossary/leasing',
      canonicalUrl: 'https://namefi.io/r/en/glossary/leasing',
      locale: 'en',
      termSet: {
        name: 'Namefi Glossary',
        url: 'https://namefi.io/r/en/glossary',
      },
    });

    expect(jsonLd).not.toHaveProperty('description');
  });
});
