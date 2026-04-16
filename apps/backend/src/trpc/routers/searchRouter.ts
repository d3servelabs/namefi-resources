import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { searchContract } from '@namefi-astra/common/contract/search-contract';
import { getClubsCategoriesWithStats } from '#lib/clubs-categories';
import { logger } from '#lib/logger';
import {
  type DomainAvailabilityInfo,
  getDomainListInfo,
} from '#lib/namefi-registry';
import {
  authedOrPublicProcedure,
  protectedProcedure,
  baseProcedure,
} from '../base';
import { createContractTRPCRouter } from '../contract';
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
import { gaEventUserBeginSearch } from '#lib/tracking/checkout/events';
import { orderService } from '#services/orders/orders.service';

export const searchRouter = createContractTRPCRouter<typeof searchContract>({
  isDomainAvailable: authedOrPublicProcedure
    .input(searchContract.isDomainAvailable.input)
    .output(searchContract.isDomainAvailable.output)
    .query(async ({ input, ctx }) => {
      const { domain } = input;
      // TODO: Replace requestId fallback with stable GA clientId from frontend (_ga/gtag).
      const clientId = ctx.sessionId ?? ctx.honoVars?.requestId ?? null;
      const gaEventTracking = ctx.user?.id
        ? await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id)
        : { trackGaEvents: true };
      const gaEventTrackingReason =
        'reason' in gaEventTracking
          ? (gaEventTracking.reason ?? 'DEFAULT')
          : 'DEFAULT';

      if ((ctx.user?.id || clientId) && gaEventTracking.trackGaEvents) {
        void gaEventUserBeginSearch({
          userId: ctx.user?.id,
          clientId,
          searchTerm: domain,
          parentDomain: ctx.poweredByNamefiDomain ?? undefined,
        });
      } else if (!gaEventTracking.trackGaEvents) {
        logger.info(
          {
            userId: ctx.user?.id,
            domain,
            eventName: 'user_begin_search',
            gaEventTrackingReason,
          },
          'Skipping GA user_begin_search event because tracking is disabled',
        );
      }

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

  getClubsCategoriesWithStats: authedOrPublicProcedure
    .input(searchContract.getClubsCategoriesWithStats.input)
    .output(searchContract.getClubsCategoriesWithStats.output)
    .query(async ({ ctx }) => {
      const parentDomain = ctx.poweredByNamefiDomain;
      const startTime = performance.now();
      const categories = await getClubsCategoriesWithStats(parentDomain);
      const endTime = performance.now();
      logger.debug(
        `[getClubsCategoriesWithStats] Time taken: ${endTime - startTime} milliseconds`,
      );
      logger.debug(
        `[getClubsCategoriesWithStats] Number of categories: ${categories.length}`,
      );
      return categories;
    }),

  getDomainSuggestions: baseProcedure
    .input(searchContract.getDomainSuggestions.input)
    .output(searchContract.getDomainSuggestions.output)
    .query(async ({ input, ctx }) => {
      const { query, page = 1, pageSize } = input;
      const parentDomain =
        input.parentDomain ?? ctx.poweredByNamefiDomain ?? undefined;
      // TODO: Replace requestId fallback with stable GA clientId from frontend (_ga/gtag).
      const clientId = ctx.sessionId ?? ctx.honoVars?.requestId ?? null;
      const gaEventTracking = ctx.user?.id
        ? await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id)
        : { trackGaEvents: true };
      const gaEventTrackingReason =
        'reason' in gaEventTracking
          ? (gaEventTracking.reason ?? 'DEFAULT')
          : 'DEFAULT';
      if (
        page === 1 &&
        (ctx.user?.id || clientId) &&
        gaEventTracking.trackGaEvents
      ) {
        void gaEventUserBeginSearch({
          userId: ctx.user?.id,
          clientId,
          searchTerm: query.trim(),
          parentDomain,
        });
      } else if (page === 1 && !gaEventTracking.trackGaEvents) {
        logger.info(
          {
            userId: ctx.user?.id,
            query: query.trim(),
            eventName: 'user_begin_search',
            gaEventTrackingReason,
          },
          'Skipping GA user_begin_search event because tracking is disabled',
        );
      }
      return generateDomainSuggestions(query, parentDomain, page, pageSize);
    }),

  /**
   * Stream domain availability results
   */
  /**
   * Subscription procedure — does NOT call `.output(...)` because tRPC v11
   * subscriptions infer their wire-output from the `async function*`
   * resolver's return type. The contract still pins the per-event shape
   * via `searchContract.streamDomainAvailability.output`, which the
   * runtime helper wraps in `AsyncIterable<...>` automatically.
   */
  streamDomainAvailability: authedOrPublicProcedure
    .input(searchContract.streamDomainAvailability.input)
    .subscription(async function* ({ input: { domains }, signal, ctx }) {
      if (domains.length === 0 || signal?.aborted) {
        yield* [];
        return;
      }

      // TODO: Replace requestId fallback with stable GA clientId from frontend (_ga/gtag).
      const clientId = ctx.sessionId ?? ctx.honoVars?.requestId ?? null;
      const gaEventTracking = ctx.user?.id
        ? await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id)
        : { trackGaEvents: true };
      const gaEventTrackingReason =
        'reason' in gaEventTracking
          ? (gaEventTracking.reason ?? 'DEFAULT')
          : 'DEFAULT';
      if ((ctx.user?.id || clientId) && gaEventTracking.trackGaEvents) {
        void gaEventUserBeginSearch({
          userId: ctx.user?.id,
          clientId,
          searchTerm: domains[0],
          parentDomain: ctx.poweredByNamefiDomain ?? undefined,
        });
      } else if (!gaEventTracking.trackGaEvents) {
        logger.info(
          {
            userId: ctx.user?.id,
            domain: domains[0],
            eventName: 'user_begin_search',
            gaEventTrackingReason,
          },
          'Skipping GA user_begin_search event because tracking is disabled',
        );
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
    .input(searchContract.checkFreeClaimEligibility.input)
    .output(searchContract.checkFreeClaimEligibility.output)
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
