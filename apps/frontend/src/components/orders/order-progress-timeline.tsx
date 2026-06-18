'use client';

import { StatusBadge } from '@/components/status-badge';
import {
  ProgressTimeline,
  type StepDisplayInfo,
} from '@namefi-astra/ui/components/namefi/progress-timeline';
import type { WorkflowProgressPhase } from '@/hooks/use-order-progress';
import type { AppRouterOutput } from '@/lib/trpc';
import { isNotNil } from 'ramda';
import { matchAny } from '@namefi-astra/utils/match';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

type OrderProgress = AppRouterOutput['orders']['getOrderProgress'];
type OrderStepId = NonNullable<OrderProgress['state']>['steps'][number]['id'];

interface OrderProgressTimelineProps {
  progress: OrderProgress | null;
  workflowPhase: WorkflowProgressPhase;
}

/**
 * Display information for each order processing step.
 */
const orderStepDisplayInfo: Record<OrderStepId, StepDisplayInfo> = {
  'order-details': {
    label: 'Preparing your order',
    helper: 'Validating domains and wallet configuration.',
  },
  payments: {
    label: 'Collecting payment',
    helper:
      'Confirming your payment. Blockchain payments may take 30+ seconds for transaction confirmation.',
  },
  items: {
    label: 'Registering domains',
    helper: 'Securing each domain on the blockchain.',
  },
  'post-processing': {
    label: 'Final touches',
    helper: 'Adding Some Namefi Magic to your domains.',
  },
  'final-status': {
    label: 'Finalising order status',
    helper: 'Applying the final status to your order.',
  },
  refund: {
    label: 'Handling refunds',
    helper: 'Returning funds for any items we could not secure.',
  },
  notification: {
    label: 'Sending confirmation',
    helper: 'Preparing your receipt and order summary email.',
  },
};

/**
 * Order progress timeline component that displays the current state of order processing.
 * Uses the generic ProgressTimeline component with order-specific display info.
 */
export function OrderProgressTimeline({
  progress,
  workflowPhase,
}: OrderProgressTimelineProps) {
  const t = useTranslations('orders');
  const effectiveLoading = workflowPhase === 'loading' || !progress?.state;
  const steps = progress?.state?.steps ?? [];
  const localizedStepDisplayInfo = useMemo<
    Record<OrderStepId, StepDisplayInfo>
  >(
    () => ({
      'order-details': {
        label: t('timeline.orderDetails.label'),
        helper: t('timeline.orderDetails.helper'),
      },
      payments: {
        label: t('timeline.payments.label'),
        helper: t('timeline.payments.helper'),
      },
      items: {
        label: t('timeline.items.label'),
        helper: t('timeline.items.helper'),
      },
      'post-processing': {
        label: t('timeline.postProcessing.label'),
        helper: t('timeline.postProcessing.helper'),
      },
      'final-status': {
        label: t('timeline.finalStatus.label'),
        helper: t('timeline.finalStatus.helper'),
      },
      refund: {
        label: t('timeline.refund.label'),
        helper: t('timeline.refund.helper'),
      },
      notification: {
        label: t('timeline.notification.label'),
        helper: t('timeline.notification.helper'),
      },
    }),
    [t],
  );
  const displayedSteps = useMemo(() => {
    return steps.filter((step) => {
      if (step.id === 'refund') {
        return isNotNil(step.startedAt);
      }
      if (matchAny(step.id, 'notification', 'final-status')) {
        return false;
      }
      return true;
    });
  }, [steps]);

  return (
    <ProgressTimeline<OrderStepId>
      loading={effectiveLoading}
      steps={displayedSteps}
      stepDisplayInfo={localizedStepDisplayInfo}
      subtitle={t('timeline.subtitle')}
      badge={
        <StatusBadge
          status={progress?.orderStatus ?? 'PROCESSING'}
          type="order"
        />
      }
      skeletonStepCount={7}
    />
  );
}

// Re-export for backwards compatibility
export { orderStepDisplayInfo };
