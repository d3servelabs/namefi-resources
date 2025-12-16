import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { ExportStatusBadge } from './export-status-badge';

type StatusHistoryEntry = {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
};

type StatusHistorySubrowProps = {
  statusHistory: StatusHistoryEntry[];
};

export function StatusHistorySubrow({
  statusHistory,
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
