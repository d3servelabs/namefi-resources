import { log } from '@temporalio/workflow';
import {
  namefiGptProcessingWorkflow,
  type AiProcessingResult,
} from './namefi-gpt-domain-processing.workflow';
import {
  refreshNftMarketplacesWorkflow,
  type MarketplaceUpdateResult,
} from './refresh-nft-marketplaces.workflow';
import { typedProxyActivities } from '../shared/workflow-helpers';
import { TEMPORAL_ENUMS } from '../shared';
import { shortRunningOpts } from '../shared/commonRunningOptions';

export interface GenerateAndUpdateDataResult {
  aiProcessing: AiProcessingResult;
  marketplaceUpdate: MarketplaceUpdateResult;
  totalDuration: string;
}

/**
 * Combined workflow that generates and updates comprehensive domain data
 *
 * This workflow chains together three important operations:
 * 1. Add categories to domains that don't have them
 * 2. Process domains with AI analysis
 * 3. Update marketplace data for dirty domains
 */
export async function generateAndUpdateDataForDomainsWorkflow({
  aiLimit,
  marketplaceLimit,
  regenerateAllAi = false,
}: {
  aiLimit?: number;
  marketplaceLimit?: number;
  regenerateAllAi?: boolean;
} = {}): Promise<GenerateAndUpdateDataResult> {
  const { addCategoriesToDomainsWithNoCategories } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
    },
  });
  const startTime = Date.now();

  log.info('Starting generate and update data for domains workflow', {
    aiLimit,
    marketplaceLimit,
    regenerateAllAi,
  });

  // Step 1: Add categories to domains with no categories
  log.info('Step 1/3: Adding categories to domains with no categories');
  await addCategoriesToDomainsWithNoCategories();

  // Step 2: Run AI processing workflow
  log.info('Step 2/3: Running AI processing workflow');
  const aiProcessingResult = await namefiGptProcessingWorkflow({
    limit: aiLimit,
    regenerateAll: regenerateAllAi,
  });

  log.info('AI processing step completed', {
    processed: aiProcessingResult.processed,
    failed: aiProcessingResult.failed,
    total: aiProcessingResult.total,
  });

  // Step 3: Run marketplace update workflow
  log.info('Step 3/3: Running marketplace update workflow');
  const marketplaceUpdateResult = await refreshNftMarketplacesWorkflow({
    limit: marketplaceLimit,
  });

  log.info('Marketplace update step completed', {
    processed: marketplaceUpdateResult.processed,
    failed: marketplaceUpdateResult.failed,
    total: marketplaceUpdateResult.total,
  });

  const endTime = Date.now();
  const totalDuration = `${(endTime - startTime) / 1000}s`;

  const finalResult: GenerateAndUpdateDataResult = {
    aiProcessing: aiProcessingResult,
    marketplaceUpdate: marketplaceUpdateResult,
    totalDuration,
  };

  log.info('Generate and update data for domains workflow completed', {
    ...finalResult,
    totalProcessed:
      aiProcessingResult.processed + marketplaceUpdateResult.processed,
    totalFailed: aiProcessingResult.failed + marketplaceUpdateResult.failed,
  });

  return finalResult;
}
