import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n-config';

// content.ts pulls in the `server-only` guard transitively; stub it so these
// helpers can run outside a Server Component context (same pattern as
// sitemap.test.ts).
vi.mock('server-only', () => ({}));

const {
  getGlossaryParams,
  getGlossaryCached,
  getPostParams,
  getPostCached,
  getAvailableLocalesForSlug,
} = await import('@/lib/content');

const glossaryParams = getGlossaryParams();
const EN_ONLY_TERM = glossaryParams.find(
  ({ lang, slug }) =>
    lang === i18n.defaultLocale &&
    i18n.locales.some(
      (locale) =>
        locale !== i18n.defaultLocale &&
        !glossaryParams.some(
          (param) => param.lang === locale && param.slug === slug,
        ),
    ),
)?.slug;

// Stable fixture in the content submodule: `dns` is translated into every locale.
const FULLY_TRANSLATED_TERM = 'dns';

function requireEnOnlyTerm() {
  if (!EN_ONLY_TERM) {
    throw new Error('Expected at least one English-only glossary term fixture');
  }
  return EN_ONLY_TERM;
}

describe('getGlossaryParams excludes default-locale fallbacks', () => {
  const params = glossaryParams;
  const has = (lang: string, slug: string) =>
    params.some((p) => p.lang === lang && p.slug === slug);

  it('keeps the own-locale (en) entry for an en-only term', () => {
    const enOnlyTerm = requireEnOnlyTerm();
    expect(has('en', enOnlyTerm)).toBe(true);
  });

  it('drops the fallback combos for an en-only term (they redirect)', () => {
    const enOnlyTerm = requireEnOnlyTerm();
    for (const locale of i18n.locales) {
      if (locale === i18n.defaultLocale) continue;
      expect(has(locale, enOnlyTerm)).toBe(false);
    }
  });

  it('keeps genuine translations of a fully-translated term', () => {
    expect(has('en', FULLY_TRANSLATED_TERM)).toBe(true);
    expect(has('zh', FULLY_TRANSLATED_TERM)).toBe(true);
  });

  it('every emitted param is an own-locale file, never a fallback', () => {
    expect(params.length).toBeGreaterThan(0);
    for (const { lang, slug } of params) {
      expect(getGlossaryCached(lang, slug)?.sourceLanguage).toBe(lang);
    }
  });
});

describe('getAvailableLocalesForSlug returns only real translations', () => {
  it('every returned locale has its own file (no fallback locales)', () => {
    const posts = getPostParams();
    expect(posts.length).toBeGreaterThan(0);
    const { lang, slug } = posts[0];
    const locales = getAvailableLocalesForSlug(slug);
    expect(locales).toContain(lang);
    for (const locale of locales) {
      expect(getPostCached(locale, slug)?.sourceLanguage).toBe(locale);
    }
  });
});
