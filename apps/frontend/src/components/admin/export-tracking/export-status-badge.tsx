import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';

const statusConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  NO_SIGNAL: {
    label: 'No Signal',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'No explicit transfer signal was detected on this check.',
  },
  UNDETERMINED: {
    label: 'Undetermined',
    className:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    description:
      'The transfer state is ambiguous due to conflicting or insufficient evidence.',
  },
  PENDING_TRANSFER: {
    label: 'Pending Transfer',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    description: 'A transfer request is pending with the registrar.',
  },
  TRANSFER_PERIOD: {
    label: 'Transfer Period',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Domain appears to be in the post-transfer lock period.',
  },
  TRANSFER_COMPLETED: {
    label: 'Transfer Completed',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'Transfer completion was detected (legacy complete status).',
  },
  TRANSFER_FAILED: {
    label: 'Transfer Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description:
      'Transfer no longer appears in progress and was treated as failed.',
  },
  NEEDS_ADMIN_REVIEW: {
    label: 'Needs Admin Review',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    description:
      'Completion detected and waiting for admin review before notification/burn flow.',
  },
  NOTIFIED: {
    label: 'Notified',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    description: 'User notification has been sent for this export.',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    description: 'This export tracking case has been closed.',
  },
};

export function ExportStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Unknown export status from the tracking system.',
  };

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Badge
          variant="outline"
          className={cn('font-medium', config.className)}
        >
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{config.description}</TooltipContent>
    </Tooltip>
  );
}
