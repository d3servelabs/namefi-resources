import { longRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { workflowInfo } from '@temporalio/workflow';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export type NamefiFeedSalesDigestWorkflowInput = {
  trigger: 'scheduled' | 'manual';
  requestedByUserId?: string | null;
  digestRunId?: string | null;
  at?: string;
  includeImage?: boolean;
  includeAnimation?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
};

export type NamefiFeedSalesDigestWorkflowResult = Awaited<
  ReturnType<typeof runNamefiFeedSalesDigestActivity>
>;

const { runNamefiFeedSalesDigestActivity } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...longRunningOpts,
    startToCloseTimeout: '90 minutes',
    retry: {
      maximumAttempts: 1,
    },
  },
});

export async function namefiFeedSalesDigestWorkflow(
  input: NamefiFeedSalesDigestWorkflowInput,
): Promise<NamefiFeedSalesDigestWorkflowResult> {
  const workflowId = workflowInfo().workflowId;
  return runNamefiFeedSalesDigestActivity({
    at: input.at,
    createdByUserId: input.requestedByUserId ?? null,
    digestRunId: input.digestRunId ?? null,
    trigger: input.trigger,
    workflowId,
    includeAnimation: input.includeAnimation ?? true,
    includeImage: input.includeImage ?? true,
    enabledOnly: input.enabledOnly ?? true,
    targetIds: input.targetIds,
    dryRun: input.dryRun ?? false,
  });
}
