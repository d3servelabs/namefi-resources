import type { ResourceRecordSet } from '@aws-sdk/client-route-53';
import {
  type DnsRecordInsert,
  db,
  dnsRecordsTable,
  domainConfigTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { recordTypeEnum } from '@namefi-astra/zod-dns';
import * as workflow from '@temporalio/workflow';
import { eq } from 'drizzle-orm';
import { getZoneRecords, getZonesByName } from '#lib/route53-dns/route53';
import { PARKED_DOMAIN_RECORDS } from '#services/dns/parking';

export const getRoute53ZoneRecords = async (zoneId: string) => {
  let marker: string | undefined;
  const output: ResourceRecordSet[] = [];
  do {
    const records = await getZoneRecords({
      HostedZoneId: zoneId,
      StartRecordIdentifier: marker,
    });
    marker = records.IsTruncated ? records.NextRecordIdentifier : undefined;
    output.push(
      ...(records.ResourceRecordSets ?? []).map((r) => ({
        ...r,
        name: r.Name,
        ttl: r.TTL,
        resourceRecords: r.ResourceRecords,
        type: r.Type,
      })),
    );
  } while (marker);

  return output;
};

export const getRoute53ZonesByName = async (zoneName: string) => {
  return await getZonesByName({
    zoneName,
  });
};

export const determineZoneFlagsFromRecords = async (
  zoneName: NamefiNormalizedDomain,
  domainOwnerAddress: string,
  records: DnsRecordInsert[],
) => {
  const apexRecords = records.filter((r) => r.name === '@');

  const hasApexRecords = apexRecords.length > 0;
  if (!hasApexRecords) {
    return {
      autoPark: false,
      autoEns: false,
      forwarding: false,
      forwardTo: undefined,
    };
  }

  const hasIpv4ParkingRecords = apexRecords.some(
    (r) =>
      r.type === 'A' &&
      r.rdata === PARKED_DOMAIN_RECORDS.find((r) => r.type === 'A')?.rdata,
  );
  const hasIpv6ParkingRecords = apexRecords.some(
    (r) =>
      r.type === 'AAAA' &&
      r.rdata === PARKED_DOMAIN_RECORDS.find((r) => r.type === 'AAAA')?.rdata,
  );

  const ensRecords = apexRecords.find(
    (r) => r.type === 'TXT' && /^"?ENS1 dnsname.ens.eth .*/.test(r.rdata),
  );

  const ensOwnerAddress = ensRecords
    ? /^"?ENS1 dnsname.ens.eth (?<ownerAddress>.*)"?$/.exec(ensRecords.rdata)
        ?.groups?.ownerAddress
    : undefined;
  const hasAutoEnsRecords =
    !!ensOwnerAddress &&
    ensOwnerAddress.toLowerCase() === domainOwnerAddress.toLowerCase();

  const forwardingRecord = apexRecords.find(
    (r) => r.type === 'TXT' && /^"?--nfi-redirect=.*/.test(r.rdata),
  );
  const forwardTo = forwardingRecord
    ? /"--nfi-redirect=(?<forwardTo>.*)"/.exec(forwardingRecord.rdata)?.groups
        ?.forwardTo
    : undefined;

  const flags = {
    autoPark: hasIpv4ParkingRecords && hasIpv6ParkingRecords,
    autoEns: hasAutoEnsRecords,
    forwarding: !!forwardingRecord,
    forwardTo,
  };
  return flags;
};

export const determineDnssecStatus = async (
  zoneName: NamefiNormalizedDomain,
) => {
  return true; // TODO: implement this
};

export const determineFinalRecords = async (
  zoneName: NamefiNormalizedDomain,
  flags: Awaited<ReturnType<typeof determineZoneFlagsFromRecords>>,
  records: DnsRecordInsert[],
) => {
  // check if any records are unsupported
  const hasUnsupportedRecords = records.some(
    (r) => !recordTypeEnum.safeParse(r.type).success,
  );
  if (hasUnsupportedRecords) {
    throw new workflow.ApplicationFailure(
      `Unsupported records found in zone ${zoneName}`,
    );
  }
  const finalRecords = records.filter((r) => {
    const isApexRecord = r.name === '@';
    if (isApexRecord && r.type === 'TXT') {
      if (
        flags.forwarding &&
        flags.forwardTo &&
        /^"?--nfi-redirect=.*/.test(r.rdata)
      ) {
        return false;
      }
      if (flags.autoEns && /^"?ENS1 dnsname.ens.eth .*/.test(r.rdata)) {
        return false;
      }

      return true;
    }
    if (
      isApexRecord &&
      flags.autoPark &&
      (r.type === 'A' || r.type === 'AAAA')
    ) {
      return false;
    }
    return true;
  });

  return finalRecords;
};

export const transformRoute53RecordsToAstraRecords = async (
  zoneName: NamefiNormalizedDomain,
  records: ResourceRecordSet[],
): Promise<DnsRecordInsert[]> => {
  return records.flatMap((r) => {
    let recordName = r.Name?.replace(
      new RegExp(`\.?${zoneName.replace('.', '\\.')}$`),
      '',
    );
    if (recordName === '') {
      recordName = '@';
    }

    return (r.ResourceRecords ?? []).flatMap((rr) => {
      if (!rr.Value) {
        return [];
      }
      const record: DnsRecordInsert = {
        zoneName: zoneName,
        name: recordName,
        ttl: r.TTL,
        rdata: rr.Value,
        type: r.Type as DnsRecordInsert['type'],
        class: 'IN',
      };
      return [record];
    });
  });
};

export const fillZoneRecords = async (
  zoneName: NamefiNormalizedDomain,
  records: DnsRecordInsert[],
) => {
  await db.insert(dnsRecordsTable).values(records);
};

export const fillZoneFlags = async (
  zoneName: NamefiNormalizedDomain,
  flags: Awaited<ReturnType<typeof determineZoneFlagsFromRecords>>,
) => {
  await db
    .update(domainConfigTable)
    .set({
      autoEnsEnabled: flags.autoEns,
      autoParkEnabled: flags.autoPark,
      forwardTo: flags.forwardTo,
    })
    .where(eq(domainConfigTable.normalizedDomainName, zoneName));
};
