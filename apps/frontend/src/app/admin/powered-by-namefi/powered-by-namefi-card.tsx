'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { DnsStatusCell } from './cells/dns-status-cell';
import {
  CostCell,
  DomainActionsMenu,
  type DomainActionsMenuProps,
  DomainLevelBadge,
  DomainNameCell,
  DurationCell,
  EnabledBadge,
  type PoweredByNamefiDomainRow,
  RelativeDateCell,
  RolloutStartedCell,
} from './powered-by-namefi-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching my-domains/domain-card.tsx.
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

interface PoweredByNamefiCardProps
  extends Omit<DomainActionsMenuProps, 'domain'> {
  row: PoweredByNamefiDomainRow;
  /** Row index — feeds the staggered DNS-status query, same as the table column. */
  index: number;
}

/**
 * Mobile card representation of a single Powered-by-Namefi domain row. Composes
 * the SAME shared cell components the desktop table columns use
 * (`DomainNameCell`, `DomainLevelBadge`, `EnabledBadge`, `DnsStatusCell`,
 * `CostCell`, `DurationCell`, `RolloutStartedCell`, `RelativeDateCell`,
 * `DomainActionsMenu`) so the values and actions stay identical — only the
 * layout differs: a compact iOS-style grouped list instead of a wide,
 * horizontally-scrolling table row.
 */
export function PoweredByNamefiCard({
  row,
  index,
  ...actions
}: PoweredByNamefiCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <DomainNameCell name={row.normalizedDomainName} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <DomainLevelBadge name={row.normalizedDomainName} />
          <DomainActionsMenu domain={row} {...actions} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Status">
          <EnabledBadge enabled={row.enabled} />
        </CardRow>

        <CardRow label="DNS Status">
          <DnsStatusCell
            normalizedDomainName={row.normalizedDomainName}
            index={index}
          />
        </CardRow>

        <CardRow label="Cost/Year">
          <CostCell costPerYearInUsdCents={row.costPerYearInUsdCents} />
        </CardRow>

        <CardRow label="Duration">
          <DurationCell durationConstraints={row.durationConstraints} />
        </CardRow>

        <CardRow label="Rollout Started">
          <RolloutStartedCell startRolloutAt={row.startRolloutAt} />
        </CardRow>

        <CardRow label="Created">
          <RelativeDateCell date={row.createdAt} />
        </CardRow>

        <CardRow label="Updated">
          <RelativeDateCell date={row.updatedAt} />
        </CardRow>
      </dl>
    </Card>
  );
}
