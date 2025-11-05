import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import * as workflow from '@temporalio/workflow';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers';
import { resetNameserversWorkflow } from '../reset-nameservers.workflow';
import { isAfter } from 'date-fns';
import { groupBy, pluck, splitEvery } from 'ramda';
import pMap from 'p-map';

export const migrateZoneToNewNameserversWorkflow = async (args: {
  zoneName: PunycodeDomainName;
}) => {
  const {
    getRoute53ZoneRecords,
    getRoute53ZonesByName,
    determineZoneFlagsFromRecords,
    transformRoute53RecordsToAstraRecords,
    determineFinalRecords,
    fillZoneRecords,
    fillZoneFlags,
    checkIfUsingLegacyNamefiNameservers,
    checkIfUsingNamefiNameservers,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  // check if the zone is using Namefi nameservers
  const isUsingNamefiNameservers = await checkIfUsingNamefiNameservers(
    args.zoneName,
  );
  if (isUsingNamefiNameservers) {
    workflow.log.info(
      `Zone ${args.zoneName} is already using Namefi nameservers, skipping migration`,
    );
    return;
  }

  const { getNftFromIndexer } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      ...shortRunningOpts,
    },
  });

  const zones = await getRoute53ZonesByName(args.zoneName);
  if (!zones || zones.length === 0) {
    throw new workflow.ApplicationFailure(`Zone ${args.zoneName} not found`);
  }

  if (zones.length > 1) {
    throw new workflow.ApplicationFailure(
      `Multiple zones found for ${args.zoneName}`,
    );
  }

  const zone = zones[0];
  const zoneId = zone.Id;
  if (!zoneId) {
    throw new workflow.ApplicationFailure(`Zone ${args.zoneName} has no ID`);
  }

  const nft = await getNftFromIndexer(args.zoneName);
  if (!nft || !nft.ownerAddress) {
    throw new workflow.ApplicationFailure(`NFT for ${args.zoneName} not found`);
  }
  const ownerAddress = nft.ownerAddress;

  // get the old records
  const oldRecords = await getRoute53ZoneRecords(zoneId);

  // transform the old records to the new record shape and flatten them
  const newRecords = await transformRoute53RecordsToAstraRecords(
    args.zoneName,
    oldRecords,
  );

  // determine flags (AutoPark, AutoENS, DNSSEC, Forwarding, etc) from the new records
  const flags = await determineZoneFlagsFromRecords(
    args.zoneName,
    ownerAddress,
    newRecords,
  );

  //determine new records
  const finalRecords = await determineFinalRecords(
    args.zoneName,
    flags,
    newRecords,
  );

  if (finalRecords.length > 0) {
    // MARK: Fill Records
    // fill in the new records to the new zone
    await fillZoneRecords(args.zoneName, finalRecords);
  }
  // fill in the flags to the new zone
  await fillZoneFlags(args.zoneName, flags);

  // check if the zone is using Legacy Namefi nameservers
  const isUsingLegacyNamefiNameservers =
    await checkIfUsingLegacyNamefiNameservers(args.zoneName);
  if (isUsingLegacyNamefiNameservers) {
    // reset the nameservers to the new zone (and enable DNSSEC if needed)
    await workflow.executeChild(resetNameserversWorkflow, {
      args: [
        {
          domainName: args.zoneName,
        },
      ],
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: `reset-nameservers-${args.zoneName}`,
      parentClosePolicy: 'ABANDON',
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    });
  }
};

export async function migrateAllZonesToNewNameserversWorkflow() {
  const { listAllDomains } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });
  const domains = await listAllDomains();
  workflow.log.info(`Found ${domains.length} domains`);

  /**
   * We want to migrate domains before they enter the Auto Renew Period or Grace Period
   * because these are the domains that allow nameservers changes
   */
  const { domainsToMigrate, domainsToNotMigrate } = groupBy((domain) => {
    if (domain.expirationTime && isAfter(domain.expirationTime, new Date())) {
      return 'domainsToMigrate';
    }
    return 'domainsToNotMigrate';
  }, domains);

  const report = {
    domainsToMigrate: pluck('domainName', domainsToMigrate ?? []),
    domainsToNotMigrate: pluck('domainName', domainsToNotMigrate ?? []),
    executionDate: new Date().toISOString(),
    successCount: 0,
    errorCount: 0,
    successDomains: [] as { normalizedDomainName: string }[],
    errorDomains: [] as { normalizedDomainName: string; error: Error }[],
    multipleZonesFound: [] as string[],
  };

  workflow.upsertMemo({
    domainsToMigrate: pluck('domainName', domainsToMigrate ?? []),
    domainsToMigrateCount: (domainsToMigrate ?? []).length,
    domainsToNotMigrateCount: (domainsToNotMigrate ?? []).length,
    domainsToNotMigrate: pluck('domainName', domainsToNotMigrate ?? []),
    executionDate: new Date().toISOString(),
  });

  const batchSize = 10;
  const batches = splitEvery(batchSize, domainsToMigrate ?? []);
  const batchResultsPromises: Promise<
    {
      success: boolean;
      normalizedDomainName: string;
      error?: Error;
      message?: string;
    }[]
  >[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    await workflow.sleep(i === 0 ? 0 : 120_000);
    const promises = pMap(
      batch,
      async (domain) => {
        try {
          workflow.log.info(
            `Migrating zone ${domain.domainName} to new nameservers`,
          );
          await workflow.executeChild(migrateZoneToNewNameserversWorkflow, {
            args: [{ zoneName: domain.domainName }],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            parentClosePolicy: 'ABANDON',
            workflowId: `migrate-zone-to-new-nameservers-${domain.domainName}`,
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          });
          return {
            success: true,
            normalizedDomainName: domain.domainName,
          };
        } catch (error) {
          return {
            success: false,
            normalizedDomainName: domain.domainName,
            message:
              (error as workflow.ApplicationFailure).failure?.cause?.message ??
              '',
            error: error as Error,
          };
        }
      },
      { concurrency: 10 },
    );
    batchResultsPromises.push(promises);
  }

  const results = (await Promise.all(batchResultsPromises)).flat();
  for (const result of results) {
    if (result.success) {
      report.successDomains.push({
        normalizedDomainName: result.normalizedDomainName,
      });
    } else {
      if (result.message && result.message.includes('Multiple zones found')) {
        report.multipleZonesFound.push(result.normalizedDomainName);
      }
      report.errorDomains.push({
        normalizedDomainName: result.normalizedDomainName,
        error: result.error as Error,
      });
    }
  }

  report.successCount = report.successDomains.length;
  report.errorCount = report.errorDomains.length;

  return report;
}
