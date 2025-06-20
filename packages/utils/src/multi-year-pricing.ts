import { z } from 'zod';

type OneToTenYears = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PricingType = 'SINGLE_YEAR' | 'MULTI_YEAR';
export type PriceWithCurrency = {
  amount: number;
  currency: string;
};
export type PricingDetails =
  | {
      type: 'SINGLE_YEAR';
      price: PriceWithCurrency;
    }
  | {
      type: 'MULTI_YEAR';
      price: Record<OneToTenYears, PriceWithCurrency>;
    };

export type DomainPricingDetails = {
  registrationPrice: PricingDetails;
  renewalPrice: PricingDetails;
  importPrice: PricingDetails;
};

/**
 * @param price - The price to use for the pricing template
 * @returns The pricing template for a single year
 */
export const singleYearPricingTemplate = (price: number, currency = 'USD') => ({
  type: 'SINGLE_YEAR' as const,
  price: {
    amount: price,
    currency,
  },
});

/**
 * @param prices - The prices to use for the pricing template
 * @param currency - The currency to use for the pricing template
 * @returns The pricing template for a multi year
 */
export const multiYearPricingTemplate = (
  prices: number[],
  currency: string,
) => {
  const priceMap = Object.fromEntries(
    prices.map((price, index) => [
      index + 1,
      {
        amount: price,
        currency,
      },
    ]),
  ) as Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, PriceWithCurrency>;
  return {
    type: 'MULTI_YEAR' as const,
    price: priceMap,
  } satisfies PricingDetails;
};

export const domainRegistrationMultiYearPricingTemplateFromSingleYear = (
  registrationPrice: PriceWithCurrency,
  renewalPrice: PriceWithCurrency,
) => {
  if (registrationPrice.currency !== renewalPrice.currency) {
    throw new Error(
      'Registration and renewal prices must have the same currency',
    );
  }
  const prices = new Array(10)
    .fill(0)
    .map((_, index) => registrationPrice.amount + renewalPrice.amount * index);
  return multiYearPricingTemplate(prices, registrationPrice.currency);
};

/**
 * @param price - The price to use for the pricing template
 * @returns The pricing template for a single year
 */
export const domainSingleYearPricingTemplate = (
  price: number,
  currency = 'USD',
) => ({
  registrationPrice: singleYearPricingTemplate(price, currency),
  renewalPrice: singleYearPricingTemplate(price, currency),
  importPrice: singleYearPricingTemplate(price, currency),
});

export type PriceFromDomainAvailabilityInfo = {
  pricingDetails: DomainPricingDetails;
};

/**
 * @param pricingDetails - The pricing details to compute the charges for
 * @param _durationInYears - The duration in years to compute the charges for (must be an integer between 1 and 10)
 * @param operation - The operation to compute the charges for (must be one of 'REGISTER', 'RENEW', 'IMPORT')
 * @returns The charges for the given duration
 * @throws Error if duration is not an integer, less than 1, or greater than 10
 */
export function computeChargesInUsdFromDomainAvailabilityInfo(
  { pricingDetails }: PriceFromDomainAvailabilityInfo,
  _durationInYears: number,
  operation: 'REGISTER' | 'RENEW' | 'IMPORT',
) {
  const _pricingDetails =
    operation === 'REGISTER'
      ? pricingDetails.registrationPrice
      : operation === 'RENEW'
        ? pricingDetails.renewalPrice
        : pricingDetails.importPrice;

  if (!_pricingDetails) {
    throw new Error(
      `No pricing details found for the given operation: ${operation}`,
    );
  }
  return computeChargesInUsdOrThrow(_pricingDetails, _durationInYears);
}

/**
 * @param pricingDetails - The pricing details to compute the charges for
 * @param _durationInYears - The duration in years to compute the charges for (must be an integer between 1 and 10)
 * @returns The charges for the given duration
 * @throws Error if duration is not an integer, less than 1, or greater than 10
 */
export function computeChargesInUsdOrThrow(
  pricingDetails: PricingDetails,
  _durationInYears: number,
) {
  const durationInYears = z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Invalid duration')
    .max(10, 'Invalid duration')
    .parse(_durationInYears) as OneToTenYears;

  if (pricingDetails.type === 'SINGLE_YEAR') {
    return pricingDetails.price.amount * durationInYears;
  }

  const allowedYears = Object.keys(pricingDetails.price).map(Number);
  if (!allowedYears.includes(durationInYears)) {
    throw new Error('Invalid duration, no price found');
  }

  const price = pricingDetails.price[durationInYears];
  if (!price) {
    throw new Error('Invalid duration, no price found');
  }
  if (
    price.amount <= 0 ||
    Number.isNaN(price.amount) ||
    price.amount === Number.POSITIVE_INFINITY ||
    price.amount === Number.NEGATIVE_INFINITY ||
    price.amount === undefined ||
    price.amount === null ||
    price.amount > 100_0000 //TODO: this is a temporary fix to avoid miscalculations, we should find a better way to handle this
  ) {
    throw new Error('Invalid price');
  }
  return price.amount;
}

/**
 * @param usd - The amount in USD
 * @returns The amount in cents
 */
export function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

/**
 * @param cents - The amount in cents
 * @returns The amount in USD
 */
export function centsToUsd(cents: number) {
  return cents / 100;
}
