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

const currentUserDomainV1Schema = z.object({
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

/**
 * Optimistic NFT operation states exposed alongside a domain. `IDLE` means no
 * deferred on-chain operation is in flight; the others mirror an in-flight
 * mint / expiration change / lock change shown before the indexer reflects it.
 */
export const nftPendingChangeTypeSchema = z.enum([
  'MINTING',
  'CHANGING_EXPIRATION',
  'CHANGING_LOCK',
]);
export type NftPendingChangeType = z.infer<typeof nftPendingChangeTypeSchema>;

export const nftPendingStateSchema = z.enum([
  'IDLE',
  'MINTING',
  'CHANGING_EXPIRATION',
  'CHANGING_LOCK',
]);
export type NftPendingState = z.infer<typeof nftPendingStateSchema>;

const currentUserDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
  ownerAddress: z.string(),
  tokenId: z.bigint(),
  expirationDate: z.date().nullable(),
  autoRenewEnabled: z.boolean(),
  autoEnsEnabled: z.boolean(),
  dnssecEnabled: z.boolean(),
  // Dominant in-flight NFT operation for this domain (IDLE when none). When a
  // deferred mint/expiration/lock op is pending, the row's expirationDate /
  // ownership reflect the optimistic state and `pendingNftTxHash` is '0x0'.
  nftState: nftPendingStateSchema.default('IDLE'),
  // Full set of concurrently in-flight operations (empty when none).
  pendingNftStates: z.array(nftPendingChangeTypeSchema).default([]),
  // '0x0' placeholder while any NFT op is pending, else null.
  pendingNftTxHash: z.string().nullable().default(null),
  // Earliest mint event blockTime for this token, sourced from
  // managed_indexer_data.TransferLog. Null when the indexer hasn't seen the
  // mint yet.
  dateTokenized: z.date().nullable(),
  // ID of the earliest SUCCEEDED order item that produced this domain, so the
  // UI can deep-link from My Domains → /orders/<orderId>/details. Null when
  // the domain wasn't acquired through an order (e.g. imported / manually
  // minted).
  orderId: z.string().nullable(),
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

/**
 * Shared row schema for the current user's own login history (profile → Security tab).
 * Mirrors the admin row shape minus PII like email — the client already knows who
 * it is authenticated as, so we don't re-ship user identity fields here.
 */
const myLoginHistoryRowSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().nullable(),
  signedInAt: z.date(),
  lastAccessedAt: z.date(),
  ipAddress: z.string().nullable(),
  os: z.string().nullable(),
  browser: z.string().nullable(),
  device: z.string().nullable(),
  loginMethod: z.string().nullable(),
  geoCity: z.string().nullable(),
  geoSubdivision: z.string().nullable(),
  geoRegionCode: z.string().nullable(),
  isNewIp: z.boolean(),
  isNewLocation: z.boolean(),
  /**
   * True when the browser fingerprint wasn't seen on this user's prior
   * 90 days. Always false for sign-ins that didn't carry a fingerprint
   * (privacy mode, blocker, non-browser caller).
   */
  isNewFingerprint: z.boolean(),
  isFirstSession: z.boolean(),
  /**
   * True iff *any* of (IP, location, fingerprint) matched a prior 90-day
   * session — the OR-of-knowns recognition rule. Drives whether the
   * profile row gets the alarm treatment + recognize/reject buttons.
   */
  systemRecognizedSessionDetails: z.boolean(),
  /** Tri-state: null = no decision, true = recognized, false = rejected. */
  userRecognizedSessionDetails: z.boolean().nullable(),
});

const listMyLoginHistoryInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

const listMyLoginHistoryOutputSchema = z.object({
  items: z.array(myLoginHistoryRowSchema),
});

const acknowledgeLoginSessionInputSchema = z.object({
  id: z.string().uuid(),
  /** null clears the user's prior decision (undo). */
  recognized: z.boolean().nullable(),
});

const acknowledgeLoginSessionOutputSchema = z.object({
  ok: z.literal(true),
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
    getCurrentUserDomainsV1: {
      type: 'query',
      input: z.void(),
      output: z.array(currentUserDomainV1Schema),
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
    listMyLoginHistory: {
      type: 'query',
      input: listMyLoginHistoryInputSchema,
      output: listMyLoginHistoryOutputSchema,
    },
    acknowledgeLoginSession: {
      type: 'mutation',
      input: acknowledgeLoginSessionInputSchema,
      output: acknowledgeLoginSessionOutputSchema,
    },
  },
);

export type UsersContract = typeof usersContract;
export type MyLoginHistoryRow = z.infer<typeof myLoginHistoryRowSchema>;
