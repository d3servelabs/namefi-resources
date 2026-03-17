import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/cn';

const statusConfig: Record<string, { label: string; className: string }> = {
  NO_SIGNAL: {
    label: 'No Signal',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  UNDETERMINED: {
    label: 'Undetermined',
    className:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  },
  PENDING_TRANSFER: {
    label: 'Pending Transfer',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  TRANSFER_PERIOD: {
    label: 'Transfer Period',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  TRANSFER_COMPLETED: {
    label: 'Transfer Completed',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  TRANSFER_FAILED: {
    label: 'Transfer Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  NEEDS_ADMIN_REVIEW: {
    label: 'Needs Admin Review',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  NOTIFIED: {
    label: 'Notified',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  },
};

export function ExportStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
