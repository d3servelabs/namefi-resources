import { describe, expect, it } from 'vitest';
import {
  type PriceWithCurrency,
  type PricingDetails,
  computeChargesInUsdOrThrow,
  domainRegistrationMultiYearPricingTemplateFromSingleYear,
  domainSingleYearPricingTemplate,
  multiYearPricingTemplate,
  singleYearPricingTemplate,
} from '../multi-year-pricing';

describe('singleYearPricingTemplate', () => {
  it('should create a single year pricing template with USD currency', () => {
    const price = 10.99;
    const result = singleYearPricingTemplate(price);

    expect(result).toEqual({
      type: 'SINGLE_YEAR',
      price: {
        amount: 10.99,
        currency: 'USD',
      },
    });
  });

  it('should handle zero price', () => {
    const result = singleYearPricingTemplate(0);

    expect(result).toEqual({
      type: 'SINGLE_YEAR',
      price: {
        amount: 0,
        currency: 'USD',
      },
    });
  });

  it('should handle negative price', () => {
    const result = singleYearPricingTemplate(-5.5);

    expect(result).toEqual({
      type: 'SINGLE_YEAR',
      price: {
        amount: -5.5,
        currency: 'USD',
      },
    });
  });
});

describe('multiYearPricingTemplate', () => {
  it('should create a multi-year pricing template with specified currency', () => {
    const prices = [10.99, 20.99, 30.99];
    const currency = 'EUR';
    const result = multiYearPricingTemplate(prices, currency);

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 10.99, currency: 'EUR' },
        2: { amount: 20.99, currency: 'EUR' },
        3: { amount: 30.99, currency: 'EUR' },
      },
    });
  });

  it('should handle single year pricing', () => {
    const prices = [15.5];
    const currency = 'USD';
    const result = multiYearPricingTemplate(prices, currency);

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 15.5, currency: 'USD' },
      },
    });
  });

  it('should handle maximum 10 years', () => {
    const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const currency = 'GBP';
    const result = multiYearPricingTemplate(prices, currency);

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 1, currency: 'GBP' },
        2: { amount: 2, currency: 'GBP' },
        3: { amount: 3, currency: 'GBP' },
        4: { amount: 4, currency: 'GBP' },
        5: { amount: 5, currency: 'GBP' },
        6: { amount: 6, currency: 'GBP' },
        7: { amount: 7, currency: 'GBP' },
        8: { amount: 8, currency: 'GBP' },
        9: { amount: 9, currency: 'GBP' },
        10: { amount: 10, currency: 'GBP' },
      },
    });
  });

  it('should handle zero prices', () => {
    const prices = [0, 0, 0];
    const currency = 'USD';
    const result = multiYearPricingTemplate(prices, currency);

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 0, currency: 'USD' },
        2: { amount: 0, currency: 'USD' },
        3: { amount: 0, currency: 'USD' },
      },
    });
  });

  it('should handle mixed positive and negative prices', () => {
    const prices = [10, -5, 15];
    const currency = 'CAD';
    const result = multiYearPricingTemplate(prices, currency);

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 10, currency: 'CAD' },
        2: { amount: -5, currency: 'CAD' },
        3: { amount: 15, currency: 'CAD' },
      },
    });
  });
});

describe('domainSingleYearPricingTemplate', () => {
  it('should create domain pricing with all three price types', () => {
    const price = 12.99;
    const result = domainSingleYearPricingTemplate(price);

    const expectedSingleYear = {
      type: 'SINGLE_YEAR' as const,
      price: {
        amount: 12.99,
        currency: 'USD',
      },
    };

    expect(result).toEqual({
      registrationPrice: expectedSingleYear,
      renewalPrice: expectedSingleYear,
      importPrice: expectedSingleYear,
    });
  });

  it('should handle zero price', () => {
    const result = domainSingleYearPricingTemplate(0);

    const expectedSingleYear = {
      type: 'SINGLE_YEAR' as const,
      price: {
        amount: 0,
        currency: 'USD',
      },
    };

    expect(result).toEqual({
      registrationPrice: expectedSingleYear,
      renewalPrice: expectedSingleYear,
      importPrice: expectedSingleYear,
    });
  });

  it('should handle negative price', () => {
    const result = domainSingleYearPricingTemplate(-8.5);

    const expectedSingleYear = {
      type: 'SINGLE_YEAR' as const,
      price: {
        amount: -8.5,
        currency: 'USD',
      },
    };

    expect(result).toEqual({
      registrationPrice: expectedSingleYear,
      renewalPrice: expectedSingleYear,
      importPrice: expectedSingleYear,
    });
  });
});

describe('computeChargesInUsdOrThrow', () => {
  describe('with SINGLE_YEAR pricing', () => {
    const singleYearPricing: PricingDetails = {
      type: 'SINGLE_YEAR',
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
        type: 'SINGLE_YEAR',
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
        type: 'SINGLE_YEAR',
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
        type: 'SINGLE_YEAR',
        price: {
          amount: 10.99,
          currency: 'USD',
        },
      };
      expect(() =>
        computeChargesInUsdOrThrow(singleYearPricing, 1.5 as any),
      ).toThrow('Duration must be an integer');
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
      } as Record<
        1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
        { amount: number; currency: string }
      >,
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
      type: 'SINGLE_YEAR',
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
        type: 'SINGLE_YEAR',
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

describe('domainRegistrationMultiYearPricingTemplateFromSingleYear', () => {
  it('should create multi-year pricing from registration and renewal prices', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 10.99,
      currency: 'USD',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 8.99,
      currency: 'USD',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    expect(result.type).toBe('MULTI_YEAR');
    expect(result.price[1]).toEqual({ amount: 10.99, currency: 'USD' }); // registration only
    expect(result.price[2]).toEqual({ amount: 19.98, currency: 'USD' }); // registration + 1 renewal
    expect(result.price[3]).toEqual({ amount: 28.97, currency: 'USD' }); // registration + 2 renewals
    expect(result.price[4]).toEqual({ amount: 37.96, currency: 'USD' }); // registration + 3 renewals
    expect(result.price[5]).toEqual({ amount: 46.95, currency: 'USD' }); // registration + 4 renewals
    expect(result.price[6].amount).toBeCloseTo(55.94, 2); // registration + 5 renewals
    expect(result.price[7].amount).toBeCloseTo(64.93, 2); // registration + 6 renewals
    expect(result.price[8]).toEqual({ amount: 73.92, currency: 'USD' }); // registration + 7 renewals
    expect(result.price[9]).toEqual({ amount: 82.91, currency: 'USD' }); // registration + 8 renewals
    expect(result.price[10].amount).toBeCloseTo(91.9, 2); // registration + 9 renewals
  });

  it('should handle zero renewal price', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 15.5,
      currency: 'EUR',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 0,
      currency: 'EUR',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 15.5, currency: 'EUR' },
        2: { amount: 15.5, currency: 'EUR' },
        3: { amount: 15.5, currency: 'EUR' },
        4: { amount: 15.5, currency: 'EUR' },
        5: { amount: 15.5, currency: 'EUR' },
        6: { amount: 15.5, currency: 'EUR' },
        7: { amount: 15.5, currency: 'EUR' },
        8: { amount: 15.5, currency: 'EUR' },
        9: { amount: 15.5, currency: 'EUR' },
        10: { amount: 15.5, currency: 'EUR' },
      },
    });
  });

  it('should handle zero registration price', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 0,
      currency: 'GBP',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 5.99,
      currency: 'GBP',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    expect(result.type).toBe('MULTI_YEAR');
    expect(result.price[1]).toEqual({ amount: 0, currency: 'GBP' });
    expect(result.price[2]).toEqual({ amount: 5.99, currency: 'GBP' });
    expect(result.price[3]).toEqual({ amount: 11.98, currency: 'GBP' });
    expect(result.price[4]).toEqual({ amount: 17.97, currency: 'GBP' });
    expect(result.price[5]).toEqual({ amount: 23.96, currency: 'GBP' });
    expect(result.price[6].amount).toBeCloseTo(29.95, 2);
    expect(result.price[7]).toEqual({ amount: 35.94, currency: 'GBP' });
    expect(result.price[8]).toEqual({ amount: 41.93, currency: 'GBP' });
    expect(result.price[9]).toEqual({ amount: 47.92, currency: 'GBP' });
    expect(result.price[10].amount).toBeCloseTo(53.91, 2);
  });

  it('should handle negative prices', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: -2.5,
      currency: 'CAD',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: -1.0,
      currency: 'CAD',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    expect(result).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: -2.5, currency: 'CAD' },
        2: { amount: -3.5, currency: 'CAD' },
        3: { amount: -4.5, currency: 'CAD' },
        4: { amount: -5.5, currency: 'CAD' },
        5: { amount: -6.5, currency: 'CAD' },
        6: { amount: -7.5, currency: 'CAD' },
        7: { amount: -8.5, currency: 'CAD' },
        8: { amount: -9.5, currency: 'CAD' },
        9: { amount: -10.5, currency: 'CAD' },
        10: { amount: -11.5, currency: 'CAD' },
      },
    });
  });

  it('should use registration price currency for all years', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 12.99,
      currency: 'JPY',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 9.99,
      currency: 'JPY', // Same currency as registration
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    // Check that all prices use the registration currency
    Object.values(result.price).forEach((price) => {
      expect(price.currency).toBe('JPY');
    });

    // Verify the calculation is still correct
    expect(result.price[1].amount).toBe(12.99);
    expect(result.price[2].amount).toBe(22.98); // 12.99 + 9.99
  });

  it('should throw error when currencies do not match', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 12.99,
      currency: 'JPY',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 9.99,
      currency: 'USD', // Different currency
    };

    expect(() =>
      domainRegistrationMultiYearPricingTemplateFromSingleYear(
        registrationPrice,
        renewalPrice,
      ),
    ).toThrow('Registration and renewal prices must have the same currency');
  });

  it('should create exactly 10 years of pricing', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 10.0,
      currency: 'USD',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 5.0,
      currency: 'USD',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    expect(Object.keys(result.price)).toHaveLength(10);
    expect(Object.keys(result.price).map(Number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('should calculate prices correctly for all years', () => {
    const registrationPrice: PriceWithCurrency = {
      amount: 20.0,
      currency: 'USD',
    };
    const renewalPrice: PriceWithCurrency = {
      amount: 10.0,
      currency: 'USD',
    };

    const result = domainRegistrationMultiYearPricingTemplateFromSingleYear(
      registrationPrice,
      renewalPrice,
    );

    // Verify the calculation formula: registration + (renewal * (year - 1))
    for (let year = 1; year <= 10; year++) {
      const expectedAmount =
        registrationPrice.amount + renewalPrice.amount * (year - 1);
      expect(result.price[year as keyof typeof result.price].amount).toBe(
        expectedAmount,
      );
    }
  });
});
