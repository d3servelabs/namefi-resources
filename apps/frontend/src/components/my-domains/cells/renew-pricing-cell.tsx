'use client';

import { formatAmountInUSD } from '@/lib/number';
import { RenewPricePremiumInfo } from '../renew-price-premium-info';
import { getCustomRenewalPrice } from '../utils';

interface RenewPricingCellProps {
  domainName: string;
  /** The per-year USD price already resolved by the column's `accessorFn`. */
  resolvedPrice: number | null;
}

export function RenewPricingCell({
  domainName,
  resolvedPrice,
}: RenewPricingCellProps) {
  const customPrice = getCustomRenewalPrice(domainName);
  const renewalPriceUsdPerYear =
    customPrice !== null ? customPrice : resolvedPrice;

  const priceLabel =
    renewalPriceUsdPerYear === null
      ? '—'
      : formatAmountInUSD(renewalPriceUsdPerYear);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{priceLabel}</span>
      <RenewPricePremiumInfo domainName={domainName} />
    </div>
  );
}
