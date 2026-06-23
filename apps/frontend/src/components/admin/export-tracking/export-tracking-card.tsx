'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  MobileTableItem,
  MobileTableItemActions,
  MobileTableItemContent,
  MobileTableItemHeader,
  MobileTableItemTitle,
} from '@/components/ui/mobile-table';
import { ChainCell, OwnerAddressCell } from './export-tracking-cells';
import { ExportStatusBadge } from './export-status-badge';
import { StatusHistorySubrow } from './status-history-subrow';
import type { EvidenceSnapshot, ExportTrackingRecord } from './types';
import { ExportTrackingEvidenceDialog } from './export-tracking-evidence-dialog';
import { VerifyButton } from './verify-button';

const fmt = (value: Date | string | null | undefined): string =>
  value ? new Date(value).toLocaleString() : '-';

// ---------------------------------------------------------------------------
// Latest evidence — refined, per-source view (req: "displayed in a clear manner")
// ---------------------------------------------------------------------------

/** Display order + labels for the six evidence sources. */
const EVIDENCE_SOURCES: Array<{ key: string; label: string }> = [
  { key: 'AccountCheck', label: 'Registrar Reseller Account Check' },
  { key: 'DomainIndex', label: 'Namefi Domain index Check' },
  { key: 'RDAPStatus', label: 'RDAP status Check' },
  { key: 'RDAPEvents', label: 'RDAP events Check' },
  { key: 'WHOIS', label: 'WHOIS Status Check' },
  { key: 'DirectRegistrar', label: 'Specific Export Record from Registrar' },
];

const SOURCE_STATUS_LABEL: Record<string, string> = {
  positive_pending: 'Pending',
  positive_period: 'Transfer period',
  positive_completed: 'Gone (completed)',
  positive_failed: 'Failed',
  negative: 'Present',
  no_data: 'No data',
  error: 'Error',
};

/** Tone (text color) per source status. */
function sourceStatusTone(status: string): string {
  switch (status) {
    case 'positive_completed':
      return 'text-green-600 dark:text-green-400';
    case 'positive_pending':
    case 'positive_period':
      return 'text-amber-600 dark:text-amber-400';
    case 'positive_failed':
    case 'error':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
}

function LatestEvidencePanel({
  evidence,
  recordId,
}: {
  evidence: EvidenceSnapshot | null;
  recordId: string;
}) {
  if (!evidence) {
    return (
      <span className="text-xs text-muted-foreground">
        No evidence gathered yet
      </span>
    );
  }

  const sources = evidence.sources ?? [];

  return (
    <div className="space-y-2">
      {evidence.decisionAction ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{evidence.decisionAction}</Badge>
          {evidence.checkedAt ? (
            <span className="text-[11px] text-muted-foreground">
              checked {new Date(evidence.checkedAt).toLocaleString()}
            </span>
          ) : null}
        </div>
      ) : null}

      {evidence.decisionReason ? (
        <p className="break-words text-xs text-muted-foreground">
          {evidence.decisionReason}
        </p>
      ) : null}

      {sources.length > 0 ? (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {EVIDENCE_SOURCES.map(({ key, label }) => {
            const source = sources.find((s) => s.source === key);
            if (!source) return null;
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1"
              >
                <span className="text-[11px] text-muted-foreground">
                  {label}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    sourceStatusTone(source.status),
                  )}
                  title={source.error ?? undefined}
                >
                  {SOURCE_STATUS_LABEL[source.status] ?? source.status}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {evidence.eppStatuses && evidence.eppStatuses.length > 0 ? (
        <div className="text-[11px]">
          <span className="text-muted-foreground">EPP:</span>{' '}
          <span className="font-mono">{evidence.eppStatuses.join(', ')}</span>
        </div>
      ) : null}

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ms-2 h-6 px-2 text-[11px]"
            />
          }
        >
          View JSON
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[440px] max-sm:w-[calc(100vw-2rem)] p-3"
        >
          <div className="space-y-2">
            <div className="text-xs font-medium">Latest evidence</div>
            <pre
              className="max-h-80 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed"
              data-testid={`admin.export-tracking.card.${recordId}.evidence-json`}
            >
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined dates — only the dates that are actually set (req: "combined into
// one section based on whether they were set or not")
// ---------------------------------------------------------------------------

function SetDates({ record }: { record: ExportTrackingRecord }) {
  const dates: Array<{ label: string; value: Date | string | null }> = [
    { label: 'First detected', value: record.firstDetectedAt ?? null },
    { label: 'Status changed', value: record.statusChangedAt ?? null },
    { label: 'Last checked', value: record.lastCheckedAt ?? null },
    {
      label: 'Confirmed out of account',
      value: record.confirmedOutOfAccountAt,
    },
    { label: 'Transfer completed', value: record.transferCompletedAt },
    { label: 'Client approved', value: record.clientApprovedAt },
    { label: 'Admin verified', value: record.adminVerifiedAt },
    { label: 'Pending email sent', value: record.pendingExportEmailSentAt },
    { label: 'Failed email sent', value: record.failedExportEmailSentAt },
    {
      label: 'Completion email sent',
      value: record.completedExportEmailSentAt,
    },
    { label: 'NFT burned', value: record.nftBurnedAt },
    { label: 'NFT burn failed', value: record.nftBurnFailedAt },
  ];
  const set = dates.filter((d) => Boolean(d.value));

  if (set.length === 0) {
    return <span className="text-xs text-muted-foreground">None recorded</span>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
      {set.map((d) => (
        <div
          key={d.label}
          className="flex items-baseline justify-between gap-2 text-xs"
        >
          <span className="shrink-0 text-muted-foreground">{d.label}</span>
          <span className="text-end font-mono">{fmt(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/** A labeled section block inside the card body. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
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
 * Card representation of a single export-tracking row — the primary layout at
 * all breakpoints (decision-gates style), replacing the wide table. Filters,
 * sorting and pagination are still driven by ExtensibleDataTable; only the row
 * presentation changes. The status-history timeline (the old desktop expander
 * sub-row) is revealed inline on expand.
 */
export function ExportTrackingCard({
  record,
  isExpanded,
  onToggleExpanded,
  canExpand,
}: ExportTrackingCardProps) {
  const isActive = record.isActive ?? true;

  return (
    <MobileTableItem
      className="p-0"
      data-testid={`admin.export-tracking.card.${record.id}`}
    >
      <MobileTableItemHeader className="mb-0 gap-2 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <MobileTableItemTitle className="break-words">
            <span
              data-testid={`admin.export-tracking.card.${record.id}.domain-name`}
            >
              {record.normalizedDomainName}
            </span>
          </MobileTableItemTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChainCell chainId={record.chainId} />
            {record.registrarKey ? <span>· {record.registrarKey}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ExportStatusBadge status={record.status} />
          <Badge variant={isActive ? 'secondary' : 'outline'}>
            {isActive ? 'Active' : 'Terminal'}
          </Badge>
        </div>
      </MobileTableItemHeader>

      <MobileTableItemContent className="space-y-4 px-4 pb-4">
        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Owner
          </div>
          <OwnerAddressCell
            ownerAddress={record.ownerAddress}
            data-testid={`admin.export-tracking.card.${record.id}.owner`}
          />
        </div>

        <Section label="Latest evidence">
          <LatestEvidencePanel
            evidence={record.latestEvidence}
            recordId={record.id}
          />
        </Section>

        {record.nftBurnLastError ? (
          <Section label="Burn failure">
            <span className="text-xs text-destructive">
              {record.nftBurnLastError}
              {record.nftBurnAttempts ? ` (×${record.nftBurnAttempts})` : ''}
            </span>
          </Section>
        ) : null}

        <Section label="Dates">
          <SetDates record={record} />
        </Section>

        {canExpand ? (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              aria-expanded={isExpanded}
              className="-ms-2 h-7 gap-1 px-2 text-xs text-muted-foreground"
              data-testid={`admin.export-tracking.card.${record.id}.expand-toggle`}
            >
              <ChevronRight
                className={cn(
                  'size-3.5 transition-transform',
                  isExpanded && 'rotate-90',
                )}
              />
              {isExpanded ? 'Hide timeline' : 'Show status history timeline'}
            </Button>
            {isExpanded ? (
              <div className="mt-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/20">
                <StatusHistorySubrow
                  statusHistory={record.statusHistory ?? []}
                  pendingExportEmailSentAt={record.pendingExportEmailSentAt}
                  pendingExportEmailAttempts={record.pendingExportEmailAttempts}
                  pendingExportEmailLastError={
                    record.pendingExportEmailLastError
                  }
                  failedExportEmailSentAt={record.failedExportEmailSentAt}
                  failedExportEmailAttempts={record.failedExportEmailAttempts}
                  failedExportEmailLastError={record.failedExportEmailLastError}
                  completedExportEmailSentAt={record.completedExportEmailSentAt}
                  completedExportEmailAttempts={
                    record.completedExportEmailAttempts
                  }
                  completedExportEmailLastError={
                    record.completedExportEmailLastError
                  }
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </MobileTableItemContent>

      <MobileTableItemActions className="flex-wrap px-4 pb-4">
        <VerifyButton
          record={record}
          data-testid={`admin.export-tracking.row.${record.id}.actions`}
        />
        <ExportTrackingEvidenceDialog
          recordId={record.id}
          domain={record.normalizedDomainName}
          data-testid={`admin.export-tracking.card.${record.id}.evidence-button`}
        />
      </MobileTableItemActions>
    </MobileTableItem>
  );
}
