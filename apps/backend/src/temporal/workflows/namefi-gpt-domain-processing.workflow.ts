import { log } from '@temporalio/workflow';
import { typedProxyActivities } from '../shared/workflow-helpers';
import { TEMPORAL_ENUMS } from '../shared';

const {
  getAllDomainsNeedingProcessingForNamefiGpt,
  processSingleDomainForNamefiGpt,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    startToCloseTimeout: '5m',
    retry: {
      maximumAttempts: 3,
      initialInterval: '10s',
      backoffCoefficient: 2,
      maximumInterval: '60s',
    },
  },
});

export interface AiProcessingResult {
  processed: number;
  failed: number;
  total: number;
}

/**
 * Final AI processing workflow - dead simple
 * Get all domains, loop through them, done
 */
export async function namefiGptProcessingWorkflow({
  limit,
  regenerateAll,
}: {
  limit?: number;
  regenerateAll?: boolean;
} = {}): Promise<AiProcessingResult> {
  log.info('Starting final AI processing workflow', { limit, regenerateAll });

  // Get all domains that need processing (single query)
  const domains = await getAllDomainsNeedingProcessingForNamefiGpt(
    limit,
    regenerateAll,
  );

  if (domains.length === 0) {
    log.info('No domains need processing');
    return { processed: 0, failed: 0, total: 0 };
  }

  log.info(`Processing ${domains.length} domains`);

  let processed = 0;
  let failed = 0;

  // Loop through each domain and process
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];

    log.info(
      `Processing domain ${i + 1}/${domains.length}: ${domain.normalizedDomainName}`,
      {
        tokenId: domain.tokenId,
      },
    );

    const result = await processSingleDomainForNamefiGpt(
      domain.tokenId,
      domain.normalizedDomainName,
    );

    if (result.success) {
      processed++;
      log.info(`✅ Processed domain ${i + 1}/${domains.length}`);
    } else {
      failed++;
      log.error(`❌ Failed domain ${i + 1}/${domains.length}: ${result.error}`);
    }
  }

  const finalResult: AiProcessingResult = {
    processed,
    failed,
    total: domains.length,
  };

  log.info('AI processing workflow completed', {
    processed: finalResult.processed,
    failed: finalResult.failed,
    total: finalResult.total,
  });
  return finalResult;
}
