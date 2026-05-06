import { describe, expect, it } from 'vitest';
import {
  generateRankedDomainSuggestions,
  safeGenerateRankedDomainSuggestions,
  sanitizeDomainSearchQuery,
} from './ranked-domain-suggestions';
import { RANKED_TLDS } from './tld-rank';

const maxLengthLabel = 'a'.repeat(63);
const overlongDomain = Array.from({ length: 5 }, () => maxLengthLabel).join(
  '.',
);
const truncatedOverlongDomain = Array.from(
  { length: 4 },
  () => maxLengthLabel,
).join('.');

const sanitizedQueryCases = [
  { query: 'namefi', expected: 'namefi' },
  { query: '  NameFi  ', expected: 'namefi' },
  { query: 'NameFi.COM', expected: 'namefi.com' },
  { query: 'namefi..com', expected: 'namefi.com' },
  { query: '.namefi.com.', expected: 'namefi.com' },
  { query: 'namefi . com', expected: 'namefi.com' },
  { query: 'Namefi!!.com', expected: 'namefi.com' },
  { query: 'hello world', expected: 'hello-world' },
  { query: 'some_label.com', expected: 'some-label.com' },
  { query: '---namefi---.com', expected: 'namefi.com' },
  { query: 'namefi‐labs.com', expected: 'namefi-labs.com' },
  { query: 'rock&roll.com', expected: 'rock-roll.com' },
  { query: 'https://Namefi.com/path?utm=1#top', expected: 'namefi.com' },
  { query: 'https://Namefi.com:443/path?utm=1', expected: 'namefi.com' },
  { query: 'NameFi.com:443', expected: 'namefi.com' },
  { query: 'www.namefi.com/path', expected: 'www.namefi.com' },
  { query: '12345', expected: '12345' },
  { query: 'http://12345:8080/path', expected: '12345' },
  { query: '１２３４５', expected: '12345' },
  { query: 'bücher.com', expected: 'xn--bcher-kva.com' },
  { query: '例え.com', expected: 'xn--r8jz45g.com' },
  { query: 'xn--bcher-kva.com', expected: 'xn--bcher-kva.com' },
  { query: '_sip._tcp.example.com', expected: '_sip._tcp.example.com' },
  { query: `${'a'.repeat(64)}.com`, expected: `${'a'.repeat(63)}.com` },
  { query: overlongDomain, expected: truncatedOverlongDomain },
] as const;

const invalidQueryCases = [
  { query: '', expectedMessage: 'empty domain' },
  { query: '   ', expectedMessage: 'empty domain' },
  { query: '.', expectedMessage: 'empty domain' },
  { query: '---', expectedMessage: 'empty domain' },
] as const;

const rankedSuggestionCases = [
  {
    query: 'namefi',
    expectedDomains: ['namefi.com', 'namefi.xyz', 'namefi.io'],
  },
  {
    query: 'NameFi.io',
    expectedDomains: ['namefi.io', 'namefi.com', 'namefi.xyz'],
  },
  {
    query: 'https://Namefi.com:443/path?utm=1',
    expectedDomains: ['namefi.com', 'namefi.xyz', 'namefi.io'],
  },
  {
    query: '12345',
    expectedDomains: ['12345.com', '12345.xyz', '12345.io'],
  },
  {
    query: 'http://12345:8080/path',
    expectedDomains: ['12345.com', '12345.xyz', '12345.io'],
  },
  {
    query: 'some_label.com',
    expectedDomains: ['some-label.com', 'some-label.xyz', 'some-label.io'],
  },
  {
    query: '---namefi---',
    expectedDomains: ['namefi.com', 'namefi.xyz', 'namefi.io'],
  },
  {
    query: 'bücher.com',
    expectedDomains: [
      'xn--bcher-kva.com',
      'xn--bcher-kva.xyz',
      'xn--bcher-kva.io',
    ],
  },
] as const;

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

  it('keeps numeric labels as domain labels instead of URL-normalized IP addresses', () => {
    const result = generateRankedDomainSuggestions('12345', 1, 3);

    expect(result.domains).toEqual(['12345.com', '12345.xyz', '12345.io']);
  });

  it.each(
    rankedSuggestionCases,
  )('generates ideal first-page suggestions for $query', ({
    query,
    expectedDomains,
  }) => {
    const result = generateRankedDomainSuggestions(query, 1, 3);

    expect(result.domains).toEqual(expectedDomains);
    expect(result.page).toBe(1);
    expect(result.nextPage).toBe(2);
    expect(result.pageSize).toBe(3);
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

  it('returns empty suggestions when no usable label characters remain', () => {
    expect(generateRankedDomainSuggestions('---', 1, 3)).toEqual({
      domains: [],
      page: 1,
      totalPages: 1,
      nextPage: null,
      pageSize: 3,
    });
  });

  it('returns empty results without throwing for client render paths', () => {
    const result = safeGenerateRankedDomainSuggestions('---');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domains).toEqual([]);
    }
  });
});

describe('sanitizeDomainSearchQuery', () => {
  it.each(sanitizedQueryCases)('sanitizes $query to $expected', ({
    query,
    expected,
  }) => {
    expect(sanitizeDomainSearchQuery(query)).toBe(expected);
  });

  it.each(invalidQueryCases)('rejects $query', ({ query, expectedMessage }) => {
    expect(() => sanitizeDomainSearchQuery(query)).toThrow(expectedMessage);
  });

  it('normalizes URLs and trims unsupported characters', () => {
    expect(sanitizeDomainSearchQuery('https://Namefi!!.com/path')).toBe(
      'namefi.com',
    );
  });

  it('does not coerce bare numeric labels into IPv4 hostnames', () => {
    expect(sanitizeDomainSearchQuery('12345')).toBe('12345');
  });

  it('removes URL query strings and hashes', () => {
    expect(sanitizeDomainSearchQuery('https://example.com?foo=1')).toBe(
      'example.com',
    );
    expect(sanitizeDomainSearchQuery('https://example.com#section')).toBe(
      'example.com',
    );
  });

  it('preserves valid underscore labels and fixes invalid underscore placement', () => {
    expect(sanitizeDomainSearchQuery('_sip.example.com')).toBe(
      '_sip.example.com',
    );
    expect(sanitizeDomainSearchQuery('some_label.com')).toBe('some-label.com');
  });
});
