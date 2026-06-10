import { runNamefiFeedSalesDigest } from '../../services/namefi-feed/digest.service';

export async function runNamefiFeedSalesDigestActivity(input: {
  at?: string;
  createdByUserId?: string | null;
  digestRunId?: string | null;
  trigger?: 'scheduled' | 'manual';
  workflowId?: string | null;
  includeAnimation?: boolean;
  includeImage?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
}) {
  return runNamefiFeedSalesDigest({
    at: input.at ? new Date(input.at) : undefined,
    createdByUserId: input.createdByUserId,
    digestRunId: input.digestRunId,
    trigger: input.trigger,
    workflowId: input.workflowId,
    includeAnimation: input.includeAnimation,
    includeImage: input.includeImage,
    enabledOnly: input.enabledOnly,
    targetIds: input.targetIds,
    dryRun: input.dryRun,
  });
}
