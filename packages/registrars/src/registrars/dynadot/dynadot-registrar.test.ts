import type { DynadotTldPriceDetails } from '#lib/dynadot/index';
import { describe, expect, it } from 'vitest';
import { __INTERNAL__ } from './dynadot-registrar';

type DynadotTldPriceDetailsOverrides = Omit<
  Partial<DynadotTldPriceDetails>,
  'Price' | 'GracePeriod'
> & {
  Price?: Partial<DynadotTldPriceDetails['Price']>;
  GracePeriod?: Partial<DynadotTldPriceDetails['GracePeriod']>;
};

const createDynadotTldPriceDetails = (
  overrides: DynadotTldPriceDetailsOverrides = {},
): DynadotTldPriceDetails => {
  const defaultValue: DynadotTldPriceDetails = {
    Tld: '.com',
    Usage: 'Usage',
    Price: {
      Unit: '(Price/1 year)',
      Register: '10',
      Renew: '10',
      Transfer: '10',
      Restore: '80',
    },
    Privacy: 'Yes',
    GracePeriod: {
      Unit: '(Grace Period/days)',
      Renew: '40',
      Delete: '5',
    },
    IDN: 'NO',
    Restrictions: '--',
  };

  return {
    ...defaultValue,
    ...overrides,
    Price: {
      ...defaultValue.Price,
      ...overrides.Price,
    },
    GracePeriod: {
      ...defaultValue.GracePeriod,
      ...overrides.GracePeriod,
    },
  };
};

describe('__INTERNAL__._dynadotTldPriceToDomainPricingDetails', () => {
  it('returns PER_YEAR pricing for registration and import when renew <= register', () => {
    const input = createDynadotTldPriceDetails({
      Tld: '.com',
      Price: {
        Register: '12',
        Renew: '11',
        Transfer: '9.5',
        Restore: '88.77',
      },
    });

    const result = __INTERNAL__._dynadotTldPriceToDomainPricingDetails(input);

    expect(result).toEqual({
      registrationPrice: {
        type: 'PER_YEAR',
        price: { amount: 12, currency: 'USD' },
      },
      renewalPrice: {
        type: 'PER_YEAR',
        price: { amount: 11, currency: 'USD' },
      },
      importPrice: {
        type: 'PER_YEAR',
        price: { amount: 9.5, currency: 'USD' },
      },
      changeOwnershipPrice: {
        type: 'PER_YEAR',
        price: { amount: 0, currency: 'USD' },
      },
      restorationPrice: {
        type: 'PER_YEAR',
        price: { amount: 88.77, currency: 'USD' },
      },
    });
  });

  it('returns MULTI_YEAR registration pricing when renew > register', () => {
    const input = createDynadotTldPriceDetails({
      Tld: '.net',
      Price: {
        Register: '10',
        Renew: '12',
        Transfer: '8',
        Restore: '70',
      },
    });

    const result = __INTERNAL__._dynadotTldPriceToDomainPricingDetails(input);

    expect(result.registrationPrice).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 10, currency: 'USD' },
        2: { amount: 22, currency: 'USD' },
        3: { amount: 34, currency: 'USD' },
        4: { amount: 46, currency: 'USD' },
        5: { amount: 58, currency: 'USD' },
        6: { amount: 70, currency: 'USD' },
        7: { amount: 82, currency: 'USD' },
        8: { amount: 94, currency: 'USD' },
        9: { amount: 106, currency: 'USD' },
        10: { amount: 118, currency: 'USD' },
      },
    });
    expect(result.importPrice).toEqual({
      type: 'PER_YEAR',
      price: { amount: 8, currency: 'USD' },
    });
  });

  it('returns MULTI_YEAR import pricing for .ai with year(1,2) transfer pricing and rounded year 3+ totals', () => {
    const input = createDynadotTldPriceDetails({
      Tld: '.ai',
      Price: {
        Register: '55',
        Renew: '35.347',
        Transfer: '70.102',
        Restore: '90',
      },
    });

    const result = __INTERNAL__._dynadotTldPriceToDomainPricingDetails(input);

    expect(result.importPrice).toEqual({
      type: 'MULTI_YEAR',
      price: {
        1: { amount: 70.1, currency: 'USD' },
        2: { amount: 70.1, currency: 'USD' },
        3: { amount: 105.45, currency: 'USD' },
        4: { amount: 140.8, currency: 'USD' },
        5: { amount: 176.14, currency: 'USD' },
        6: { amount: 211.49, currency: 'USD' },
        7: { amount: 246.84, currency: 'USD' },
        8: { amount: 282.18, currency: 'USD' },
        9: { amount: 317.53, currency: 'USD' },
        10: { amount: 352.88, currency: 'USD' },
      },
    });

    expect(result.importPrice.type).toBe('MULTI_YEAR');
    if (result.importPrice.type !== 'MULTI_YEAR') {
      throw new Error('Expected MULTI_YEAR import pricing');
    }

    const multiYearImportPrice = result.importPrice.price;

    expect(multiYearImportPrice[1]?.amount).toBe(70.1);
    expect(multiYearImportPrice[2]?.amount).toBe(70.1);
    expect(multiYearImportPrice[3]?.amount).toBe(105.45);
    expect(multiYearImportPrice[4]?.amount).toBe(140.8);

    for (const amount of Object.values(multiYearImportPrice).map(
      (entry) => entry.amount,
    )) {
      const decimalPart = amount.toString().split('.')[1] ?? '';
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    }
  });
});
