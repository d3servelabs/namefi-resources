'use client';

import { StatusBadge } from '@/components/status-badge';
import {
  ProgressTimeline,
  type StepDisplayInfo,
} from '@/components/ui/progress-timeline';
import type { WorkflowProgressPhase } from '@/hooks/use-order-progress';
import type { AppRouterOutput } from '@/lib/trpc';

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
    helper: 'Confirming the payment method you selected.',
  },
  items: {
    label: 'Registering domains',
    helper: 'Securing each domain on the blockchain.',
  },
  'post-processing': {
    label: 'Final touches',
    helper: 'Updating indexes and generating NFT assets.',
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
  const effectiveLoading = workflowPhase === 'loading' || !progress?.state;
  const steps = progress?.state?.steps ?? [];

  return (
    <ProgressTimeline<OrderStepId>
      loading={effectiveLoading}
      steps={steps}
      stepDisplayInfo={orderStepDisplayInfo}
      subtitle="Live order updates"
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
