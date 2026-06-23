import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { ExportStatusBadge } from './export-status-badge';

type EvidenceSourceEntry = {
  source: string;
  status: string;
  evidence?: unknown;
  error?: string;
  checkedAt: string;
};

type EvidenceSnapshot = {
  checkedAt?: string;
  decisionAction?: string;
  decisionReason?: string;
  sources?: EvidenceSourceEntry[];
  eppStatuses?: string[];
  actor?: 'workflow' | 'admin' | 'system';
};

type StatusHistoryEntry = {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
  reason?: string;
  evidence?: EvidenceSnapshot;
};

type StatusHistorySubrowProps = {
  statusHistory: StatusHistoryEntry[];
  pendingExportEmailSentAt?: Date | string | null;
  pendingExportEmailAttempts?: number | null;
  pendingExportEmailLastError?: string | null;
  failedExportEmailSentAt?: Date | string | null;
  failedExportEmailAttempts?: number | null;
  failedExportEmailLastError?: string | null;
  completedExportEmailSentAt?: Date | string | null;
  completedExportEmailAttempts?: number | null;
  completedExportEmailLastError?: string | null;
};

const actorVariant: Record<string, string> = {
  workflow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  admin:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  system: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
};

function ActorBadge({ actor }: { actor?: EvidenceSnapshot['actor'] }) {
  if (!actor) return null;
  return (
    <Badge
      variant="outline"
      className={actorVariant[actor] ?? actorVariant.system}
    >
      {actor}
    </Badge>
  );
}

function formatSourceStatus(entry?: EvidenceSourceEntry): string {
  if (!entry) return 'No data';
  if (entry.status === 'error') {
    return `Error: ${entry.error ?? 'unknown'}`;
  }
  return entry.status;
}

function EvidenceSummary({ evidence }: { evidence?: EvidenceSnapshot }) {
  if (!evidence) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const sources = evidence.sources ?? [];
  const accountSource = sources.find((s) => s.source === 'AccountCheck');
  const domainIndexSource = sources.find((s) => s.source === 'DomainIndex');
  const rdapEventsSource = sources.find((s) => s.source === 'RDAPEvents');
  const directSource = sources.find((s) => s.source === 'DirectRegistrar');

  const rdapEventDate = (rdapEventsSource?.evidence as { eventDate?: string })
    ?.eventDate;
  const rdapSummary =
    rdapEventsSource?.status === 'positive_completed'
      ? rdapEventDate
        ? `Detected (${new Date(rdapEventDate).toLocaleString()})`
        : 'Detected'
      : rdapEventsSource
        ? formatSourceStatus(rdapEventsSource)
        : null;

  const errorCount = sources.filter((s) => s.status === 'error').length;

  return (
    <div className="space-y-0.5 text-[11px] max-w-[260px]">
      {evidence.actor && (
        <div>
          <span className="text-muted-foreground">Actor:</span>{' '}
          <span>{evidence.actor}</span>
        </div>
      )}
      {accountSource && (
        <div>
          <span className="text-muted-foreground">Account:</span>{' '}
          <span>{formatSourceStatus(accountSource)}</span>
        </div>
      )}
      {domainIndexSource && (
        <div>
          <span className="text-muted-foreground">Domain index:</span>{' '}
          <span>{formatSourceStatus(domainIndexSource)}</span>
        </div>
      )}
      {rdapSummary && (
        <div>
          <span className="text-muted-foreground">RDAP events:</span>{' '}
          <span>{rdapSummary}</span>
        </div>
      )}
      {directSource && (
        <div>
          <span className="text-muted-foreground">Direct registrar:</span>{' '}
          <span>{formatSourceStatus(directSource)}</span>
        </div>
      )}
      {sources.length > 0 && (
        <div className="text-muted-foreground">
          {sources.length} source{sources.length === 1 ? '' : 's'}
          {errorCount > 0 ? ` (${errorCount} errored)` : ''}
        </div>
      )}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] -ml-2"
            />
          }
        >
          View JSON
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[440px] max-sm:w-full p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium">Evidence snapshot</div>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function StatusHistorySubrow({
  statusHistory,
  pendingExportEmailSentAt,
  pendingExportEmailAttempts,
  pendingExportEmailLastError,
  failedExportEmailSentAt,
  failedExportEmailAttempts,
  failedExportEmailLastError,
  completedExportEmailSentAt,
  completedExportEmailAttempts,
  completedExportEmailLastError,
}: StatusHistorySubrowProps) {
  // Sort by timestamp descending (most recent first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (sortedHistory.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No status history available
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="font-medium mb-3 text-sm">Status History Timeline</h4>

      <div className="grid gap-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pending Email Sent:</span>
          <span>
            {pendingExportEmailSentAt
              ? new Date(pendingExportEmailSentAt).toLocaleString()
              : '-'}
          </span>
          {pendingExportEmailAttempts ? (
            <span className="text-muted-foreground">
              ({pendingExportEmailAttempts} attempt
              {pendingExportEmailAttempts === 1 ? '' : 's'})
            </span>
          ) : null}
        </div>
        {pendingExportEmailLastError ? (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">
              Pending Email Last Error:
            </span>
            <span className="text-red-600 font-mono">
              {pendingExportEmailLastError}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Failed Email Sent:</span>
          <span>
            {failedExportEmailSentAt
              ? new Date(failedExportEmailSentAt).toLocaleString()
              : '-'}
          </span>
          {failedExportEmailAttempts ? (
            <span className="text-muted-foreground">
              ({failedExportEmailAttempts} attempt
              {failedExportEmailAttempts === 1 ? '' : 's'})
            </span>
          ) : null}
        </div>
        {failedExportEmailLastError ? (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">
              Failed Email Last Error:
            </span>
            <span className="text-red-600 font-mono">
              {failedExportEmailLastError}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Completion Email Sent:</span>
          <span>
            {completedExportEmailSentAt
              ? new Date(completedExportEmailSentAt).toLocaleString()
              : '-'}
          </span>
          {completedExportEmailAttempts ? (
            <span className="text-muted-foreground">
              ({completedExportEmailAttempts} attempt
              {completedExportEmailAttempts === 1 ? '' : 's'})
            </span>
          ) : null}
        </div>
        {completedExportEmailLastError ? (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground">
              Completion Email Last Error:
            </span>
            <span className="text-red-600 font-mono">
              {completedExportEmailLastError}
            </span>
          </div>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[170px]">Timestamp</TableHead>
            <TableHead className="w-[160px]">Status</TableHead>
            <TableHead className="w-[80px]">Actor</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="w-[180px]">EPP Statuses</TableHead>
            <TableHead className="w-[280px]">Evidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHistory.map((entry, index) => (
            <TableRow key={`${entry.timestamp}-${index}`}>
              <TableCell className="text-xs align-top">
                {new Date(entry.timestamp).toLocaleString()}
              </TableCell>
              <TableCell className="align-top">
                <ExportStatusBadge status={entry.status} />
              </TableCell>
              <TableCell className="align-top">
                <ActorBadge actor={entry.evidence?.actor} />
              </TableCell>
              <TableCell className="text-xs align-top whitespace-pre-wrap">
                {entry.reason ?? entry.evidence?.decisionReason ?? (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-xs font-mono align-top">
                {entry.eppStatuses && entry.eppStatuses.length > 0
                  ? entry.eppStatuses.join(', ')
                  : entry.evidence?.eppStatuses &&
                      entry.evidence.eppStatuses.length > 0
                    ? entry.evidence.eppStatuses.join(', ')
                    : '-'}
              </TableCell>
              <TableCell className="align-top">
                <EvidenceSummary evidence={entry.evidence} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
