'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  DnssecCell,
  NameserversCell,
  type DomainWorkflows,
  type TemporalConfig,
} from '@/components/admin/ns-dnssec-dialogs';
import {
  DomainNameCell,
  PendingWorkflowsCell,
  RowActions,
  UserCell,
  type NsAndDnssecRow,
} from './ns-and-dnssec-cells';

/**
 * One labeled detail row of the card: label pinned to the start, value to the
 * end (the iOS grouped-list convention), mirroring my-domains/domain-card.
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

interface NsAndDnssecCardProps {
  row: NsAndDnssecRow;
  workflows: DomainWorkflows | undefined;
  temporal: TemporalConfig | undefined;
  canWrite: boolean;
  isWorkflowsLoading: boolean;
}

/**
 * Mobile card representation of a single NS & DNSSEC admin row. Composes the
 * SAME shared cell components the desktop table columns use (`DomainNameCell`,
 * `UserCell`, `NameserversCell`, `DnssecCell`, `PendingWorkflowsCell`,
 * `RowActions`) so the values and behavior (dialogs, workflow links, mutations)
 * stay identical — only the layout differs: a compact iOS-style grouped list
 * instead of a wide, horizontally-scrolling table row.
 */
export function NsAndDnssecCard({
  row,
  workflows,
  temporal,
  canWrite,
  isWorkflowsLoading,
}: NsAndDnssecCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <DomainNameCell domainName={row.normalizedDomainName} />
        </div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="User">
          <div className="w-full">
            <UserCell row={row} />
          </div>
        </CardRow>

        <CardRow label="Nameservers">
          <NameserversCell row={row} />
        </CardRow>

        <CardRow label="DNSSEC">
          <DnssecCell row={row} />
        </CardRow>

        <CardRow label="Pending Workflow">
          <PendingWorkflowsCell
            workflows={workflows}
            temporal={temporal}
            isLoading={isWorkflowsLoading}
          />
        </CardRow>

        <CardRow label="Actions">
          <RowActions
            row={row}
            workflows={workflows}
            canWrite={canWrite}
            isWorkflowsLoading={isWorkflowsLoading}
          />
        </CardRow>
      </dl>
    </Card>
  );
}
