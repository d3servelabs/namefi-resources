import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin users sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/adminUsersRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminUsersContract>`. Procedures use
 * `adminProcedureWithPermissions`.
 */

const searchUsersInputSchema = z.object({
  searchTerm: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(10),
});

/**
 * Mirror of `adminUserReferenceInput` from the router's user-details helper.
 * Exactly one of userId / privyUserId / walletAddress must be provided.
 */
const adminUserReferenceInputSchema = z
  .object({
    userId: z.string().uuid().optional(),
    privyUserId: z.string().min(1).optional(),
    walletAddress: checksumWalletAddressSchema.optional(),
  })
  .refine(
    (input) =>
      Number(Boolean(input.userId)) +
        Number(Boolean(input.privyUserId)) +
        Number(Boolean(input.walletAddress)) ===
      1,
    {
      message: 'Provide exactly one reference',
    },
  );

const getUserDetailsInputSchema = z.object({
  userId: z.string().uuid(),
  matchedWalletAddress: checksumWalletAddressSchema.optional(),
});

const getWalletDetailsInputSchema = z.object({
  walletAddress: checksumWalletAddressSchema,
});

const columnFilterSchema = z.object({
  id: z.string(),
  value: z.object({
    operator: z.enum(['like', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte']),
    value: z.union([z.string(), z.number(), z.date()]),
  }),
});

const sortingSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

const listUsersInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  domainSearchTerm: z.string().optional(),
  ensSearchTerm: z.string().optional(),
  columnFilters: z.array(columnFilterSchema).optional(),
  sorting: z.array(sortingSchema).optional(),
});

const listUsersV2InputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  domainSearchTerm: z.string().optional(),
  ensSearchTerm: z.string().optional(),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

/**
 * Structural mirrors of the large admin-user aggregates returned by the
 * handler file's helpers (`getAdminUserDetails`, `resolveAdminUserReference`,
 * etc.). These are declared as real `z.object(...)` schemas — not
 * `z.custom<T>()` — because tRPC's `TRPCOptionsProxy` collapses top-level
 * `z.custom<T>` / `z.any()` outputs to `() => never` at the
 * `queryOptions(...)` boundary, while `z.object` shapes propagate
 * cleanly through the whole client-side inference chain.
 *
 * The shapes mirror `apps/backend/dist/dts/src/trpc/routers/admin/adminUsersRouter.d.ts`
 * and its helpers — divergence is caught at the contract-assignment site
 * in the router file.
 */

const adminSearchUserRowSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  primaryEmail: z.string().nullable(),
  walletAddresses: z.array(z.string()),
  displayName: z.string().nullable(),
  twitterUsername: z.string().nullable(),
});

const adminUserRowsSchema = z.array(adminSearchUserRowSchema);

// `resolveAdminUserReference` returns one of three tagged-union variants.
const resolveUserReferenceOutputSchema = z.union([
  z.object({
    type: z.literal('user'),
    userId: z.string(),
    privyUserId: z.string(),
    matchedWalletAddress: z.string().nullable(),
  }),
  z.object({
    type: z.literal('wallet'),
    walletAddress: z.string(),
    linkedUserId: z.null(),
    linkedPrivyUserId: z.string().nullable(),
    primaryEmail: z.string().nullable(),
    displayName: z.string().nullable(),
  }),
  z.object({
    type: z.literal('user'),
    userId: z.string(),
    privyUserId: z.string(),
    matchedWalletAddress: z.string(),
  }),
]);

/**
 * `getUserDetails` returns a massive aggregate. The top-level shape and
 * the small nested objects are typed concretely; per-row item shapes use
 * `z.array(z.any())` so iteration callbacks get typed as `any`.
 */
const getUserDetailsOutputSchema = z.object({
  user: z.object({
    id: z.string(),
    privyUserId: z.string(),
    displayName: z.string().nullable(),
    primaryEmail: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastSignInAt: z.date().nullable(),
    stripeCustomerId: z.string().nullable(),
    isAdmin: z.boolean(),
    twitterUsername: z.string().nullable(),
    twitterDetails: z
      .object({
        username: z.string().optional(),
        name: z.string().optional(),
        subject: z.string().optional(),
        profilePictureUrl: z.string().optional(),
      })
      .nullable(),
    matchedWalletAddress: z.string().nullable(),
  }),
  contactInfo: z.any().nullable(),
  credentials: z.object({
    linkedAccounts: z.array(z.any()),
    apiKeys: z.array(z.any()),
  }),
  wallets: z.array(z.any()),
  paymentMethods: z.array(z.any()),
  domains: z.array(z.any()),
  orders: z.array(z.any()),
  cartItems: z.array(z.any()),
  wishlistItems: z.array(z.any()),
  freeClaims: z.array(z.any()),
  totals: z.object({
    walletCount: z.number(),
    nftCount: z.number(),
    domainCount: z.number(),
    orderCount: z.number(),
    cartItemCount: z.number(),
    wishlistCount: z.number(),
    freeClaimCount: z.number(),
    availableFreeClaimCount: z.number(),
    apiKeyCount: z.number(),
    activeApiKeyCount: z.number(),
    paymentMethodCount: z.number(),
    totalNfscBalanceInUsdCents: z.number(),
  }),
});

/**
 * `getWalletDetails` returns wallet-centric details. The top-level
 * fields the frontend reads are typed concretely.
 */
const getWalletDetailsOutputSchema = z
  .object({
    wallet: z
      .object({
        address: z.string(),
        isLinked: z.boolean(),
        linkedUserId: z.string().nullable(),
        linkedPrivyUserId: z.string().nullable(),
        linkedPrimaryEmail: z.string().nullable(),
        linkedDisplayName: z.string().nullable(),
      })
      .passthrough(),
    balances: z.array(z.any()),
    domains: z.array(z.any()),
    linkedAccounts: z.array(z.any()),
    contactInfo: z.any().nullable(),
    totals: z
      .object({
        totalNfscBalanceInUsdCents: z.number(),
        domainCount: z.number(),
        nftCount: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

const adminUserListRowSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  primaryEmail: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastSignInAt: z.date().nullable(),
  twitterUsername: z.string().nullable(),
  twitterDetails: z
    .object({
      username: z.string().optional(),
      name: z.string().optional(),
      subject: z.string().optional(),
      profilePictureUrl: z.string().optional(),
    })
    .nullable(),
  isAdmin: z.boolean(),
  displayName: z.string().nullable(),
  wallets: z.array(z.string()),
  nfts: z.array(
    z.object({
      chainId: z.number(),
      normalizedDomainName: z.string(),
      tokenId: z.string(),
      expirationTime: z.union([z.date(), z.string()]),
      ownerAddress: z.string(),
    }),
  ),
  nftCount: z.number(),
});

const adminUserListOutputSchema = z.object({
  items: z.array(adminUserListRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  cacheLastRefresh: z.date().nullable(),
  cacheExpiresAt: z.date().nullable(),
});

const privyCacheStatusSchema = z.object({
  success: z.boolean(),
  lastRefresh: z.date().nullable(),
  expiresAt: z.date().nullable(),
  recordCount: z.number(),
});

export const adminUsersContract = {
  searchUsers: {
    type: 'query',
    input: searchUsersInputSchema,
    output: adminUserRowsSchema,
  },
  resolveUserReference: {
    type: 'query',
    input: adminUserReferenceInputSchema,
    output: resolveUserReferenceOutputSchema,
  },
  getUserDetails: {
    type: 'query',
    input: getUserDetailsInputSchema,
    output: getUserDetailsOutputSchema,
  },
  getWalletDetails: {
    type: 'query',
    input: getWalletDetailsInputSchema,
    output: getWalletDetailsOutputSchema,
  },
  listUsers: {
    type: 'query',
    input: listUsersInputSchema,
    output: adminUserListOutputSchema,
  },
  listUsersV2: {
    type: 'query',
    input: listUsersV2InputSchema,
    output: adminUserListOutputSchema,
  },
  forceRefreshPrivyCache: {
    type: 'mutation',
    input: z.void(),
    output: privyCacheStatusSchema,
  },
} as const satisfies RouterContract;

export type AdminUsersContract = typeof adminUsersContract;
