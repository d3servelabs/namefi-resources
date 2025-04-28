import { db, dnsRecordsTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { recordSchema } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { assoc, isNotNil, map, pickBy, pluck } from 'ramda';
import { z } from 'zod';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import {
  createRecord,
  createRecordInputSchema,
  deleteRecord,
  getZoneRecords,
  updateRecord,
  updateRecordInputSchema,
  validateZone,
} from '../../services/dns/service';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { assertAuthenticatedUserIsDomainOwner } from '../guards/assert-domain-owner';

export const dnsRecordsRouter = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .input(
      z.object({
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .query(({ input }) => {
      // In a real implementation, we may want to check permissions
      // before returning records, but for DNS we might allow public reading
      return getZoneRecords(input.zoneName);
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .input(createRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { zoneName } = input;

      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      return createRecord(input);
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .input(updateRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      return updateRecord(input);
    }),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(
      async ({ input: { zoneName: normalizedDomainName, id }, ctx }) => {
        await assertAuthenticatedUserIsDomainOwner(
          normalizedDomainName,
          ctx.user,
        );

        await deleteRecord(id, normalizedDomainName);

        return { success: true };
      },
    ),

  /**
   * Update multiple DNS records
   */
  updateRecords: protectedProcedure
    .input(
      z.object({
        records: z.array(updateRecordInputSchema.omit({ zoneName: true })),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { zoneName, records } = input;
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      // First, verify that all records exist and belong to the specified domain
      const existingRecords = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            inArray(dnsRecordsTable.id, pluck('id', records)),
            eq(dnsRecordsTable.zoneName, zoneName),
          ),
        );

      if (existingRecords?.length !== records.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Some DNS records are not found or do not belong to this domain',
        });
      }
      // Validate the zone with the updated record
      await validateZone(zoneName, {
        updatedRecords: records,
      });

      const updatedRecords = await db.transaction(async (tx) => {
        const multiStatementSql = sql.join(
          records.map((record) =>
            tx
              .update(dnsRecordsTable)
              .set(pickBy(isNotNil, record))
              .where(
                and(
                  eq(dnsRecordsTable.id, record.id),
                  eq(dnsRecordsTable.zoneName, zoneName),
                ),
              )
              .returning()
              .getSQL(),
          ),
          sql`;\n`,
        );
        return tx.execute(multiStatementSql.inlineParams());
      });

      return updatedRecords;
    }),

  /**
   * Create DNS records
   */
  createRecords: protectedProcedure
    .input(
      z.object({
        records: z.array(recordSchema),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input: { zoneName, records }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      // Validate the zone with the new record
      await validateZone(zoneName, {
        addedRecords: records,
      });

      const addedRecords = await db
        .insert(dnsRecordsTable)
        .values(map(assoc('zoneName', zoneName), records))
        .returning();
      return addedRecords;
    }),

  /**
   * Delete DNS records by IDs
   */
  deleteRecords: protectedProcedure
    .input(
      z.object({
        recordsIds: z.array(z.string()),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .mutation(async ({ input: { zoneName, recordsIds }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      const records = await db
        .select()
        .from(dnsRecordsTable)
        .where(
          and(
            inArray(dnsRecordsTable.id, recordsIds),
            eq(dnsRecordsTable.zoneName, zoneName),
          ),
        );

      if (records?.length !== recordsIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Some DNS records are not found or do not belong to this domain',
        });
      }

      // Validate the zone with the deleted records
      await validateZone(zoneName, {
        deletedRecords: records,
      });

      await db
        .delete(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.zoneName, zoneName),
            inArray(dnsRecordsTable.id, recordsIds),
          ),
        );

      return { success: true };
    }),

  /**
   * Park a domain
   */
  parkDomain: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        overrideExistingRecords: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      return parkDomain(
        input.normalizedDomainName,
        input.overrideExistingRecords,
      );
    }),

  /**
   * Check if a domain is parked
   */
  isDomainParked: publicProcedure
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .query(({ input }) => isDomainParked(input.normalizedDomainName)),
});
