import { describe, expect, it } from 'vitest';
import { parseGlossaryHref } from '@/lib/glossary-href';

describe('parseGlossaryHref', () => {
  it('parses a glossary entry href into locale + slug', () => {
    expect(parseGlossaryHref('/en/glossary/registrar/')).toEqual({
      locale: 'en',
      slug: 'registrar',
    });
    expect(parseGlossaryHref('/zh/glossary/dns-record-types')).toEqual({
      locale: 'zh',
      slug: 'dns-record-types',
    });
  });

  it('returns null for non-glossary internal links', () => {
    expect(parseGlossaryHref('/en/blog/some-post/')).toBeNull();
    expect(parseGlossaryHref('/en/tld/com/')).toBeNull();
    expect(parseGlossaryHref('/en/glossary/')).toBeNull();
  });

  it('returns null for hrefs with extra segments, queries, or hashes', () => {
    expect(parseGlossaryHref('/en/glossary/registrar/extra')).toBeNull();
    expect(parseGlossaryHref('/en/glossary/registrar?x=1')).toBeNull();
    expect(parseGlossaryHref('/en/glossary/registrar#section')).toBeNull();
    expect(
      parseGlossaryHref('https://example.com/en/glossary/registrar/'),
    ).toBeNull();
  });
});
