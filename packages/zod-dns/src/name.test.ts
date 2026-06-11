import { describe, expect, it } from 'vitest';
import { fqdnLowercaseSchema, nameSchema, normalizeDomainName } from './name';
import {
  fqdnLowercaseTestCases,
  nonNormalizedDomainNamesTestCases,
  normalizedDomainNamesTestCases,
} from './name.testing';

// Create a test suite for the domain name regex
describe('Domain Name Regex', () => {
  for (const domain of normalizedDomainNamesTestCases) {
    it(`should validate that domain name ${domain.name} is normalized`, () => {
      expect(nameSchema.safeParse(domain.name).success).toBe(domain.valid);
    });
  }
  for (const domain of nonNormalizedDomainNamesTestCases) {
    it(`should validate that domain name ${domain.name} is NOT normalized because ${domain.reason}`, () => {
      expect(nameSchema.safeParse(domain.name).success).toBe(domain.valid);
    });
  }
});

describe('normalizeDomainName - domain confusion rejection', () => {
  it('rejects userinfo-style input that would rewrite to a different hostname', () => {
    // "legit.com@evil.com" must NOT silently normalize to "evil.com"
    expect(() => normalizeDomainName('legit.com@evil.com')).toThrow();
  });

  it('rejects path-suffixed input', () => {
    expect(() => normalizeDomainName('example.com/path')).toThrow();
  });

  it('rejects port-suffixed input', () => {
    expect(() => normalizeDomainName('example.com:8080')).toThrow();
  });

  it('rejects query-string input', () => {
    expect(() => normalizeDomainName('example.com?q=1')).toThrow();
  });

  it('rejects fragment input', () => {
    expect(() => normalizeDomainName('example.com#frag')).toThrow();
  });

  it('rejects input with whitespace', () => {
    expect(() => normalizeDomainName('example.com with space')).toThrow();
    expect(() => normalizeDomainName('example.com\t')).toThrow();
    expect(() => normalizeDomainName(' example.com')).toThrow();
  });

  it('rejects backslash-separated input (WHATWG treats \\ as path separator)', () => {
    expect(() => normalizeDomainName('example.com\\path')).toThrow();
  });

  it('still normalises a valid lowercase ASCII domain', () => {
    expect(normalizeDomainName('Example.com')).toBe('example.com');
  });
});

describe('fqdnLowercaseSchema', () => {
  for (const domain of fqdnLowercaseTestCases) {
    it(`should validate that domain name ${domain.name} being ${domain.valid ? 'valid' : 'invalid'}`, () => {
      expect(fqdnLowercaseSchema.safeParse(domain.name).success).toBe(
        domain.valid,
      );
    });
  }
});
