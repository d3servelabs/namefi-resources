/**
 * This file contains the activities for the domain index for basic info like expiration time.
 * It is used to update the domain index by fetching all domains from registrars
 * and inserting them into the database.
 * It also contains the activities for cleaning up stale entries from the indexed domains table.
 * It also contains the activities for updating specific domain index rows by domain names and registrar keys.
 */

import { eq, lt, sql, or, isNull } from 'drizzle-orm';
import { db as database } from '@namefi-astra/db';
import { indexedDomainsTable } from '@namefi-astra/db/schema';
import type { IndexedDomainDnssecStatus } from '@namefi-astra/db/schema';
import { sldRegistrar } from '../../../lib/namefi-registry';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Registrars } from '@namefi-astra/registrars/registrars-keys';
import type { Nameserver } from '@namefi-astra/registrars/data/types/nameservers';
import { createLogger } from '#lib/logger';
import { splitEvery } from 'ramda';
import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { getDnssecStatusDetails } from '#lib/domains/dnssec';

const logger = createLogger({ module: 'domain-index-activities' });
const METADATA_BACKFILL_BATCH_SIZE = 25;

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

  logger.debug('Starting domain index update');

  try {
    // Fetch all domains from all registrars
    const domainsWithRegistrar = await sldRegistrar.listAllDomains();

    logger.debug('Fetched domains from registrars', {
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
    const indexingTimestamp = new Date();
    const domainRecords = domainsWithRegistrar.map((domain) => ({
      normalizedDomainName: domain.domainName,
      registrarKey: domain.registrarKey as Registrars,
      expirationTime: domain.expirationTime,
      lastIndexedAt: indexingTimestamp,
      isMissingFromRegistrar: false,
      missingFromRegistrarSince: null,
    }));

    // Use PostgreSQL's ON CONFLICT to handle upserts
    const updatedCount = await database.transaction(async (tx) => {
      // Mark all existing domains as missing from registrar which will be overridden by the upserts
      await tx
        .update(indexedDomainsTable)
        .set({
          isMissingFromRegistrar: true,
          missingFromRegistrarSince: sql`COALESCE(${indexedDomainsTable.missingFromRegistrarSince}, ${indexingTimestamp})`,
        })
        .where(eq(indexedDomainsTable.isMissingFromRegistrar, false));
      const batches = splitEvery(500, domainRecords);
      let updatedCount = 0;
      for (const batch of batches) {
        const result = await tx
          .insert(indexedDomainsTable)
          .values(batch)
          .onConflictDoUpdate({
            target: [
              indexedDomainsTable.registrarKey,
              indexedDomainsTable.normalizedDomainName,
            ],
            set: {
              expirationTime: sql.raw('EXCLUDED.expiration_time'),
              lastIndexedAt: sql.raw('EXCLUDED.last_indexed_at'),
              isMissingFromRegistrar: false,
              missingFromRegistrarSince: null,
            },
          });
        updatedCount += result.rowCount ?? 0;
      }
      return updatedCount;
    });

    const registrarsProcessed = [
      ...new Set(domainsWithRegistrar.map((d) => d.registrarKey)),
    ];
    const executionTimeMs = Date.now() - startTime;

    logger.debug('Domain index update completed successfully', {
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

  logger.debug('Starting cleanup of stale indexed domains', {
    olderThanHours,
  });

  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await database
      .delete(indexedDomainsTable)
      .where(lt(indexedDomainsTable.lastIndexedAt, cutoffDate));

    const deletedCount = result.rowCount ?? 0;

    logger.debug('Stale domain cleanup completed', {
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
  expirationTime?: Date;
  nameservers?: Nameserver[];
  nameserversLastUpdatedAt?: Date;
  isUsingNamefiNameservers?: boolean;
  dnssecStatus?: IndexedDomainDnssecStatus | null;
  dnssecLastUpdatedAt?: Date | null;
  isMissingFromRegistrar?: boolean;
  missingFromRegistrarSince?: Date | null;
  lastIndexedAt?: Date;
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

  logger.debug(
    {
      domainsToUpdate: domainUpdates.length,
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
          const updatePayload: Partial<
            typeof indexedDomainsTable.$inferInsert
          > = {};

          if (update.expirationTime) {
            updatePayload.expirationTime = update.expirationTime;
          }

          if (update.nameservers !== undefined) {
            updatePayload.nameservers = update.nameservers;
            updatePayload.nameserversLastUpdatedAt =
              update.nameserversLastUpdatedAt ?? now;
          } else if (update.nameserversLastUpdatedAt) {
            updatePayload.nameserversLastUpdatedAt =
              update.nameserversLastUpdatedAt;
          }

          if (typeof update.isUsingNamefiNameservers === 'boolean') {
            updatePayload.isUsingNamefiNameservers =
              update.isUsingNamefiNameservers;
          }

          if (update.dnssecStatus !== undefined) {
            updatePayload.dnssecStatus = update.dnssecStatus;
            updatePayload.dnssecLastUpdatedAt =
              update.dnssecLastUpdatedAt ?? now;
          } else if (update.dnssecLastUpdatedAt) {
            updatePayload.dnssecLastUpdatedAt = update.dnssecLastUpdatedAt;
          }

          if (typeof update.isMissingFromRegistrar === 'boolean') {
            updatePayload.isMissingFromRegistrar =
              update.isMissingFromRegistrar;
            updatePayload.missingFromRegistrarSince =
              update.isMissingFromRegistrar
                ? (update.missingFromRegistrarSince ?? now)
                : null;
          } else if (update.missingFromRegistrarSince) {
            updatePayload.missingFromRegistrarSince =
              update.missingFromRegistrarSince;
          }

          if (
            Object.keys(updatePayload).length === 0 &&
            !update.lastIndexedAt
          ) {
            logger.warn(
              {
                domainName: update.domainName,
              },
              'No fields provided for domain index update',
            );
            continue;
          }

          updatePayload.lastIndexedAt = update.lastIndexedAt ?? now;

          // Update the lastIndexedAt timestamp and any provided metadata
          const result = await tx
            .update(indexedDomainsTable)
            .set(updatePayload)
            .where(
              eq(indexedDomainsTable.normalizedDomainName, update.domainName),
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

type MetadataBackfillResult = {
  nameserversUpdated: number;
  dnssecUpdated: number;
  nameserversRemaining: number;
  dnssecRemaining: number;
  stillRemaining: boolean;
};

export async function backfillMissingNameserversAndDnssecInIndex(): Promise<MetadataBackfillResult> {
  const updatesMap = new Map<
    NamefiNormalizedDomain,
    UpdateDomainIndexRowsInput
  >();
  let nameserversUpdated = 0;
  let dnssecUpdated = 0;

  const targets = await database
    .select({
      normalizedDomainName: indexedDomainsTable.normalizedDomainName,
      nameserversLastUpdatedAt: indexedDomainsTable.nameserversLastUpdatedAt,
      nameserversCount: sql<number>`COALESCE(jsonb_array_length(${indexedDomainsTable.nameservers}), 0)`,
      dnssecStatus: indexedDomainsTable.dnssecStatus,
      dnssecLastUpdatedAt: indexedDomainsTable.dnssecLastUpdatedAt,
    })
    .from(indexedDomainsTable)
    .where(
      or(
        or(
          isNull(indexedDomainsTable.nameserversLastUpdatedAt),
          sql`jsonb_array_length(${indexedDomainsTable.nameservers}) = 0`,
        ),
        or(
          isNull(indexedDomainsTable.dnssecStatus),
          isNull(indexedDomainsTable.dnssecLastUpdatedAt),
        ),
      ),
    )
    .limit(METADATA_BACKFILL_BATCH_SIZE);

  for (const target of targets) {
    const normalizedDomainName = target.normalizedDomainName;
    const needsNameservers =
      !target.nameserversLastUpdatedAt || (target.nameserversCount ?? 0) === 0;
    const needsDnssec = !target.dnssecStatus || !target.dnssecLastUpdatedAt;

    if (!needsNameservers && !needsDnssec) {
      continue;
    }

    try {
      const dnssecDetails = await getDnssecStatusDetails(
        toPunycodeDomainName(normalizedDomainName),
      );

      const existingUpdate = updatesMap.get(normalizedDomainName) ?? {
        domainName: normalizedDomainName,
      };

      const now = new Date();
      const update: UpdateDomainIndexRowsInput = { ...existingUpdate };

      if (needsNameservers) {
        update.nameservers = dnssecDetails.nameservers as Nameserver[];
        update.nameserversLastUpdatedAt = now;
        update.isUsingNamefiNameservers =
          dnssecDetails.isUsingNamefiNameservers;
        nameserversUpdated++;
      }

      if (needsDnssec) {
        update.dnssecStatus = {
          supportsDnssec: dnssecDetails.supportsDnssec,
          hasDelegationSigner: dnssecDetails.hasDelegationSigner,
          isUsingNamefiDelegationSigner:
            dnssecDetails.isUsingNamefiDelegationSigner ?? false,
          zoneHasActiveDnssec: dnssecDetails.zoneHasActiveDnssec,
        };
        update.dnssecLastUpdatedAt = now;
        dnssecUpdated++;
      }

      updatesMap.set(normalizedDomainName, update);
    } catch (error) {
      logger.warn(
        { domainName: normalizedDomainName, error },
        'Failed to backfill domain metadata',
      );
    }
  }

  const updates = Array.from(updatesMap.values());
  if (updates.length > 0) {
    await updateDomainIndexRows(updates);
  }

  const { nameserversRemaining, dnssecRemaining } =
    await getMetadataBackfillCounts();

  logger.debug('Completed domain index metadata backfill', {
    nameserversUpdated,
    dnssecUpdated,
    nameserversRemaining,
    dnssecRemaining,
  });

  return {
    nameserversUpdated,
    dnssecUpdated,
    nameserversRemaining,
    dnssecRemaining,
    stillRemaining: nameserversRemaining > 0 || dnssecRemaining > 0,
  };
}

async function getMetadataBackfillCounts(): Promise<{
  nameserversRemaining: number;
  dnssecRemaining: number;
}> {
  const [result] = await database
    .select({
      nameserversRemaining: sql<number>`
        SUM(
          CASE
            WHEN ${indexedDomainsTable.nameserversLastUpdatedAt} IS NULL
              OR jsonb_array_length(${indexedDomainsTable.nameservers}) = 0
            THEN 1 ELSE 0
          END
        )
      `,
      dnssecRemaining: sql<number>`
        SUM(
          CASE
            WHEN ${indexedDomainsTable.dnssecStatus} IS NULL
              OR ${indexedDomainsTable.dnssecLastUpdatedAt} IS NULL
            THEN 1 ELSE 0
          END
        )
      `,
    })
    .from(indexedDomainsTable);

  return {
    nameserversRemaining: Number(result.nameserversRemaining ?? 0),
    dnssecRemaining: Number(result.dnssecRemaining ?? 0),
  };
}
