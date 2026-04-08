import { type DnsRecordSelect, db, dnsRecordsTable } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { pluck } from 'ramda';
import { updateDomainConfig } from '#lib/domains/domain-preferences';
import {
  getVercelAnycastRecordPlan,
  type VercelAnycastDnsRecord,
} from '#lib/vercel/vercel-client-sdk';
import { validateZone } from './service';

const VERCEL_ANYCAST_MANAGED_BY = 'vercelAnycast';

function isApexRecordName(name: string) {
  return name === '@' || name === '';
}

function isManagedVercelAnycastRecord(
  record: Pick<DnsRecordSelect, 'metadata'>,
) {
  return (
    typeof record.metadata === 'object' &&
    record.metadata !== null &&
    record.metadata.namefiManaged === true &&
    record.metadata.managedBy === VERCEL_ANYCAST_MANAGED_BY
  );
}

function isMatchingVercelAnycastRecord(
  record: Pick<DnsRecordSelect, 'name' | 'type' | 'rdata'>,
  targetRecord: VercelAnycastDnsRecord,
) {
  return (
    record.name === targetRecord.name &&
    record.type === targetRecord.type &&
    record.rdata === targetRecord.rdata
  );
}

function toValidationRecord(
  record: Pick<DnsRecordSelect, 'id' | 'name' | 'type' | 'rdata' | 'ttl'>,
) {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    rdata: record.rdata,
    ttl: record.ttl,
  };
}

function buildVercelAnycastMetadata(record: VercelAnycastDnsRecord) {
  return {
    namefiManaged: true,
    managedBy: VERCEL_ANYCAST_MANAGED_BY,
    kind: record.type === 'CAA' ? 'caa' : 'apex',
  } as const;
}

function getVercelAnycastManagedConfigUpdate(apexRecordType: 'A' | 'CNAME') {
  if (apexRecordType === 'CNAME') {
    return {
      autoParkEnabled: false,
      autoEnsEnabled: false,
      forwardTo: '',
    };
  }

  return {
    autoParkEnabled: false,
    forwardTo: '',
  };
}

export async function toggleVercelAnycastRecords(input: {
  normalizedDomainName: NamefiNormalizedDomain;
  enableVercelAnyCastRecords: boolean;
  overrideExistingRecords?: boolean;
}): Promise<{ success: true }> {
  const zoneRecords = await db
    .select()
    .from(dnsRecordsTable)
    .where(eq(dnsRecordsTable.zoneName, input.normalizedDomainName));

  const apexZoneRecords = zoneRecords.filter((record) =>
    isApexRecordName(record.name),
  );
  const existingManagedAnycastRecords = apexZoneRecords.filter((record) =>
    isManagedVercelAnycastRecord(record),
  );

  if (!input.enableVercelAnyCastRecords) {
    if (existingManagedAnycastRecords.length > 0) {
      await db
        .delete(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.zoneName, input.normalizedDomainName),
            inArray(
              dnsRecordsTable.id,
              pluck('id', existingManagedAnycastRecords),
            ),
          ),
        );
    }

    return { success: true };
  }

  let recordPlan: ReturnType<typeof getVercelAnycastRecordPlan>;
  try {
    recordPlan = getVercelAnycastRecordPlan(input.normalizedDomainName);
  } catch (error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error instanceof Error ? error.message : 'Invalid domain name',
    });
  }

  const conflictingRecords = apexZoneRecords.filter((record) => {
    if (isMatchingVercelAnycastRecord(record, recordPlan.records[0])) {
      return false;
    }

    if (
      recordPlan.records.some((targetRecord) =>
        isMatchingVercelAnycastRecord(record, targetRecord),
      )
    ) {
      return false;
    }

    if (isManagedVercelAnycastRecord(record)) {
      return true;
    }

    if (recordPlan.overrideStrategy === 'replace-all-apex-records') {
      return true;
    }

    return (
      record.type === 'A' || record.type === 'CNAME' || record.type === 'AAAA'
    );
  });

  if (conflictingRecords.length > 0 && input.overrideExistingRecords !== true) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Conflicting apex DNS records already exist. Set overrideExistingRecords to true to replace them.',
    });
  }

  await validateZone(
    input.normalizedDomainName,
    {
      addedRecords: recordPlan.records,
      deletedRecords: conflictingRecords.map(toValidationRecord),
    },
    {
      managedStateOverride:
        recordPlan.apexRecordType === 'CNAME'
          ? {
              autoParkEnabled: false,
              autoEnsEnabled: false,
              forwardTo: null,
            }
          : {
              autoParkEnabled: false,
              forwardTo: null,
            },
    },
  );

  await db.transaction(async (tx) => {
    await updateDomainConfig(
      input.normalizedDomainName,
      getVercelAnycastManagedConfigUpdate(recordPlan.apexRecordType),
      tx,
    );

    if (conflictingRecords.length > 0) {
      await tx
        .delete(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.zoneName, input.normalizedDomainName),
            inArray(dnsRecordsTable.id, pluck('id', conflictingRecords)),
          ),
        );
    }

    await tx
      .insert(dnsRecordsTable)
      .values(
        recordPlan.records.map((record) => ({
          zoneName: input.normalizedDomainName,
          name: record.name,
          type: record.type,
          class: 'IN',
          ttl: record.ttl,
          rdata: record.rdata,
          metadata: buildVercelAnycastMetadata(record),
        })),
      )
      .onConflictDoUpdate({
        target: [
          dnsRecordsTable.zoneName,
          dnsRecordsTable.name,
          dnsRecordsTable.type,
          dnsRecordsTable.class,
          dnsRecordsTable.rdata,
        ],
        set: {
          ttl: sql`excluded.ttl`,
          metadata: sql`excluded.metadata`,
          updatedAt: new Date(),
        },
      });
  });

  return { success: true };
}
