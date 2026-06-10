export type PriceWithCurrency = {
  amount: number;
  currency: 'USD';
};

export function printPriceWithCurrency(price: PriceWithCurrency) {
  return `${price.amount.toFixed(2)}$${price.currency}`;
}

export type PricingType = 'PER_YEAR' | 'MULTI_YEAR';

export type PricingDetails =
  | {
      type: 'PER_YEAR';
      price: PriceWithCurrency;
    }
  | {
      type: 'MULTI_YEAR';
      price: Record<number, PriceWithCurrency>;
    };

export type DomainPricingDetails = {
  registrationPrice: PricingDetails;
  renewalPrice: PricingDetails;
  importPrice: PricingDetails;
  // changeOwnershipPrice: PricingDetails; not needed in our case
  // restorationPrice: PricingDetails; not supported yet
};

/**
 * @param price - The price to use for the pricing template
 * @returns The pricing template for a single year
 */
export const singleYearPricingTemplate = (price: number) => ({
  type: 'PER_YEAR' as const,
  price: {
    amount: price,
    currency: 'USD' as const,
  },
});

/**
 * @param prices - The prices to use for the pricing template
 * @param currency - The currency to use for the pricing template
 * @returns The pricing template for a multi year
 */
export const multiYearPricingTemplate = (prices: number[]) => {
  const priceMap = Object.fromEntries(
    prices.map((price, index) => [
      index + 1,
      {
        amount: price,
        currency: 'USD' as const,
      },
    ]),
  ) as Record<number, PriceWithCurrency>;
  return {
    type: 'MULTI_YEAR' as const,
    price: priceMap,
  } satisfies PricingDetails;
};
