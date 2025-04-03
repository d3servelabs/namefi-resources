import { describe, expect, it } from 'vitest';
import { fqdnLowercaseSchema, nameSchema } from './name';
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

describe('fqdnLowercaseSchema', () => {
  for (const domain of fqdnLowercaseTestCases) {
    it(`should validate that domain name ${domain.name} being ${domain.valid ? 'valid' : 'invalid'}`, () => {
      expect(fqdnLowercaseSchema.safeParse(domain.name).success).toBe(
        domain.valid,
      );
    });
  }
});
