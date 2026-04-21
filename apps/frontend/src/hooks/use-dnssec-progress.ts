'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import type { StepDisplayInfo } from '@namefi-astra/ui/components/namefi/progress-timeline';
import {
  getProgressPhase,
  isTerminalStatus,
  type UseWorkflowProgressOptions,
} from './use-workflow-progress';

type EnableDnssecProgressResponse =
  AppRouterOutput['dnsRecords']['getEnableDnssecProgress'];

type DisableDnssecProgressResponse =
  AppRouterOutput['dnsRecords']['getDisableDnssecProgress'];

type EnableDnssecStepId = NonNullable<
  EnableDnssecProgressResponse['state']
>['steps'][number]['id'];

type DisableDnssecStepId = NonNullable<
  DisableDnssecProgressResponse['state']
>['steps'][number]['id'];

/**
 * Display information for each enable DNSSEC workflow step.
 */
export const enableDnssecStepDisplayInfo: Record<
  EnableDnssecStepId,
  StepDisplayInfo
> = {
  'check-support': {
    label: 'Checking DNSSEC support',
    helper: 'Verifying your domain supports DNSSEC.',
  },
  'enable-zone-signing': {
    label: 'Enabling zone signing',
    helper: 'Configuring DNSSEC for your DNS zone.',
  },
  'associate-ds-record': {
    label: 'Registering DS record',
    helper: 'Submitting delegation signer to the registrar.',
  },
  'verify-propagation': {
    label: 'Verifying propagation',
    helper: 'Waiting for DNS changes to propagate globally.',
  },
};

/**
 * Display information for each disable DNSSEC workflow step.
 */
export const disableDnssecStepDisplayInfo: Record<
  DisableDnssecStepId,
  StepDisplayInfo
> = {
  'check-status': {
    label: 'Checking DNSSEC status',
    helper: 'Verifying current DNSSEC configuration.',
  },
  'remove-ds-record': {
    label: 'Removing DS record',
    helper: 'Removing delegation signer from the registrar.',
  },
  'verify-removal': {
    label: 'Verifying removal',
    helper: 'Waiting for DS record removal to propagate.',
  },
  'disable-zone-signing': {
    label: 'Disabling zone signing',
    helper: 'Turning off DNSSEC for your DNS zone.',
  },
};

// Keep backward compatibility
export const dnssecStepDisplayInfo = enableDnssecStepDisplayInfo;

// Re-export options type for convenience
export type { UseWorkflowProgressOptions as UseDnssecProgressOptions };

/**
 * Hook to track the progress of enabling DNSSEC for a domain.
 */
export function useEnableDnssecProgress(
  domainName: string | undefined,
  options: UseWorkflowProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const isEnabled = Boolean(domainName) && enabled;

  const query = useQuery({
    ...trpc.dnsRecords.getEnableDnssecProgress.queryOptions(
      { domainName: domainName ?? '' },
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
    refetchInterval: (queryInstance) => {
      if (!isEnabled) return false;
      const data = queryInstance.state.data as
        | EnableDnssecProgressResponse
        | undefined;
      if (!data) return pollIntervalMs;

      return isTerminalStatus(data.workflowStatus) ? false : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

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
    phase,
    refreshedAt: progress?.fetchedAt ?? null,
    refetch: query.refetch,
  } as const;
}

/**
 * Hook to track the progress of disabling DNSSEC for a domain.
 */
export function useDisableDnssecProgress(
  domainName: string | undefined,
  options: UseWorkflowProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const isEnabled = Boolean(domainName) && enabled;

  const query = useQuery({
    ...trpc.dnsRecords.getDisableDnssecProgress.queryOptions(
      { domainName: domainName ?? '' },
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
    refetchInterval: (queryInstance) => {
      if (!isEnabled) return false;
      const data = queryInstance.state.data as
        | DisableDnssecProgressResponse
        | undefined;
      if (!data) return pollIntervalMs;

      return isTerminalStatus(data.workflowStatus) ? false : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

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
    phase,
    refreshedAt: progress?.fetchedAt ?? null,
    refetch: query.refetch,
  } as const;
}

// Keep backward compatibility - alias to enable hook
export const useDnssecProgress = useEnableDnssecProgress;
