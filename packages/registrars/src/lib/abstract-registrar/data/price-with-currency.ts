export type PriceWithCurrency = {
  price: number;
  /**
   * 3-letter currency code (USD, AED, EGP ...)
   */
  currency: string;
};

export function printPriceWithCurrency(price: PriceWithCurrency) {
  return `${price.price.toFixed(2)}$${price.currency}`;
}
