/**
 * This file contains the activities for the domain index for basic info like expiration time.
 * It is used to update the domain index by fetching all domains from registrars
 * and inserting them into the database.
 * It also contains the activities for cleaning up stale entries from the indexed domains table.
 * It also contains the activities for updating specific domain index rows by domain names and registrar keys.
 */

import { and, eq, lt, sql } from 'drizzle-orm';
import { db as database } from '@namefi-astra/db';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import { sldRegistrar } from '../../../lib/namefi-registry';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'domain-index-activities' });

/**
 * Activity to update the domain index by fetching all domains from registrars
 */
export async function updateDomainIndex(): Promise<{
  totalDomains: number;
  updatedDomains: number;
  registrarsProcessed: string[];
  executionTimeMs: number;
}> {
  const startTime = Date.now();

  logger.info('Starting domain index update');

  try {
    // Fetch all domains from all registrars
    const domainsWithRegistrar = await sldRegistrar.listAllDomains();

    logger.info('Fetched domains from registrars', {
      totalDomains: domainsWithRegistrar.length,
      registrars: [...new Set(domainsWithRegistrar.map((d) => d.registrarKey))],
    });

    if (domainsWithRegistrar.length === 0) {
      logger.warn('No domains found from any registrar');
      return {
        totalDomains: 0,
        updatedDomains: 0,
        registrarsProcessed: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Prepare batch insert/update data
    const now = new Date();
    const domainRecords = domainsWithRegistrar.map((domain) => ({
      normalizedDomainName: domain.domainName,
      registrarKey: domain.registrarKey as Registrars,
      expirationTime: domain.expirationTime,
      lastIndexedAt: now,
    }));

    // Use upsert to handle both inserts and updates
    let updatedCount = 0;

    // Use PostgreSQL's ON CONFLICT to handle upserts
    const result = await database
      .insert(indexedDomainsTable)
      .values(domainRecords)
      .onConflictDoUpdate({
        target: [
          indexedDomainsTable.registrarKey,
          indexedDomainsTable.normalizedDomainName,
        ],
        set: {
          expirationTime: sql.raw('EXCLUDED.expiration_time'),
          lastIndexedAt: sql.raw('EXCLUDED.last_indexed_at'),
        },
      });

    updatedCount = result.rowCount ?? 0;

    const registrarsProcessed = [
      ...new Set(domainsWithRegistrar.map((d) => d.registrarKey)),
    ];
    const executionTimeMs = Date.now() - startTime;

    logger.info('Domain index update completed successfully', {
      totalDomains: domainsWithRegistrar.length,
      updatedDomains: updatedCount,
      registrarsProcessed,
      executionTimeMs,
    });

    return {
      totalDomains: domainsWithRegistrar.length,
      updatedDomains: updatedCount,
      registrarsProcessed,
      executionTimeMs,
    };
  } catch (error) {
    logger.error('Failed to update domain index', { error });
    throw error;
  }
}

/**
 * Activity to clean up stale entries from the indexed domains table
 */
export async function cleanupStaleIndexedDomains(
  olderThanHours: number,
): Promise<{
  deletedCount: number;
}> {
  const startTime = Date.now();

  logger.info('Starting cleanup of stale indexed domains', {
    olderThanHours,
  });

  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await database
      .delete(indexedDomainsTable)
      .where(lt(indexedDomainsTable.lastIndexedAt, cutoffDate));

    const deletedCount = result.rowCount ?? 0;

    logger.info('Stale domain cleanup completed', {
      deletedCount,
      cutoffDate,
      executionTimeMs: Date.now() - startTime,
    });

    return {
      deletedCount,
    };
  } catch (error) {
    logger.error('Failed to cleanup stale indexed domains', { error });
    throw error;
  }
}

export type UpdateDomainIndexRowsInput = {
  domainName: NamefiNormalizedDomain;
  expirationTime: Date;
};
export type UpdateDomainIndexRowsFailedDomain = {
  domainName: string;
  error: string;
};
export type UpdateDomainIndexRowsOutput = {
  totalDomains: number;
  updatedDomains: number;
  failedDomains: UpdateDomainIndexRowsFailedDomain[];
  executionTimeMs: number;
};

/**
 * Activity to update specific domain index rows by domain names and registrar keys
 * This is useful for updating the index after operations like domain registration extensions
 * Note: This simply updates the lastIndexedAt timestamp for existing domains without fetching fresh data
 */
export async function updateDomainIndexRows(
  domainUpdates: UpdateDomainIndexRowsInput[],
): Promise<UpdateDomainIndexRowsOutput> {
  const startTime = Date.now();

  logger.info(
    {
      domainsToUpdate: domainUpdates.length,
      updates: domainUpdates,
    },
    'Starting selective domain index update',
  );

  try {
    if (domainUpdates.length === 0) {
      logger.warn('No domain updates provided');
      return {
        totalDomains: 0,
        updatedDomains: 0,
        failedDomains: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    let updatedCount = 0;
    const failedDomains: UpdateDomainIndexRowsFailedDomain[] = [];

    const now = new Date();
    await database.transaction(async (tx) => {
      for (const update of domainUpdates) {
        try {
          // Update the lastIndexedAt timestamp for existing domain records
          const result = await tx
            .update(indexedDomainsTable)
            .set({
              expirationTime: update.expirationTime,
              lastIndexedAt: now,
            })
            .where(
              and(
                eq(indexedDomainsTable.normalizedDomainName, update.domainName),
              ),
            );

          if (result.rowCount && result.rowCount > 0) {
            updatedCount++;
            logger.debug(
              {
                domainName: update.domainName,
              },
              'Updated domain index row',
            );
          } else {
            failedDomains.push({
              domainName: update.domainName,
              error: 'Domain not found in index',
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          failedDomains.push({
            domainName: update.domainName,
            error: errorMessage,
          });

          logger.warn(
            {
              domainName: update.domainName,
              error: errorMessage,
            },
            'Failed to update domain index row',
          );
        }
      }
    });

    return {
      totalDomains: domainUpdates.length,
      updatedDomains: updatedCount,
      failedDomains,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    logger.error(
      {
        error,
        domainUpdates,
      },
      'Failed to update domain index rows',
    );
    throw error;
  }
}
