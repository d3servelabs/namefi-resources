import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { z } from 'zod';
import { getClubsCategoriesWithStats } from '#lib/clubs-categories';
import { logger } from '#lib/logger';
import {
  type DomainAvailabilityInfo,
  getDomainListInfo,
} from '#lib/namefi-registry';
import { authedOrPublicProcedure, createTRPCRouter } from '../base';
import { generateDomainSuggestions } from '#lib/domain-suggestions';
import { drop, splitEvery } from 'ramda';
import type { UserSelect } from '@namefi-astra/db';
import { promiseWithAbortSignal } from '@namefi-astra/utils/promises/promiseWithAbortSignal';

export const searchRouter = createTRPCRouter({
  isDomainAvailable: authedOrPublicProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema.describe(
          'The domain to check availability for',
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { domain } = input;

      const availability = await getDomainListInfo([domain], ctx.user);

      if (availability.length !== 1) {
        return {
          domain: domain,
          availability: false,
          pricingDetails: undefined,
          currentOwner: undefined,
          durationValidationInYears: undefined,
          importable: false,
        } satisfies DomainAvailabilityInfo;
      }
      return availability[0];
    }),

  getClubsCategoriesWithStats: authedOrPublicProcedure.query(
    async ({ ctx }) => {
      const parentDomain = ctx.thirdPartyOriginHostname;
      const startTime = performance.now();
      const categories = await getClubsCategoriesWithStats(parentDomain);
      const endTime = performance.now();
      logger.info(
        `[getClubsCategoriesWithStats] Time taken: ${endTime - startTime} milliseconds`,
      );
      logger.info(
        `[getClubsCategoriesWithStats] Number of categories: ${categories.length}`,
      );
      return categories;
    },
  ),

  getDomainSuggestions: authedOrPublicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        parentDomain: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query } = input;
      const parentDomain =
        input.parentDomain ?? ctx.thirdPartyOriginHostname ?? undefined;
      const domains = generateDomainSuggestions(query, parentDomain);
      return { domains };
    }),

  /**
   * Stream domain availability results
   */
  streamDomainAvailability: authedOrPublicProcedure
    .input(
      z.object({
        domains: z.array(namefiNormalizedDomainSchema).min(1),
      }),
    )
    .subscription(async function* ({ input: { domains }, signal, ctx }) {
      if (domains.length === 0 || signal?.aborted) {
        yield* [];
        return;
      }

      yield* await getDomainListInfoWithAbortSignal(
        [domains[0] as NamefiNormalizedDomain],
        signal,
        ctx.user,
      );

      // split the domains into chunks of 3,
      const chunks = splitEvery(3 /** chunk size */, drop(1, domains));
      const promises = chunks.map((names) =>
        getDomainListInfoWithAbortSignal(names, signal, ctx.user),
      );

      for (const promise of promises) {
        if (signal?.aborted) break;
        try {
          yield* await promise;
        } catch (error) {
          logger.error({ error }, 'Search subscription error');
          throw error;
        }
      }
    }),
});

const getDomainListInfoWithAbortSignal = async (
  names: NamefiNormalizedDomain[],
  signal: AbortSignal | undefined | null,
  user: UserSelect | null,
) => {
  return promiseWithAbortSignal(
    () => getDomainListInfo(names, user),
    signal,
    [],
  );
};
