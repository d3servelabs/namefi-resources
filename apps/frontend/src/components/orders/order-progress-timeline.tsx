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

/**
 * What the order's active line items actually do. Drives renewal/import-aware
 * copy across the progress page. `mixed` (and the empty-order fallback) reuses
 * the registration wording. Derived from order item types in the order page.
 */
export type OrderKind = 'register' | 'import' | 'renew' | 'mixed';

interface OrderProgressTimelineProps {
  progress: OrderProgress | null;
  workflowPhase: WorkflowProgressPhase;
  /** Tailors the "items" step copy to renewals / imports. Defaults to register. */
  orderKind?: OrderKind;
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
  orderKind = 'register',
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
      // The "items" step is the one stage that means something different per
      // order kind: renewals extend on-chain, imports submit transfer requests,
      // and registrations (and mixed orders) secure new domains.
      items:
        orderKind === 'renew'
          ? {
              label: t('timeline.items.renewLabel'),
              helper: t('timeline.items.renewHelper'),
            }
          : orderKind === 'import'
            ? {
                label: t('timeline.items.importLabel'),
                helper: t('timeline.items.importHelper'),
              }
            : {
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
    [t, orderKind],
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
