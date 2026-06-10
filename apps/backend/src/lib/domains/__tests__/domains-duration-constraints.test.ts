import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { addMonths, addYears } from 'date-fns';

const mockFindPoweredByNamefiDomain = vi.hoisted(() => vi.fn());

vi.mock('@namefi-astra/db', () => ({
  db: {
    query: {
      poweredbyNamefiDomainsTable: {
        findFirst: mockFindPoweredByNamefiDomain,
      },
    },
  },
}));

import {
  determineDurationLimitsForRenewItems,
  getDomainDurationConstraints,
} from '../duration-constraints';

describe('getDomainDurationConstraints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindPoweredByNamefiDomain.mockResolvedValue(null);
  });

  describe('2-level domains', () => {
    describe('co domains', () => {
      it('should return minYears: 1, maxYears: 5 for co domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });

      it('should return minYears: 1, maxYears: 5 for co.com domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.com.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });
    });

    describe('be domains', () => {
      it('should return minYears: 1, maxYears: 1 for be domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.be' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('de domains', () => {
      it('should return minYears: 1, maxYears: 2 for de domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.de' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 2 });
      });
    });

    describe('at domains', () => {
      it('should return minYears: 1, maxYears: 1 for at domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.at' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('lt domains', () => {
      it('should return minYears: 1, maxYears: 1 for lt domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.lt' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('nl domains', () => {
      it('should return minYears: 1, maxYears: 1 for nl domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.nl' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('cx domains', () => {
      it('should return minYears: 1, maxYears: 5 for cx domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.cx' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });
    });

    describe('ai domains', () => {
      it('should return minYears: 2, maxYears: 10 for ai domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.ai' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 2, maxYears: 10 });
      });
    });

    describe('lv domains', () => {
      it('should return minYears: 1, maxYears: 1 for lv domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('dk domains', () => {
      it('should return minYears: 1, maxYears: 3 for dk domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.dk' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 3 });
      });
    });

    describe('it domains', () => {
      it('should return minYears: 1, maxYears: 1 for it domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.it' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('co.za domains', () => {
      it('should return minYears: 1, maxYears: 1 for co.za domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.co.za' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('ch and li domains', () => {
      it('should return minYears: 1, maxYears: 1 for ch domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.ch' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for li domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.li' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('default case for 2-level domains', () => {
      it('should return minYears: 1, maxYears: 10 for unspecified 2-level domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.com' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for org domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.org' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for net domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.net' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });

      it('should return minYears: 1, maxYears: 10 for info domains', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.info' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 10 });
      });
    });
  });

  describe('3-level domains', () => {
    describe('0x.city domains', () => {
      it('should return minYears: 0, maxYears: 5 for 0x.city domains', async () => {
        mockFindPoweredByNamefiDomain.mockResolvedValue({
          enabled: true,
          normalizedDomainName: '0x.city',
          durationConstraints: {
            minDurationInYears: 3,
            maxDurationInYears: 5,
          },
        });

        const constraints = await getDomainDurationConstraints(
          'example.0x.city' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 0, maxYears: 5 });
      });
    });

    describe('other 3-level domains that should be treated as 2-level', () => {
      it('should return minYears: 1, maxYears: 5 for co.net domains (3-level parsed as 2-level)', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.net.co' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
      });

      it('should return minYears: 1, maxYears: 1 for at.co domains (3-level parsed as 2-level)', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.co.at' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.com domains (3-level parsed as 2-level)', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.com.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.org domains (3-level parsed as 2-level)', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.org.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });

      it('should return minYears: 1, maxYears: 1 for lv.net domains (3-level parsed as 2-level)', async () => {
        const constraints = await getDomainDurationConstraints(
          'example.net.lv' as NamefiNormalizedDomain,
        );
        expect(constraints).toEqual({ minYears: 1, maxYears: 1 });
      });
    });

    describe('invalid 3-level domains', () => {
      it('should throw error for non-powered-by 3-level domains not in the special cases', async () => {
        await expect(
          getDomainDurationConstraints(
            'example.subdomain.com' as NamefiNormalizedDomain,
          ),
        ).rejects.toThrow(
          'Domain example.subdomain.com is not a valid powered by namefi 3P domain',
        );
      });

      it('should throw error for other non-powered-by 3-level domains not in the special cases', async () => {
        await expect(
          getDomainDurationConstraints(
            'example.qwerty.uk' as NamefiNormalizedDomain,
          ),
        ).rejects.toThrow(
          'Domain example.qwerty.uk is not a valid powered by namefi 3P domain',
        );
      });
    });
  });

  describe('invalid domains', () => {
    it('should throw error for single-level domains', async () => {
      await expect(
        getDomainDurationConstraints('invalid' as NamefiNormalizedDomain),
      ).rejects.toThrow('Domain invalid is not a valid domain name');
    });

    it('should throw error for empty domain', async () => {
      await expect(
        getDomainDurationConstraints('' as NamefiNormalizedDomain),
      ).rejects.toThrow('Domain  is not a valid domain name');
    });

    it('should throw error for domains with more than 3 levels', async () => {
      await expect(
        getDomainDurationConstraints('a.b.c.d' as NamefiNormalizedDomain),
      ).rejects.toThrow('Domain a.b.c.d is not a valid domain name');
    });
  });

  describe('edge cases', () => {
    it('should handle domains with numbers', async () => {
      const constraints = await getDomainDurationConstraints(
        'test123.co' as NamefiNormalizedDomain,
      );
      expect(constraints).toEqual({ minYears: 1, maxYears: 5 });
    });

    it('should handle domains with hyphens', async () => {
      const constraints = await getDomainDurationConstraints(
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
        minimumPossibleRenewalYears: 1,
        maxAdditionalYears: 7, // 10 - 3 = 7 years can be added
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
        minimumPossibleRenewalYears: 0,
        maxAdditionalYears: 0, // 10 - 10 = 0 years can be added
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
        minimumPossibleRenewalYears: 0,
        maxAdditionalYears: 0, // Cannot add any more years
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
        minimumPossibleRenewalYears: 1,
        maxAdditionalYears: 9, // Can add up to 9 years
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
        minimumPossibleRenewalYears: 1, // min(1, 2) = 1
        maxAdditionalYears: 1, // 10 - 9 = 1 year can be added
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
        minimumPossibleRenewalYears: 1,
        maxAdditionalYears: 8, // 10 - 2 = 8 years can be added
      });
    });
  });
});
