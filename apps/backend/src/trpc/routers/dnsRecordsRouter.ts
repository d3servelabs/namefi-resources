import {
  type UserSelect,
  db,
  dnsRecordInsertSchema,
  dnsRecordsTable,
} from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { recordSchema, zoneSchema } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { mergeRight } from 'ramda';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { privyClient } from '../utils';

const updateRecordInputSchema = z.object({
  id: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  type: z.string().optional(),
  name: z.string().optional(),
  rdata: z.string().optional(),
  ttl: z.number().optional(),
});

export const dnsRecordsRouter = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(({ input }) => {
      // In a real implementation, we may want to check permissions
      // before returning records, but for DNS we might allow public reading
      return getZoneRecords(input.normalizedDomainName);
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .input(
      dnsRecordInsertSchema.extend({
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName } = input;

      await assertAuthenticatedUserIsDomainOwner(
        normalizedDomainName,
        ctx.user,
      );

      const parsedRecord = recordSchema.parse({
        type: input.type,
        name: input.name,
        rdata: input.rdata,
        ttl: input.ttl,
      });

      // Validate the zone with the new record
      await validateZone(normalizedDomainName, [parsedRecord], []);

      const record = await db.insert(dnsRecordsTable).values(input).returning();
      return record[0];
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .input(updateRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, normalizedDomainName, ...updateData } = input;
      await assertAuthenticatedUserIsDomainOwner(
        normalizedDomainName,
        ctx.user,
      );

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
    }),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input: { normalizedDomainName, id }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        normalizedDomainName,
        ctx.user,
      );

      // First, verify the record belongs to the specified domain
      await getRecordByIdAndDomainOrThrow(id, normalizedDomainName);

      // Delete the record
      await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, id));

      return { success: true };
    }),
});

/**
 * Helper function to get a DNS record by ID and domain name.
 * Throws if the record doesn't exist or doesn't belong to the specified domain.
 * @param id - The ID of the DNS record to find
 * @param normalizedDomainName - The normalized domain name to check against
 * @returns The found DNS record
 * @throws {TRPCError} If record is not found or doesn't belong to Domain
 */
async function getRecordByIdAndDomainOrThrow(
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
 * Helper function to verify if the authenticated user is the owner of a domain NFT
 * @param normalizedDomainName - The normalized domain name to check ownership for
 * @param user - The authenticated user object
 */
async function assertAuthenticatedUserIsDomainOwner(
  normalizedDomainName: NamefiNormalizedDomain,
  user: UserSelect,
): Promise<void> {
  // Verify user has permission to manage DNS records for this domain
  const nft = await db.query.namefiNftTable.findFirst({
    where: (namefiNft, { eq }) =>
      eq(namefiNft.normalizedDomainName, normalizedDomainName),
  });

  if (!nft) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Domain NFT not found',
    });
  }

  const nftOwnerUser = await privyClient.getUserByWalletAddress(
    nft.ownerAddress,
  );

  if (nftOwnerUser?.id !== user.privyUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'You do not have permission to manage DNS records for this domain',
    });
  }
}

/**
 * Helper function to get all DNS records for a given domain
 * @param normalizedDomainName - The normalized domain name to get records for
 * @returns An array of DNS records for the domain
 */
async function getZoneRecords(normalizedDomainName: NamefiNormalizedDomain) {
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
async function validateZone(
  normalizedDomainName: NamefiNormalizedDomain,
  newRecords: Array<z.infer<typeof recordSchema>> = [],
  updatedRecord: Array<
    Omit<z.infer<typeof updateRecordInputSchema>, 'normalizedDomainName'>
  > = [],
) {
  const existingRecords = await getZoneRecords(normalizedDomainName);

  // Replace updated records in existing records
  const updatedExistingRecords = existingRecords.map((record) => {
    const update = updatedRecord.find((u) => u.id === record.id);
    return update ? mergeRight(record, update) : record;
  });

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
