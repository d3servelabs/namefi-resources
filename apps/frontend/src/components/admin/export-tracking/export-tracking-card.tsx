'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  ChainCell,
  formatDateTime,
  LatestEvidenceCell,
  OwnerAddressCell,
} from './export-tracking-cells';
import { ExportStatusBadge } from './export-status-badge';
import { StatusHistorySubrow } from './status-history-subrow';
import type { ExportTrackingRecord } from './types';
import { ExportTrackingEvidenceDialog } from './export-tracking-evidence-dialog';
import { VerifyButton } from './verify-button';

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

interface ExportTrackingCardProps {
  record: ExportTrackingRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  /** Whether the row has any history/timeline content worth expanding. */
  canExpand: boolean;
}

/**
 * Mobile card representation of a single export-tracking row. Composes the SAME
 * shared cell components/formatters the desktop table columns use, so behavior
 * (status badge, owner copy, evidence popover, verify actions) stays identical —
 * only the layout differs: a compact iOS-style grouped list instead of a wide,
 * horizontally-scrolling table row.
 *
 * Cards are collapsible: the status-history timeline (the desktop expander
 * sub-row) is revealed on expand so the list stays scannable.
 */
export function ExportTrackingCard({
  record,
  isExpanded,
  onToggleExpanded,
  canExpand,
}: ExportTrackingCardProps) {
  return (
    <Card
      className="gap-0 overflow-hidden px-0 py-0"
      data-testid={`admin.export-tracking.card.${record.id}`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        {canExpand ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse history' : 'Expand history'}
            className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            data-testid={`admin.export-tracking.card.${record.id}.expand-toggle`}
          >
            <ChevronRight
              className={cn(
                'size-4 transition-transform',
                isExpanded && 'rotate-90',
              )}
            />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div
            className="break-words font-medium"
            data-testid={`admin.export-tracking.card.${record.id}.domain-name`}
          >
            {record.normalizedDomainName}
          </div>
        </div>
        <ExportStatusBadge status={record.status} />
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Chain">
          <ChainCell chainId={record.chainId} />
        </CardRow>

        <CardRow label="Owner">
          <div className="w-full">
            <OwnerAddressCell
              ownerAddress={record.ownerAddress}
              data-testid={`admin.export-tracking.card.${record.id}.owner`}
            />
          </div>
        </CardRow>

        <CardRow label="Registrar">
          <span className="text-xs">{record.registrarKey ?? '-'}</span>
        </CardRow>

        <CardRow label="Status Changed">
          <span className="text-xs">
            {formatDateTime(record.statusChangedAt)}
          </span>
        </CardRow>

        <CardRow label="Client Approved">
          <span className="text-xs">
            {formatDateTime(record.clientApprovedAt)}
          </span>
        </CardRow>

        <CardRow label="Admin Verified">
          <span className="text-xs">
            {formatDateTime(record.adminVerifiedAt)}
          </span>
        </CardRow>

        <CardRow label="Pending Email Sent">
          <span className="text-xs">
            {formatDateTime(record.pendingExportEmailSentAt)}
          </span>
        </CardRow>

        <CardRow label="Completion Email Sent">
          <span className="text-xs">
            {formatDateTime(record.completedExportEmailSentAt)}
          </span>
        </CardRow>

        <CardRow label="NFT Burned">
          <span className="text-xs">{formatDateTime(record.nftBurnedAt)}</span>
        </CardRow>

        <CardRow label="Latest Evidence">
          <LatestEvidenceCell
            latestEvidence={record.latestEvidence}
            data-testid={`admin.export-tracking.card.${record.id}.latest-evidence`}
          />
        </CardRow>

        <CardRow label="Actions">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <VerifyButton
              record={record}
              data-testid={`admin.export-tracking.row.${record.id}.actions`}
            />
            <ExportTrackingEvidenceDialog
              recordId={record.id}
              domain={record.normalizedDomainName}
              data-testid={`admin.export-tracking.card.${record.id}.evidence-button`}
            />
          </div>
        </CardRow>
      </dl>

      {canExpand && isExpanded ? (
        <div className="border-t border-border/50 bg-muted/30">
          <StatusHistorySubrow
            statusHistory={record.statusHistory ?? []}
            pendingExportEmailSentAt={record.pendingExportEmailSentAt}
            pendingExportEmailAttempts={record.pendingExportEmailAttempts}
            pendingExportEmailLastError={record.pendingExportEmailLastError}
            failedExportEmailSentAt={record.failedExportEmailSentAt}
            failedExportEmailAttempts={record.failedExportEmailAttempts}
            failedExportEmailLastError={record.failedExportEmailLastError}
            completedExportEmailSentAt={record.completedExportEmailSentAt}
            completedExportEmailAttempts={record.completedExportEmailAttempts}
            completedExportEmailLastError={record.completedExportEmailLastError}
          />
        </div>
      ) : null}
    </Card>
  );
}
