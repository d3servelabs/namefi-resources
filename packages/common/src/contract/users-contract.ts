import { privyCustomMetadataSchema } from '../privy-custom-metadata';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the users router.
 *
 * The router (`apps/backend/src/trpc/routers/usersRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof usersContract>`. Middleware varies:
 * most procedures are `protectedProcedure`, `impersonateUser` uses
 * `auditedAdminProcedureWithPermissions(Permission.IMPERSONATE_USERS)`,
 * `getManagerPageEntrypointViewable` uses `authedOrPublicProcedure`,
 * `requestNfscFaucet` / `getNfscFaucetStatus` use `publicProcedure`, and
 * `updatePrivyCustomMetadata` / `setSubscribeToEmails` are wrapped in
 * `withAudit(protectedProcedure, ...)`. All middleware decisions stay at
 * the router file — the contract only pins IO shapes.
 *
 * Most complex aggregates (user rows, impersonation profiles, burned-domain
 * events) are modeled via `z.custom<T>()` escape hatches to avoid pulling
 * backend-only types into common.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const impersonateUserInputSchema = z.object({
  targetUserId: z.string().uuid(),
});

const requestNfscFaucetInputSchema = z.object({
  walletAddress: checksumWalletAddressSchema,
  altcha: z.string().nullable(),
});

const getNfscFaucetStatusInputSchema = z.object({
  workflowId: z.string().min(1),
});

const getUserQualifiesForDomainNamePromoInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const isDomainOwnedByCurrentUserInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const setSubscribeToEmailsInputSchema = z.object({
  optIn: z.boolean(),
});

const resolveEnsNameInputSchema = z.object({
  ensName: z.string().trim().min(1).max(255),
});

// ---------------------------------------------------------------------------
// Output type mirrors (opaque — modeled via z.custom<T>())
// ---------------------------------------------------------------------------

/**
 * User row returned by `getUser` / the `effectiveUser` field inside
 * `getImpersonationStatus`. Minimal structural mirror of
 * `usersTable.$inferSelect`.
 */
type UserRowLike = {
  createdAt: Date;
  updatedAt: Date;
  id: string;
  primaryEmail: string | null;
  stripeCustomerId: string | null;
  privyUserId: string;
  subscribeToEmails: boolean;
  lastSignInAt: Date | null;
  lastAccessedSessionAt: Date | null;
};

// TODO(contract): replace with a structural schema for the user row.
const userRowSchema = z.custom<UserRowLike>(() => true);

type ImpersonationProfileLike = {
  id: string;
  privyUserId: string;
  primaryEmail: string | null;
  displayName: string | null;
  walletAddresses: string[];
  mainWalletAddress: string | null;
};

// TODO(contract): replace with a structural schema for ImpersonationProfile.
const impersonationProfileSchema = z.custom<ImpersonationProfileLike>(
  () => true,
);

// TODO(contract): replace with a structural schema for Privy User.
const privyUserSchema = z.custom<unknown>(() => true);

const impersonatingStatusSchema = z.object({
  impersonating: z.literal(true),
  actorUserId: z.string(),
  targetUserId: z.string(),
  actor: impersonationProfileSchema.nullable(),
  target: impersonationProfileSchema.nullable(),
  targetPrivyUser: privyUserSchema.nullable(),
  effectiveUser: userRowSchema,
});

const notImpersonatingStatusSchema = z.object({
  impersonating: z.literal(false),
  actorUserId: z.string(),
  targetUserId: z.null(),
  actor: z.null(),
  target: z.null(),
  targetPrivyUser: z.null(),
  effectiveUser: userRowSchema,
});

const impersonationStatusOutputSchema = z.discriminatedUnion('impersonating', [
  impersonatingStatusSchema,
  notImpersonatingStatusSchema,
]);

// TODO(contract): replace with a structural schema for Permission enum.
const permissionSchema = z.custom<string>(() => true);

const requestNfscFaucetOutputSchema = z.union([
  z.object({
    status: z.literal('rate_limited'),
    walletAddress: checksumWalletAddressSchema,
    nextEligibleAt: z.date(),
    workflowId: z.undefined().optional(),
  }),
  z.object({
    status: z.literal('started'),
    workflowId: z.string(),
    walletAddress: checksumWalletAddressSchema,
    nextEligibleAt: z.date(),
  }),
]);

const getNfscFaucetStatusOutputSchema = z.union([
  z.object({
    status: z.literal('COMPLETED'),
    txHash: z.any(),
  }),
  z.object({
    status: z.string(),
    txHash: z.null(),
  }),
]);

const currentUserDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
  ownerAddress: z.string(),
  asOfBlockNumber: z.bigint(),
  tokenId: z.bigint(),
  expirationDate: z.date().nullable(),
  autoRenewEnabled: z.boolean(),
  autoEnsEnabled: z.boolean(),
  dateTokenized: z.date().nullable(),
  dnsStatus: z.object({
    nameservers: z.array(z.string()),
    isUsingNamefiNameservers: z.boolean(),
    isParkingEnabled: z.boolean(),
    forwardTo: z.string().nullable(),
    hasWebRecords: z.boolean(),
    hasMxRecords: z.boolean(),
    ensRecord: z.string().nullable(),
  }),
});

const currentUserDomainV2Schema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
  ownerAddress: z.string(),
  tokenId: z.bigint(),
  expirationDate: z.date().nullable(),
  autoRenewEnabled: z.boolean(),
  autoEnsEnabled: z.boolean(),
  dnssecEnabled: z.boolean(),
  dnsStatus: z.object({
    nameservers: z.array(z.string()),
    isUsingNamefiNameservers: z.boolean(),
    isParkingEnabled: z.boolean(),
    forwardTo: z.string().nullable(),
    hasWebRecords: z.boolean(),
    hasMxRecords: z.boolean(),
    hasEffectiveWebPresence: z.boolean(),
  }),
});

const registeredSubdomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  ownerAddress: z.string(),
  updatedAt: z.date(),
  priceInUsdCents: z.number(),
});

const qualifyingDomainSchema = z.object({
  qualifyingDomainName: z.string(),
  linkedAccountType: z.union([
    z.literal('email'),
    z.literal('github_oauth'),
    z.literal('twitter_oauth'),
    z.literal('wallet'),
  ]),
});

// TODO(contract): replace with structural schema for PreviouslyOwnedDomainEvent.
type PreviouslyOwnedDomainEventLike = {
  eventId: string;
  tokenId: string;
  normalizedDomainName: string;
  chainId: number;
  fromAddress: string;
  toAddress: string | null;
  removalType:
    | 'domain_exported'
    | 'domain_expired'
    | 'transferred_to_another_wallet';
  removalReason: string;
  removedAt: Date;
  removalTimestamp: bigint;
  removalBlock: bigint;
  transactionHash: string;
  expirationTimeAtRemoval: Date | null;
};

const previouslyOwnedDomainEventSchema =
  z.custom<PreviouslyOwnedDomainEventLike>(() => true);

const resolveEnsNameOutputSchema = z.object({
  ensName: z.string(),
  normalizedEnsName: z.string(),
  address: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const usersContract = createContract(
  { softOutput: true },
  {
    getImpersonationStatus: {
      type: 'query',
      input: z.void(),
      output: impersonationStatusOutputSchema,
    },
    impersonateUser: {
      type: 'mutation',
      input: impersonateUserInputSchema,
      output: z.object({ ok: z.literal(true) }),
    },
    stopImpersonating: {
      type: 'mutation',
      input: z.void(),
      output: z.object({ ok: z.literal(true) }),
    },
    getUser: {
      type: 'query',
      input: z.void(),
      output: userRowSchema,
    },
    getMyPermissions: {
      type: 'query',
      input: z.void(),
      output: z.array(permissionSchema),
    },
    requestNfscFaucet: {
      type: 'mutation',
      input: requestNfscFaucetInputSchema,
      output: requestNfscFaucetOutputSchema,
    },
    getNfscFaucetStatus: {
      type: 'query',
      input: getNfscFaucetStatusInputSchema,
      output: getNfscFaucetStatusOutputSchema,
    },
    updatePrivyCustomMetadata: {
      type: 'mutation',
      input: privyCustomMetadataSchema,
      output: privyCustomMetadataSchema,
    },
    getUserQualifiesForDomainNamePromo: {
      type: 'query',
      input: getUserQualifiesForDomainNamePromoInputSchema,
      output: z.boolean(),
    },
    getCurrentUserDomains: {
      type: 'query',
      input: z.void(),
      output: z.array(currentUserDomainSchema),
    },
    getCurrentUserDomainsV2: {
      type: 'query',
      input: z.void(),
      output: z.array(currentUserDomainV2Schema),
    },
    isDomainOwnedByCurrentUser: {
      type: 'query',
      input: isDomainOwnedByCurrentUserInputSchema,
      output: z.boolean(),
    },
    getManagerPageEntrypointViewable: {
      type: 'query',
      input: z.void(),
      output: z.object({ viewable: z.boolean() }),
    },
    getRegisteredSubdomainsForParentDomainOwner: {
      type: 'query',
      input: z.void(),
      output: z.array(registeredSubdomainSchema),
    },
    getUserQualifyingDomainNamesForPromo: {
      type: 'query',
      input: z.void(),
      output: z.array(qualifyingDomainSchema),
    },
    doesUserSubscribeToEmails: {
      type: 'query',
      input: z.void(),
      output: z.boolean(),
    },
    setSubscribeToEmails: {
      type: 'mutation',
      input: setSubscribeToEmailsInputSchema,
      output: z.object({
        success: z.boolean(),
        optIn: z.any(),
      }),
    },
    getCurrentUserBurnedDomains: {
      type: 'query',
      input: z.void(),
      output: z.array(previouslyOwnedDomainEventSchema),
    },
    resolveEnsName: {
      type: 'mutation',
      input: resolveEnsNameInputSchema,
      output: resolveEnsNameOutputSchema,
    },
  },
);

export type UsersContract = typeof usersContract;
