'use client';

import type { ReactNode } from 'react';
import { isPast } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { AddressWithChain } from '@/components/address-with-chain';
import { DnsStatusCell } from '@/components/domain-and-dns-managment/cells/dns-status-cell';
import { AutoRenewToggle } from './auto-renew-toggle';
import { AutoEnsCell } from './cells/auto-ens-cell';
import { DropdownDomainActionsMenu } from './cells/actions-cell';
import { DomainNameCell } from './cells/domain-name-cell';
import { RenewPricingCell } from './cells/renew-pricing-cell';
import { useTimeLeftLabel } from './cells/renewal-cell';
import type { RenewModalDomain } from './columns';
import type { DomainRow } from './types';
import {
  formatExpirationDateISO,
  getTimeLeft,
  isDomainPossiblyRenewable,
} from './utils';

interface DomainCardProps {
  domain: DomainRow;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isTogglingAutoRenew: boolean;
  isTogglingAutoEns: boolean;
  /** Per-year USD renewal price already resolved by the caller (mirrors the table column). */
  resolvedRenewalPrice: number | null;
  isMobile: boolean;
  onRowSelectionChange: (
    domainName: NamefiNormalizedDomain,
    checked: boolean,
  ) => void;
  onToggleAutoRenew: (
    domainName: string,
    enabled: boolean,
    position: { x: number; y: number } | null,
  ) => void;
  onToggleAutoEns: (domainName: string, enabled: boolean) => void;
  onOpenRenewModal: (domain: RenewModalDomain) => void;
  onListForSaleClick: (domainName: string) => void;
}

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention. Keeping every value flush to a common
 * right edge reads far cleaner on a phone than a wide table row.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card representation of a single domain row. Composes the same cell
 * components the desktop table uses so behavior (toggles, dialogs, links) stays
 * identical — only the layout differs: a compact iOS-style grouped list with the
 * label on the left and the value/control aligned to the right.
 *
 * Cards are collapsible: collapsed shows just the name + a one-line summary so
 * the list stays scannable; expanding reveals the editable detail rows.
 */
export function DomainCard({
  domain,
  isSelected,
  isExpanded,
  onToggleExpanded,
  isTogglingAutoRenew,
  isTogglingAutoEns,
  resolvedRenewalPrice,
  isMobile,
  onRowSelectionChange,
  onToggleAutoRenew,
  onToggleAutoEns,
  onOpenRenewModal,
  onListForSaleClick,
}: DomainCardProps) {
  const t = useTranslations('domains');
  const timeLeftLabel = useTimeLeftLabel();
  const domainName = domain.normalizedDomainName as string;
  const chainId = domain.chainId ?? null;
  const status = domain.dnsStatus;
  const expirationDate = domain.expirationDate;
  const isExpired = expirationDate ? isPast(new Date(expirationDate)) : false;
  const canRenew = isDomainPossiblyRenewable(expirationDate);

  const expirySummary = expirationDate
    ? `${formatExpirationDateISO(expirationDate)} (${
        isExpired
          ? t('renewalCell.expired')
          : timeLeftLabel(getTimeLeft(expirationDate))
      })`
    : null;

  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(value) =>
            onRowSelectionChange(
              domainName as NamefiNormalizedDomain,
              value === true,
            )
          }
          aria-label={t('columns.selectRow')}
          className="mt-1 shrink-0"
        />
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-label={t(isExpanded ? 'card.collapse' : 'card.expand')}
          className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              'size-4 transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        </button>
        <div className="min-w-0 flex-1">
          <DomainNameCell
            domainName={domainName}
            nftState={domain.nftState}
            pendingNftStates={domain.pendingNftStates}
          />
          {!isExpanded && expirySummary ? (
            <button
              type="button"
              onClick={onToggleExpanded}
              className="mt-0.5 flex items-center gap-1.5 text-left text-[11px] text-muted-foreground"
            >
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  domain.autoRenewEnabled
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/40',
                )}
                aria-hidden
              />
              <span className="truncate">{expirySummary}</span>
            </button>
          ) : null}
        </div>
        <DropdownDomainActionsMenu
          domainName={domainName}
          expirationDate={expirationDate}
          chainId={chainId}
          tokenId={domain.tokenId}
          ownerAddress={domain.ownerAddress ?? null}
          orderId={domain.orderId ?? null}
          isMobile={isMobile}
          onListForSaleClick={onListForSaleClick}
        />
      </div>

      {isExpanded ? (
        <dl className="divide-y divide-border/50 border-t border-border/50">
          <CardRow label={t('columns.renewal')}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {t('renewalCell.auto')}
              </span>
              <AutoRenewToggle
                checked={domain.autoRenewEnabled ?? false}
                onCheckedChange={(checked, position) =>
                  onToggleAutoRenew(domainName, checked, position)
                }
                disabled={isExpired}
                isLoading={isTogglingAutoRenew}
                ariaLabel={t('renewalCell.autoRenewAria', {
                  domain: domainName,
                })}
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
                className="cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:underline"
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
            <RenewPricingCell
              domainName={domainName}
              resolvedPrice={resolvedRenewalPrice}
              unit={t('renewalCell.usdPerYear')}
            />
          </CardRow>

          {status && chainId ? (
            <CardRow label={t('columns.dnsRecords')}>
              <DnsStatusCell
                domainName={domainName as NamefiNormalizedDomain}
                status={status}
                autoEnsEnabled={domain.autoEnsEnabled ?? false}
                nftChainId={chainId}
              />
            </CardRow>
          ) : null}

          <CardRow label={t('card.account')}>
            <AddressWithChain
              address={domain.ownerAddress ?? null}
              chainId={chainId}
              showShortAddress
            />
          </CardRow>

          <CardRow label={t('columns.autoEns')}>
            <AutoEnsCell
              domainName={domainName}
              expirationDate={expirationDate}
              autoEnsEnabled={domain.autoEnsEnabled ?? false}
              isToggling={isTogglingAutoEns}
              onToggleAutoEns={onToggleAutoEns}
            />
          </CardRow>
        </dl>
      ) : null}
    </Card>
  );
}
