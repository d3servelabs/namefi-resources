import { log } from '@temporalio/workflow';
import { typedProxyActivities } from '../shared/workflow-helpers';
import { TEMPORAL_ENUMS } from '../shared';

const { getDirtyDomains, updateMarketplaceForDomain } = typedProxyActivities({
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

export interface MarketplaceUpdateResult {
  processed: number;
  failed: number;
  total: number;
}

/**
 * Marketplace update workflow - processes dirty domains
 */
export async function refreshNftMarketplacesWorkflow({
  limit,
}: {
  limit?: number;
} = {}): Promise<MarketplaceUpdateResult> {
  log.info('Starting marketplace update workflow', { limit });

  // Get domains that are dirty (need marketplace updates)
  const dirtyDomains = await getDirtyDomains(limit);

  if (dirtyDomains.length === 0) {
    log.info('No dirty domains need marketplace updates');
    return { processed: 0, failed: 0, total: 0 };
  }

  log.info(
    `Processing ${dirtyDomains.length} dirty domains for marketplace updates`,
  );

  let marketplaceUpdated = 0;
  let marketplaceFailed = 0;

  // Loop through each dirty domain and update marketplaces
  for (let i = 0; i < dirtyDomains.length; i++) {
    const domain = dirtyDomains[i];

    log.info(
      `Updating marketplace ${i + 1}/${dirtyDomains.length}: ${domain.normalizedDomainName}`,
      {
        tokenId: domain.tokenId,
      },
    );

    const result = await updateMarketplaceForDomain(
      domain.tokenId,
      domain.chainId,
    );

    if (result.success) {
      marketplaceUpdated++;
      log.info(`✅ Updated marketplace ${i + 1}/${dirtyDomains.length}`);
    } else {
      marketplaceFailed++;
      log.error(
        `❌ Failed marketplace update ${i + 1}/${dirtyDomains.length}: ${result.error}`,
      );
    }
  }

  const finalResult: MarketplaceUpdateResult = {
    processed: marketplaceUpdated,
    failed: marketplaceFailed,
    total: dirtyDomains.length,
  };

  log.info('Marketplace update workflow completed', {
    marketplaceUpdated,
    marketplaceFailed,
    total: finalResult.total,
  });
  return finalResult;
}
