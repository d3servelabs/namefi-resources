import { db, dnsRecordsTable, dnsRecordSelectSchema } from '@namefi-astra/db';
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
  getZoneRecordsWithManagedRecords,
  updateRecord,
  updateRecordInputSchema,
  validateZone,
} from '../../services/dns/service';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { assertAuthenticatedUserIsDomainOwner } from '../guards/assert-domain-owner';

// ============================================================================
// Output Schemas for OpenAPI
// ============================================================================

const successResponseSchema = z.object({
  success: z.boolean(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const dnsRecordsRouterOrpc = createTRPCRouter({
  /**
   * Get DNS records for a domain
   */
  getRecords: publicProcedure
    .meta({
      route: {
        path: '/dns/records',
        method: 'GET',
        tags: ['dns'],
        operationId: 'getDnsRecords',
        summary: 'Get DNS records',
        description:
          'Retrieve all DNS records for a specified domain zone. Returns an array of DNS records including A, AAAA, CNAME, MX, TXT, and other record types.',
      },
    })
    .input(
      z.object({
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .output(z.array(dnsRecordSelectSchema))
    .query(({ input }) => {
      return getZoneRecordsWithManagedRecords(input.zoneName);
    }),

  /**
   * Add a new DNS record
   */
  createDnsRecord: protectedProcedure
    .meta({
      route: {
        path: '/dns/records',
        method: 'POST',
        tags: ['dns'],
        operationId: 'createDnsRecord',
        summary: 'Create DNS record',
        description:
          'Create a new DNS record for a domain. Requires domain ownership. The record will be validated against DNS zone rules before creation.',
      },
    })
    .input(createRecordInputSchema)
    .output(dnsRecordSelectSchema)
    .mutation(async ({ input, ctx }) => {
      const { zoneName } = input;

      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

      return createRecord(input);
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .meta({
      route: {
        path: '/dns/records/{id}',
        method: 'PUT',
        tags: ['dns'],
        operationId: 'updateDnsRecord',
        summary: 'Update DNS record',
        description:
          'Update an existing DNS record by its ID. Requires domain ownership. The updated record will be validated against DNS zone rules.',
      },
    })
    .input(updateRecordInputSchema)
    .output(dnsRecordSelectSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

      return updateRecord(input);
    }),

  /**
   * Delete a DNS record by ID
   */
  deleteRecord: protectedProcedure
    .meta({
      route: {
        path: '/dns/records/{id}',
        method: 'DELETE',
        tags: ['dns'],
        operationId: 'deleteDnsRecord',
        summary: 'Delete DNS record',
        description:
          'Delete a DNS record by its ID. Requires domain ownership. The deletion will be validated to ensure zone integrity.',
      },
    })
    .input(
      z.object({
        id: z.string(),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .output(successResponseSchema)
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
    .meta({
      route: {
        path: '/dns/records/batch',
        method: 'PUT',
        tags: ['dns'],
        operationId: 'batchUpdateDnsRecords',
        summary: 'Batch update DNS records',
        description:
          'Update multiple DNS records in a single transaction. Requires domain ownership. All records must belong to the same zone and will be validated together.',
      },
    })
    .input(
      z.object({
        records: z.array(updateRecordInputSchema.omit({ zoneName: true })),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .output(z.array(dnsRecordSelectSchema))
    .mutation(async ({ input, ctx }) => {
      const { zoneName, records } = input;
      await assertAuthenticatedUserIsDomainOwner(input.zoneName, ctx.user);

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

      return updatedRecords as unknown as z.infer<
        typeof dnsRecordSelectSchema
      >[];
    }),

  /**
   * Create DNS records
   */
  createRecords: protectedProcedure
    .meta({
      route: {
        path: '/dns/records/batch',
        method: 'POST',
        tags: ['dns'],
        operationId: 'batchCreateDnsRecords',
        summary: 'Batch create DNS records',
        description:
          'Create multiple DNS records in a single transaction. Requires domain ownership. All records will be validated together against DNS zone rules.',
      },
    })
    .input(
      z.object({
        records: z.array(recordSchema),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .output(z.array(dnsRecordSelectSchema))
    .mutation(async ({ input: { zoneName, records }, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(zoneName, ctx.user);

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
    .meta({
      route: {
        path: '/dns/records/batch',
        method: 'DELETE',
        tags: ['dns'],
        operationId: 'batchDeleteDnsRecords',
        summary: 'Batch delete DNS records',
        description:
          'Delete multiple DNS records by their IDs in a single transaction. Requires domain ownership. The zone will be validated after deletion.',
      },
    })
    .input(
      z.object({
        recordsIds: z.array(z.string()),
        zoneName: namefiNormalizedDomainSchema,
      }),
    )
    .output(successResponseSchema)
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
    .meta({
      route: {
        path: '/dns/park',
        method: 'POST',
        tags: ['dns'],
        operationId: 'parkDomain',
        summary: 'Park domain',
        description:
          'Park a domain by setting up default parking DNS records (A and AAAA records pointing to the parking server). Optionally override existing conflicting records.',
      },
    })
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        overrideExistingRecords: z.boolean().optional(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      try {
        await parkDomain(
          input.normalizedDomainName,
          input.overrideExistingRecords,
        );

        return { success: true };
      } catch (e) {
        return { success: false };
      }
    }),

  /**
   * Check if a domain is parked
   */
  isDomainParked: publicProcedure
    .meta({
      route: {
        path: '/dns/parked',
        method: 'GET',
        tags: ['dns'],
        operationId: 'isDomainParked',
        summary: 'Check if domain is parked',
        description:
          'Check whether a domain has the standard parking DNS records configured. Returns true if the domain is parked, false otherwise.',
      },
    })
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .output(z.boolean())
    .query(({ input }) => isDomainParked(input.normalizedDomainName)),
});
