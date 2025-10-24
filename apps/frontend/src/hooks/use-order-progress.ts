'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';

type OrderProgressResponse = AppRouterOutput['orders']['getOrderProgress'];

export interface UseOrderProgressOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

export const TERMINAL_WORKFLOW_STATUSES = new Set<
  OrderProgressResponse['workflowStatus']
>([
  'COMPLETED',
  'FAILED',
  'TERMINATED',
  'TIMED_OUT',
  'CANCELLED',
  'UNKNOWN',
  'NOT_FOUND',
]);

export function useOrderProgress(
  orderId: string | undefined,
  options: UseOrderProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const isEnabled = Boolean(orderId) && enabled;

  const orderProgressQuery = useQuery({
    ...trpc.orders.getOrderProgress.queryOptions(
      { orderId: orderId ?? '' },
      {
        trpc: {
          context: { skipBatch: true },
        },
      },
    ),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: (query) => {
      if (!isEnabled) return false;
      const data = query.state.data as OrderProgressResponse | undefined;
      if (!data) return pollIntervalMs;

      return TERMINAL_WORKFLOW_STATUSES.has(data.workflowStatus)
        ? false
        : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

  const progress = orderProgressQuery.data ?? null;

  const latestState = progress?.state;
  const steps = useMemo(() => latestState?.steps ?? [], [latestState?.steps]);

  const activeStep = useMemo(() => {
    return (
      steps.find((step) => step.status === 'IN_PROGRESS') ??
      steps.find((step) => step.status === 'PENDING') ??
      null
    );
  }, [steps]);

  const hasCompleted = useMemo(() => {
    if (!progress) return false;
    return ['COMPLETED', 'FAILED', 'TERMINATED', 'TIMED_OUT'].includes(
      progress.workflowStatus,
    );
  }, [progress]);

  const isPolling =
    orderProgressQuery.fetchStatus === 'fetching' &&
    orderProgressQuery.data !== undefined &&
    !orderProgressQuery.isLoading;

  return {
    data: progress,
    state: latestState,
    steps,
    activeStep,
    isLoading: orderProgressQuery.isLoading,
    isPolling,
    isError: orderProgressQuery.isError,
    error: orderProgressQuery.error,
    hasCompleted,
    workflowStatus: progress?.workflowStatus,
    orderStatus: progress?.orderStatus,
    refreshedAt: progress?.fetchedAt ?? null,
  } as const;
}

export type WorkflowProgressPhase = 'loading' | 'processing' | 'terminal';

export function getWorkflowProgressPhase(
  progress: OrderProgressResponse | null | undefined,
): WorkflowProgressPhase {
  if (!progress || !progress.state) {
    return 'loading';
  }

  if (TERMINAL_WORKFLOW_STATUSES.has(progress.workflowStatus)) {
    return 'terminal';
  }

  return 'processing';
}
