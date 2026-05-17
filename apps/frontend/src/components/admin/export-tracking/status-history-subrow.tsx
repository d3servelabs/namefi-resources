import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { ExportStatusBadge } from './export-status-badge';

type StatusHistoryEntry = {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
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
      <h4 className="font-medium mb-3 text-sm">Status History</h4>

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
            <TableHead className="w-[200px]">Timestamp</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead>EPP Statuses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHistory.map((entry, index) => (
            <TableRow key={`${entry.timestamp}-${index}`}>
              <TableCell className="text-xs">
                {new Date(entry.timestamp).toLocaleString()}
              </TableCell>
              <TableCell>
                <ExportStatusBadge status={entry.status} />
              </TableCell>
              <TableCell className="text-xs font-mono">
                {entry.eppStatuses && entry.eppStatuses.length > 0
                  ? entry.eppStatuses.join(', ')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
