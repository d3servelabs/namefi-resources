import { describe, expect, it } from 'vitest';
import {
  generateRankedDomainSuggestions,
  safeGenerateRankedDomainSuggestions,
  sanitizeDomainSearchQuery,
} from './ranked-domain-suggestions';
import { RANKED_TLDS } from './tld-rank';

describe('generateRankedDomainSuggestions', () => {
  it('generates ranked TLD suggestions for a single label query', () => {
    const result = generateRankedDomainSuggestions('namefi', 1, 3);

    expect(result).toEqual({
      domains: ['namefi.com', 'namefi.xyz', 'namefi.io'],
      page: 1,
      totalPages: Math.ceil(RANKED_TLDS.length / 3),
      nextPage: 2,
      pageSize: 3,
    });
  });

  it('preserves a searched domain before ranked alternatives', () => {
    const result = generateRankedDomainSuggestions('namefi.io', 1, 3);

    expect(result.domains).toEqual(['namefi.io', 'namefi.com', 'namefi.xyz']);
  });

  it('clamps pages', () => {
    const result = generateRankedDomainSuggestions('namefi', 999, 10);

    expect(result.page).toBe(Math.ceil(RANKED_TLDS.length / 10));
    expect(result.nextPage).toBeNull();
  });

  it('throws for invalid queries like the API suggestion path', () => {
    expect(() => generateRankedDomainSuggestions('---')).toThrow(
      'violates Namefi rules',
    );
  });

  it('returns validation errors without throwing for client render paths', () => {
    const result = safeGenerateRankedDomainSuggestions('---');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('violates Namefi rules');
    }
  });
});

describe('sanitizeDomainSearchQuery', () => {
  it('normalizes URLs and trims unsupported characters', () => {
    expect(sanitizeDomainSearchQuery('https://Namefi!!.com/path')).toBe(
      'namefi.com',
    );
  });

  it('removes URL query strings and hashes', () => {
    expect(sanitizeDomainSearchQuery('https://example.com?foo=1')).toBe(
      'example.com',
    );
    expect(sanitizeDomainSearchQuery('https://example.com#section')).toBe(
      'example.com',
    );
  });

  it('preserves valid underscore labels and rejects invalid underscore placement', () => {
    expect(sanitizeDomainSearchQuery('_sip.example.com')).toBe(
      '_sip.example.com',
    );
    expect(() => sanitizeDomainSearchQuery('some_label.com')).toThrow(
      'violates Namefi rules',
    );
  });
});
