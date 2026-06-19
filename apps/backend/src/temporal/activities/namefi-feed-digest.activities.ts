import { ApplicationFailure } from '@temporalio/common';
import {
  NamefiFeedSalesDigestDeliveryError,
  runNamefiFeedSalesDigest,
} from '../../services/namefi-feed/digest.service';

export async function runNamefiFeedSalesDigestActivity(input: {
  at?: string;
  createdByUserId?: string | null;
  trigger?: 'scheduled' | 'manual';
  temporalRunId?: string | null;
  workflowId?: string | null;
  includeAnimation?: boolean;
  includeImage?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
}) {
  try {
    return await runNamefiFeedSalesDigest({
      at: input.at ? new Date(input.at) : undefined,
      createdByUserId: input.createdByUserId,
      trigger: input.trigger,
      temporalRunId: input.temporalRunId,
      workflowId: input.workflowId,
      includeAnimation: input.includeAnimation,
      includeImage: input.includeImage,
      enabledOnly: input.enabledOnly,
      targetIds: input.targetIds,
      dryRun: input.dryRun,
    });
  } catch (error) {
    if (error instanceof NamefiFeedSalesDigestDeliveryError) {
      throw ApplicationFailure.create({
        message: error.message,
        type: error.name,
        nonRetryable: true,
        details: [error.digestResult],
      });
    }
    throw error;
  }
}
