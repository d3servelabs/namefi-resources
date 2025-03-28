import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import {
  createRecord,
  createRecordInputSchema,
  deleteRecord,
  getZoneRecords,
  updateRecord,
  updateRecordInputSchema,
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
    .input(createRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName } = input;

      await assertAuthenticatedUserIsDomainOwner(
        normalizedDomainName,
        ctx.user,
      );

      return createRecord(input);
    }),

  /**
   * Update a DNS record by ID
   */
  updateRecord: protectedProcedure
    .input(updateRecordInputSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      return updateRecord(input);
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

      await deleteRecord(id, normalizedDomainName);

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
