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
import {
  authedOrPublicProcedure,
  createTRPCRouter,
  protectedProcedure,
  baseProcedure,
} from '../base';
import { generateDomainSuggestions } from '#lib/domain-suggestions';
import { drop, take, isNil, isNotNil, isEmpty } from 'ramda';
import type { UserSelect } from '@namefi-astra/db';
import { promiseWithAbortSignal } from '@namefi-astra/utils/promises/promiseWithAbortSignal';
import {
  getUserUnusedClaims,
  checkItemClaimEligibility,
} from '#temporal/activities/free-claim.activities';
import pMap from 'p-map';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { resolveNs } from 'node:dns/promises';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

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
          supported: true,
        } satisfies DomainAvailabilityInfo;
      }
      return availability[0];
    }),

  getClubsCategoriesWithStats: authedOrPublicProcedure.query(
    async ({ ctx }) => {
      const parentDomain = ctx.poweredByNamefiDomain;
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

  getDomainSuggestions: baseProcedure
    .input(
      z.object({
        query: z.string().min(1),
        parentDomain: z.string().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query, page = 1, pageSize } = input;
      const parentDomain =
        input.parentDomain ?? ctx.poweredByNamefiDomain ?? undefined;
      return generateDomainSuggestions(query, parentDomain, page, pageSize);
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

      const firstDomainResult = await getDomainListInfoWithAbortSignal(
        [domains[0] as NamefiNormalizedDomain],
        signal,
        ctx.user,
      );

      const nonTraditionalDomainsResult = getDomainListInfoWithAbortSignal(
        pickNonTraditionalDomains(drop(1, domains)),
        signal,
        ctx.user,
      );

      yield* firstDomainResult;

      const chunks = [pickTraditionalDomains(drop(1, domains))];

      const promises = chunks.map((names) =>
        getDomainListInfoWithAbortSignal(names, signal, ctx.user),
      );
      yield* await nonTraditionalDomainsResult;

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

  checkFreeClaimEligibility: protectedProcedure
    .input(
      z.object({
        domains: z
          .array(namefiNormalizedDomainSchema)
          .min(1)
          .describe('Array of domains to check for free claim eligibility'),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { domains } = input;
      const { user } = ctx;

      // Get all unused claims for this user
      const unusedClaims = await getUserUnusedClaims(user.id);

      // Check eligibility for each domain
      const eligibilityResults = domains.map((domain) => {
        const eligibility = checkItemClaimEligibility(domain, unusedClaims);

        return {
          domain,
          eligible: eligibility.length > 0,
          eligibility: eligibility.map((claim) => ({
            groupOrCampaignKey: claim.groupOrCampaignKey,
            claimsAvailable: claim.claimsAvailable,
            hasExactMatch: claim.exactMatchClaims.length > 0,
            hasParentMatch: claim.parentMatchClaims.length > 0,
          })),
        };
      });

      return eligibilityResults;
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

const increasingSizeChunks = <T>(
  arr: T[],
  initialChunkSize = 1,
  nextChunkSize?: (prevChunkSize: number, currentChunkSize: number) => number,
) => {
  const _nextChunkSize =
    nextChunkSize ?? ((prev, curr) => (prev === 0 ? curr * 2 : prev + curr));
  let chunkSize = initialChunkSize;
  let _arr = arr;

  const chunks: T[][] = [];

  while (_arr.length > 0) {
    chunks.push(take(chunkSize, _arr));
    _arr = drop(chunkSize, _arr);
    chunkSize = _nextChunkSize((chunks.at(-1) ?? []).length, chunkSize);
  }

  return chunks;
};

const getPreliminaryDomainAvailability = async (
  domains: NamefiNormalizedDomain[],
): Promise<DomainAvailabilityInfo[]> => {
  const nonTraditionalDomains = pickNonTraditionalDomains(domains);
  const nonTraditionalDomainsPromises = await getDomainListInfo(
    nonTraditionalDomains,
  );
  const nonTraditionalDomainsMap = new Map(
    nonTraditionalDomainsPromises.map((domain) => [domain.domain, domain]),
  );

  return pMap(domains, async (domain) => {
    const nonTraditionalDomain = nonTraditionalDomainsMap.get(domain);
    if (isNotNil(nonTraditionalDomain)) {
      return nonTraditionalDomain;
    }

    const [_error, nameservers] = await resolve(
      resolveNs(toPunycodeDomainName(domain)),
    );
    const availability = isNil(nameservers) || isEmpty(nameservers);

    return {
      domain,
      availability,
      pricingDetails: undefined,
      currentOwner: undefined,
      durationValidationInYears: { min: 1, max: 1 },
      importable: !availability,
      registrarKey: 'preliminary',
      supported: true,
    } satisfies DomainAvailabilityInfo;
  });
};

const pickTraditionalDomains = (
  domains: NamefiNormalizedDomain[],
): NamefiNormalizedDomain[] => {
  return domains.filter((domain) => {
    const parseResult = parseDomainName(domain);
    if (!parseResult.valid) {
      return false;
    }
    return parseResult.registryType === 'traditional';
  });
};
const pickNonTraditionalDomains = (
  domains: NamefiNormalizedDomain[],
): NamefiNormalizedDomain[] => {
  return domains.filter((domain) => {
    const parseResult = parseDomainName(domain);
    if (!parseResult.valid) {
      return false;
    }
    return parseResult.registryType === 'subdomain';
  });
};
