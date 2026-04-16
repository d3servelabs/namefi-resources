import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { DomainAvailabilityInfo } from '../domain-availability';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the search router.
 *
 * The router (`apps/backend/src/trpc/routers/searchRouter.ts`) is type-checked
 * against this contract via `createContractTRPCRouter<typeof searchContract>`.
 *
 * **First contract that exercises the `'subscription'` branch** of
 * `ProcedureFor`. The `streamDomainAvailability` procedure is implemented as
 * an `async function*` on the backend; the contract's `output` declares the
 * per-event shape (`DomainAvailabilityInfo`) and the runtime helper wraps
 * it in `AsyncIterable<...>` automatically. The router file does **not**
 * call `.output(...)` on the subscription chain — see the
 * `apps/backend/src/trpc/__subscription-contract-test.ts` proof file.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const isDomainAvailableInputSchema = z.object({
  domain: namefiNormalizedDomainSchema.describe(
    'The domain to check availability for',
  ),
});

const getDomainSuggestionsInputSchema = z.object({
  query: z.string().min(1),
  parentDomain: z.string().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

const streamDomainAvailabilityInputSchema = z.object({
  domains: z.array(namefiNormalizedDomainSchema).min(1),
});

const checkFreeClaimEligibilityInputSchema = z.object({
  domains: z
    .array(namefiNormalizedDomainSchema)
    .min(1)
    .describe('Array of domains to check for free claim eligibility'),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

// TODO(contract): replace with a structural zod schema for DomainAvailabilityInfo.
const domainAvailabilityInfoSchema = z.custom<DomainAvailabilityInfo>(
  () => true,
);

interface Tag {
  id: string;
  name: string;
  description: string;
}
type ClubsCategoryWithStats = {
  tagDetails: Tag;
  tag: string;
  distinctOwnerAddressesArray: string;
  distinctChainIds: number;
  countPerChainId: Record<number, number>;
  countTotal: number;
  amountSpentInUsdCents: number;
  amountSpentInUsdCentsInLast30Days: number;
};

const tagSchema = z.custom<Tag>(() => true);
const clubsCategoryWithStatsSchema = z.custom<ClubsCategoryWithStats>(
  () => true,
);

const getClubsCategoriesWithStatsOutputSchema = z.array(
  clubsCategoryWithStatsSchema,
);

/**
 * Mirror of `DomainSuggestionsResult` from
 * `apps/backend/src/lib/domain-suggestions.ts`. Modeled structurally so
 * common doesn't need a backend import.
 */
const domainSuggestionsResultSchema = z.object({
  domains: z.array(namefiNormalizedDomainSchema),
  page: z.number(),
  totalPages: z.number(),
  nextPage: z.number().nullable(),
  pageSize: z.number(),
});

const checkFreeClaimEligibilityOutputSchema = z.array(
  z.object({
    domain: namefiNormalizedDomainSchema,
    eligible: z.boolean(),
    eligibility: z.array(
      z.object({
        groupOrCampaignKey: z.string(),
        claimsAvailable: z.number(),
        hasExactMatch: z.boolean(),
        hasParentMatch: z.boolean(),
      }),
    ),
  }),
);

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const searchContract = {
  isDomainAvailable: {
    type: 'query',
    input: isDomainAvailableInputSchema,
    output: domainAvailabilityInfoSchema,
  },
  getClubsCategoriesWithStats: {
    type: 'query',
    input: z.void(),
    output: getClubsCategoriesWithStatsOutputSchema,
  },
  getDomainSuggestions: {
    type: 'query',
    input: getDomainSuggestionsInputSchema,
    output: domainSuggestionsResultSchema,
  },
  /**
   * Streams `DomainAvailabilityInfo` events as the backend resolves each
   * domain. The output schema describes a SINGLE event; tRPC v11 wraps
   * the resolver's `async function*` return as `AsyncIterable<Event>`
   * automatically.
   */
  streamDomainAvailability: {
    type: 'subscription',
    input: streamDomainAvailabilityInputSchema,
    output: domainAvailabilityInfoSchema,
  },
  checkFreeClaimEligibility: {
    type: 'query',
    input: checkFreeClaimEligibilityInputSchema,
    output: checkFreeClaimEligibilityOutputSchema,
  },
} as const satisfies RouterContract;

export type SearchContract = typeof searchContract;
