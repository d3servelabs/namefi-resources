import { db, dnsRecordInsertSchema, dnsRecordsTable } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { publicProcedure, router } from '../context';

export const dnsRecordsRouter = router({
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
  createDnsRecord: publicProcedure
    .input(dnsRecordInsertSchema)
    .mutation(async ({ input }) => {
      // TODO! implement authentication and zone validation
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
  updateRecord: publicProcedure
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
    .mutation(async ({ input }) => {
      // TODO! implement authentication and zone validation
      // First, verify the record exists and belongs to the specified domain
      const existingRecord = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.id, input.id),
            eq(
              dnsRecordsTable.normalizedDomainName,
              input.normalizedDomainName,
            ),
          ),
        );

      if (existingRecord?.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'DNS record not found or does not belong to this domain',
        });
      }
      // Update the record
      const { id, normalizedDomainName, ...updateData } = input;

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
  deleteRecord: publicProcedure
    .input(
      z.object({
        id: z.string(),
        normalizedDomainName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO! implement authentication and zone validation
      // First, verify the record belongs to the specified domain
      const record = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.id, input.id),
            eq(
              dnsRecordsTable.normalizedDomainName,
              input.normalizedDomainName,
            ),
          ),
        );

      if (record?.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'DNS record not found or does not belong to this domain',
        });
      }

      // Delete the record
      await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, input.id));

      return { success: true };
    }),
});
