import { db, dnsRecordInsertSchema, dnsRecordsTable } from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { recordSchema, zoneSchema } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { filter, isNotNil, mergeRight } from 'ramda';
import { z } from 'zod';

export const updateRecordInputSchema = z.object({
  id: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  type: z.string().optional(),
  name: z.string().optional(),
  rdata: z.string().optional(),
  ttl: z.number().optional(),
});

export const createRecordInputSchema = dnsRecordInsertSchema.extend({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

/**
 * Helper function to get a DNS record by ID and domain name.
 * Throws if the record doesn't exist or doesn't belong to the specified domain.
 * @param id - The ID of the DNS record to find
 * @param normalizedDomainName - The normalized domain name to check against
 * @returns The found DNS record
 * @throws {TRPCError} If record is not found or doesn't belong to Domain
 */
export async function getRecordByIdAndDomainOrThrow(
  id: string,
  normalizedDomainName: NamefiNormalizedDomain,
) {
  const record = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(
        eq(dnsRecordsTable.id, id),
        eq(dnsRecordsTable.normalizedDomainName, normalizedDomainName),
      ),
    );

  if (record?.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'DNS record not found or does not belong to this domain',
    });
  }

  return record[0];
}

/**
 * Helper function to get all DNS records for a given domain
 * @param normalizedDomainName - The normalized domain name to get records for
 * @returns An array of DNS records for the domain
 */
export async function getZoneRecords(
  normalizedDomainName: NamefiNormalizedDomain,
) {
  const records = await db
    .select()
    .from(dnsRecordsTable)
    .where(eq(dnsRecordsTable.normalizedDomainName, normalizedDomainName));

  return records;
}

/**
 * Helper function to validate a DNS zone with existing, updated, and new records
 * @param normalizedDomainName - The normalized domain name to validate zone for
 * @param newRecords - Array of new DNS records to add to the zone
 * @param updatedRecord - Array of existing records with updates to apply
 * @returns Array of all records in the zone after updates
 */
export async function validateZone(
  normalizedDomainName: NamefiNormalizedDomain,
  newRecords: z.infer<typeof recordSchema>[] = [],
  updatedRecord: Omit<
    z.infer<typeof updateRecordInputSchema>,
    'normalizedDomainName'
  >[] = [],
  deleteRecords: (z.infer<typeof recordSchema> & { id?: string })[] = [],
) {
  const existingRecords = await getZoneRecords(normalizedDomainName);

  // Replace updated records in existing records
  const updatedExistingRecords = filter(
    isNotNil,
    existingRecords.map((record) => {
      const update = updatedRecord.find((u) => u.id === record.id);
      if (update) {
        return mergeRight(record, update);
      }
      if (
        deleteRecords.find(
          (d) =>
            d.id === record.id ||
            (d.name === record.name &&
              d.type === record.type &&
              d.rdata === record.rdata &&
              d.ttl === record.ttl),
        )
      ) {
        return null;
      }
      return record;
    }),
  );

  // Combine existing (with updates) and new records
  const allRecords = [
    ...updatedExistingRecords.map((record) => {
      return {
        type: record.type,
        name: record.name,
        rdata: record.rdata,
        ttl: record.ttl,
      };
    }),
    ...newRecords,
  ];

  // Validate the entire zone
  await zoneSchema.parseAsync({
    zoneName: normalizedDomainName,
    records: allRecords,
  });
}

/**
 * Helper function to update a DNS record by ID
 * @param input - The input data for the updated record
 * @returns The updated DNS record
 */
export async function updateRecord(
  input: z.infer<typeof updateRecordInputSchema>,
) {
  const { id, normalizedDomainName, ...updateData } = input;

  // First, verify the record exists and belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, normalizedDomainName);

  // Validate the zone with the updated record
  await validateZone(normalizedDomainName, [], [input]);

  // Update the record in the database
  const updatedRecord = await db
    .update(dnsRecordsTable)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dnsRecordsTable.id, id),
        eq(dnsRecordsTable.normalizedDomainName, normalizedDomainName),
      ),
    )
    .returning();

  return updatedRecord[0];
}

/**
 * Helper function to delete a DNS record by ID
 * @param id - The ID of the DNS record to delete
 * @param normalizedDomainName - The normalized domain name to check against
 */
export async function deleteRecord(
  id: string,
  normalizedDomainName: NamefiNormalizedDomain,
) {
  // First, verify the record belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, normalizedDomainName);

  // Delete the record
  await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, id));
}

/**
 * Helper function to create a new DNS record
 * @param input - The input data for the new record
 * @returns The created DNS record
 */
export async function createRecord(
  input: z.infer<typeof createRecordInputSchema>,
) {
  const parsedRecord = recordSchema.parse({
    type: input.type,
    name: input.name,
    rdata: input.rdata,
    ttl: input.ttl,
  });

  // Validate the zone with the new record
  await validateZone(input.normalizedDomainName, [parsedRecord], []);

  const record = await db.insert(dnsRecordsTable).values(input).returning();
  return record[0];
}
