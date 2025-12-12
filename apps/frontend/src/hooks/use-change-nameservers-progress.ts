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
import {
  disableDnssecStepDisplayInfo,
  enableDnssecStepDisplayInfo,
} from './use-dnssec-progress';

type ChangeNameserversProgressResponse =
  AppRouterOutput['dnsRecords']['getChangeNameserversProgress'];

type WorkflowType = ChangeNameserversProgressResponse['workflowType'];

type ChangeNameserversStepId =
  | 'disable-dnssec'
  | 'set-nameservers'
  | 'verify-change';

type ResetNameserversStepId = 'change-nameservers' | 'enable-dnssec';

/**
 * Display information for each change nameservers workflow step.
 */
export const changeNameserversStepDisplayInfo: Record<
  ChangeNameserversStepId,
  StepDisplayInfo
> = {
  'disable-dnssec': {
    label: 'Disabling DNSSEC',
    helper: 'Removing DNSSEC before changing nameservers.',
  },
  'set-nameservers': {
    label: 'Setting nameservers',
    helper: 'Updating nameserver configuration at the registrar.',
  },
  'verify-change': {
    label: 'Verifying change',
    helper: 'Confirming nameserver changes have been applied.',
  },
};

/**
 * Display information for reset nameservers workflow steps.
 */
export const resetNameserversStepDisplayInfo: Record<
  ResetNameserversStepId,
  StepDisplayInfo
> = {
  'change-nameservers': {
    label: 'Changing nameservers',
    helper: 'Updating nameserver configuration to Namefi defaults.',
  },
  'enable-dnssec': {
    label: 'Enabling DNSSEC',
    helper: 'Configuring DNSSEC for enhanced security.',
  },
};

/**
 * Substep display info for the disable-dnssec step in change-nameservers workflow.
 * Uses the same labels as the disable DNSSEC workflow.
 */
export const changeNameserversSubstepDisplayInfo = disableDnssecStepDisplayInfo;

/**
 * Substep display info for the change-nameservers step in reset-nameservers workflow.
 * Uses the same labels as the change nameservers workflow.
 */
export const resetNameserversChangeSubstepDisplayInfo =
  changeNameserversStepDisplayInfo;

/**
 * Substep display info for the enable-dnssec step in reset-nameservers workflow.
 * Uses the same labels as the enable DNSSEC workflow.
 */
export const resetNameserversEnableDnssecSubstepDisplayInfo =
  enableDnssecStepDisplayInfo;

/**
 * Hook to track the progress of changing nameservers for a domain.
 * Includes substeps for embedded workflows (e.g., disable DNSSEC).
 */
export function useChangeNameserversProgress(
  domainName: string | undefined,
  options: UseWorkflowProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEnabled = Boolean(domainName) && enabled;

  const queryOptions = useMemo(
    () =>
      trpc.dnsRecords.getChangeNameserversProgress.queryOptions(
        { domainName: domainName ?? '' },
        {
          trpc: {
            context: { skipBatch: true },
          },
        },
      ),
    [trpc, domainName],
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
        | ChangeNameserversProgressResponse
        | undefined;
      if (!data) return pollIntervalMs;

      return isTerminalStatus(data.workflowStatus) ? false : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

  // Invalidate and refetch - useful when opening modal to get fresh data
  const reset = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
  }, [queryClient, queryOptions.queryKey]);

  const progress = query.data ?? null;
  const latestState = progress?.state ?? null;
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
    return isTerminalStatus(progress.workflowStatus);
  }, [progress]);

  const isPolling =
    query.fetchStatus === 'fetching' &&
    query.data !== undefined &&
    !query.isLoading;

  const phase = useMemo(() => getProgressPhase(progress), [progress]);

  const workflowType = progress?.workflowType ?? null;

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
    workflowType,
    phase,
    refreshedAt: progress?.fetchedAt ?? null,
    refetch: query.refetch,
    reset,
  } as const;
}
