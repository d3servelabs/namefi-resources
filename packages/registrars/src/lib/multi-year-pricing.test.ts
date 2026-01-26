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

    it('should throw error for duration less than 1', () => {
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, 0)).toThrow(
        'Invalid duration',
      );
      expect(() => computeChargesInUsdOrThrow(singleYearPricing, -1)).toThrow(
        'Invalid duration',
      );
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

  describe('IMPORT operation with PER_YEAR pricing', () => {
    const perYearImportPricing: PricingDetails = {
      type: 'PER_YEAR',
      price: { amount: 15.99, currency: 'USD' },
    };

    const pricingDetails = createDomainPricingDetails(
      { type: 'PER_YEAR', price: { amount: 10.99, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 12.99, currency: 'USD' } },
      perYearImportPricing,
    );

    it('should compute import charges for 1 year', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        1,
        'IMPORT',
      );
      expect(result).toBe(15.99);
    });

    it('should compute import charges for multiple years (linear scaling)', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        3,
        'IMPORT',
      );
      expect(result).toBe(47.97); // 15.99 * 3
    });

    it('should compute import charges for 5 years', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        5,
        'IMPORT',
      );
      expect(result).toBe(79.95); // 15.99 * 5
    });

    it('should compute import charges for 10 years', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        10,
        'IMPORT',
      );
      expect(result).toBe(159.9); // 15.99 * 10
    });
  });

  describe('IMPORT operation with MULTI_YEAR pricing', () => {
    const multiYearImportPricing: PricingDetails = {
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 15.99, currency: 'USD' },
        2: { amount: 29.99, currency: 'USD' },
        3: { amount: 42.99, currency: 'USD' },
        5: { amount: 69.99, currency: 'USD' },
        10: { amount: 129.99, currency: 'USD' },
      },
    };

    const pricingDetails = createDomainPricingDetails(
      { type: 'PER_YEAR', price: { amount: 10.99, currency: 'USD' } },
      { type: 'PER_YEAR', price: { amount: 12.99, currency: 'USD' } },
      multiYearImportPricing,
    );

    it('should compute import charges for 1 year from multi-year table', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        1,
        'IMPORT',
      );
      expect(result).toBe(15.99);
    });

    it('should compute import charges for 2 years from multi-year table', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'IMPORT',
      );
      expect(result).toBe(29.99);
    });

    it('should compute import charges for 5 years from multi-year table', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        5,
        'IMPORT',
      );
      expect(result).toBe(69.99);
    });

    it('should compute import charges for 10 years from multi-year table', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        10,
        'IMPORT',
      );
      expect(result).toBe(129.99);
    });

    it('should throw error for duration not in multi-year import pricing table', () => {
      expect(() =>
        computeChargesInUsdFromDomainAvailabilityInfo(
          { pricingDetails },
          4,
          'IMPORT',
        ),
      ).toThrow('Invalid duration, no price found');
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

    it('should use importPrice for IMPORT operation', () => {
      const result = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        2,
        'IMPORT',
      );
      expect(result).toBe(30.0); // 15.0 * 2
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
