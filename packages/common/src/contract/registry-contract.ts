import {
  type checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { normalizeDomainName } from '@namefi-astra/zod-dns';
import { z } from 'zod';

import type { DomainAvailabilityInfo } from '../domain-availability';
import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Schema for an array of domain names that the server normalizes
 * (lowercases, strips trailing dots, etc.) before branding them as
 * `NamefiNormalizedDomain`. Mirrors the `parseNormalizedDomainsArraySchema`
 * the original `registryRouter` defined inline — kept here so the contract
 * preserves the same wire behavior (clients send plain `string[]`, the
 * server normalizes).
 */
const parseNormalizedDomainsArraySchema = z.array(
  z.string().transform(normalizeDomainName).pipe(namefiNormalizedDomainSchema),
);

/**
 * Contract for the registry router.
 *
 * The router (`apps/backend/src/trpc/routers/registryRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof registryContract>`. All procedures use
 * `authedOrPublicProcedure` or `publicProcedure` — the contract doesn't
 * care which.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const domainListInputSchema = z.object({
  domains: parseNormalizedDomainsArraySchema,
});

const domainInputSchema = z.object({
  domain: namefiNormalizedDomainSchema.describe(
    'The domain to check availability for',
  ),
});

const queryDomainInputSchema = z.object({
  query: z.string(),
  parentDomains: z.array(namefiNormalizedDomainSchema).optional().default([]),
});

const getDomainsByOwnerInputSchema = z.object({
  identifier: z
    .string()
    .min(1)
    .describe('Wallet address or ENS name to retrieve NFT ownership data')
    .transform((value) => value.trim()),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

// TODO(contract): replace with a structural zod schema for DomainAvailabilityInfo.
// `DomainAvailabilityInfo` lives at `@namefi-astra/common/domain-availability`
// as a TS type only — it's a deeply-nested aggregate that's painful to
// re-express in zod. The escape hatch keeps full type information flowing
// through to consumers without runtime structural validation.
const domainAvailabilityInfoSchema = z.custom<DomainAvailabilityInfo>(
  () => true,
);

const getDomainListInfoOutputSchema = z.array(domainAvailabilityInfoSchema);

const getDomainInfoOutputSchema = z.union([
  domainAvailabilityInfoSchema,
  z.object({
    domain: namefiNormalizedDomainSchema,
    availability: z.boolean(),
  }),
]);

/**
 * Mirror of the backend's `TldPricingInfo` (defined in
 * `apps/backend/src/lib/namefi-registry.ts`). `registrarKey` is a string
 * literal union from `@namefi-astra/registrars` — represented here as a
 * plain `string` so common doesn't need a registrars dep. Divergence is
 * caught at the contract-assignment site in the router.
 */
export type TldPricingInfoLike = {
  tld: string;
  registrarKey: string;
  registrationPriceUsdPerYear: number | null;
  renewalPriceUsdPerYear: number | null;
  transferPriceUsdPerYear: number | null;
};

// TODO(contract): replace with a structural zod schema for TldPricingInfo.
const tldPricingInfoSchema = z.custom<TldPricingInfoLike>(() => true);

const getTldPricingTableOutputSchema = z.array(tldPricingInfoSchema);

const getDomainsByOwnerOutputSchema = z.object({
  walletAddress: z.string(),
  ensName: z.string().nullable(),
  domains: z.array(
    z.object({
      normalizedDomainName: namefiNormalizedDomainSchema,
      chainId: z.number(),
      ownerAddress: z.string(),
      tokenId: z.string().nullable(),
      expirationTime: z.date().nullable(),
    }),
  ),
});

// `checksumWalletAddressSchema` is unused in this contract for now but is
// imported to keep parity with how the router validates incoming
// identifiers. Re-exported as a type for any downstream consumer that
// wants to type its inputs against the same brand.
export type ChecksumWalletAddress = z.output<
  typeof checksumWalletAddressSchema
>;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const registryContract = createContract(
  { softOutput: true },
  {
    getDomainListInfo: {
      type: 'query',
      input: domainListInputSchema,
      output: getDomainListInfoOutputSchema,
    },
    getDomainInfo: {
      type: 'query',
      input: domainInputSchema,
      output: getDomainInfoOutputSchema,
    },
    getTldPricingTable: {
      type: 'query',
      input: z.void(),
      output: getTldPricingTableOutputSchema,
    },
    getDomainsByOwner: {
      type: 'query',
      input: getDomainsByOwnerInputSchema,
      output: getDomainsByOwnerOutputSchema,
    },
    queryDomain: {
      type: 'query',
      input: queryDomainInputSchema,
      output: getDomainListInfoOutputSchema,
    },
    get0xDotCityPercentageRollout: {
      type: 'query',
      input: z.void(),
      output: z.number(),
    },
  },
);

export type RegistryContract = typeof registryContract;
