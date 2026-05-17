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
import pMap from 'p-map';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { resolveNs } from 'node:dns/promises';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { gaEventUserBeginSearch } from '#lib/tracking/checkout/events';
import { resolveWebCheckoutTracking } from '#lib/tracking/checkout/context';

export const searchRouter = createContractTRPCRouter<typeof searchContract>({
  isDomainAvailable: authedOrPublicProcedure
    .input(searchContract.isDomainAvailable.input)
    .output(searchContract.isDomainAvailable.output)
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
      return generateDomainSuggestions(query, parentDomain, page, pageSize);
    }),

  trackUserBeginSearch: authedOrPublicProcedure
    .input(searchContract.trackUserBeginSearch.input)
    .output(searchContract.trackUserBeginSearch.output)
    .mutation(async ({ input, ctx }) => {
      const searchTerm = input.query.trim();

      const parentDomain =
        input.parentDomain ?? ctx.poweredByNamefiDomain ?? undefined;
      const gaEventTracking = await resolveWebCheckoutTracking({
        userId: ctx.user?.id,
        gaIdentity: {
          clientId: ctx.gaClientId,
          sessionId: ctx.gaSessionId,
        },
        consentDomainName: ctx.consentDomainName,
        requestMeasurementConsentState: ctx.requestMeasurementConsentState,
        getMeasurementConsentAutoGranted: ctx.getMeasurementConsentAutoGranted,
      });
      const gaEventTrackingReason = gaEventTracking.reason ?? 'DEFAULT';

      if (gaEventTracking.trackGaEvents) {
        void gaEventUserBeginSearch({
          userId: ctx.user?.id,
          identity: gaEventTracking.identity,
          searchTerm,
          parentDomain,
        });
      } else {
        logger.info(
          {
            userId: ctx.user?.id,
            searchTerm,
            eventName: 'user_begin_search',
            gaEventTrackingReason,
          },
          'Skipping GA user_begin_search event because tracking is disabled',
        );
      }
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
    .subscription(async function* ({ input, signal, ctx }) {
      const { domains } = input;
      if (domains.length === 0 || signal?.aborted) {
        yield* [];
        return;
      }

      const remainingDomains = drop(1, domains);
      const firstDomainResult = settleAvailabilityBatch(
        getDomainListInfoWithAbortSignal(
          [domains[0] as NamefiNormalizedDomain],
          signal,
          ctx.user,
        ),
      );

      const nonTraditionalDomainsResult = settleAvailabilityBatch(
        getDomainListInfoWithAbortSignal(
          pickNonTraditionalDomains(remainingDomains),
          signal,
          ctx.user,
        ),
      );

      const chunks = [pickTraditionalDomains(remainingDomains)];

      const promises = chunks.map((names) =>
        settleAvailabilityBatch(
          getDomainListInfoWithAbortSignal(names, signal, ctx.user),
        ),
      );

      yield* await getAvailabilityBatch(firstDomainResult);
      yield* await getAvailabilityBatch(nonTraditionalDomainsResult);

      for (const promise of promises) {
        if (signal?.aborted) break;
        yield* await getAvailabilityBatch(promise);
      }
    }),

  checkFreeClaimEligibility: protectedProcedure
    .input(searchContract.checkFreeClaimEligibility.input)
    .output(searchContract.checkFreeClaimEligibility.output)
    .query(async ({ input, ctx }) => {
      const { domains } = input;
      const { user } = ctx;
      const { getUserUnusedClaims, checkItemClaimEligibility } = await import(
        '#temporal/activities/free-claim.activities'
      );

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

type AvailabilityBatchResult =
  | {
      status: 'fulfilled';
      value: DomainAvailabilityInfo[];
    }
  | {
      status: 'rejected';
      error: unknown;
    };

const settleAvailabilityBatch = async (
  promise: Promise<DomainAvailabilityInfo[]>,
): Promise<AvailabilityBatchResult> => {
  try {
    return {
      status: 'fulfilled',
      value: await promise,
    };
  } catch (error) {
    return {
      status: 'rejected',
      error,
    };
  }
};

const getAvailabilityBatch = async (
  promise: Promise<AvailabilityBatchResult>,
) => {
  const result = await promise;
  if (result.status === 'rejected') {
    logger.error({ error: result.error }, 'Search subscription error');
    throw result.error;
  }
  return result.value;
};

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
