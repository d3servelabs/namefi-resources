import { describe, expect, it } from 'vitest';
import {
  determineDurationLimitsForRenewItems,
  getDomainDurationConstraints,
} from '../duration-constraints';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { addMonths, addYears } from 'date-fns';

describe('getDomainDurationConstraints', () => {
  describe('2-level domains', () => {
    describe('co domains', () => {
      it('should return minYears: 1, maxYears: 5 for co domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });

      it('should return minYears: 1, maxYears: 5 for co.com domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.com.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });
    });

    describe('be domains', () => {
      it('should return minYears: 1, maxYears: 1 for be domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.be' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('de domains', () => {
      it('should return minYears: 1, maxYears: 2 for de domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.de' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 2 });
      });
    });

    describe('at domains', () => {
      it('should return minYears: 1, maxYears: 1 for at domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.at' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('lt domains', () => {
      it('should return minYears: 1, maxYears: 1 for lt domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.lt' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('nl domains', () => {
      it('should return minYears: 1, maxYears: 1 for nl domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.nl' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('cx domains', () => {
      it('should return minYears: 1, maxYears: 5 for cx domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.cx' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });
    });

    describe('ai domains', () => {
      it('should return minYears: 2, maxYears: 10 for ai domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.ai' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 2, maxYears: 10 });
      });
    });

    describe('lv domains', () => {
      it('should return minYears: 1, maxYears: 1 for lv domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('dk domains', () => {
      it('should return minYears: 1, maxYears: 3 for dk domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.dk' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 3 });
      });
    });

    describe('it domains', () => {
      it('should return minYears: 1, maxYears: 1 for it domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.it' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('co.za domains', () => {
      it('should return minYears: 1, maxYears: 1 for co.za domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.co.za' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('ch and li domains', () => {
      it('should return minYears: 1, maxYears: 1 for ch domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.ch' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for li domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.li' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('default case for 2-level domains', () => {
      it('should return minYears: 1, maxYears: 10 for unspecified 2-level domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.com' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for org domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.org' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for net domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.net' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for info domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.info' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });
    });
  });

  describe('3-level domains', () => {
    describe('0x.city domains', () => {
      it('should return minYears: 3, maxYears: 10 for 0x.city domains', () => {
        const constraints = getDomainDurationConstraints(
          'example.0x.city' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 3, maxYears: 5 });
      });
    });

    describe('other 3-level domains that should be treated as 2-level', () => {
      it('should return minYears: 1, maxYears: 5 for co.net domains (3-level parsed as 2-level)', () => {
        const constraints = getDomainDurationConstraints(
          'example.net.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });

      it('should return minYears: 1, maxYears: 1 for at.co domains (3-level parsed as 2-level)', () => {
        const constraints = getDomainDurationConstraints(
          'example.co.at' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.com domains (3-level parsed as 2-level)', () => {
        const constraints = getDomainDurationConstraints(
          'example.com.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.org domains (3-level parsed as 2-level)', () => {
        const constraints = getDomainDurationConstraints(
          'example.org.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.net domains (3-level parsed as 2-level)', () => {
        const constraints = getDomainDurationConstraints(
          'example.net.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('invalid 3-level domains', () => {
      it('should throw error for non-0x.city 3-level domains not in the special cases', () => {
        expect(() => {
          getDomainDurationConstraints(
            'example.subdomain.com' as NamefiNormalizedDomain,
          );
        }).toThrow(
          'Domain example.subdomain.com is not a valid 0x.city domain',
        );
      });

      it('should throw error for other 3-level domains not in the special cases', () => {
        expect(() => {
          getDomainDurationConstraints(
            'example.qwerty.uk' as NamefiNormalizedDomain,
          );
        }).toThrow('Domain example.qwerty.uk is not a valid 0x.city domain');
      });
    });
  });

  describe('invalid domains', () => {
    it('should throw error for single-level domains', () => {
      expect(() => {
        getDomainDurationConstraints('invalid' as NamefiNormalizedDomain);
      }).toThrow('Domain invalid is not a valid domain');
    });

    it('should throw error for empty domain', () => {
      expect(() => {
        getDomainDurationConstraints('' as NamefiNormalizedDomain);
      }).toThrow('Domain  is not a valid domain');
    });

    it('should throw error for domains with more than 3 levels', () => {
      expect(() => {
        getDomainDurationConstraints('a.b.c.d' as NamefiNormalizedDomain);
      }).toThrow('Domain a.b.c.d is not a valid domain');
    });
  });

  describe('edge cases', () => {
    it('should handle domains with numbers', () => {
      const constraints = getDomainDurationConstraints(
        'test123.co' as NamefiNormalizedDomain,
      );
      expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
    });

    it('should handle domains with hyphens', () => {
      const constraints = getDomainDurationConstraints(
        'test-domain.co' as NamefiNormalizedDomain,
      );
      expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
    });
  });

  describe('determineDurationLimitsForRenewItems', () => {
    it('should calculate correct duration limits for domain with years remaining', () => {
      const expirationTime = addMonths(new Date(), 25); // Expires in 2+ years, so current registration is 3 years

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 3,
        min: 1,
        max: 7, // 10 - 3 = 7 years can be added
      });
    });

    it('should return max 0 when domain is already at maximum registration', () => {
      const expirationTime = addYears(new Date(), 9); // Expires in 9+ years, so current registration is 10 years

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 10,
        min: 0,
        max: 0, // 10 - 10 = 0 years can be added
      });
    });

    it('should handle domain that exceeds maximum registration', () => {
      const expirationTime = addYears(new Date(), 12); // Expires in 12+ years, so current registration is 13 years

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 13,
        min: 0,
        max: 0, // Cannot add any more years
      });
    });

    it('should handle domain with less than 1 year remaining', () => {
      const expirationTime = addMonths(new Date(), 6); // ~6 months, so current registration is 1 year

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 1,
        min: 1,
        max: 9, // Can add up to 9 years
      });
    });

    it('should handle edge case where min years is higher than available years', () => {
      const expirationTime = addYears(new Date(), 8); // Expires in 8+ years, so current registration is 9 years

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 9,
        min: 1, // min(1, 2) = 1
        max: 1, // 10 - 9 = 1 year can be added
      });
    });

    it('should handle domain with fractional years correctly', () => {
      const expirationTime = addMonths(new Date(), 18); // ~18 months, so current registration is 2 year

      const result = determineDurationLimitsForRenewItems(expirationTime, {
        minYears: 1,
        maxYears: 10,
      });

      expect(result).toEqual({
        activeRegistrationYears: 2,
        min: 1,
        max: 8, // 10 - 2 = 8 years can be added
      });
    });
  });
});
