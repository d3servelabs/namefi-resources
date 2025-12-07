import { describe, expect, it } from 'vitest';
import type {
  DomainPricingDetails,
  PricingDetails,
} from './abstract-registrar/data/price-with-currency';
import {
  computeChargesInUsdFromDomainAvailabilityInfo,
  computeChargesInUsdOrThrow,
} from './multi-year-pricing';

describe('computeChargesInUsdOrThrow', () => {
  describe('with PER_YEAR pricing', () => {
    const singleYearPricing: PricingDetails = {
      type: 'PER_YEAR',
      price: {
        amount: 10.99,
        currency: 'USD',
      },
    };

    it('should compute charges for 1 year', () => {
      const result = computeChargesInUsdOrThrow(singleYearPricing, 1);
      expect(result).toBe(10.99);
    });

    it('should compute charges for multiple years (linear scaling)', () => {
      const result = computeChargesInUsdOrThrow(singleYearPricing, 3);
      expect(result).toBe(32.97); // 10.99 * 3
    });

    it('should compute charges for 10 years', () => {
      const result = computeChargesInUsdOrThrow(singleYearPricing, 10);
      expect(result).toBe(109.9); // 10.99 * 10
    });

    it('should handle zero price', () => {
      const zeroPricing: PricingDetails = {
        type: 'PER_YEAR',
        price: {
          amount: 0,
          currency: 'USD',
        },
      };
      const result = computeChargesInUsdOrThrow(zeroPricing, 5);
      expect(result).toBe(0);
    });

    it('should handle negative price', () => {
      const negativePricing: PricingDetails = {
        type: 'PER_YEAR',
        price: {
          amount: -5.5,
          currency: 'USD',
        },
      };
      const result = computeChargesInUsdOrThrow(negativePricing, 2);
      expect(result).toBe(-11); // -5.50 * 2
    });

    it('should throw error for decimal durations', () => {
      const singleYearPricing: PricingDetails = {
        type: 'PER_YEAR',
        price: {
          amount: 10.99,
          currency: 'USD',
        },
      };
      expect(() =>
        computeChargesInUsdOrThrow(singleYearPricing, 1.5 as any),
      ).toThrow('Duration must be an integer');
    });

    it('should throw ZodError for decimal durations with correct message', () => {
      const singleYearPricing: PricingDetails = {
        type: 'PER_YEAR',
        price: {
          amount: 10.99,
          currency: 'USD',
        },
      };
      try {
        computeChargesInUsdOrThrow(singleYearPricing, 1.5 as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Duration must be an integer');
      }
    });
  });

  describe('with MULTI_YEAR pricing', () => {
    const multiYearPricing: PricingDetails = {
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 10.99, currency: 'USD' },
        2: { amount: 19.99, currency: 'USD' },
        3: { amount: 28.99, currency: 'USD' },
        5: { amount: 45.99, currency: 'USD' },
        10: { amount: 89.99, currency: 'USD' },
      },
    };

    it('should compute charges for 1 year', () => {
      const result = computeChargesInUsdOrThrow(multiYearPricing, 1);
      expect(result).toBe(10.99);
    });

    it('should compute charges for 2 years', () => {
      const result = computeChargesInUsdOrThrow(multiYearPricing, 2);
      expect(result).toBe(19.99);
    });

    it('should compute charges for 3 years', () => {
      const result = computeChargesInUsdOrThrow(multiYearPricing, 3);
      expect(result).toBe(28.99);
    });

    it('should compute charges for 5 years', () => {
      const result = computeChargesInUsdOrThrow(multiYearPricing, 5);
      expect(result).toBe(45.99);
    });

    it('should compute charges for 10 years', () => {
      const result = computeChargesInUsdOrThrow(multiYearPricing, 10);
      expect(result).toBe(89.99);
    });

    it('should throw error for duration not in pricing table', () => {
      expect(() => computeChargesInUsdOrThrow(multiYearPricing, 4)).toThrow(
        'Invalid duration, no price found',
      );
      expect(() => computeChargesInUsdOrThrow(multiYearPricing, 6)).toThrow(
        'Invalid duration, no price found',
      );
      expect(() => computeChargesInUsdOrThrow(multiYearPricing, 7)).toThrow(
        'Invalid duration, no price found',
      );
      expect(() => computeChargesInUsdOrThrow(multiYearPricing, 8)).toThrow(
        'Invalid duration, no price found',
      );
      expect(() => computeChargesInUsdOrThrow(multiYearPricing, 9)).toThrow(
        'Invalid duration, no price found',
      );
    });
  });

  describe('error cases', () => {
    const singleYearPricing: PricingDetails = {
      type: 'PER_YEAR',
      price: {
        amount: 10.99,
        currency: 'USD',
      },
    };

    it('should throw error for negative duration', () => {
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, -1)).toThrow(
        'Invalid duration',
      );
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, -5)).toThrow(
        'Invalid duration',
      );
    });

    it('should allow a duration of 0 (granular duration support)', () => {
      // The duration schema now uses `.min(0)`, so 0 is a valid duration and
      // resolves to a zero charge rather than throwing.
      expect(computeChargesInUsdOrThrow(singleYearPricing, 0)).toBe(0);
    });

    it('should throw error for duration greater than 10', () => {
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, 11)).toThrow(
        'Invalid duration',
      );
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, 15)).toThrow(
        'Invalid duration',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers in single year pricing', () => {
      const largePricing: PricingDetails = {
        type: 'PER_YEAR',
        price: {
          amount: 999999.99,
          currency: 'USD',
        },
      };
      const result = computeChargesInUsdOrThrow(largePricing, 10);
      expect(result).toBe(9999999.9); // 999999.99 * 10
    });
  });
});

describe('computeChargesInUsdFromDomainAvailabilityInfo', () => {
  const createDomainPricingDetails = (
    registrationPrice: PricingDetails,
    renewalPrice: PricingDetails,
    importPrice: PricingDetails,
  ): DomainPricingDetails => ({
    registrationPrice,
    renewalPrice,
    importPrice,
  });

  describe('IMPORT operation with PER_YEAR pricing (import price for year 1, renewal price for years 2+)', () => {
    const pricingDetails = createDomainPricingDetails(
      { type: 'PER_YEAR', price: { amount: 10.99, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 12.99, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 15.99, currency: 'USD' } },
    );

    it('should compute import charges for 1 year (import price only)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        1,
        'IMPORT',
      );
      expect(result).toBe(15.99); // import price for year 1
    });

    it('should compute import charges for 2 years (import + 1 renewal)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'IMPORT',
      );
      expect(result).toBe(28.98); // 15.99 (import) + 12.99 (1 year renewal)
    });

    it('should compute import charges for 3 years (import + 2 renewals)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        3,
        'IMPORT',
      );
      expect(result).toBe(41.97); // 15.99 (import) + 25.98 (2 years renewal @ 12.99/yr)
    });

    it('should compute import charges for 5 years (import + 4 renewals)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        5,
        'IMPORT',
      );
      expect(result).toBe(67.95); // 15.99 (import) + 51.96 (4 years renewal @ 12.99/yr)
    });

    it('should compute import charges for 10 years (import + 9 renewals)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        10,
        'IMPORT',
      );
      expect(result).toBe(132.9); // 15.99 (import) + 116.91 (9 years renewal @ 12.99/yr)
    });
  });

  describe('IMPORT operation with MULTI_YEAR import pricing (import price for year 1, renewal for years 2+)', () => {
    const multiYearImportPricing: PricingDetails = {
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 20.0, currency: 'USD' },
      },
    };

    const pricingDetails = createDomainPricingDetails(
      { type: 'PER_YEAR', price: { amount: 10.99, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 12.0, currency: 'USD' } },
      multiYearImportPricing,
    );

    it('should compute import charges for 1 year from multi-year import table', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        1,
        'IMPORT',
      );
      expect(result).toBe(20.0); // import price for year 1
    });

    it('should compute import charges for 2 years (import + 1 renewal)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'IMPORT',
      );
      expect(result).toBe(32.0); // 20.0 (import) + 12.0 (1 year renewal)
    });

    it('should compute import charges for 5 years (import + 4 renewals)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        5,
        'IMPORT',
      );
      expect(result).toBe(68.0); // 20.0 (import) + 48.0 (4 years renewal @ 12.0/yr)
    });

    it('should compute import charges for 10 years (import + 9 renewals)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        10,
        'IMPORT',
      );
      expect(result).toBe(128.0); // 20.0 (import) + 108.0 (9 years renewal @ 12.0/yr)
    });
  });

  describe('operation type selection', () => {
    const pricingDetails = createDomainPricingDetails(
      { type: 'PER_YEAR', price: { amount: 10.0, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 12.0, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 15.0, currency: 'USD' } },
    );

    it('should use registrationPrice for REGISTER operation', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'REGISTER',
      );
      expect(result).toBe(20.0); // 10.0 * 2
    });

    it('should use renewalPrice for RENEW operation', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'RENEW',
      );
      expect(result).toBe(24.0); // 12.0 * 2
    });

    it('should use importPrice for year 1 and renewalPrice for years 2+ for IMPORT operation', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'IMPORT',
      );
      expect(result).toBe(27.0); // 15.0 (import year 1) + 12.0 (renewal year 2)
    });
  });

  describe('error cases', () => {
    it('should throw error for invalid duration (less than 1)', () => {
      const pricingDetails = createDomainPricingDetails(
        { type: 'PER_YEAR', price: { amount: 10.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 12.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 15.0, currency: 'USD' } },
      );

      expect(() =>
        computeChargesInUsdFromDomainAvailabilityInfo(
          { pricingDetails },
          0,
          'IMPORT',
        ),
      ).toThrow('Invalid duration');
    });

    it('should throw error for invalid duration (greater than 10)', () => {
      const pricingDetails = createDomainPricingDetails(
        { type: 'PER_YEAR', price: { amount: 10.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 12.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 15.0, currency: 'USD' } },
      );

      expect(() =>
        computeChargesInUsdFromDomainAvailabilityInfo(
          { pricingDetails },
          11,
          'IMPORT',
        ),
      ).toThrow('Invalid duration');
    });

    it('should throw error for decimal duration', () => {
      const pricingDetails = createDomainPricingDetails(
        { type: 'PER_YEAR', price: { amount: 10.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 12.0, currency: 'USD' } },
        { type: 'PER_YEAR', price: { amount: 15.0, currency: 'USD' } },
      );

      expect(() =>
        computeChargesInUsdFromDomainAvailabilityInfo(
          { pricingDetails },
          1.5,
          'IMPORT',
        ),
      ).toThrow('Duration must be an integer');
    });
  });
});
