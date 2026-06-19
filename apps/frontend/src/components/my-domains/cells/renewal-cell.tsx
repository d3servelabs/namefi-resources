'use client';

import { isPast } from 'date-fns';
import { useTranslations } from 'next-intl';
import { AutoRenewToggle } from '../auto-renew-toggle';
import type { RenewModalDomain } from '../columns';
import {
  formatExpirationDateISO,
  getTimeLeft,
  isDomainPossiblyRenewable,
  type TimeLeft,
} from '../utils';
import {
  RenewPricingCell,
  type RenewPricingCellProps,
} from './renew-pricing-cell';

/**
 * Map a {@link TimeLeft} descriptor to its translated, locale-formatted label.
 * `none` collapses to "-"; every other kind is keyed under the `timeLeft`
 * namespace with its numeric count as an ICU argument.
 */
export function useTimeLeftLabel() {
  const t = useTranslations('domains');
  return (timeLeft: TimeLeft): string => {
    switch (timeLeft.kind) {
      case 'none':
        return '-';
      case 'expired':
        return t('timeLeft.expired');
      case 'days':
        return t('timeLeft.days', { days: timeLeft.count });
      case 'months':
        return t('timeLeft.monthsExact', { months: timeLeft.count });
      case 'monthsPlus':
        return t('timeLeft.monthsPlus', { months: timeLeft.count });
      case 'years':
        return t('timeLeft.yearsExact', { years: timeLeft.count });
      case 'yearsPlus':
        return t('timeLeft.yearsPlus', { years: timeLeft.count });
    }
  };
}

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
  const t = useTranslations('domains');
  const timeLeftLabel = useTimeLeftLabel();
  const isExpired = expirationDate ? isPast(new Date(expirationDate)) : false;
  const canRenew = isDomainPossiblyRenewable(expirationDate);

  return (
    <div className="flex flex-row flex-wrap gap-x-2 gap-y-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t('renewalCell.auto')}
          </span>
          <AutoRenewToggle
            checked={autoRenewEnabled}
            onCheckedChange={(checked, position) =>
              onToggleAutoRenew(domainName, checked, position)
            }
            disabled={isExpired}
            isLoading={isToggling}
            ariaLabel={t('renewalCell.autoRenewAria', { domain: domainName })}
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
            className="text-start text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors"
          >
            {formatExpirationDateISO(expirationDate)} (
            {timeLeftLabel(getTimeLeft(expirationDate))})
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {formatExpirationDateISO(expirationDate)} (
            {isExpired
              ? t('renewalCell.expired')
              : timeLeftLabel(getTimeLeft(expirationDate))}
            )
          </span>
        )}
      </div>

      {renewPricingCellProps ? (
        <RenewPricingCell
          className={'items-end'}
          unit={t('renewalCell.usdPerYear')}
          {...renewPricingCellProps}
        />
      ) : (
        false
      )}
    </div>
  );
}
