import { describe, expect, it } from 'vitest';
import type { PricingDetails } from './abstract-registrar/data/price-with-currency';
import { computeChargesInUsdOrThrow } from './multi-year-pricing';

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
