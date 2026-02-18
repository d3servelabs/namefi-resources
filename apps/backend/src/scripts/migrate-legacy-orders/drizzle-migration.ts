#!/usr/bin/env bun tsx

/**
 * Drizzle-based Legacy Data Migration Script
 *
 * This script migrates legacy order data from JSON files to PostgreSQL using Drizzle ORM.
 * It follows the same patterns as the existing migrate-legacy-orders.ts script but works
 * directly with the JSON files provided.
 *
 * Usage:
 * bun tsx apps/backend/src/scripts/migrate-legacy-orders/drizzle-migration.ts [--dry-run]
 */
import { config } from '#lib/env';
import { db } from '@namefi-astra/db';
import {
  ordersTable,
  orderItemsTable,
  paymentsTable,
  refundsTable,
  orderMetadataSchema,
  orderItemMetadataSchema,
  type legacyOrderMetadataSchema,
  type legacyOrderItemMetadataSchema,
} from '@namefi-astra/db/schema';

import type {
  PaymentStatus,
  OrderStatus,
  RefundStatus,
  PaymentProvider,
  ItemType,
} from '@namefi-astra/db/types';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { createLogger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import { isNotNil } from 'ramda';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const _logger = createLogger({
  module: 'drizzle-legacy-migration',
});

// Type definitions for JSON data (inferred from Zod schemas)
type LegacyPaymentIntent = z.infer<typeof legacyPaymentIntentSchema>;
type LegacyOrder = z.infer<typeof legacyOrderSchema>;
type LegacyOrderItem = z.infer<typeof legacyOrderItemSchema>;
type StripeRefund = z.infer<typeof stripeRefundSchema>;

// Type definitions for metadata (inferred from Zod schemas)
export type LegacyOrderMetadata = z.infer<typeof legacyOrderMetadataSchema>;
export type LegacyOrderItemMetadata = z.infer<
  typeof legacyOrderItemMetadataSchema
>;
export type OrderMetadata = z.infer<typeof orderMetadataSchema>;
export type OrderItemMetadata = z.infer<typeof orderItemMetadataSchema>;

interface UserMapping {
  walletAddress: string;
  userId: string;
  privyUserId: string;
}

interface MigrationData {
  order: Omit<typeof ordersTable.$inferInsert, 'id'>;
  items: Omit<typeof orderItemsTable.$inferInsert, 'id' | 'orderId'>[];
  payment: Omit<typeof paymentsTable.$inferInsert, 'id'>;
  refunds: Omit<typeof refundsTable.$inferInsert, 'id' | 'paymentId'>[];
}

// Zod schemas for validation
const legacyPaymentIntentSchema = z.object({
  id: z.string().min(1, 'Payment intent ID is required'),
  amountinusdcents: z.number().min(0, 'Amount must be non-negative'),
  externalid: z.string().nullable(),
  paymenttype: z.string().min(1, 'Payment type is required'),
  status: z.string().min(1, 'Status is required'),
  txhash: z.string().nullable(),
  modified: z.boolean().nullable(),
  refundtxhash: z.string().nullable(),
});

const legacyOrderSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
  createdat: z.string().min(1, 'Creation date is required'),
  creatorid: z.string().min(1, 'Creator ID is required'),
  namefipaymentintentid: z.string().min(1, 'Payment intent ID is required'),
  status: z.string().min(1, 'Status is required'),
  amountinusdcents: z.number().min(0, 'Amount must be non-negative'),
  updatedat: z.string().min(1, 'Update date is required'),
  usenfscbalance: z.boolean(),
  chargedwalletaddress: z.string().nullable(),
});

const legacyOrderItemSchema = z.object({
  id: z.string().min(1, 'Order item ID is required'),
  amountinusdcents: z.number().min(0, 'Amount must be non-negative'),
  chainid: z.number().min(1, 'Chain ID must be positive'),
  orderid: z.string().min(1, 'Order ID is required'),
  receivingwalletaddress: z.string().nullable(),
  registrar: z.string().nullable(),
  status: z.string().min(1, 'Status is required'),
  createdat: z.string().min(1, 'Creation date is required'),
  domainnameldh: z.string().nullable(),
  type: z.string().min(1, 'Type is required'),
  encryptedeppauthorizationcode: z.string().nullable(),
  encryptionkeyid: z.string().nullable(),
  durationinyears: z.number().nullable(),
});

const stripeRefundDetailSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
  status: z.string().min(1, 'Status is required'),
  createdAt: z.string().min(1, 'Creation date is required'),
  paymentProviderReferenceId: z
    .string()
    .min(1, 'Payment provider reference ID is required'),
});

const stripeRefundSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  fullRefund: z.boolean(),
  totalRefundAmount: z
    .number()
    .min(0, 'Total refund amount must be non-negative'),
  refundsDetails: z.array(stripeRefundDetailSchema),
});

const loadedJsonDataSchema = z.object({
  legacyPaymentIntents: z.array(legacyPaymentIntentSchema),
  legacyOrders: z.array(legacyOrderSchema),
  legacyOrderItems: z.array(legacyOrderItemSchema),
  stripeRefunds: z.array(stripeRefundSchema),
});

// Schema for validating prepared migration data
const migrationDataItemSchema = z.object({
  order: z.object({
    userId: z.string().uuid('User ID must be a valid UUID'),
    status: z.string().min(1, 'Order status is required'),
    paymentId: z.string().optional(), // will be filled in later
    amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
    nftWalletAddress: z.string().min(1, 'NFT wallet address is required'),
    nftChainId: z.number().min(1, 'NFT chain ID must be positive'),
    metadata: orderMetadataSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    startedAt: z.date(),
    finishedAt: z.date(),
  }),
  items: z
    .array(
      z.object({
        normalizedDomainName: z.string().min(1, 'Domain name is required'),
        amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
        durationInYears: z.number().min(1, 'Duration must be at least 1 year'),
        type: z.string().min(1, 'Item type is required'),
        registrar: z.string().min(1, 'Registrar is required'),
        encryptionKeyId: z.string().optional(),
        encryptedEppAuthorizationCode: z.string().optional(),
        status: z.string().min(1, 'Status is required'),
        metadata: orderItemMetadataSchema,
        createdAt: z.date(),
        updatedAt: z.date(),
        startedAt: z.date(),
        finishedAt: z.date(),
      }),
    )
    .min(1, 'At least one order item is required'),
  payment: z.object({
    amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
    status: z.string().min(1, 'Payment status is required'),
    paymentProvider: z.string().min(1, 'Payment provider is required'),
    paymentProviderReferenceId: z
      .string()
      .min(1, 'Payment provider reference ID is required'),
    nfscPaymentDetails: z
      .object({
        chainId: z.number().min(1, 'Chain ID must be positive'),
        walletAddress: z.string().min(1, 'Wallet address is required'),
        txHash: z.string().optional(),
      })
      .optional()
      .nullable(),
    stripePaymentDetails: z
      .object({
        paymentMethodId: z.string().optional(),
      })
      .optional()
      .nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    startedAt: z.date(),
    finishedAt: z.date(),
  }),
  refunds: z.array(
    z.object({
      amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
      status: z.string().min(1, 'Refund status is required'),
      paymentProviderReferenceId: z
        .string()
        .min(1, 'Payment provider reference ID is required'),
      chainId: z.number().min(1, 'Chain ID must be positive').optional(),
      walletAddress: z.string().min(1, 'Wallet address is required').optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
      startedAt: z.date(),
      finishedAt: z.date(),
    }),
  ),
});

const migrationDataSchema = z.array(migrationDataItemSchema);

// Utility functions for mapping legacy data to new schema
const mapLegacyItemType = (legacyType: string): ItemType => {
  switch (legacyType) {
    case 'DOMAIN_REGISTRATION':
      return 'REGISTER';
    case 'DOMAIN_IMPORT':
      return 'IMPORT';
    case 'DOMAIN_RENEW':
      return 'RENEW';
  }
  throw new Error(`Unknown legacy item type: ${legacyType}`);
};

const mapLegacyOrderStatus = (legacyStatus: string): OrderStatus => {
  switch (legacyStatus) {
    case 'CREATED':
      return 'CREATED';
    case 'SUBMITTED':
    case 'PROCESSING':
      return 'PROCESSING';
    case 'SUCCESS':
      return 'SUCCEEDED';
    case 'FAILURE':
    case 'FAILED':
      return 'FAILED';
    case 'CANCELED':
      return 'CANCELLED';
    case 'PARTIAL_FULFILLMENT':
      return 'PARTIALLY_COMPLETED';
  }
  throw new Error(`Unknown legacy order status: ${legacyStatus}`);
};

const mapPaymentIntentStatus = (legacyStatus: string): PaymentStatus => {
  switch (legacyStatus) {
    case 'SUCCEEDED':
      return 'SUCCEEDED';
    case 'REQUIRES_CAPTURE':
    case 'REQUIRES_CONFIRMATION':
    case 'REQUIRES_ACTION':
    case 'REQUIRES_PAYMENT_METHOD':
      return 'REQUIRES_CAPTURE';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'VOIDED':
    case 'CANCELED':
    case 'REFUNDED':
      return 'REFUND_REQUESTED';
    case 'FAILED':
      return 'FAILED';
    case 'CREATED':
      return 'CREATED';
  }
  throw new Error(`Unknown payment intent status: ${legacyStatus}`);
};

const mapLegacyRefundStatus = (legacyStatus: string): RefundStatus => {
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
    case 'REQUIRES_ACTION':
      return 'REQUIRES_ACTION';
  }
  throw new Error(`Unknown refund status: ${legacyStatus}`);
};

const determinePaymentProvider = (
  paymentType: string | null,
  useNfscBalance: boolean,
): PaymentProvider => {
  if (useNfscBalance || paymentType?.includes('NFSC')) {
    switch (paymentType) {
      case 'NFSC_BASE':
        return 'NFSC_BASE';
      case 'NFSC_ETHEREUM':
        return 'NFSC_ETHEREUM';
      case 'NFSC_ETHEREUM_SEPOLIA':
        return 'NFSC_ETHEREUM_SEPOLIA';
    }
    return 'NFSC_ETHEREUM';
  }
  return 'STRIPE';
};

// Load and validate JSON data
function loadJsonData() {
  const scriptsDir = join(import.meta.dirname);

  try {
    _logger.info('Loading JSON files...');

    const rawPaymentIntents = JSON.parse(
      readFileSync(join(scriptsDir, 'legacy_payment_intents.json'), 'utf8'),
    );

    const rawOrders = JSON.parse(
      readFileSync(join(scriptsDir, 'legacy_orders.json'), 'utf8'),
    );

    const rawOrderItems = JSON.parse(
      readFileSync(join(scriptsDir, 'legacy_order_items.json'), 'utf8'),
    );

    const rawStripeRefunds = JSON.parse(
      readFileSync(join(scriptsDir, './stripe-data/refunds-all.json'), 'utf8'),
    );

    _logger.info('Validating JSON data with Zod schemas...');

    // Validate each dataset with Zod
    const legacyPaymentIntents = z
      .array(legacyPaymentIntentSchema)
      .parse(rawPaymentIntents);
    const legacyOrders = z.array(legacyOrderSchema).parse(rawOrders);
    const legacyOrderItems = z
      .array(legacyOrderItemSchema)
      .parse(rawOrderItems);
    const stripeRefunds = z.array(stripeRefundSchema).parse(rawStripeRefunds);

    const validatedData = {
      legacyPaymentIntents,
      legacyOrders,
      legacyOrderItems,
      stripeRefunds,
    };

    // Additional validation with complete schema
    const result = loadedJsonDataSchema.parse(validatedData);

    _logger.info('JSON data validation completed successfully');
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      _logger.error(
        {
          errors: z.treeifyError(error).errors,
        },
        'JSON data validation failed',
      );
      throw new Error(
        `JSON data validation failed: ${z.treeifyError(error).errors.length} validation errors found`,
      );
    }
    _logger.error({ error }, 'Failed to load JSON data');
    throw error;
  }
}

// Validate data integrity
function validateData(data: ReturnType<typeof loadJsonData>) {
  const {
    legacyPaymentIntents,
    legacyOrders,
    legacyOrderItems,
    stripeRefunds,
  } = data;

  _logger.info('Validating data integrity...');

  // Validate payment intent statuses
  const unknownPaymentStatuses = new Set<string>();
  for (const payment of legacyPaymentIntents) {
    try {
      mapPaymentIntentStatus(payment.status);
    } catch {
      unknownPaymentStatuses.add(payment.status);
    }
  }

  // Validate order statuses
  const unknownOrderStatuses = new Set<string>();
  for (const order of legacyOrders) {
    try {
      mapLegacyOrderStatus(order.status);
    } catch {
      unknownOrderStatuses.add(order.status);
    }
  }

  // Validate item types
  const unknownItemTypes = new Set<string>();
  for (const item of legacyOrderItems) {
    try {
      mapLegacyItemType(item.type);
    } catch {
      unknownItemTypes.add(item.type);
    }
  }

  // Validate refund statuses
  const unknownRefundStatuses = new Set<string>();
  for (const refund of stripeRefunds) {
    for (const detail of refund.refundsDetails) {
      try {
        mapLegacyRefundStatus(detail.status);
      } catch {
        unknownRefundStatuses.add(detail.status);
      }
    }
  }

  const hasErrors =
    unknownPaymentStatuses.size > 0 ||
    unknownOrderStatuses.size > 0 ||
    unknownItemTypes.size > 0 ||
    unknownRefundStatuses.size > 0;

  if (hasErrors) {
    _logger.error(
      {
        unknownPaymentStatuses: Array.from(unknownPaymentStatuses),
        unknownOrderStatuses: Array.from(unknownOrderStatuses),
        unknownItemTypes: Array.from(unknownItemTypes),
        unknownRefundStatuses: Array.from(unknownRefundStatuses),
      },
      'Data validation failed',
    );
    throw new Error('Data validation failed - unknown status values found');
  }

  _logger.info('Data validation passed');
}

// Get user mappings (same as in migrate-legacy-orders.ts)
async function getUserMappings(): Promise<Map<string, UserMapping>> {
  _logger.info('Creating user mappings using Privy client...');

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
          return linkedAccount.address.toLowerCase();
        })
        .filter(isNotNil);

      const userId = usersPrivyUserIdToNamefiUserIdMap.get(privyUser.id);
      if (!userId) {
        // console.log('Skipping user', privyUser);
        return null;
      }
      return {
        userId,
        privyUserId: privyUser.id,
        wallets,
      };
    })
    .filter(isNotNil);

  const walletToUserMap = new Map<string, UserMapping>();
  for (const user of usersWithEvmWallets) {
    for (const wallet of user.wallets) {
      walletToUserMap.set(wallet.toLowerCase(), {
        walletAddress: wallet,
        userId: user.userId,
        privyUserId: user.privyUserId,
      });
    }
  }

  _logger.info(`Created ${walletToUserMap.size} user mappings`);
  return walletToUserMap;
}

// Prepare migration data
function prepareMigrationData(
  data: ReturnType<typeof loadJsonData>,
  userMappings: Map<string, UserMapping>,
): MigrationData[] {
  const {
    legacyPaymentIntents,
    legacyOrders,
    legacyOrderItems,
    stripeRefunds,
  } = data;

  // Create lookup maps with proper naming
  const paymentIntentIdToPaymentIntent = new Map(
    legacyPaymentIntents.map((p) => [p.id, p]),
  );
  const orderItemsByOrderId = new Map<string, LegacyOrderItem[]>();

  // Group order items by order ID
  for (const item of legacyOrderItems) {
    if (!orderItemsByOrderId.has(item.orderid)) {
      orderItemsByOrderId.set(item.orderid, []);
    }
    const items = orderItemsByOrderId.get(item.orderid);
    if (items) {
      items.push(item);
    }
  }

  // Create stripe refunds map
  const paymentIntentIdToStripeRefund = new Map<string, StripeRefund>();
  for (const refund of stripeRefunds) {
    paymentIntentIdToStripeRefund.set(refund.paymentIntentId, refund);
  }

  const migrationData: MigrationData[] = [];

  for (const legacyOrder of legacyOrders) {
    const userMapping = userMappings.get(legacyOrder.creatorid.toLowerCase());
    if (!userMapping) {
      _logger.warn(
        `No user mapping found for wallet: ${legacyOrder.creatorid}`,
      );
      continue;
    }

    const paymentIntent = paymentIntentIdToPaymentIntent.get(
      legacyOrder.namefipaymentintentid,
    );
    const orderItems = orderItemsByOrderId.get(legacyOrder.id) || [];
    const stripeRefund = paymentIntent?.externalid
      ? paymentIntentIdToStripeRefund.get(paymentIntent.externalid)
      : null;

    // Filter out NFSC_PURCHASE items
    const filteredItems = orderItems.filter(
      (item) => item.type !== 'NFSC_PURCHASE' && item.domainnameldh,
    );

    if (filteredItems.length === 0) {
      _logger.warn(`No valid order items found for order: ${legacyOrder.id}`);
      continue;
    }

    // Calculate total amount
    const totalAmountInUsdCents = filteredItems.reduce(
      (total, item) => total + item.amountinusdcents,
      0,
    );

    // Determine payment status
    let paymentStatus: PaymentStatus = 'CREATED';
    if (paymentIntent) {
      paymentStatus = mapPaymentIntentStatus(paymentIntent.status);
    } else if (mapLegacyOrderStatus(legacyOrder.status) === 'SUCCEEDED') {
      paymentStatus = 'SUCCEEDED';
    }

    // Prepare payment data
    const payment: Omit<typeof paymentsTable.$inferInsert, 'id'> = {
      amountInUSDCents: totalAmountInUsdCents,
      status: paymentStatus,
      paymentProvider: determinePaymentProvider(
        paymentIntent?.paymenttype || null,
        legacyOrder.usenfscbalance,
      ),
      paymentProviderReferenceId:
        paymentIntent?.txhash ||
        paymentIntent?.externalid ||
        legacyOrder.namefipaymentintentid,
      nfscPaymentDetails: legacyOrder.usenfscbalance
        ? {
            chainId: filteredItems[0]?.chainid || 1,
            walletAddress:
              legacyOrder.chargedwalletaddress || legacyOrder.creatorid,
            ...(paymentIntent?.txhash && { txHash: paymentIntent.txhash }),
          }
        : null,
      stripePaymentDetails: null,
      createdAt: new Date(legacyOrder.createdat),
      updatedAt: new Date(legacyOrder.updatedat),
      startedAt: new Date(legacyOrder.createdat),
      finishedAt: new Date(legacyOrder.updatedat),
      metadata: {
        legacyPaymentMetadata: paymentIntent,
      },
    };

    // Prepare refunds data
    const refunds: Omit<
      typeof refundsTable.$inferInsert,
      'id' | 'paymentId'
    >[] = [];

    // Add refund from legacy payment intent
    if (paymentIntent?.refundtxhash) {
      refunds.push({
        amountInUSDCents: paymentIntent.amountinusdcents,
        status: 'SUCCEEDED',
        paymentProviderReferenceId: paymentIntent.refundtxhash,
        chainId: legacyOrder.usenfscbalance
          ? filteredItems[0]?.chainid || 1
          : undefined,
        walletAddress: legacyOrder.usenfscbalance
          ? legacyOrder.chargedwalletaddress || legacyOrder.creatorid
          : undefined,
        createdAt: new Date(legacyOrder.updatedat),
        updatedAt: new Date(legacyOrder.updatedat),
        startedAt: new Date(legacyOrder.updatedat),
        finishedAt: new Date(legacyOrder.updatedat),
        metadata: {
          legacyRefundMetadata: {
            nfscRefund: {
              amountInUSDCents: paymentIntent.amountinusdcents,
              txHash: paymentIntent.refundtxhash,
              chainId: legacyOrder.usenfscbalance
                ? filteredItems[0]?.chainid || 1
                : undefined,
              walletAddress: legacyOrder.usenfscbalance
                ? legacyOrder.chargedwalletaddress || legacyOrder.creatorid
                : undefined,
              paymentId: paymentIntent.id,
            },
          },
        },
      });
    }

    // Add refunds from stripe data
    if (stripeRefund) {
      for (const refundDetail of stripeRefund.refundsDetails) {
        refunds.push({
          amountInUSDCents: refundDetail.amountInUSDCents,
          status: mapLegacyRefundStatus(refundDetail.status),
          paymentProviderReferenceId: refundDetail.paymentProviderReferenceId,
          chainId: undefined,
          walletAddress: undefined,
          createdAt: new Date(refundDetail.createdAt),
          updatedAt: new Date(refundDetail.createdAt),
          startedAt: new Date(refundDetail.createdAt),
          finishedAt: new Date(refundDetail.createdAt),
          metadata: {
            legacyRefundMetadata: {
              stripeRefund: {
                ...stripeRefund,
                refundsDetails: stripeRefund.refundsDetails?.map(
                  (refundsDetails) => ({
                    ...refundsDetails,
                    paymentId: paymentIntent?.id ?? '',
                  }),
                ),
              },
            },
          },
        });
      }
    }

    // Prepare order data
    const order: Omit<typeof ordersTable.$inferInsert, 'id'> = {
      userId: userMapping.userId,
      status: mapLegacyOrderStatus(legacyOrder.status),
      amountInUSDCents: totalAmountInUsdCents,
      nftWalletAddress:
        legacyOrder.chargedwalletaddress || legacyOrder.creatorid,
      nftChainId: filteredItems[0]?.chainid || 1,
      metadata: {
        legacyOrderMetadata: {
          source: 'legacy' as const,
          type: 'legacy-migration' as const,
          legacyOrderId: legacyOrder.id,
          useNfscBalance: legacyOrder.usenfscbalance,
          migratedAt: new Date().toISOString(),
          ...(paymentIntent && {
            legacyPaymentIntentId: legacyOrder.namefipaymentintentid,
            legacyPaymentDetails: {
              status: paymentIntent.status,
              provider: paymentIntent.paymenttype,
              paymentType: paymentIntent.paymenttype,
              ...(paymentIntent.txhash && { txHash: paymentIntent.txhash }),
              ...(paymentIntent.externalid && {
                externalId: paymentIntent.externalid,
              }),
            },
          }),
        },
      },
      createdAt: new Date(legacyOrder.createdat),
      updatedAt: new Date(legacyOrder.updatedat),
      startedAt: new Date(legacyOrder.createdat),
      finishedAt: new Date(legacyOrder.updatedat),
    };

    // Prepare order items data
    const items: Omit<typeof orderItemsTable.$inferInsert, 'id' | 'orderId'>[] =
      filteredItems.map((item) => ({
        normalizedDomainName: namefiNormalizedDomainSchema.parse(
          item.domainnameldh?.toLowerCase() || '',
        ),
        amountInUSDCents: item.amountinusdcents,
        durationInYears: item.durationinyears || 1,
        type: mapLegacyItemType(item.type),
        registrar: item.registrar || 'route53',
        encryptionKeyId: item.encryptionkeyid || undefined,
        encryptedEppAuthorizationCode:
          item.encryptedeppauthorizationcode || undefined,
        status: mapLegacyOrderStatus(item.status),
        metadata: {
          legacyOrderItemMetadata: {
            source: 'legacy' as const,
            type: 'legacy-migration' as const,
            legacyItemId: item.id,
            chainId: item.chainid,
            receivingWalletAddress: item.receivingwalletaddress,
          },
        },
        createdAt: new Date(item.createdat),
        updatedAt: new Date(legacyOrder.updatedat),
        startedAt: new Date(item.createdat),
        finishedAt: new Date(legacyOrder.updatedat),
      }));

    migrationData.push({
      order,
      items,
      payment,
      refunds,
    });
  }

  return migrationData;
}

// Migrate batch of data within a transaction
async function migrateBatchOfDataInTransaction(
  migrationDataBatch: MigrationData[],
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<{ successCount: number; failCount: number; errors: string[] }> {
  if (migrationDataBatch.length === 0) {
    return { successCount: 0, failCount: 0, errors: [] };
  }

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  try {
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
    const newMigrationData = migrationDataBatch.filter((data) => {
      const metadata = data.order.metadata as { legacyOrderId: string };
      return !existingLegacyIds.has(metadata.legacyOrderId);
    });

    if (newMigrationData.length === 0) {
      _logger.info('All orders in batch already exist, skipping');
      successCount = migrationDataBatch.length;
      return { successCount, failCount, errors };
    }

    // Update order data with payment IDs
    const orders = newMigrationData.map((data) => data.order);

    // Bulk insert orders
    const insertedOrders = await tx
      .insert(ordersTable)
      .values(orders)
      .returning({ id: ordersTable.id });

    // Bulk insert payments
    const payments = await tx
      .insert(paymentsTable)
      .values(
        newMigrationData.map((data, index) => ({
          ...data.payment,
          orderId: insertedOrders[index]?.id,
        })),
      )
      .returning({ id: paymentsTable.id });

    // Bulk insert refunds if any exist
    const refundsToInsert = newMigrationData.flatMap((data, index) =>
      data.refunds.map((refund) => ({
        ...refund,
        paymentId: payments[index].id,
      })),
    );

    if (refundsToInsert.length > 0) {
      await tx.insert(refundsTable).values(refundsToInsert);
    }

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
  } catch (error) {
    failCount = migrationDataBatch.length;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Batch migration failed: ${errorMessage}`);
    _logger.error('Failed to migrate batch:', error);
    throw error; // Re-throw to fail the transaction
  }

  return { successCount, failCount, errors };
}

// Main migration function
async function main(options: { dryRun?: boolean } = {}) {
  const { dryRun = false } = options;

  try {
    _logger.info({ dryRun }, 'Starting legacy data migration...');

    // Load JSON data
    const jsonData = loadJsonData();
    _logger.info(
      {
        paymentIntents: jsonData.legacyPaymentIntents.length,
        orders: jsonData.legacyOrders.length,
        orderItems: jsonData.legacyOrderItems.length,
        stripeRefunds: jsonData.stripeRefunds.length,
      },
      'Loaded JSON data',
    );

    // Validate data before proceeding
    validateData(jsonData);

    // Get user mappings
    const userMappings = await getUserMappings();

    if (userMappings.size === 0) {
      _logger.error('No user mappings found. Please run user migration first.');
      return;
    }

    // Prepare migration data
    const migrationData = prepareMigrationData(jsonData, userMappings);
    _logger.info(`Prepared migration data for ${migrationData.length} orders`);

    // Validate prepared migration data
    _logger.info('Validating prepared migration data...');
    try {
      migrationDataSchema.parse(migrationData);
      _logger.info('Prepared migration data validation completed successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        _logger.error(
          {
            errors: z.prettifyError(error),
          },
          'Prepared migration data validation failed',
        );
        throw new Error(
          `Prepared migration data validation failed: ${z.treeifyError(error).errors.length} validation errors found`,
        );
      }
      throw error;
    }

    if (dryRun) {
      _logger.info(
        {
          totalOrders: migrationData.length,
          sampleOrder: migrationData[0]
            ? {
                orderId: (
                  migrationData[0].order.metadata as { legacyOrderId: string }
                ).legacyOrderId,
                userId: migrationData[0].order.userId,
                status: migrationData[0].order.status,
                itemCount: migrationData[0].items.length,
                refundCount: migrationData[0].refunds.length,
                totalAmount: migrationData[0].order.amountInUSDCents,
              }
            : null,
        },
        'DRY RUN: Migration data summary',
      );
      return;
    }

    // Process in batches within a single transaction
    const batchSize = 50;
    const batches: MigrationData[][] = [];
    for (let i = 0; i < migrationData.length; i += batchSize) {
      batches.push(migrationData.slice(i, i + batchSize));
    }

    let totalSuccessCount = 0;
    let totalFailCount = 0;
    const allErrors: string[] = [];

    // Run entire migration in a single transaction
    await db.transaction(async (tx) => {
      _logger.info('Starting migration transaction...');

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        _logger.info(
          `Processing batch ${i + 1}/${batches.length} (${batch.length} orders)`,
        );

        const result = await migrateBatchOfDataInTransaction(batch, tx);
        totalSuccessCount += result.successCount;
        totalFailCount += result.failCount;
        allErrors.push(...result.errors);

        _logger.info(
          `Batch ${i + 1} completed: ${result.successCount} success, ${result.failCount} failed`,
        );
      }

      _logger.info('Migration transaction completed successfully');
    });

    // Final report
    _logger.info(
      {
        totalOrders: migrationData.length,
        totalSuccessCount,
        totalFailCount,
        successRate: `${((totalSuccessCount / migrationData.length) * 100).toFixed(2)}%`,
      },
      'Migration completed',
    );

    if (allErrors.length > 0) {
      _logger.error({ errors: allErrors.slice(0, 10) }, 'Migration errors');
      if (allErrors.length > 10) {
        _logger.error(`... and ${allErrors.length - 10} more errors`);
      }
    }
  } catch (error) {
    _logger.error({ error }, 'Migration failed');
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (
  typeof process !== 'undefined' &&
  process.argv[1] === import.meta.url.replace('file://', '')
) {
  const dryRun = process.argv.includes('--dry-run');
  console.log('Dry run:', dryRun, process.env.DATABASE_URL);

  main({ dryRun }).catch((error) => {
    _logger.error({ error }, 'Unhandled error');
    process.exit(1);
  });
}

export {
  main as migrateLegacyData,
  loadJsonData,
  getUserMappings,
  prepareMigrationData,
  migrateBatchOfDataInTransaction,
};
