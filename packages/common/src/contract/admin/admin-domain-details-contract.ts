import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';

/**
 * Contract for the admin domain-details sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/domainDetailsRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminDomainDetailsContract>`.
 *
 * One read-only query that aggregates everything the per-domain admin
 * modal needs in a single round-trip — registration / NFT, owning user,
 * domain preferences, and the cached NS/DNSSEC indexed snapshot. All
 * mutations stay on the existing `admin.nsAndDnssec.*` and
 * `admin.domainPreferences.*` sub-routers.
 */

const domainNameInputSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

const registrationSchema = z.object({
  chainId: z.number(),
  tokenId: z.string(),
  normalizedDomainName: z.string(),
  ownerAddress: z.string().nullable(),
  registrarKey: z.string().nullable(),
  expirationTime: z.date().nullable(),
  /**
   * Earliest `block_timestamp` for this NFT in the Ponder TransferLog.
   * Effectively the on-chain mint time. Null when Ponder has no transfer
   * record for the token (lookup failed or the index hasn't caught up).
   */
  dateTokenized: z.date().nullable(),
  /**
   * Last refresh of the indexed NFT row, from `namefiNftView`.
   */
  lastUpdatedTimestamp: z.date().nullable(),
});

const userSchema = z
  .object({
    id: z.string(),
    privyUserId: z.string().nullable(),
  })
  .nullable();

const preferencesSchema = z.object({
  autoRenewEnabled: z.boolean().nullable(),
  autoEnsEnabled: z.boolean().nullable(),
  autoParkEnabled: z.boolean().nullable(),
  forwardTo: z.string().nullable(),
});

const nsCachedSchema = z
  .object({
    nameservers: z.array(z.string()),
    isUsingNamefiNameservers: z.boolean(),
  })
  .nullable();

/**
 * Mirror of `IndexedDomainDnssecStatus` from
 * `packages/db/src/schema.ts:1028`. Inline so this contract stays
 * self-contained.
 */
const dnssecCachedSchema = z
  .object({
    supportsDnssec: z.boolean(),
    hasDelegationSigner: z.boolean(),
    isUsingNamefiDelegationSigner: z.boolean(),
    zoneHasActiveDnssec: z.boolean(),
  })
  .nullable();

const getDomainAdminDetailsOutputSchema = z.object({
  registration: registrationSchema,
  user: userSchema,
  preferences: preferencesSchema,
  nsCached: nsCachedSchema,
  dnssecCached: dnssecCachedSchema,
  dnssecLastUpdatedAt: z.date().nullable(),
});

export const adminDomainDetailsContract = createContract(
  { softOutput: true },
  {
    getDomainAdminDetails: {
      type: 'query',
      input: domainNameInputSchema,
      output: getDomainAdminDetailsOutputSchema,
    },
  },
);

export type AdminDomainDetailsContract = typeof adminDomainDetailsContract;
