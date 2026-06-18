'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

type StatusBadgeType = 'order' | 'payment';

interface StatusBadgeProps {
  status: string;
  type: StatusBadgeType;
}

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

/**
 * Visual style per status code. The human-readable label is resolved from the
 * shared `common.status.*` namespace at render so it localizes; the status
 * codes themselves stay as stable identifiers. `SUCCEEDED`/`COMPLETED` share a
 * style but keep distinct labels.
 */
const STATUS_STYLES: Record<
  string,
  { labelKey: string; className: string; variant?: BadgeVariant }
> = {
  CREATED: {
    labelKey: 'created',
    variant: 'secondary',
    className: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  },
  PROCESSING: {
    labelKey: 'processing',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  SUCCEEDED: {
    labelKey: 'succeeded',
    className: 'bg-green-600 text-secondary-foreground hover:bg-green-700',
  },
  COMPLETED: {
    labelKey: 'completed',
    className: 'bg-green-600 text-secondary-foreground hover:bg-green-700',
  },
  FAILED: {
    labelKey: 'failed',
    variant: 'secondary',
    className: 'bg-red-900 text-secondary-foreground hover:bg-red-950',
  },
  CANCELLED: {
    labelKey: 'cancelled',
    variant: 'outline',
    className:
      'border-orange-500 bg-orange-400 text-secondary-foreground hover:bg-orange-500',
  },
  PARTIALLY_COMPLETED: {
    labelKey: 'partiallyCompleted',
    variant: 'outline',
    className:
      'border-amber-400 bg-amber-200 text-gray-800 hover:text-secondary-foreground hover:bg-amber-400',
  },
  REQUIRES_ACTION: {
    labelKey: 'waitingForUser',
    variant: 'outline',
    className:
      'border-amber-500 bg-amber-300 text-gray-800 hover:text-secondary-foreground hover:bg-amber-500',
  },
  PENDING: {
    labelKey: 'pending',
    variant: 'outline',
    className:
      'border-amber-500 bg-amber-300 text-gray-800 hover:text-secondary-foreground hover:bg-amber-500',
  },
  // TODO: change to REFUNDED once the backend status is renamed.
  REFUND_REQUESTED: {
    labelKey: 'refunded',
    variant: 'outline',
    className:
      'border-purple-500 bg-purple-300 text-gray-800 hover:text-secondary-foreground hover:bg-purple-500',
  },
  REQUIRES_CAPTURE: {
    labelKey: 'requiresCapture',
    variant: 'outline',
    className:
      'border-orange-500 bg-orange-300 text-gray-800 hover:text-secondary-foreground hover:bg-orange-500',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('common.status');
  const style = STATUS_STYLES[status];

  if (!style) {
    return (
      <Badge
        variant="outline"
        className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
      >
        {status || t('unknown')}
      </Badge>
    );
  }

  return (
    <Badge variant={style.variant} className={style.className}>
      {t(style.labelKey)}
    </Badge>
  );
}
