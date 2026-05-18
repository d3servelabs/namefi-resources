'use client';

import { isPast } from 'date-fns';
import { AutoRenewToggle } from '../auto-renew-toggle';
import type { RenewModalDomain } from '../columns';
import {
  formatExpirationDateISO,
  formatTimeLeft,
  isDomainPossiblyRenewable,
} from '../utils';
import {
  RenewPricingCell,
  type RenewPricingCellProps,
} from './renew-pricing-cell';

interface RenewalCellProps {
  domainName: string;
  expirationDate: Date | string | null | undefined;
  autoRenewEnabled: boolean;
  isToggling: boolean;
  onToggleAutoRenew: (
    domainName: string,
    enabled: boolean,
    position: { x: number; y: number } | null,
  ) => void;
  onOpenRenewModal: (domain: RenewModalDomain) => void;
  renewPricingCellProps?: RenewPricingCellProps;
}

export function RenewalCell({
  domainName,
  expirationDate,
  autoRenewEnabled,
  isToggling,
  onToggleAutoRenew,
  onOpenRenewModal,
  renewPricingCellProps,
}: RenewalCellProps) {
  const isExpired = expirationDate ? isPast(new Date(expirationDate)) : false;
  const canRenew = isDomainPossiblyRenewable(expirationDate);

  return (
    <div className="flex flex-row flex-wrap gap-x-2 gap-y-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Auto</span>
          <AutoRenewToggle
            checked={autoRenewEnabled}
            onCheckedChange={(checked, position) =>
              onToggleAutoRenew(domainName, checked, position)
            }
            disabled={isExpired}
            isLoading={isToggling}
            ariaLabel={`Auto-renew ${domainName}`}
          />
        </div>

        {canRenew ? (
          <button
            type="button"
            onClick={() =>
              onOpenRenewModal({
                normalizedDomainName: domainName,
                expirationDate,
              })
            }
            className="text-left text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
          >
            {formatExpirationDateISO(expirationDate)} (
            {formatTimeLeft(expirationDate)})
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {formatExpirationDateISO(expirationDate)} (
            {isExpired ? 'Expired' : formatTimeLeft(expirationDate)})
          </span>
        )}
      </div>

      {renewPricingCellProps ? (
        <RenewPricingCell
          className={'items-end'}
          unit={'USD/year'}
          {...renewPricingCellProps}
        />
      ) : (
        false
      )}
    </div>
  );
}
