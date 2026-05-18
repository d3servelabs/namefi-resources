'use client';

import { formatAmountInUSD } from '@/lib/number';
import { RenewPricePremiumInfo } from '../renew-price-premium-info';
import { getCustomRenewalPrice } from '../utils';
import { cn } from '@namefi-astra/ui/lib/cn';

export interface RenewPricingCellProps {
  domainName: string;
  /** The per-year USD price already resolved by the column's `accessorFn`. */
  resolvedPrice: number | null;
  unit?: string;
  className?: string;
}

export function RenewPricingCell({
  domainName,
  resolvedPrice,
  unit,
  className,
}: RenewPricingCellProps) {
  const customPrice = getCustomRenewalPrice(domainName);
  const renewalPriceUsdPerYear =
    customPrice !== null ? customPrice : resolvedPrice;

  const priceLabel =
    renewalPriceUsdPerYear === null
      ? '—'
      : formatAmountInUSD(renewalPriceUsdPerYear);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">
        {priceLabel} {unit}
      </span>
      <RenewPricePremiumInfo domainName={domainName} />
    </div>
  );
}
