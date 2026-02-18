#!/usr/bin/env bun tsx

/**
 * Legacy Orders Migration Script
 *
 * This script migrates orders from the legacy MongoDB database to the new PostgreSQL schema.
 * It covers the past 2 months of orders and maps legacy users to new users.
 *
 * IMPORTANT: Run the user migration script first to ensure user mappings exist.
 */

import { db } from '@namefi-astra/db';
import {
  ordersTable,
  orderItemsTable,
  paymentsTable,
  refundsTable,
} from '@namefi-astra/db/schema';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import mongoose from 'mongoose';
import { secrets } from '#lib/env';
import { logger } from '#lib/logger';
import { CheckoutOrder, CheckoutOrderItem } from '../src/lib/legacy/db/schemas';
import { NamefiPaymentIntent } from '../src/lib/legacy/db/schemas/namefi-payment-intent.schema';
import { subMonths } from 'date-fns';
import { isNotNil } from 'ramda';
import { privyClient } from '../src/trpc/utils';

const _logger = logger.child({
  module: 'legacy-orders-migration',
});

// MongoDB connection
const MONGODB_URI = secrets.LEGACY_DB_URL;

interface LegacyPaymentIntentData {
  _id: string;
  status: string;
  amount: {
    amount: number;
    currency: string;
  };
  externalId?: string;
  txHash?: string;
  provider: string;
  paymentType: string;
  refund?: {
    amount: {
      amount: number;
      currency: string;
    };
    status: string;
    reason?: string;
    txHash?: string;
    stripeRefundId?: string;
  };
}

interface LegacyOrderData {
  _id: string;
  creatorId: string; // wallet address
  namefiPaymentIntentId?: string;
  status: string;
  useNfscBalance: boolean;
  chargedWalletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  isTest?: boolean;
  items: LegacyOrderItemData[];
  paymentIntent?: LegacyPaymentIntentData;
  nfscPurchaseItems: LegacyOrderItemData[];
}

interface LegacyOrderItemData {
  _id: string;
  orderId: string;
  status: string;
  type: string;
  chainId: number;
  chargeAmount: {
    amount: number;
    currency: string;
  };
  domainNameLdh?: string | null;
  registrar?: string | null;
  durationInYears?: number | null;
  receivingWalletAddress?: string | null;
  encryptionKeyId?: string | null;
  encryptedEppAuthorizationCode?: string | null;
  mintNfscAmount?: number | null;
}

interface UserMapping {
  legacyWalletAddress: string;
  newUserId: string;
  privyUserId: string;
}

interface OrderMigrationData {
  order: Omit<typeof ordersTable.$inferInsert, 'id'>;
  items: Omit<typeof orderItemsTable.$inferInsert, 'id' | 'orderId'>[];
  payment: Omit<typeof paymentsTable.$inferInsert, 'id'>;
  refund?: Omit<typeof refundsTable.$inferInsert, 'id' | 'paymentId'>;
}

/**
 * Maps legacy order item type to new item type
 */
const mapLegacyItemType = (
  legacyType: string,
): 'REGISTER' | 'IMPORT' | 'RENEW' => {
  switch (legacyType) {
    case 'DOMAIN_REGISTRATION':
      return 'REGISTER';
    case 'DOMAIN_IMPORT':
      return 'IMPORT';
    case 'DOMAIN_RENEW':
      return 'RENEW';
    default:
      return 'REGISTER';
  }
};

/**
 * Maps legacy order status to new order status
 */
const mapLegacyOrderStatus = (
  legacyStatus: string,
):
  | 'CREATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIALLY_COMPLETED' => {
  switch (legacyStatus) {
    case 'CREATED':
      return 'CREATED';
    case 'SUBMITTED':
    case 'PROCESSING':
      return 'PROCESSING';
    case 'SUCCESS':
      return 'SUCCEEDED';
    case 'FAILURE':
      return 'FAILED';
    case 'CANCELED':
      return 'CANCELLED';
    case 'PARTIAL_FULFILLMENT':
      return 'PARTIALLY_COMPLETED';
    default:
      return 'CREATED';
  }
};

/**
 * Filters out NFSC_PURCHASE items from order items
 */
const filterOutNfscPurchaseItems = (items: LegacyOrderItemData[]) =>
  items.filter((item) => item.type !== 'NFSC_PURCHASE');

/**
 * Gets orders from legacy database for the past 2 months
 */
async function getLegacyOrders(
  connection: mongoose.Connection,
): Promise<LegacyOrderData[]> {
  _logger.info('Fetching legacy orders from past 2 months...');

  const twoMonthsAgo = subMonths(new Date(), 2);

  const CheckoutOrderModel = connection.model(
    CheckoutOrder.modelName,
    CheckoutOrder.schema,
  );
  const CheckoutOrderItemModel = connection.model(
    CheckoutOrderItem.modelName,
    CheckoutOrderItem.schema,
  );
  const NamefiPaymentIntentModel = connection.model(
    NamefiPaymentIntent.modelName,
    NamefiPaymentIntent.schema,
  );

  // Get all orders from the past 2 months, excluding test orders and non-migrable orders
  const legacyOrders = await CheckoutOrderModel.find({
    createdAt: { $gte: twoMonthsAgo },
    isTest: { $ne: true }, // Exclude test orders
    migrate: { $ne: false }, // Exclude orders marked as non-migrable
  }).sort({ createdAt: -1 });

  _logger.info(`Found ${legacyOrders.length} legacy orders`);

  const ordersWithItems: LegacyOrderData[] = [];

  for (const order of legacyOrders) {
    // Get order items
    const items = await CheckoutOrderItemModel.find({ orderId: order._id });

    // Get payment intent if it exists
    let paymentIntent: LegacyPaymentIntentData | undefined;
    if (order.namefiPaymentIntentId) {
      const paymentDoc = await NamefiPaymentIntentModel.findById(
        order.namefiPaymentIntentId,
      );
      if (paymentDoc) {
        paymentIntent = {
          _id: paymentDoc._id.toString(),
          status: paymentDoc.status,
          amount: paymentDoc.amount,
          externalId: paymentDoc.externalId || undefined,
          txHash: paymentDoc.txHash || undefined,
          provider: paymentDoc.provider || '',
          paymentType: paymentDoc.paymentType ?? paymentDoc.provider,
          refund: paymentDoc.refund
            ? {
                ...paymentDoc.refund,
                reason: paymentDoc.refund.reason || undefined,
                txHash: paymentDoc.refund.txHash || undefined,
                stripeRefundId: paymentDoc.refund.stripeRefundId || undefined,
              }
            : undefined,
        };
      }
    }

    // Process all items and separate NFSC_PURCHASE items
    const processedItems = items.map((item) => ({
      _id: item._id.toString(),
      orderId: item.orderId.toString(),
      status: item.status,
      type: item.type,
      chainId: item.chainId,
      chargeAmount: item.chargeAmount,
      domainNameLdh: item.domainNameLdh || undefined,
      registrar: item.registrar || undefined,
      durationInYears: item.durationInYears || undefined,
      receivingWalletAddress: item.receivingWalletAddress || undefined,
      encryptionKeyId: item.encryptionKeyId || undefined,
      encryptedEppAuthorizationCode:
        item.encryptedEppAuthorizationCode || undefined,
      mintNfscAmount: item.mintNfscAmount || undefined,
    }));

    const filteredItems = filterOutNfscPurchaseItems(processedItems);
    const nfscPurchaseItems = processedItems.filter(
      (item) => item.type === 'NFSC_PURCHASE',
    );

    // Only include orders that have non-NFSC_PURCHASE items
    if (filteredItems.length > 0) {
      ordersWithItems.push({
        _id: order._id.toString(),
        creatorId: order.creatorId,
        namefiPaymentIntentId: order.namefiPaymentIntentId?.toString(),
        status: order.status,
        useNfscBalance: order.useNfscBalance,
        chargedWalletAddress: order.chargedWalletAddress || undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        isTest: order.isTest,
        items: filteredItems,
        paymentIntent,
        nfscPurchaseItems,
      });
    }
  }

  _logger.info(
    `Processed ${ordersWithItems.length} orders with valid items (filtered out NFSC_PURCHASE)`,
  );
  return ordersWithItems;
}

/**
 * Gets user wallet mappings using Privy client similar to renew.activities.ts
 */
async function getUserWithEvmWallets() {
  const [privyUsers, users] = await Promise.all([
    privyClient.getUsers(),
    db.query.usersTable.findMany({
      columns: {
        id: true,
        privyUserId: true,
      },
    }),
  ]);

  const usersPrivyUserIdToNamefiUserIdMap = new Map<string, string>(
    users.map((user) => [user.privyUserId, user.id]),
  );

  const usersWithEvmWallets = privyUsers
    .map((privyUser) => {
      const wallets = privyUser.linkedAccounts
        .map((linkedAccount) => {
          if (
            linkedAccount.type !== 'wallet' ||
            linkedAccount.chainType !== 'ethereum'
          ) {
            return null;
          }
          return linkedAccount.address.toLowerCase(); // Normalize to lowercase
        })
        .filter(isNotNil);

      const userId = usersPrivyUserIdToNamefiUserIdMap.get(privyUser.id);
      if (!userId) {
        _logger.warn(
          { privyUserId: privyUser.id },
          'User has no namefi user id',
        );
        return null;
      }
      return {
        userId,
        privyUserId: privyUser.id,
        wallets,
      };
    })
    .filter(isNotNil);

  type UserWithWallets = {
    userId: string;
    privyUserId: string;
    wallets: string[];
  };

  const walletToUserIdMap = new Map<string, UserWithWallets>();
  for (const user of usersWithEvmWallets) {
    for (const wallet of user.wallets) {
      walletToUserIdMap.set(wallet.toLowerCase(), user);
    }
  }

  return {
    walletToUserIdMap,
    usersWithEvmWallets,
  };
}

/**
 * Creates user mappings from legacy wallet addresses to new user IDs
 */
async function createUserMappings(
  legacyOrders: LegacyOrderData[],
): Promise<Map<string, UserMapping>> {
  _logger.info('Creating user mappings using Privy client...');

  // Get unique wallet addresses from orders
  const walletAddressSet = legacyOrders.reduce(
    (acc: Set<string>, order: LegacyOrderData) => {
      acc.add(order.creatorId.toLowerCase());
      if (order.chargedWalletAddress) {
        acc.add(order.chargedWalletAddress.toLowerCase());
      }
      return acc;
    },
    new Set<string>(),
  );

  const walletAddresses = Array.from(walletAddressSet);

  _logger.info(`Found ${walletAddresses.length} unique wallet addresses`);

  // Get user mappings using Privy
  const { walletToUserIdMap } = await getUserWithEvmWallets();

  const userMappings = new Map<string, UserMapping>();

  for (const walletAddress of walletAddresses) {
    const user = walletToUserIdMap.get(walletAddress.toLowerCase());
    if (user) {
      userMappings.set(walletAddress, {
        legacyWalletAddress: walletAddress,
        newUserId: user.userId,
        privyUserId: user.privyUserId,
      });
      _logger.info(`Mapped wallet ${walletAddress} to user ${user.userId}`);
    } else {
      _logger.warn(`No user found for wallet address: ${walletAddress}`);
    }
  }

  _logger.info(
    `Created ${userMappings.size} user mappings out of ${walletAddresses.length} wallet addresses`,
  );
  return userMappings;
}

/**
 * Maps legacy payment intent status to new payment status
 */
function mapPaymentIntentStatus(
  legacyStatus: string,
): 'CREATED' | 'SUCCEEDED' | 'FAILED' {
  switch (legacyStatus) {
    case 'SUCCEEDED':
      return 'SUCCEEDED';
    case 'PROCESSING':
    case 'REQUIRES_CAPTURE':
    case 'REQUIRES_CONFIRMATION':
    case 'REQUIRES_ACTION':
    case 'REQUIRES_PAYMENT_METHOD':
      return 'CREATED';
    case 'VOIDED':
    case 'CANCELED':
    case 'REFUNDED':
      return 'FAILED';
    default:
      return 'CREATED';
  }
}

/**
 * Maps legacy refund status to new refund status
 */
function mapLegacyRefundStatus(
  legacyStatus: string,
):
  | 'CREATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REQUIRES_ACTION' {
  switch (legacyStatus) {
    case 'SUCCEEDED':
      return 'SUCCEEDED';
    case 'PENDING':
      return 'PROCESSING';
    case 'REQUESTED':
      return 'CREATED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELED':
      return 'CANCELLED';
    default:
      return 'PROCESSING';
  }
}

/**
 * Creates NFSC purchase summary from NFSC purchase items
 */
function createNfscPurchaseSummary(nfscPurchaseItems: LegacyOrderItemData[]) {
  if (nfscPurchaseItems.length === 0) {
    return null;
  }

  return {
    totalItems: nfscPurchaseItems.length,
    totalNfscAmount: nfscPurchaseItems.reduce(
      (total, item) => total + (item.mintNfscAmount || 0),
      0,
    ),
    totalChargeAmount: nfscPurchaseItems.reduce(
      (total, item) => total + item.chargeAmount.amount,
      0,
    ),
    items: nfscPurchaseItems.map((item) => ({
      itemId: item._id,
      mintNfscAmount: item.mintNfscAmount,
      chargeAmount: item.chargeAmount,
      chainId: item.chainId,
      receivingWalletAddress: item.receivingWalletAddress,
    })),
  };
}

/**
 * Prepares migration data for a batch of orders
 */
function prepareMigrationData(
  orders: LegacyOrderData[],
  userMappings: Map<string, UserMapping>,
): OrderMigrationData[] {
  const migrationData: OrderMigrationData[] = [];

  for (const legacyOrder of orders) {
    const userMapping = userMappings.get(legacyOrder.creatorId.toLowerCase());
    if (!userMapping) {
      _logger.warn(
        `No user mapping found for wallet address: ${legacyOrder.creatorId}`,
      );
      continue;
    }

    // Calculate total amount in USD cents
    const totalAmountInUsdCents = legacyOrder.items.reduce(
      (total, item) => total + item.chargeAmount.amount * 100,
      0,
    );

    // Determine payment status and reference ID
    let paymentStatus: 'CREATED' | 'SUCCEEDED' | 'FAILED' = 'CREATED';
    let paymentProviderReferenceId = legacyOrder._id;

    if (legacyOrder.paymentIntent) {
      paymentStatus = mapPaymentIntentStatus(legacyOrder.paymentIntent.status);
      paymentProviderReferenceId =
        legacyOrder.paymentIntent.externalId || legacyOrder._id;
    } else if (mapLegacyOrderStatus(legacyOrder.status) === 'SUCCEEDED') {
      paymentStatus = 'SUCCEEDED';
    }

    const payment: Omit<typeof paymentsTable.$inferInsert, 'id'> = {
      amountInUSDCents: totalAmountInUsdCents,
      status: paymentStatus,
      paymentProvider:
        (legacyOrder.paymentIntent?.paymentType ?? legacyOrder.useNfscBalance)
          ? 'NFSC_ETHEREUM'
          : 'STRIPE',
      paymentProviderReferenceId,
      nfscPaymentDetails: legacyOrder.useNfscBalance
        ? {
            chainId: legacyOrder.items[0]?.chainId || 1,
            walletAddress:
              legacyOrder.chargedWalletAddress || legacyOrder.creatorId,
            ...(legacyOrder.paymentIntent?.txHash && {
              txHash: legacyOrder.paymentIntent.txHash,
            }),
          }
        : null,
      stripePaymentDetails: !legacyOrder.useNfscBalance
        ? {
            ...(legacyOrder.paymentIntent?.externalId && {
              paymentMethodId: legacyOrder.paymentIntent.externalId,
            }),
          }
        : null,
      createdAt: legacyOrder.createdAt,
      updatedAt: legacyOrder.updatedAt,
    };

    // Prepare refund data if refund exists
    let refund:
      | Omit<typeof refundsTable.$inferInsert, 'id' | 'paymentId'>
      | undefined;
    if (legacyOrder.paymentIntent?.refund) {
      const legacyRefund = legacyOrder.paymentIntent.refund;
      refund = {
        amountInUSDCents: Math.round(legacyRefund.amount.amount * 100),
        status: mapLegacyRefundStatus(legacyRefund.status),
        paymentProviderReferenceId:
          legacyRefund.stripeRefundId || legacyOrder._id,
        chainId: legacyOrder.useNfscBalance
          ? legacyOrder.items[0]?.chainId || 1
          : undefined,
        walletAddress: legacyOrder.useNfscBalance
          ? legacyOrder.chargedWalletAddress || legacyOrder.creatorId
          : undefined,
        createdAt: legacyOrder.updatedAt, // Use order updated time as refund time
        updatedAt: legacyOrder.updatedAt,
      };
    }

    // Calculate NFSC purchase summary
    const nfscPurchaseSummary = createNfscPurchaseSummary(
      legacyOrder.nfscPurchaseItems,
    );

    // Prepare order data
    const order: Omit<typeof ordersTable.$inferInsert, 'id'> = {
      userId: userMapping.newUserId,
      status: mapLegacyOrderStatus(legacyOrder.status),
      paymentId: '', // Will be set after payment insertion
      amountInUSDCents: totalAmountInUsdCents,
      totalAmountInUSDCents: totalAmountInUsdCents,
      nftWalletAddress:
        legacyOrder.chargedWalletAddress || legacyOrder.creatorId,
      nftChainId: legacyOrder.items[0]?.chainId || 1,
      metadata: {
        legacyOrderId: legacyOrder._id,
        useNfscBalance: legacyOrder.useNfscBalance,
        migratedAt: new Date().toISOString(),
        source: 'legacy',
        ...(legacyOrder.namefiPaymentIntentId && {
          legacyPaymentIntentId: legacyOrder.namefiPaymentIntentId,
        }),
        ...(legacyOrder.paymentIntent && {
          legacyPaymentDetails: {
            status: legacyOrder.paymentIntent.status,
            provider: legacyOrder.paymentIntent.provider,
            paymentType: legacyOrder.paymentIntent.paymentType,
            ...(legacyOrder.paymentIntent.txHash && {
              txHash: legacyOrder.paymentIntent.txHash,
            }),
            ...(legacyOrder.paymentIntent.refund && {
              refund: legacyOrder.paymentIntent.refund,
            }),
          },
        }),
        ...(nfscPurchaseSummary && {
          nfscPurchaseSummary,
        }),
      },
      createdAt: legacyOrder.createdAt,
      updatedAt: legacyOrder.updatedAt,
    };

    // Prepare order items data
    const items: Omit<typeof orderItemsTable.$inferInsert, 'id' | 'orderId'>[] =
      legacyOrder.items
        .filter((item: LegacyOrderItemData) => Boolean(item.domainNameLdh))
        .map((item: LegacyOrderItemData) => ({
          normalizedDomainName: namefiNormalizedDomainSchema.parse(
            item.domainNameLdh?.toLowerCase() || '',
          ),
          amountInUSDCents: Math.round(item.chargeAmount.amount * 100),
          durationInYears: item.durationInYears || 1,
          type: mapLegacyItemType(item.type),
          registrar: item.registrar || 'route53',
          encryptionKeyId: item.encryptionKeyId || undefined,
          encryptedEppAuthorizationCode:
            item.encryptedEppAuthorizationCode || undefined,
          status: mapLegacyOrderStatus(legacyOrder.status),
          metadata: {
            legacyItemId: item._id,
            chainId: item.chainId,
            receivingWalletAddress: item.receivingWalletAddress,
            mintNfscAmount: item.mintNfscAmount,
            source: 'legacy',
          },
          createdAt: legacyOrder.createdAt,
          updatedAt: legacyOrder.updatedAt,
        }));

    migrationData.push({
      order,
      items,
      payment,
      ...(refund && { refund }),
    });
  }

  return migrationData;
}

/**
 * Migrates a batch of orders using transactions and bulk inserts
 */
async function migrateBatchOfOrders(
  migrationDataBatch: OrderMigrationData[],
): Promise<{
  successCount: number;
  failCount: number;
  errors: string[];
}> {
  if (migrationDataBatch.length === 0) {
    return { successCount: 0, failCount: 0, errors: [] };
  }

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  try {
    await db.transaction(async (tx) => {
      // Check for existing orders to avoid duplicates
      const existingOrders = await tx
        .select({
          metadata: ordersTable.metadata,
        })
        .from(ordersTable);

      const existingLegacyIds = new Set(
        existingOrders
          .map((order) => {
            const metadata = order.metadata as { legacyOrderId?: string };
            return metadata?.legacyOrderId;
          })
          .filter(Boolean),
      );

      // Filter out orders that already exist
      const newMigrationData = migrationDataBatch.filter(
        (data: OrderMigrationData) => {
          const metadata = data.order.metadata as { legacyOrderId: string };
          return !existingLegacyIds.has(metadata.legacyOrderId);
        },
      );

      if (newMigrationData.length === 0) {
        _logger.info('All orders in batch already exist, skipping');
        successCount = migrationDataBatch.length;
        return;
      }

      // Bulk insert payments
      const payments = await tx
        .insert(paymentsTable)
        .values(newMigrationData.map((data) => data.payment))
        .returning({ id: paymentsTable.id });

      // Bulk insert refunds if any exist
      const refundsToInsert = newMigrationData
        .map((data, index) =>
          data.refund
            ? {
                ...data.refund,
                paymentId: payments[index].id,
              }
            : null,
        )
        .filter(
          (refund): refund is NonNullable<typeof refund> => refund !== null,
        );

      if (refundsToInsert.length > 0) {
        await tx.insert(refundsTable).values(refundsToInsert);
      }

      // Update order data with payment IDs
      const ordersWithPaymentIds = newMigrationData.map((data, index) => ({
        ...data.order,
        paymentId: payments[index].id,
      }));

      // Bulk insert orders
      const insertedOrders = await tx
        .insert(ordersTable)
        .values(ordersWithPaymentIds)
        .returning({ id: ordersTable.id });

      // Prepare order items with order IDs
      const allOrderItems = newMigrationData.flatMap((data, orderIndex) =>
        data.items.map((item) => ({
          ...item,
          orderId: insertedOrders[orderIndex].id,
        })),
      );

      // Bulk insert order items if any exist
      if (allOrderItems.length > 0) {
        await tx.insert(orderItemsTable).values(allOrderItems);
      }

      successCount = newMigrationData.length;

      _logger.info(`Successfully migrated batch of ${successCount} orders`);
    });
  } catch (error) {
    failCount = migrationDataBatch.length;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Batch migration failed: ${errorMessage}`);
    _logger.error('Failed to migrate batch:', error);
  }

  return { successCount, failCount, errors };
}

/**
 * Main migration function
 */
async function main(options: { dryRun?: boolean } = {}) {
  const { dryRun = false } = options;
  let connection: mongoose.Connection | null = null;

  try {
    _logger.info('Starting legacy orders migration...', { dryRun });

    // Connect to MongoDB
    connection = mongoose.createConnection(MONGODB_URI);
    _logger.info('Connected to MongoDB');

    // Get legacy orders
    const legacyOrders = await getLegacyOrders(connection);

    if (legacyOrders.length === 0) {
      _logger.info('No legacy orders found to migrate');
      return;
    }

    // Create user mappings
    const userMappings = await createUserMappings(legacyOrders);

    if (userMappings.size === 0) {
      _logger.error(
        'No user mappings found. Please run the user migration script first.',
      );
      return;
    }

    // Filter orders that have user mappings
    const ordersWithUserMappings = legacyOrders.filter(
      (order: LegacyOrderData) =>
        userMappings.has(order.creatorId.toLowerCase()),
    );

    _logger.info(
      `${ordersWithUserMappings.length} orders have user mappings out of ${legacyOrders.length} total orders`,
    );

    // Prepare migration data
    const migrationData = prepareMigrationData(
      ordersWithUserMappings,
      userMappings,
    );

    _logger.info(`Prepared migration data for ${migrationData.length} orders`);

    if (dryRun) {
      _logger.info('DRY RUN: Would migrate the following data:');
      _logger.info({
        totalOrders: legacyOrders.length,
        ordersWithUserMappings: ordersWithUserMappings.length,
        ordersToMigrate: migrationData.length,
        sampleOrder: migrationData[0]
          ? {
              orderId: (
                migrationData[0].order.metadata as { legacyOrderId: string }
              ).legacyOrderId,
              userId: migrationData[0].order.userId,
              status: migrationData[0].order.status,
              itemCount: migrationData[0].items.length,
              totalAmount: migrationData[0].order.totalAmountInUSDCents,
            }
          : null,
        userMappingsCount: userMappings.size,
      });
      return {
        dryRun: true,
        totalOrders: legacyOrders.length,
        ordersWithUserMappings: ordersWithUserMappings.length,
        ordersToMigrate: migrationData.length,
        userMappingsCount: userMappings.size,
      };
    }

    // Process in batches of 50 for better performance
    const batchSize = 50;
    const batches: OrderMigrationData[][] = [];
    for (let i = 0; i < migrationData.length; i += batchSize) {
      batches.push(migrationData.slice(i, i + batchSize));
    }

    let totalSuccessCount = 0;
    let totalFailCount = 0;
    const allErrors: string[] = [];

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      _logger.info(
        `Processing batch ${i + 1}/${batches.length} (${batch.length} orders)`,
      );

      const result = await migrateBatchOfOrders(batch);
      totalSuccessCount += result.successCount;
      totalFailCount += result.failCount;
      allErrors.push(...result.errors);

      // Log progress
      _logger.info(
        `Batch ${i + 1} completed: ${result.successCount} success, ${result.failCount} failed`,
      );
    }

    // Final report
    _logger.info('Migration completed!', {
      totalOrders: legacyOrders.length,
      ordersWithUserMappings: ordersWithUserMappings.length,
      totalSuccessCount,
      totalFailCount,
      successRate: `${((totalSuccessCount / ordersWithUserMappings.length) * 100).toFixed(2)}%`,
    });

    if (allErrors.length > 0) {
      _logger.error('Migration errors:', allErrors.slice(0, 10));
      if (allErrors.length > 10) {
        _logger.error(`... and ${allErrors.length - 10} more errors`);
      }
    }
  } catch (error) {
    _logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      _logger.info('MongoDB connection closed');
    }
  }
}

// Run the migration if this script is executed directly
if (
  typeof process !== 'undefined' &&
  process.argv[1] === import.meta.url.replace('file://', '')
) {
  // Check for dry run flag
  const dryRun = process.argv.includes('--dry-run');

  main({ dryRun }).catch((error) => {
    _logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

export {
  main as migrateLegacyOrders,
  getLegacyOrders,
  createUserMappings,
  prepareMigrationData,
  migrateBatchOfOrders,
};
