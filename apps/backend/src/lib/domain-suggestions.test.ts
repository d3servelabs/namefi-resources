import { describe, expect, it } from 'vitest';
import {
  generateDomainSuggestions,
  sanitisedQuerySchema,
} from './domain-suggestions';

describe('sanitisedQuerySchema', () => {
  it('removes URL query strings and hashes', () => {
    expect(sanitisedQuerySchema.parse('https://example.com?foo=1').ascii).toBe(
      'example.com',
    );
    expect(
      sanitisedQuerySchema.parse('https://example.com#section').ascii,
    ).toBe('example.com');
  });

  it('preserves valid underscore labels and rejects invalid underscore placement', () => {
    expect(sanitisedQuerySchema.parse('_sip.example.com').ascii).toBe(
      '_sip.example.com',
    );
    expect(() => sanitisedQuerySchema.parse('some_label.com')).toThrow(
      'violates Namefi rules',
    );
  });
});

describe('generateDomainSuggestions', () => {
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

  it('preserves valid underscore domains and rejects invalid underscore placement', () => {
    expect(
      generateDomainSuggestions('_sip.example.com', undefined, 1, 3).domains[0],
    ).toBe('_sip.example.com');
    expect(() =>
      generateDomainSuggestions('some_label.com', undefined, 1, 3),
    ).toThrow('violates Namefi rules');
  });
});
