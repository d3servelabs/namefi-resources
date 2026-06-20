import { describe, expect, it } from 'vitest';
import { resolveLocaleFromParam } from './negotiate';

describe('resolveLocaleFromParam (Google-style ?hl= override)', () => {
  it('accepts an exact supported locale tag', () => {
    expect(resolveLocaleFromParam('en')).toBe('en');
    expect(resolveLocaleFromParam('zh')).toBe('zh');
    expect(resolveLocaleFromParam('ar-EG')).toBe('ar-EG');
  });

  it('maps a language-only tag to its supported regional locale', () => {
    expect(resolveLocaleFromParam('ar')).toBe('ar-EG');
  });

  it('maps a lang-region tag to the supported language', () => {
    expect(resolveLocaleFromParam('zh-CN')).toBe('zh');
    expect(resolveLocaleFromParam('en-GB')).toBe('en');
    expect(resolveLocaleFromParam('fr-CA')).toBe('fr');
  });

  it('is case-insensitive', () => {
    expect(resolveLocaleFromParam('ZH')).toBe('zh');
    expect(resolveLocaleFromParam('Zh-cn')).toBe('zh');
  });

  it('trims surrounding whitespace', () => {
    expect(resolveLocaleFromParam('  de  ')).toBe('de');
  });

  it('returns null for unsupported languages (caller keeps cookie/Accept-Language)', () => {
    expect(resolveLocaleFromParam('pt')).toBeNull();
    expect(resolveLocaleFromParam('ru-RU')).toBeNull();
  });

  it('returns null for empty, missing, or malformed values', () => {
    expect(resolveLocaleFromParam(null)).toBeNull();
    expect(resolveLocaleFromParam(undefined)).toBeNull();
    expect(resolveLocaleFromParam('')).toBeNull();
    expect(resolveLocaleFromParam('   ')).toBeNull();
    expect(resolveLocaleFromParam('not a locale')).toBeNull();
  });
});
