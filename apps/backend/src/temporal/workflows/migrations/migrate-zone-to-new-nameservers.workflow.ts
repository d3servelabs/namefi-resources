import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import * as workflow from '@temporalio/workflow';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers';
import { resetNameserversWorkflow } from '../reset-nameservers.workflow';

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
    throw new Error(`Zone ${args.zoneName} not found`);
  }

  if (zones.length > 1) {
    throw new Error(`Multiple zones found for ${args.zoneName}`);
  }

  const zone = zones[0];
  const zoneId = zone.Id;
  if (!zoneId) {
    throw new Error(`Zone ${args.zoneName} has no ID`);
  }

  const nft = await getNftFromIndexer(args.zoneName);
  if (!nft || !nft.ownerAddress) {
    throw new Error(`NFT for ${args.zoneName} not found`);
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

  // fill in the new records to the new zone
  await fillZoneRecords(args.zoneName, finalRecords);

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
      workflowIdConflictPolicy: 'USE_EXISTING',
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    });
  }
};
