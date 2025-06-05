import type { PriceWithCurrency } from './price-with-currency';

export type DomainPriceDetails = {
  registrationPrice: PriceWithCurrency;
  transferPrice: PriceWithCurrency;
  renewalPrice: PriceWithCurrency;
  changeOwnershipPrice: PriceWithCurrency;
  restorationPrice: PriceWithCurrency;
};
