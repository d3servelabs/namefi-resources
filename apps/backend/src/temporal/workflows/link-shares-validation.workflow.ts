import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { shortRunningOpts } from '../shared/commonRunningOptions';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type TwitterLinkSharesValidationWorkflowInput = {
  batchSize?: number;
  maxBatches?: number;
  campaignKey?: string;
  normalizedDomainName?: NamefiNormalizedDomain;
  requiredHashtags?: string[];
};

export async function twitterLinkSharesValidationWorkflow(
  input: TwitterLinkSharesValidationWorkflowInput = {},
): Promise<{ processed: number; verified: number; failed: number }> {
  const {
    batchSize = 100,
    maxBatches = 100,
    campaignKey,
    normalizedDomainName,
    requiredHashtags,
  } = input;
  const {
    getTwitterLinkSharesNeedingValidation,
    validateAndUpdateTwitterLinkShare,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts, startToCloseTimeout: '2 minute' },
  });

  let processed = 0;
  let verified = 0;
  let failed = 0;

  const all = await getTwitterLinkSharesNeedingValidation({
    campaignKey,
    normalizedDomainName,
  });
  if (all.length === 0) {
    return { processed, verified, failed };
  }

  for (
    let i = 0;
    i < Math.min(maxBatches, Math.ceil(all.length / batchSize));
    i++
  ) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, all.length);
    const batch = all.slice(start, end);

    const results = await Promise.all(
      batch.map((item) =>
        validateAndUpdateTwitterLinkShare({
          ...item,
          requiredHashtags,
        }),
      ),
    );

    processed += results.length;
    for (const r of results) {
      if (r?.ok) verified += 1;
      else failed += 1;
    }
  }

  return { processed, verified, failed };
}
