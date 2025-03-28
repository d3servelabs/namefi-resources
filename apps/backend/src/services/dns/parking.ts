import { db, dnsRecordsTable } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { RecordType, recordSchema } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { pluck } from 'ramda';
import type { z } from 'zod';
import { areRecordsEqual } from './helpers';
import { validateZone } from './service';
/**
 * A collection of records that are considered parked
 */
export const PARKED_DOMAIN_RECORDS: z.infer<typeof recordSchema>[] = [
  {
    type: RecordType.A,
    name: '@',
    rdata: '24.199.74.33',
    ttl: 300,
  },
  {
    type: RecordType.AAAA,
    name: '@',
    rdata: '2604:a880:4:1d0::417:7000',
    ttl: 300,
  },
];

/**
 * Helper function to get the records that are considered parked for a domain (meaning they match the PARKED_DOMAIN_RECORDS except for the rdata and ttl)
 * @param normalizedDomainName - The normalized domain name to get parking records for
 * @returns The parking records for the domain
 */
export function getZoneRecordsInPlaceOfParkedRecords(
  normalizedDomainName: NamefiNormalizedDomain,
) {
  const parkingRecords = db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(
        eq(dnsRecordsTable.normalizedDomainName, normalizedDomainName),
        inArray(
          dnsRecordsTable.type,
          PARKED_DOMAIN_RECORDS.map((record) => record.type),
        ),
        inArray(
          dnsRecordsTable.name,
          PARKED_DOMAIN_RECORDS.map((record) => record.name),
        ),
      ),
    );
  return parkingRecords;
}

/**
 * Helper function to check if a domain is parked
 * @param normalizedDomainName - The normalized domain name to check
 * @returns True if the domain is parked, false otherwise
 */
export async function isDomainParked(
  normalizedDomainName: NamefiNormalizedDomain,
) {
  const records =
    await getZoneRecordsInPlaceOfParkedRecords(normalizedDomainName);
  return PARKED_DOMAIN_RECORDS.every((parkedRecord) =>
    records.some((record) =>
      areRecordsEqual(record as z.infer<typeof recordSchema>, parkedRecord),
    ),
  );
}

/**
 * Helper function to park a domain
 * @param normalizedDomainName - The normalized domain name to park
 * @param overrideExistingRecords - Whether to override the conflicting records if they already exist
 */
export async function parkDomain(
  normalizedDomainName: NamefiNormalizedDomain,
  overrideExistingRecords = false,
) {
  const isZoneParked = await isDomainParked(normalizedDomainName);
  if (isZoneParked) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Domain is already parked',
    });
  }

  const existingConflictingRecords =
    await getZoneRecordsInPlaceOfParkedRecords(normalizedDomainName);
  if (!overrideExistingRecords) {
    if (existingConflictingRecords.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Domain already has records that conflict with parked records',
      });
    }
  }

  await validateZone(normalizedDomainName, {
    addedRecords: PARKED_DOMAIN_RECORDS,
    deletedRecords: existingConflictingRecords.map((record) => ({
      ...recordSchema.parse(record),
      id: record.id,
    })),
  });
  await db.batch([
    db
      .delete(dnsRecordsTable)
      .where(
        and(
          eq(dnsRecordsTable.normalizedDomainName, normalizedDomainName),
          inArray(dnsRecordsTable.id, pluck('id', existingConflictingRecords)),
        ),
      ),
    db
      .insert(dnsRecordsTable)
      .values(
        PARKED_DOMAIN_RECORDS.map((record) => ({
          ...record,
          normalizedDomainName,
        })),
      )
      .returning(),
  ]);
}
