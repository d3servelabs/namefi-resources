import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/cn';

const statusConfig: Record<string, { label: string; className: string }> = {
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
