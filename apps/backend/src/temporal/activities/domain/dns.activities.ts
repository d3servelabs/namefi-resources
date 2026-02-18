import { type DnsRecordInsert, db, dnsRecordsTable } from '@namefi-astra/db';
import type { z } from 'zod';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { recordSchema, sanitizeDnsRecord } from '@namefi-astra/zod-dns';
import { and, eq } from 'drizzle-orm';
import { PARKED_DOMAIN_RECORDS } from '#services/dns/parking';
import { validateZone } from '#services/dns/service';

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
    ? /^"?ENS1 dnsname.ens.eth (?<ownerAddress>.*?)"?$/.exec(ensRecords.rdata)
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

type ZoneRecordInput = {
  type: DnsRecordInsert['type'];
  name: string;
  rdata: string;
  ttl?: number | null;
};

type ZoneRecordSchemaInput = z.infer<typeof recordSchema>;

type NormalizedRecord = {
  type: DnsRecordInsert['type'];
  name: string;
  rdata: string;
  ttl: number;
  class: 'IN';
};

const sanitizeAndNormalizeRecords = (
  records: ZoneRecordInput[],
): NormalizedRecord[] => {
  return records.map((record) => {
    const parsed = recordSchema.parse(
      sanitizeDnsRecord({
        ...record,
        ttl: record.ttl ?? 30,
      }),
    ) as ZoneRecordSchemaInput;
    return {
      type: parsed.type,
      name: parsed.name,
      rdata: parsed.rdata,
      ttl: parsed.ttl,
      class: 'IN',
    };
  });
};

export const addDnsRecordsForZone = async (
  zoneName: NamefiNormalizedDomain,
  records: ZoneRecordInput[],
) => {
  const sanitizedRecords = sanitizeAndNormalizeRecords(records);
  const recordsToInsert: DnsRecordInsert[] = sanitizedRecords.map((record) => ({
    ...record,
    zoneName,
  }));

  await validateZone(zoneName, {
    addedRecords: sanitizedRecords.map((record) => ({
      type: record.type,
      name: record.name,
      rdata: record.rdata,
      ttl: record.ttl,
    })) as ZoneRecordSchemaInput[],
  });

  await db.insert(dnsRecordsTable).values(recordsToInsert);
};

export const setDnsRecordsForZone = async (
  zoneName: NamefiNormalizedDomain,
  records: ZoneRecordInput[],
) => {
  const sanitizedRecords = sanitizeAndNormalizeRecords(records);
  const recordsToInsert: DnsRecordInsert[] = sanitizedRecords.map((record) => ({
    ...record,
    zoneName,
  }));

  await validateZone(zoneName, {
    addedRecords: sanitizedRecords.map((record) => ({
      type: record.type,
      name: record.name,
      rdata: record.rdata,
      ttl: record.ttl,
    })) as ZoneRecordSchemaInput[],
  });

  const uniqueKeyRecords = new Map<
    string,
    {
      name: string;
      type: DnsRecordInsert['type'];
    }
  >();

  sanitizedRecords.forEach((record) => {
    uniqueKeyRecords.set(`${record.name}::${record.type}`, {
      name: record.name,
      type: record.type,
    });
  });

  await db.transaction(async (tx) => {
    if (uniqueKeyRecords.size > 0) {
      await Promise.all(
        Array.from(uniqueKeyRecords.values()).map(({ name, type }) =>
          tx
            .delete(dnsRecordsTable)
            .where(
              and(
                eq(dnsRecordsTable.zoneName, zoneName),
                eq(dnsRecordsTable.name, name),
                eq(dnsRecordsTable.type, type),
              ),
            ),
        ),
      );
    }

    await tx.insert(dnsRecordsTable).values(recordsToInsert);
  });
};
