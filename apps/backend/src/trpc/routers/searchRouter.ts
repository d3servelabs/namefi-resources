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
    .subscription(async function* (opts) {
      const sleep = (ms: number) =>
        new Promise<void>((resolve, reject) => {
          const id = setTimeout(resolve, ms);
          opts.signal?.addEventListener('abort', () => {
            clearTimeout(id);
            reject(new Error('aborted'));
          });
        });

      const safeFetch = async (names: NamefiNormalizedDomain[]) => {
        if (opts.signal?.aborted) return [];
        return Promise.race([
          getDomainListInfo(names, opts.ctx.user),
          new Promise<DomainAvailabilityInfo[]>((resolve) => {
            opts.signal?.addEventListener('abort', () => {
              resolve([]);
            });
          }),
        ]);
      };

      const { domains } = opts.input;
      const Chunk = 3;

      try {
        // For single domain queries, process immediately
        if (domains.length === 1) {
          for (const info of await safeFetch(domains)) yield info;
          return;
        }

        for (const info of await safeFetch([domains[0]])) yield info;

        for (let i = 1; i < domains.length; i += Chunk) {
          if (opts.signal?.aborted) break;

          const chunk = domains.slice(i, i + Chunk);
          for (const info of await safeFetch(chunk)) yield info;

          if (i + Chunk < domains.length) await sleep(300);
        }
      } catch (error) {
        logger.error('Search subscription error:', error);
        throw error;
      }
    }),
});
