'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { AsyncButton } from '@/components/buttons/async-button';
import { AddressWithChain as AddressWithChainId } from '@/components/address-with-chain';
import {
  DomainNameCell,
  ForwardToValue,
  ModeBadge,
  type ParkedDomainRow,
  StatusBadge,
  type VerificationResult,
  VerificationDetailDialog,
} from './parked-domains-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching `my-domains/domain-card.tsx`.
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

interface ParkedDomainCardProps {
  row: ParkedDomainRow;
  /** Latest verification result for this domain, if it has been verified. */
  result: VerificationResult | undefined;
  isSelected: boolean;
  onSelectedChange: (domain: string, checked: boolean) => void;
  onVerify: (domains: string[]) => Promise<void>;
}

/**
 * Mobile card representation of a single parked-domain row. Reuses the same cell
 * components the desktop table columns use (`StatusBadge`, `ModeBadge`,
 * `ForwardToValue`, `DomainNameCell`, `VerificationDetailDialog`) so the values
 * stay identical — only the layout differs: a compact iOS-style grouped list
 * with the label on the left and the value/status aligned to the right.
 */
export function ParkedDomainCard({
  row,
  result,
  isSelected,
  onSelectedChange,
  onVerify,
}: ParkedDomainCardProps) {
  const domainName = row.normalizedDomainName;

  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectedChange(domainName, checked === true)
          }
          aria-label={`Select ${domainName}`}
          className="mt-1 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <DomainNameCell domainName={domainName} />
        </div>
        <div className="shrink-0">
          <ModeBadge mode={row.mode} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Wallet">
          {row.ownerAddress ? (
            <AddressWithChainId
              address={row.ownerAddress}
              chainId={row.chainId}
              showShortAddress
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </CardRow>

        <CardRow label="Forward To">
          <ForwardToValue forwardTo={row.forwardTo} />
        </CardRow>

        <CardRow label="DNS">
          <StatusBadge
            status={result?.dns.status}
            detail={result?.dns.detail}
          />
        </CardRow>

        <CardRow label="SSL">
          <StatusBadge
            status={result?.ssl.status}
            detail={result?.ssl.detail}
          />
        </CardRow>

        <CardRow label="Serving">
          <StatusBadge
            status={result?.serving.status}
            detail={result?.serving.detail}
          />
        </CardRow>

        <CardRow label="Redirect">
          <StatusBadge
            status={result?.redirect.status}
            detail={result?.redirect.detail}
          />
        </CardRow>

        <CardRow label="Overall">
          <StatusBadge
            status={result?.overall}
            detail={result ? undefined : 'Not yet verified'}
          />
        </CardRow>
      </dl>

      <div className="flex items-center gap-2 border-t border-border/50 px-3.5 py-3">
        <AsyncButton
          size="sm"
          variant="outline"
          onClick={async () => onVerify([domainName])}
        >
          {result ? 'Re-verify' : 'Verify'}
        </AsyncButton>
        {result ? <VerificationDetailDialog result={result} /> : null}
      </div>
    </Card>
  );
}
