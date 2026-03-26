import {
  db,
  namefiNftOwnersView,
  namefiNftOwnersCte,
  indexedDomainsTable,
  domainConfigTable,
  dnsRecordsTable,
  cartItemsTable,
  orderItemsTable,
  ordersTable,
  freeClaimSelectSchema,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, getTableColumns, ilike, inArray } from 'drizzle-orm';
import { isEmpty, isNil, pluck, isNotNil } from 'ramda';
import { z } from 'zod';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { nftIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { logger } from '#lib/logger';
import {
  requestNfscFaucet,
  requestNfscFaucetForPrimaryWallet,
} from '#lib/faucet/nfsc-faucet';
import { getDomainsExpirationDatesFromIndex } from '../../temporal/activities/domain/renew.activities';
import {
  getUserUnusedClaims,
  checkItemClaimEligibility,
} from '#temporal/activities/free-claim.activities';

// ============================================================================
// Output Schemas for OpenAPI
// ============================================================================

const dnsStatusSchema = z.object({
  nameservers: z.array(z.string()),
  isUsingNamefiNameservers: z.boolean(),
  isParkingEnabled: z.boolean(),
  forwardTo: z.string().nullable(),
  hasWebRecords: z.boolean(),
  hasMxRecords: z.boolean(),
  ensRecord: z.string().nullable(),
});

const userDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  chainId: z.number(),
  ownerAddress: z.string(),
  tokenId: z.string(),
  expirationDate: z.date().nullable(),
  dnsStatus: dnsStatusSchema,
});

const nfscFaucetResponseSchema = z.object({
  status: z.literal('started'),
  workflowId: z.string(),
  walletAddress: checksumWalletAddressSchema,
  nextEligibleAt: z.date(),
});

// Schema for claim eligibility output
const claimEligibilitySchema = z.object({
  groupOrCampaignKey: z.string(),
  claimsAvailable: z.number(),
  exactMatchClaims: z.array(freeClaimSelectSchema),
  parentMatchClaims: z.array(freeClaimSelectSchema),
});

// Cart item metadata schema
const cartItemMetadataSchema = z
  .object({
    freeClaim: z.boolean().optional(),
    groupOrCampaignKey: z.string().optional(),
    claimId: z.string().optional(),
  })
  .passthrough()
  .nullable()
  .optional();

// Order item metadata schema
const orderItemMetadataSchema = z
  .object({
    freeClaim: z.boolean().optional(),
    groupOrCampaignKey: z.string().optional(),
    claimId: z.string().optional(),
    mintTransaction: z
      .object({
        txHash: z.string(),
        recordedAt: z.string(),
      })
      .optional(),
    requiredAction: z
      .enum([
        'EPP_UNLOCK_REQUIRED',
        'EPP_AUTH_CODE_UPDATE_REQUIRED',
        'UNDETERMINED',
      ])
      .optional(),
  })
  .passthrough()
  .nullable()
  .optional();

const cartItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  amountInUSDCents: z.number(),
  durationInYears: z.number(),
  type: z.enum(['REGISTER', 'IMPORT', 'RENEW']),
  registrar: z.string(),
  encryptionKeyId: z.string().nullable(),
  encryptedEppAuthorizationCode: z.string().nullable(),
  metadata: cartItemMetadataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

const cartItemWithClaimsSchema = cartItemSchema.extend({
  claims: z.array(claimEligibilitySchema),
});

const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  amountInUSDCents: z.number(),
  durationInYears: z.number(),
  type: z.enum(['REGISTER', 'IMPORT', 'RENEW']),
  registrar: z.string(),
  encryptionKeyId: z.string().nullable(),
  encryptedEppAuthorizationCode: z.string().nullable(),
  metadata: orderItemMetadataSchema,
  status: z
    .enum([
      'CREATED',
      'PROCESSING',
      'SUCCEEDED',
      'FAILED',
      'CANCELLED',
      'PARTIALLY_COMPLETED',
    ])
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const userDataRouterOrpc = createTRPCRouter({
  getUser: protectedProcedure
    .meta({
      route: {
        path: '/user',
        method: 'GET',
        tags: ['user'],
        operationId: 'getUser',
        summary: 'Get user ',
        description: 'Retrieve the current user.',
      },
    })
    .query(async ({ ctx }) => {
      const user = await db.query.usersTable.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.id, ctx.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Get current user's domains
   */
  getDomains: protectedProcedure
    .meta({
      route: {
        path: '/user/domains',
        method: 'GET',
        tags: ['user'],
        operationId: 'getUserDomains',
        summary: 'Get user domains',
        description:
          'Retrieve all domains owned by the current user. Returns domain details including DNS status, nameservers, and expiration dates.',
      },
    })
    .output(z.array(userDomainSchema))
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      const privyUserLinkedEthereumChecksumWalletAddresses =
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        });

      if (isEmpty(privyUserLinkedEthereumChecksumWalletAddresses)) {
        return [];
      }

      const whereConditions = [
        inArray(
          namefiNftOwnersView.ownerAddress,
          privyUserLinkedEthereumChecksumWalletAddresses,
        ),
      ];

      if (poweredByNamefiDomain) {
        whereConditions.push(
          ilike(
            namefiNftOwnersView.normalizedDomainName,
            `%.${poweredByNamefiDomain}`,
          ),
        );
      }

      const nfts = (
        await db
          .with(namefiNftOwnersCte)
          .select()
          .from(namefiNftOwnersView)
          .where(and(...whereConditions))
      ).map((nft) => ({
        ...nft,
        tokenId: nftIdFromDomainName(nft.normalizedDomainName).toString(),
        expirationDate: null as Date | null,
      }));

      const domainNames = pluck('normalizedDomainName', nfts);

      if (isEmpty(domainNames)) {
        return [];
      }

      try {
        const [expirationDates, indexedDomains, domainConfigs, dnsRecords] =
          await Promise.all([
            getDomainsExpirationDatesFromIndex(domainNames),
            db
              .select({
                normalizedDomainName: indexedDomainsTable.normalizedDomainName,
                isUsingNamefiNameservers:
                  indexedDomainsTable.isUsingNamefiNameservers,
                nameservers: indexedDomainsTable.nameservers,
              })
              .from(indexedDomainsTable)
              .where(
                inArray(indexedDomainsTable.normalizedDomainName, domainNames),
              ),
            db
              .select({
                normalizedDomainName: domainConfigTable.normalizedDomainName,
                autoParkEnabled: domainConfigTable.autoParkEnabled,
                forwardTo: domainConfigTable.forwardTo,
              })
              .from(domainConfigTable)
              .where(
                inArray(domainConfigTable.normalizedDomainName, domainNames),
              ),
            db
              .select({
                zoneName: dnsRecordsTable.zoneName,
                type: dnsRecordsTable.type,
                rdata: dnsRecordsTable.rdata,
                name: dnsRecordsTable.name,
              })
              .from(dnsRecordsTable)
              .where(inArray(dnsRecordsTable.zoneName, domainNames)),
          ]);

        const indexedDomainsMap = new Map(
          indexedDomains.map((d) => [d.normalizedDomainName, d]),
        );
        const domainConfigsMap = new Map(
          domainConfigs.map((d) => [d.normalizedDomainName, d]),
        );

        const dnsRecordsMap = new Map<string, typeof dnsRecords>();
        for (const record of dnsRecords) {
          const records = dnsRecordsMap.get(record.zoneName) || [];
          records.push(record);
          dnsRecordsMap.set(record.zoneName, records);
        }

        return nfts.map((nft) => {
          const domainName = nft.normalizedDomainName;
          const indexedDomain = indexedDomainsMap.get(domainName);
          const config = domainConfigsMap.get(domainName);
          const records = dnsRecordsMap.get(domainName) || [];

          const hasWebRecords = records.some((r) =>
            ['A', 'AAAA', 'CNAME'].includes(r.type),
          );
          const hasMxRecords = records.some((r) => r.type === 'MX');
          const ensRecord = records.find(
            (r) =>
              r.type === 'TXT' && r.rdata.startsWith('ENS1') && r.name === '@',
          );

          return {
            normalizedDomainName: nft.normalizedDomainName,
            chainId: nft.chainId,
            ownerAddress: nft.ownerAddress,
            tokenId: nft.tokenId,
            expirationDate: expirationDates[domainName] ?? null,
            dnsStatus: {
              nameservers: indexedDomain?.nameservers ?? [],
              isUsingNamefiNameservers:
                indexedDomain?.isUsingNamefiNameservers ?? false,
              isParkingEnabled: config?.autoParkEnabled ?? false,
              forwardTo: config?.forwardTo ?? null,
              hasWebRecords,
              hasMxRecords,
              ensRecord: ensRecord?.rdata ?? null,
            },
          };
        });
      } catch (err) {
        logger.error(
          { context: 'getDomains', error: err },
          'Failed to fetch domain details',
        );
        return nfts.map((nft) => ({
          normalizedDomainName: nft.normalizedDomainName,
          chainId: nft.chainId,
          ownerAddress: nft.ownerAddress,
          tokenId: nft.tokenId,
          expirationDate: null,
          dnsStatus: {
            nameservers: [],
            isUsingNamefiNameservers: false,
            isParkingEnabled: false,
            forwardTo: null,
            hasWebRecords: false,
            hasMxRecords: false,
            ensRecord: null,
          },
        }));
      }
    }),

  requestNfscFaucet: protectedProcedure
    .meta({
      route: {
        path: '/user/faucet',
        method: 'POST',
        tags: ['user', 'balance'],
        operationId: 'requestNfscFaucet',
        summary: 'Request NFSC faucet',
        description:
          'Request NFSC test tokens on Sepolia. Rate limited by user and wallet address.',
      },
    })
    .input(z.object({ walletAddress: checksumWalletAddressSchema.optional() }))
    .output(nfscFaucetResponseSchema)
    .mutation(async ({ ctx, input }) => {
      let result: Awaited<ReturnType<typeof requestNfscFaucet>>;

      if (input.walletAddress !== undefined) {
        const walletAddress = input.walletAddress;
        const [privyError, privyUser] = await resolve(
          privyClient.getUserById(ctx.user.privyUserId),
        );

        if (privyError || isNil(privyUser)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Could not find user details',
          });
        }

        const walletAddresses =
          getPrivyUserLinkedEthereumChecksumWalletAddresses({
            privyUser,
          });
        const hasWallet = walletAddresses.some(
          (address) => address.toLowerCase() === walletAddress.toLowerCase(),
        );

        if (!hasWallet) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Wallet address is not linked to user',
          });
        }

        result = await requestNfscFaucet({
          walletAddress,
        });
      } else {
        result = await requestNfscFaucetForPrimaryWallet({
          userId: ctx.user.id,
          privyUserId: ctx.user.privyUserId,
        });
      }

      if (result.status === 'rate_limited') {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `NFSC faucet rate limited until ${result.nextEligibleAt.toISOString()}`,
        });
      }

      return {
        status: 'started',
        workflowId: result.workflowId,
        walletAddress: result.walletAddress,
        nextEligibleAt: result.nextEligibleAt,
      };
    }),

  /**
   * Get user's order items
   */
  getUserOrders: protectedProcedure
    .meta({
      route: {
        path: '/user/orders',
        method: 'GET',
        tags: ['user', 'orders'],
        operationId: 'getUserOrders',
        summary: 'Get user orders',
        description:
          'Retrieve all order items for the current user. Returns order items sorted by creation date in descending order.',
      },
    })
    .output(z.array(orderItemSchema))
    .query(async ({ ctx: { user, poweredByNamefiDomain } }) => {
      const items = await db
        .select({
          ...getTableColumns(orderItemsTable),
        })
        .from(orderItemsTable)
        .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .where(
          and(
            eq(ordersTable.userId, user.id),
            isNotNil(poweredByNamefiDomain)
              ? ilike(
                  orderItemsTable.normalizedDomainName,
                  `%.${poweredByNamefiDomain}`,
                )
              : undefined,
          ),
        )
        .orderBy(desc(ordersTable.createdAt));

      return items;
    }),
});

const extra = {
  /**
   * Get user's cart items
   */
  getUserCart: protectedProcedure
    .meta({
      route: {
        path: '/user/cart',
        method: 'GET',
        tags: ['user', 'cart'],
        operationId: 'getUserCart',
        summary: 'Get user cart',
        description:
          "Retrieve all items in the current user's shopping cart. Includes free claim eligibility information for each item.",
      },
    })
    .output(z.array(cartItemWithClaimsSchema))
    .query(async ({ ctx: { user, poweredByNamefiDomain } }) => {
      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          eq(cartItemsTable.userId, user.id),
          isNotNil(poweredByNamefiDomain)
            ? ilike(
                cartItemsTable.normalizedDomainName,
                `%.${poweredByNamefiDomain}`,
              )
            : undefined,
        ),
      });

      const unusedClaims = await getUserUnusedClaims(user.id);

      const cartItemsWithClaims = cartItems.map((item) => {
        const itemEligibleClaims = checkItemClaimEligibility(
          item.normalizedDomainName as NamefiNormalizedDomain,
          unusedClaims,
        );

        return {
          ...item,
          claims: itemEligibleClaims,
        };
      });

      return cartItemsWithClaims;
    }),
};
