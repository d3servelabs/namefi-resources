import { sldRegistrar } from '#lib/namefi-registry';
import { db } from '@namefi-astra/db';
import {
  indexedDomainsTable,
  namefiNftView,
  namefiNftCte,
} from '@namefi-astra/db';
import { eq, sql } from 'drizzle-orm';
import { logger } from '#lib/logger';
import { indexBy, prop } from 'ramda';
import type { WithRegistrar } from '@namefi-astra/registrars/registrars/main-registrar';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Script to synchronize expired domains from registrars with NFT expiration dates
 *
 * This script:
 * 1. Gets the list of expired domains from all registrars
 * 2. Finds corresponding NFT expiration dates
 * 3. Updates the indexed domains table with NFT expiration dates where missing
 */

async function syncExpiredDomainsWithNftDates(
  options: { dryRun?: boolean } = {},
) {
  const { dryRun = false } = options;
  try {
    logger.debug('Starting sync of expired domains with NFT expiration dates');

    // Step 1: Get expired domains from registrars
    logger.debug('Getting expired domains from registrars...');
    const expiredDomains = await sldRegistrar.listExpiredDomains();
    logger.debug(
      { count: expiredDomains.length },
      'Found expired domains from registrars',
    );

    if (expiredDomains.length === 0) {
      logger.debug('No expired domains found, exiting');
      return {
        success: true,
        message: 'No expired domains found from registrars',
        processedDomains: 0,
        updatedDomains: 0,
      };
    }

    const expiredDomainsByName: Record<
      NamefiNormalizedDomain,
      WithRegistrar<{ domainName: PunycodeDomainName }>
    > = indexBy(prop('domainName'), expiredDomains);
    // Step 2: Get current indexed domains data and NFT expiration dates
    logger.debug('Querying indexed domains and NFT data...');
    const expiredDomainNames = expiredDomains.map((d) => d.domainName);

    // Process in batches to avoid overwhelming the database
    const allDomainsWithNftData = [];
    const batchSize = 100;

    for (let i = 0; i < expiredDomainNames.length; i += batchSize) {
      const batch = expiredDomainNames.slice(i, i + batchSize);

      const batchResults = await db
        .with(namefiNftCte)
        .select({
          normalizedDomainName: namefiNftView.normalizedDomainName,
          currentExpirationTime: indexedDomainsTable.expirationTime,
          nftExpirationTime: namefiNftView.expirationTime,
          chainId: namefiNftView.chainId,
        })
        .from(namefiNftView)
        .leftJoin(
          indexedDomainsTable,
          eq(
            namefiNftView.normalizedDomainName,
            indexedDomainsTable.normalizedDomainName,
          ),
        )
        .where(
          sql`${namefiNftView.normalizedDomainName} = ANY(${sql.raw(`ARRAY[${batch.map((d) => `'${d}'`).join(',')}]`)})`,
        );

      allDomainsWithNftData.push(...batchResults);

      logger.debug(
        {
          processed: Math.min(i + batchSize, expiredDomainNames.length),
          total: expiredDomainNames.length,
        },
        'Processing expired domains batch',
      );
    }

    logger.debug(
      { count: allDomainsWithNftData.length },
      'Found indexed domains with NFT data',
    );

    // Step 3: Identify domains that need expiration date updates
    const domainsToUpdate = [];
    const domainStats = {
      processedDomains: allDomainsWithNftData.length,
      domainsWithMissingExpirationData: 0,
      domainsWithNftExpirationData: 0,
      domainsToUpdate: 0,
    };

    for (const domain of allDomainsWithNftData) {
      // Count stats
      if (!domain.currentExpirationTime) {
        domainStats.domainsWithMissingExpirationData++;
      }
      if (domain.nftExpirationTime) {
        domainStats.domainsWithNftExpirationData++;
      }

      // Check if we should update this domain's expiration date
      const shouldUpdate =
        // Domain has no expiration date in indexed domains table
        !domain.currentExpirationTime &&
        // But has NFT expiration data
        domain.nftExpirationTime;

      if (shouldUpdate) {
        domainsToUpdate.push({
          normalizedDomainName: domain.normalizedDomainName,
          nftExpirationTime: domain.nftExpirationTime,
          registrarKey:
            expiredDomainsByName[domain.normalizedDomainName]?.registrarKey,
          chainId: domain.chainId,
        });
        domainStats.domainsToUpdate++;
      }
    }

    logger.debug(domainStats, 'Domain analysis completed');

    if (domainsToUpdate.length === 0) {
      logger.debug('No domains need expiration date updates');
      return {
        success: true,
        message: 'No domains need expiration date updates',
        processedDomains: domainStats.processedDomains,
        updatedDomains: 0,
        stats: domainStats,
        dryRun,
      };
    }

    if (dryRun) {
      logger.debug(
        { count: domainsToUpdate.length },
        'DRY RUN: Would upsert these domains with NFT expiration dates',
      );

      console.log('\n=== DRY RUN: Domains that would be upserted ===');
      domainsToUpdate.slice(0, 10).forEach((domain) => {
        console.log(
          `- ${domain.normalizedDomainName} (Chain: ${domain.chainId})`,
        );
        console.log(
          `  Would set expiration: ${domain.nftExpirationTime?.toISOString().split('T')[0]}`,
        );
        console.log(`  Registrar: ${domain.registrarKey || 'unknown'}`);
      });

      if (domainsToUpdate.length > 10) {
        console.log(`... and ${domainsToUpdate.length - 10} more domains`);
      }

      return {
        success: true,
        message: `DRY RUN: Would upsert ${domainsToUpdate.length} domains with NFT expiration dates`,
        processedDomains: domainStats.processedDomains,
        updatedDomains: 0,
        domainsToUpdate: domainsToUpdate.map((d) => ({
          normalizedDomainName: d.normalizedDomainName,
          nftExpirationTime: d.nftExpirationTime,
          registrarKey: d.registrarKey,
          chainId: d.chainId,
        })),
        stats: domainStats,
        dryRun: true,
      };
    }

    // Step 4: Update indexed domains table with NFT expiration dates
    logger.debug(
      { count: domainsToUpdate.length },
      'Updating indexed domains with NFT expiration dates',
    );

    let updatedCount = 0;
    const updateErrors = [];

    for (const domain of domainsToUpdate) {
      try {
        await db
          .insert(indexedDomainsTable)
          .values({
            normalizedDomainName: domain.normalizedDomainName,
            expirationTime: domain.nftExpirationTime!,
            registrarKey: domain.registrarKey || 'unknown',
          })
          .onConflictDoUpdate({
            target: [
              indexedDomainsTable.normalizedDomainName,
              indexedDomainsTable.registrarKey,
            ],
            set: {
              expirationTime: domain.nftExpirationTime!,
              updatedAt: new Date(),
              // Only update registrarKey if we have a value and the existing one is null/unknown
              registrarKey: sql`CASE 
                WHEN ${indexedDomainsTable.registrarKey} IS NULL OR ${indexedDomainsTable.registrarKey} = 'unknown' 
                THEN ${domain.registrarKey || 'unknown'}
                ELSE ${indexedDomainsTable.registrarKey}
              END`,
            },
          });

        updatedCount++;

        if (updatedCount % 10 === 0) {
          logger.debug(
            { updated: updatedCount, total: domainsToUpdate.length },
            'Upsert progress',
          );
        }
      } catch (error) {
        logger.error(
          {
            domain: domain.normalizedDomainName,
            error,
          },
          'Failed to upsert domain expiration date',
        );

        updateErrors.push({
          domainName: domain.normalizedDomainName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const result = {
      success: true,
      message: `Successfully upserted ${updatedCount} domains with NFT expiration dates`,
      processedDomains: domainStats.processedDomains,
      updatedDomains: updatedCount,
      stats: domainStats,
      errors: updateErrors,
      dryRun: false,
    };

    logger.debug(result, 'Sync completed');
    console.log('\n=== Sync Results ===');
    console.log(`Processed: ${result.processedDomains} domains`);
    console.log(`Upserted: ${result.updatedDomains} domains`);
    console.log(
      `Domains with missing expiration data: ${domainStats.domainsWithMissingExpirationData}`,
    );
    console.log(
      `Domains with NFT expiration data: ${domainStats.domainsWithNftExpirationData}`,
    );

    if (updateErrors.length > 0) {
      console.log(`\nErrors: ${updateErrors.length}`);
      updateErrors.slice(0, 5).forEach((error) => {
        console.log(`  - ${error.domainName}: ${error.error}`);
      });
      if (updateErrors.length > 5) {
        console.log(`  ... and ${updateErrors.length - 5} more errors`);
      }
    }

    return result;
  } catch (error) {
    logger.error({ error }, 'Sync failed');
    console.error('Sync failed:', error);
    throw error;
  }
}

export { syncExpiredDomainsWithNftDates };
