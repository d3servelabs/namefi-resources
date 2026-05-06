import { describe, expect, it } from 'vitest';
import {
  generateDomainSuggestions,
  sanitisedQuerySchema,
} from './domain-suggestions';

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

describe('sanitisedQuerySchema', () => {
  it.each(sanitizedQueryCases)('sanitizes $query to $expected', ({
    query,
    expected,
  }) => {
    expect(sanitisedQuerySchema.parse(query).ascii).toBe(expected);
  });

  it.each(invalidQueryCases)('rejects $query', ({ query, expectedMessage }) => {
    expect(() => sanitisedQuerySchema.parse(query)).toThrow(expectedMessage);
  });

  it('removes URL query strings and hashes', () => {
    expect(sanitisedQuerySchema.parse('https://example.com?foo=1').ascii).toBe(
      'example.com',
    );
    expect(
      sanitisedQuerySchema.parse('https://example.com#section').ascii,
    ).toBe('example.com');
  });

  it('preserves valid underscore labels and fixes invalid underscore placement', () => {
    expect(sanitisedQuerySchema.parse('_sip.example.com').ascii).toBe(
      '_sip.example.com',
    );
    expect(sanitisedQuerySchema.parse('some_label.com').ascii).toBe(
      'some-label.com',
    );
  });
});

describe('generateDomainSuggestions', () => {
  it.each(
    rankedSuggestionCases,
  )('generates ideal first-page suggestions for $query', ({
    query,
    expectedDomains,
  }) => {
    const result = generateDomainSuggestions(query, undefined, 1, 3);

    expect(result.domains).toEqual(expectedDomains);
    expect(result.page).toBe(1);
    expect(result.nextPage).toBe(2);
    expect(result.pageSize).toBe(3);
  });

  it('uses sanitized query/hash URLs for ranked suggestions', () => {
    expect(
      generateDomainSuggestions('https://example.com?foo=1', undefined, 1, 3)
        .domains[0],
    ).toBe('example.com');
    expect(
      generateDomainSuggestions('https://example.com#section', undefined, 1, 3)
        .domains[0],
    ).toBe('example.com');
  });

  it('returns empty suggestions when no usable label characters remain', () => {
    expect(generateDomainSuggestions('---', undefined, 1, 3)).toEqual({
      domains: [],
      page: 1,
      totalPages: 1,
      nextPage: null,
      pageSize: 3,
    });
  });

  it('preserves valid underscore domains and fixes invalid underscore placement', () => {
    expect(
      generateDomainSuggestions('_sip.example.com', undefined, 1, 3).domains[0],
    ).toBe('_sip.example.com');
    expect(
      generateDomainSuggestions('some_label.com', undefined, 1, 3).domains[0],
    ).toBe('some-label.com');
  });
});
