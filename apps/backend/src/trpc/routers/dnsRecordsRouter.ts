import {
  type UserSelect,
  db,
  dnsRecordInsertSchema,
  dnsRecordsTable,
} from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { privyClient } from '../utils';

export const dnsRecordsRouter = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .input(
      z.object({
        normalizedDomainName: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // In a real implementation, we may want to check permissions
      // before returning records, but for DNS we might allow public reading

      const records = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          eq(dnsRecordsTable.normalizedDomainName, input.normalizedDomainName),
        );

      return records;
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .input(dnsRecordInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName } = input;

      await assertAuthenticatedUserIsDomainOwner(
        normalizedDomainName,
        ctx.user,
      );

      type DnsRecordInsertValues = typeof dnsRecordsTable.$inferInsert;
      const record = await db
        .insert(dnsRecordsTable)
        .values(input as DnsRecordInsertValues)
        .returning();
      return record[0];
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        normalizedDomainName: z.string(),
        type: z.string().optional(),
        name: z.string().optional(),
        rdata: z.string().optional(),
        ttl: z.number().optional(),
      }),
    )
    .mutation(
      async ({ input: { id, normalizedDomainName, ...updateData }, ctx }) => {
        await assertAuthenticatedUserIsDomainOwner(
          normalizedDomainName,
          ctx.user,
        );

        // First, verify the record exists and belongs to the specified domain
        await getRecordByIdAndDomainOrThrow(id, normalizedDomainName);

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
      },
    ),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        normalizedDomainName: z.string(),
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
  normalizedDomainName: string,
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
  normalizedDomainName: string,
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
