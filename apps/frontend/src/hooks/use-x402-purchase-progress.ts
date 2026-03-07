'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import type { StepDisplayInfo } from '@/components/ui/progress-timeline';
import {
  getProgressPhase,
  isTerminalStatus,
  type UseWorkflowProgressOptions,
} from './use-workflow-progress';
import { orderStepDisplayInfo } from '@/components/orders/order-progress-timeline';
import { isNotNil } from 'ramda';
import { matchAny } from '@namefi-astra/utils/match';

type X402PurchaseProgressResponse =
  AppRouterOutput['x402']['getX402PurchaseProgress'];

type X402PurchaseStepId =
  | 'waiting-settlement'
  | 'creating-user'
  | 'creating-order'
  | 'processing-order'
  | 'completing';

/**
 * Display information for each x402 purchase workflow step.
 */
export const x402PurchaseStepDisplayInfo: Record<
  X402PurchaseStepId,
  StepDisplayInfo
> = {
  'waiting-settlement': {
    label: 'Waiting for payment',
    helper: 'Confirming your USDC payment on-chain.',
  },
  'creating-user': {
    label: 'Setting up account',
    helper: 'Creating or linking your wallet account.',
  },
  'creating-order': {
    label: 'Creating order',
    helper: 'Preparing your domain registration order.',
  },
  'processing-order': {
    label: 'Processing order',
    helper: 'Registering your domain and minting NFT.',
  },
  completing: {
    label: 'Completing',
    helper: 'Finalizing your purchase.',
  },
};

/**
 * Substep display info for the processing-order step.
 * Uses the same labels as the order progress timeline.
 */
export const x402ProcessingOrderSubstepDisplayInfo = orderStepDisplayInfo;

/**
 * Hook to track the progress of an x402 purchase.
 * Includes substeps from the processOrderWorkflow.
 */
export function useX402PurchaseProgress(
  purchaseId: string | undefined,
  options: UseWorkflowProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEnabled = Boolean(purchaseId) && enabled;

  const queryOptions = useMemo(
    () =>
      trpc.x402.getX402PurchaseProgress.queryOptions(
        { purchaseId: purchaseId ?? '' },
        { trpc: { context: { skipBatch: true } } },
      ),
    [trpc, purchaseId],
  );

  const query = useQuery({
    ...queryOptions,
    enabled: isEnabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: (queryInstance) => {
      if (!isEnabled) return false;
      const data = queryInstance.state.data as
        | X402PurchaseProgressResponse
        | undefined;
      if (!data) return pollIntervalMs;
      return isTerminalStatus(data.workflowStatus) ? false : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

  const reset = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
  }, [queryClient, queryOptions.queryKey]);

  const progress = query.data ?? null;
  const latestState = progress?.state ?? null;
  const _steps = useMemo(() => latestState?.steps ?? [], [latestState?.steps]);
  const steps = useMemo(() => {
    return _steps.map((step) => {
      if (step.id === 'processing-order') {
        if (!step.substeps) return step;

        return {
          ...step,
          substeps: step.substeps.filter((substep) => {
            if (substep.id === 'refund') {
              return isNotNil(substep.startedAt);
            }
            if (matchAny(substep.id, 'notification', 'final-status')) {
              return false;
            }
            return true;
          }),
        };
      }
      return step;
    });
  }, [_steps]);

  const activeStep = useMemo(() => {
    return (
      steps.find((step) => step.status === 'IN_PROGRESS') ??
      steps.find((step) => step.status === 'PENDING') ??
      null
    );
  }, [steps]);

  const hasCompleted = useMemo(() => {
    if (!progress) return false;
    return isTerminalStatus(progress.workflowStatus);
  }, [progress]);

  const isPolling =
    query.fetchStatus === 'fetching' &&
    query.data !== undefined &&
    !query.isLoading;

  const phase = useMemo(() => getProgressPhase(progress), [progress]);

  return {
    data: progress,
    state: latestState,
    steps,
    activeStep,
    isLoading: query.isLoading,
    isPolling,
    isError: query.isError,
    error: query.error,
    hasCompleted,
    workflowStatus: progress?.workflowStatus ?? null,
    purchaseStatus: progress?.purchaseStatus ?? null,
    phase,
    refreshedAt: progress?.fetchedAt ?? null,
    refetch: query.refetch,
    reset,
  } as const;
}
