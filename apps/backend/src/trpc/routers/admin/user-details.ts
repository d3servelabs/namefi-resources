import {
  apiKeysTable,
  cartItemsTable,
  db,
  freeClaimsTable,
  namefiNftCte,
  namefiNftView,
  orderItemsTable,
  ordersTable,
  usersTable,
  wishlistedDomainsTable,
} from '@namefi-astra/db';
import { privyStorageToPrivyCustomMetadata } from '@namefi-astra/common/privy-custom-metadata';
import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import type { User as PrivyUser } from '@privy-io/server-auth';
import { z } from 'zod';
import { logger } from '#lib/logger';
import { getUserChainBalances } from '#lib/payments/get-user-chain-balances';
import {
  checkItemClaimEligibility,
  getUserUnusedClaims,
} from '#temporal/activities/free-claim.activities';
import { getStripeCustomerPaymentMethods } from '#temporal/activities/payment.activities';
import {
  canUserAccessAdminPanel,
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../../utils';
import { privyUsersTableSchema } from '../../../services/admin/privy-user-cache';

export const adminUserReferenceInput = z
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

const getPrimaryWalletAddress = (
  privyUser: Pick<PrivyUser, 'wallet'>,
  walletAddresses: ChecksumWalletAddress[],
): ChecksumWalletAddress | null => {
  const privyWalletAddress =
    typeof privyUser?.wallet?.address === 'string'
      ? privyUser.wallet.address
      : null;

  if (privyWalletAddress) {
    return (
      walletAddresses.find(
        (walletAddress) =>
          walletAddress.toLowerCase() === privyWalletAddress.toLowerCase(),
      ) ?? null
    );
  }

  return walletAddresses[0] ?? null;
};

const getSafeChecksumWalletAddresses = (
  privyUser: PrivyUser,
): ChecksumWalletAddress[] => {
  const walletAddresses = getPrivyUserLinkedEthereumWalletAddresses({
    privyUser,
  });

  return walletAddresses
    .map((walletAddress) =>
      checksumWalletAddressSchema.safeParse(walletAddress),
    )
    .filter((result) => result.success)
    .map((result) => result.data);
};

const getStringProperty = (value: unknown, key: string) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const propertyValue = (value as Record<string, unknown>)[key];
  return typeof propertyValue === 'string' ? propertyValue : null;
};

const getDisplayName = ({
  primaryEmail,
  fallbackDisplayName,
}: {
  primaryEmail: string | null;
  fallbackDisplayName?: string | null;
}) => {
  if (fallbackDisplayName) {
    return fallbackDisplayName;
  }

  if (!primaryEmail) {
    return null;
  }

  return primaryEmail.split('@')[0] ?? null;
};

const parsePrivyCustomMetadata = (customMetadata: unknown) => {
  try {
    return privyStorageToPrivyCustomMetadata.parse(customMetadata);
  } catch (error) {
    logger.warn({ error }, 'Failed to parse Privy custom metadata');
    return {
      fullName: undefined,
      address: undefined,
    };
  }
};

const normalizeLinkedAccount = (
  linkedAccount: PrivyUser['linkedAccounts'][number],
) => {
  const type = getStringProperty(linkedAccount, 'type') ?? 'unknown';
  const address = getStringProperty(linkedAccount, 'address');
  const email =
    getStringProperty(linkedAccount, 'email') ??
    (type === 'email' ? address : null);
  const phoneNumber =
    getStringProperty(linkedAccount, 'number') ??
    getStringProperty(linkedAccount, 'phoneNumber');
  const subject = getStringProperty(linkedAccount, 'subject');
  const walletClientType = getStringProperty(linkedAccount, 'walletClientType');
  const chainType = getStringProperty(linkedAccount, 'chainType');
  const verifiedAt = getStringProperty(linkedAccount, 'verifiedAt');

  return {
    type,
    address,
    email,
    phoneNumber,
    subject,
    walletClientType,
    chainType,
    verifiedAt,
    displayValue: address ?? email ?? phoneNumber ?? subject ?? null,
  };
};

const getPrivyUserByWalletAddressSafely = async (walletAddress: string) => {
  try {
    return await privyClient.getUserByWalletAddress(walletAddress);
  } catch (error) {
    logger.warn(
      { error, walletAddress },
      'Failed to fetch Privy user by wallet address',
    );
    return null;
  }
};

const getPrivyUserByIdSafely = async (privyUserId: string) => {
  try {
    return await privyClient.getUserById(privyUserId);
  } catch (error) {
    logger.warn({ error, privyUserId }, 'Failed to fetch Privy user by ID');
    return null;
  }
};

const getCachedPrivyDetails = async (privyUserId: string) => {
  const rows = await db
    .select({
      displayName: privyUsersTableSchema.displayName,
      email: privyUsersTableSchema.email,
      twitterUsername: privyUsersTableSchema.twitterUsername,
      twitterDetails: privyUsersTableSchema.twitterDetails,
    })
    .from(privyUsersTableSchema)
    .where(eq(privyUsersTableSchema.privyUserId, privyUserId))
    .limit(1);

  return rows[0] ?? null;
};

const getWalletMatchCondition = (
  walletAddresses: string[],
): ReturnType<typeof or> | undefined => {
  const clauses = walletAddresses.map(
    (walletAddress) =>
      sql`LOWER(${namefiNftView.ownerAddress}) = ${walletAddress.toLowerCase()}`,
  );

  if (clauses.length === 0) {
    return undefined;
  }

  return or(...clauses);
};

const getNamefiNftsByWalletAddresses = async (walletAddresses: string[]) => {
  const walletCondition = getWalletMatchCondition(walletAddresses);

  if (!walletCondition) {
    return [];
  }

  return await db
    .with(namefiNftCte)
    .select({
      chainId: namefiNftView.chainId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      tokenId: sql<string>`${namefiNftView.tokenId}::text`.as('token_id'),
      expirationTime: namefiNftView.expirationTime,
      ownerAddress: namefiNftView.ownerAddress,
    })
    .from(namefiNftView)
    .where(walletCondition)
    .orderBy(
      asc(namefiNftView.normalizedDomainName),
      asc(namefiNftView.chainId),
    );
};

const getOrdersForUser = async (userId: string) => {
  const orders = await db.query.ordersTable.findMany({
    where: eq(ordersTable.userId, userId),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
  });

  if (orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const orderItems = await db.query.orderItemsTable.findMany({
    where: inArray(orderItemsTable.orderId, orderIds),
    columns: {
      orderId: true,
      normalizedDomainName: true,
      status: true,
      type: true,
      amountInUSDCents: true,
      createdAt: true,
    },
    orderBy: (table, { asc: orderAsc }) => [orderAsc(table.createdAt)],
  });

  const itemsByOrderId = new Map<string, Array<(typeof orderItems)[number]>>();
  for (const item of orderItems) {
    const items = itemsByOrderId.get(item.orderId) ?? [];
    items.push(item);
    itemsByOrderId.set(item.orderId, items);
  }

  return orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];

    return {
      ...order,
      itemCount: items.length,
      domains: items.map((item) => item.normalizedDomainName),
      items,
    };
  });
};

const getCartItemsForUser = async (userId: string) => {
  const cartItems = await db.query.cartItemsTable.findMany({
    where: eq(cartItemsTable.userId, userId),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
  });
  const unusedClaims = await getUserUnusedClaims(userId);

  return cartItems.map((item) => ({
    ...item,
    claims: checkItemClaimEligibility(
      item.normalizedDomainName as NamefiNormalizedDomain,
      unusedClaims,
    ),
  }));
};

const getWishlistItemsForUser = async (userId: string) => {
  return await db.query.wishlistedDomainsTable.findMany({
    where: eq(wishlistedDomainsTable.userId, userId),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
  });
};

const getFreeClaimsForUser = async (userId: string) => {
  const now = new Date();
  const claims = await db.query.freeClaimsTable.findMany({
    where: eq(freeClaimsTable.userId, userId),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
  });

  return claims.map((claim) => ({
    ...claim,
    isExpired: Boolean(claim.expirationDate && claim.expirationDate < now),
  }));
};

const getApiKeysForUser = async (userId: string) => {
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      type: apiKeysTable.type,
      keyPrefix: apiKeysTable.keyPrefix,
      expiresAt: apiKeysTable.expiresAt,
      revokedAt: apiKeysTable.revokedAt,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .orderBy(desc(apiKeysTable.createdAt));

  return keys.map((key) => ({
    ...key,
    isActive: !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
    isExpired: Boolean(key.expiresAt && key.expiresAt <= new Date()),
  }));
};

const getPaymentMethodsForUser = async (stripeCustomerId: string | null) => {
  if (!stripeCustomerId) {
    return [];
  }

  try {
    return await getStripeCustomerPaymentMethods({ stripeCustomerId });
  } catch (error) {
    logger.warn(
      { error, stripeCustomerId },
      'Failed to fetch Stripe payment methods for admin user details',
    );
    return [];
  }
};

const getDbUserByPrivyUserId = async (privyUserId: string) => {
  return await db.query.usersTable.findFirst({
    where: eq(usersTable.privyUserId, privyUserId),
  });
};

const getDbUserByUserId = async (userId: string) => {
  return await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
};

const buildWalletSummaries = ({
  walletAddresses,
  primaryWalletAddress,
  chainBalances,
  domains,
}: {
  walletAddresses: string[];
  primaryWalletAddress: string | null;
  chainBalances: Awaited<ReturnType<typeof getUserChainBalances>>;
  domains: Awaited<ReturnType<typeof getNamefiNftsByWalletAddresses>>;
}) => {
  return walletAddresses.map((walletAddress) => {
    const walletBalances = chainBalances
      .filter(
        (chainBalance) =>
          chainBalance.walletAddress.toLowerCase() ===
          walletAddress.toLowerCase(),
      )
      .map((chainBalance) => ({
        ...chainBalance,
        balanceInUsd: chainBalance.balanceInUsdCents / 100,
      }));
    const walletDomains = domains.filter(
      (domain) =>
        domain.ownerAddress.toLowerCase() === walletAddress.toLowerCase(),
    );

    return {
      address: walletAddress,
      isPrimary:
        primaryWalletAddress?.toLowerCase() === walletAddress.toLowerCase(),
      nfscBalances: walletBalances,
      totalBalanceInUsdCents: walletBalances.reduce(
        (sum, walletBalance) => sum + walletBalance.balanceInUsdCents,
        0,
      ),
      nftCount: walletDomains.length,
      domainCount: walletDomains.length,
    };
  });
};

const getUserResolutionOrThrow = (
  user: Awaited<ReturnType<typeof getDbUserByUserId>>,
) => {
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  return {
    type: 'user' as const,
    userId: user.id,
    privyUserId: user.privyUserId,
    matchedWalletAddress: null,
  };
};

const getWalletResolution = ({
  walletAddress,
  linkedPrivyUserId,
  primaryEmail,
  displayName,
}: {
  walletAddress: string;
  linkedPrivyUserId: string | null;
  primaryEmail: string | null;
  displayName: string | null;
}) => ({
  type: 'wallet' as const,
  walletAddress,
  linkedUserId: null,
  linkedPrivyUserId,
  primaryEmail,
  displayName,
});

const resolveAdminUserReferenceByPrivyUserId = async (privyUserId: string) => {
  const user = await getDbUserByPrivyUserId(privyUserId);

  if (user) {
    return {
      type: 'user' as const,
      userId: user.id,
      privyUserId: user.privyUserId,
      matchedWalletAddress: null,
    };
  }

  const privyUser = await getPrivyUserByIdSafely(privyUserId);
  if (!privyUser) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  const walletAddresses = getSafeChecksumWalletAddresses(privyUser);
  const primaryWalletAddress = getPrimaryWalletAddress(
    privyUser,
    walletAddresses,
  );

  if (!primaryWalletAddress) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No wallet found for this Privy user',
    });
  }

  return getWalletResolution({
    walletAddress: primaryWalletAddress,
    linkedPrivyUserId: privyUser.id,
    primaryEmail: privyUser.email?.address ?? null,
    displayName: getDisplayName({
      primaryEmail: privyUser.email?.address ?? null,
    }),
  });
};

const resolveAdminUserReferenceByWalletAddress = async (
  walletAddress: string,
) => {
  const privyUser = await getPrivyUserByWalletAddressSafely(walletAddress);

  if (!privyUser) {
    return getWalletResolution({
      walletAddress,
      linkedPrivyUserId: null,
      primaryEmail: null,
      displayName: null,
    });
  }

  const user = await getDbUserByPrivyUserId(privyUser.id);
  if (user) {
    return {
      type: 'user' as const,
      userId: user.id,
      privyUserId: user.privyUserId,
      matchedWalletAddress: walletAddress,
    };
  }

  return getWalletResolution({
    walletAddress,
    linkedPrivyUserId: privyUser.id,
    primaryEmail: privyUser.email?.address ?? null,
    displayName: getDisplayName({
      primaryEmail: privyUser.email?.address ?? null,
    }),
  });
};

export async function resolveAdminUserReference(
  input: z.infer<typeof adminUserReferenceInput>,
) {
  if (input.userId) {
    const user = await getDbUserByUserId(input.userId);
    return getUserResolutionOrThrow(user);
  }

  if (input.privyUserId) {
    return await resolveAdminUserReferenceByPrivyUserId(input.privyUserId);
  }

  if (!input.walletAddress) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Wallet address is required',
    });
  }

  return await resolveAdminUserReferenceByWalletAddress(input.walletAddress);
}

export async function getAdminUserDetails({
  userId,
  matchedWalletAddress,
}: {
  userId: string;
  matchedWalletAddress?: string | null;
}) {
  const user = await getDbUserByUserId(userId);
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  const privyUser = await getPrivyUserByIdSafely(user.privyUserId);
  if (!privyUser) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Could not find user details',
    });
  }

  const [
    cachedPrivyDetails,
    isAdmin,
    orders,
    cartItems,
    wishlistItems,
    freeClaims,
    apiKeys,
  ] = await Promise.all([
    getCachedPrivyDetails(user.privyUserId),
    canUserAccessAdminPanel({ id: user.id, privyUserId: user.privyUserId }),
    getOrdersForUser(user.id),
    getCartItemsForUser(user.id),
    getWishlistItemsForUser(user.id),
    getFreeClaimsForUser(user.id),
    getApiKeysForUser(user.id),
  ]);

  const walletAddresses = getSafeChecksumWalletAddresses(privyUser);
  const primaryWalletAddress = getPrimaryWalletAddress(
    privyUser,
    walletAddresses,
  );

  const [domains, chainBalances, paymentMethods] = await Promise.all([
    getNamefiNftsByWalletAddresses(walletAddresses),
    getUserChainBalances(walletAddresses),
    getPaymentMethodsForUser(user.stripeCustomerId),
  ]);

  const customMetadata = parsePrivyCustomMetadata(privyUser.customMetadata);
  const wallets = buildWalletSummaries({
    walletAddresses,
    primaryWalletAddress,
    chainBalances,
    domains,
  });
  const totalNfscBalanceInUsdCents = chainBalances.reduce(
    (sum, chainBalance) => sum + chainBalance.balanceInUsdCents,
    0,
  );
  const availableFreeClaims = freeClaims.filter(
    (claim) => !claim.isExpired && claim.claimingStatus === 'IDLE',
  );

  return {
    user: {
      id: user.id,
      privyUserId: user.privyUserId,
      displayName: getDisplayName({
        primaryEmail: user.primaryEmail ?? privyUser.email?.address ?? null,
        fallbackDisplayName: cachedPrivyDetails?.displayName ?? null,
      }),
      primaryEmail: user.primaryEmail ?? privyUser.email?.address ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignInAt: user.lastSignInAt,
      stripeCustomerId: user.stripeCustomerId,
      isAdmin,
      twitterUsername: cachedPrivyDetails?.twitterUsername ?? null,
      twitterDetails: cachedPrivyDetails?.twitterDetails ?? null,
      matchedWalletAddress: matchedWalletAddress ?? null,
    },
    contactInfo: {
      primaryEmail: user.primaryEmail ?? privyUser.email?.address ?? null,
      phoneNumber: privyUser.phone?.number ?? null,
      fullName: customMetadata.fullName ?? null,
      address: customMetadata.address ?? null,
      twitterUsername: cachedPrivyDetails?.twitterUsername ?? null,
      twitterDetails: cachedPrivyDetails?.twitterDetails ?? null,
    },
    credentials: {
      linkedAccounts: (privyUser.linkedAccounts ?? []).map(
        normalizeLinkedAccount,
      ),
      apiKeys,
    },
    wallets,
    paymentMethods,
    domains,
    orders,
    cartItems,
    wishlistItems,
    freeClaims,
    totals: {
      walletCount: walletAddresses.length,
      nftCount: domains.length,
      domainCount: domains.length,
      orderCount: orders.length,
      cartItemCount: cartItems.length,
      wishlistCount: wishlistItems.length,
      freeClaimCount: freeClaims.length,
      availableFreeClaimCount: availableFreeClaims.length,
      apiKeyCount: apiKeys.length,
      activeApiKeyCount: apiKeys.filter((apiKey) => apiKey.isActive).length,
      paymentMethodCount: paymentMethods.length,
      totalNfscBalanceInUsdCents,
    },
  };
}

export async function getAdminWalletDetails({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const checksummedWalletAddress =
    checksumWalletAddressSchema.parse(walletAddress);
  const privyUser = await getPrivyUserByWalletAddressSafely(
    checksummedWalletAddress,
  );
  const linkedUser = privyUser
    ? await getDbUserByPrivyUserId(privyUser.id)
    : null;
  const cachedPrivyDetails = privyUser
    ? await getCachedPrivyDetails(privyUser.id)
    : null;
  const chainBalances = await getUserChainBalances([checksummedWalletAddress]);
  const domains = await getNamefiNftsByWalletAddresses([
    checksummedWalletAddress,
  ]);
  const customMetadata = parsePrivyCustomMetadata(privyUser?.customMetadata);
  const totalNfscBalanceInUsdCents = chainBalances.reduce(
    (sum, chainBalance) => sum + chainBalance.balanceInUsdCents,
    0,
  );

  return {
    wallet: {
      address: checksummedWalletAddress,
      isLinked: Boolean(linkedUser),
      linkedUserId: linkedUser?.id ?? null,
      linkedPrivyUserId: linkedUser?.privyUserId ?? privyUser?.id ?? null,
      linkedPrimaryEmail:
        linkedUser?.primaryEmail ?? privyUser?.email?.address ?? null,
      linkedDisplayName: getDisplayName({
        primaryEmail:
          linkedUser?.primaryEmail ?? privyUser?.email?.address ?? null,
        fallbackDisplayName: cachedPrivyDetails?.displayName ?? null,
      }),
    },
    balances: chainBalances.map((chainBalance) => ({
      ...chainBalance,
      balanceInUsd: chainBalance.balanceInUsdCents / 100,
    })),
    domains,
    linkedAccounts: (privyUser?.linkedAccounts ?? []).map(
      normalizeLinkedAccount,
    ),
    contactInfo: privyUser
      ? {
          primaryEmail:
            linkedUser?.primaryEmail ?? privyUser.email?.address ?? null,
          phoneNumber: privyUser.phone?.number ?? null,
          fullName: customMetadata.fullName ?? null,
          address: customMetadata.address ?? null,
          twitterUsername: cachedPrivyDetails?.twitterUsername ?? null,
          twitterDetails: cachedPrivyDetails?.twitterDetails ?? null,
        }
      : null,
    totals: {
      totalNfscBalanceInUsdCents,
      domainCount: domains.length,
      nftCount: domains.length,
    },
  };
}
