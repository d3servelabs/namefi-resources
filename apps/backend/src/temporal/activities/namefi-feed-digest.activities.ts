import { runNamefiFeedSalesDigest } from '../../services/namefi-feed/digest.service';

export async function runNamefiFeedSalesDigestActivity(input: {
  at?: string;
  createdByUserId?: string | null;
  includeAnimation?: boolean;
  includeImage?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
}) {
  return runNamefiFeedSalesDigest({
    at: input.at ? new Date(input.at) : undefined,
    createdByUserId: input.createdByUserId,
    includeAnimation: input.includeAnimation,
    includeImage: input.includeImage,
    enabledOnly: input.enabledOnly,
    targetIds: input.targetIds,
    dryRun: input.dryRun,
  });
}
