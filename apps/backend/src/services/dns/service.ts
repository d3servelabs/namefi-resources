import { db, dnsRecordInsertSchema, dnsRecordsTable } from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import {
  recordSchema,
  recordTypeEnum,
  zoneSchema,
} from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { filter, isNotNil, mergeRight } from 'ramda';
import { z } from 'zod';
import { areRecordsEqual } from './helpers';

export const updateRecordInputSchema = z.object({
  id: z.string(),
  zoneName: namefiNormalizedDomainSchema,
  type: recordTypeEnum.optional(),
  name: z.string().optional(),
  rdata: z.string().optional(),
  ttl: z.number().optional(),
});

export const createRecordInputSchema = dnsRecordInsertSchema.extend({
  zoneName: namefiNormalizedDomainSchema,
});

/**
 * Helper function to get a DNS record by ID and domain name.
 * Throws if the record doesn't exist or doesn't belong to the specified domain.
 * @param id - The ID of the DNS record to find
 * @param zoneName - The normalized domain name to check against
 * @returns The found DNS record
 * @throws {TRPCError} If record is not found or doesn't belong to Domain
 */
// TODO: delete or remove 'export', not being used by trpc or temporal.
export async function getRecordByIdAndDomainOrThrow(
  id: string,
  zoneName: NamefiNormalizedDomain,
) {
  const record = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(eq(dnsRecordsTable.id, id), eq(dnsRecordsTable.zoneName, zoneName)),
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
 * @param zoneName - The normalized domain name to get records for
 * @returns An array of DNS records for the domain
 */
// TODO: move to trpc, used only by apps/backend/src/trpc/routers/dnsRecordsRouter.ts
export async function getZoneRecords(zoneName: NamefiNormalizedDomain) {
  const records = await db
    .select()
    .from(dnsRecordsTable)
    .where(eq(dnsRecordsTable.zoneName, zoneName));

  return records;
}

/**
 * Helper function to validate a DNS zone with existing, updated, and new records
 * @param zoneName - The normalized domain name to validate zone for
 * @param addRecords - Array of new DNS records to add to the zone
 * @param updatedRecord - Array of existing records with updates to apply
 * @param deleteRecords - Array of existing records to delete
 * @returns Array of all records in the zone after updates
 */
// TODO: delete or remove 'export', not being used by trpc or temporal.
export async function validateZone(
  zoneName: NamefiNormalizedDomain,
  changes: {
    addedRecords?: z.infer<typeof recordSchema>[];
    updatedRecords?: Omit<
      z.infer<typeof updateRecordInputSchema>,
      'zoneName'
    >[];
    deletedRecords?: (z.infer<typeof recordSchema> & { id?: string })[];
  },
) {
  const {
    addedRecords = [],
    updatedRecords = [],
    deletedRecords = [],
  } = changes;
  const existingRecords = await getZoneRecords(zoneName);

  // Replace updated records in existing records
  const updatedExistingRecords = filter(
    isNotNil,
    existingRecords.map((record) => {
      const update = updatedRecords.find((u) => u.id === record.id);
      if (update) {
        return mergeRight(record, update);
      }
      if (
        deletedRecords.find(
          (d) => d.id === record.id || areRecordsEqual(d, record),
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
    ...addedRecords,
  ];

  // Validate the entire zone
  await zoneSchema.parseAsync({
    zoneName: zoneName,
    records: allRecords,
  });
}

/**
 * Helper function to update a DNS record by ID
 * @param input - The input data for the updated record
 * @returns The updated DNS record
 */
// TODO: move to trpc, used only by apps/backend/src/trpc/routers/dnsRecordsRouter.ts
export async function updateRecord(
  input: z.infer<typeof updateRecordInputSchema>,
) {
  const { id, zoneName, ...updateData } = input;

  // First, verify the record exists and belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, zoneName);

  // Validate the zone with the updated record
  await validateZone(zoneName, {
    updatedRecords: [input],
  });

  // Update the record in the database
  const updatedRecord = await db
    .update(dnsRecordsTable)
    .set({
      ...updateData,
    })
    .where(
      and(eq(dnsRecordsTable.id, id), eq(dnsRecordsTable.zoneName, zoneName)),
    )
    .returning();

  return updatedRecord[0];
}

/**
 * Helper function to delete a DNS record by ID
 * @param id - The ID of the DNS record to delete
 * @param zoneName - The normalized domain name to check against
 */
// TODO: move to trpc, used only by apps/backend/src/trpc/routers/dnsRecordsRouter.ts
export async function deleteRecord(
  id: string,
  zoneName: NamefiNormalizedDomain,
) {
  // First, verify the record belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, zoneName);

  // Delete the record
  await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, id));
}

/**
 * Helper function to create a new DNS record
 * @param input - The input data for the new record
 * @returns The created DNS record
 */
// TODO: move to trpc, used only by apps/backend/src/trpc/routers/dnsRecordsRouter.ts
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
  await validateZone(input.zoneName, {
    addedRecords: [parsedRecord],
  });

  const record = await db.insert(dnsRecordsTable).values(input).returning();
  return record[0];
}
