'use client';

import type { ReactNode } from 'react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  channelLabel,
  type DigestTarget,
  formatDate,
  getTargetDestination,
  TargetActionsCell,
  TargetEnabledCell,
} from './namefi-feed-cells';

/**
 * One detail row of the card: label pinned to the start, value to the end — the
 * iOS grouped-list (Settings) convention, matching `my-domains/domain-card.tsx`,
 * `parked-domains/parked-domain-card.tsx`, and `admin/nft-management-card.tsx`.
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

interface NamefiFeedTargetCardProps {
  target: DigestTarget;
  isMutating: boolean;
  onEdit: (target: DigestTarget) => void;
  onToggle: (target: DigestTarget, enabled: boolean) => void;
  onDelete: (target: DigestTarget) => void;
}

/**
 * Mobile card representation of a single digest-target row. Reuses the same cell
 * components and pure helpers the desktop table columns use (`channelLabel`,
 * `getTargetDestination`, `formatDate`, `TargetEnabledCell`, `TargetActionsCell`)
 * so the values and actions stay identical — only the layout differs: a compact
 * iOS-style grouped list with the label on the left and the value/control
 * aligned to the right (switch layout, reuse logic).
 */
export function NamefiFeedTargetCard({
  target,
  isMutating,
  onEdit,
  onToggle,
  onDelete,
}: NamefiFeedTargetCardProps) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{target.label || '-'}</div>
          <div className="text-xs text-muted-foreground">
            {channelLabel(target.targetType)}
          </div>
        </div>
        <TargetEnabledCell
          target={target}
          isMutating={isMutating}
          onToggle={onToggle}
        />
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Destination">
          <span className="break-all">{getTargetDestination(target)}</span>
        </CardRow>

        <CardRow label="Updated">{formatDate(target.updatedAt)}</CardRow>
      </dl>

      <div className="border-t border-border/50 px-3.5 py-3">
        <TargetActionsCell
          target={target}
          isMutating={isMutating}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </Card>
  );
}
