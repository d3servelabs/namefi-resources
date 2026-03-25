import {
  type NfscPaymentProviderDetails,
  type OrderStatus,
  type PaymentProviderDetails,
  type PaymentSelect,
  type X402PaymentProviderDetails,
  type UserSelect,
  cartItemsTable,
  db,
  isMppPayment,
  isNfscPayment,
  isX402Payment,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
} from '@namefi-astra/db';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import type { WorkflowExecutionStatusName } from '@temporalio/client';
import { and, desc, eq, getTableColumns, ilike, inArray } from 'drizzle-orm';
import { isNil, isNotNil, pluck, sum } from 'ramda';
import Stripe from 'stripe';
import { zeroAddress } from 'viem';
import { z } from 'zod';
import type { PaymentPayload } from '@x402/hono';
import {
  encryptX402PaymentPayloadSignature,
  resolveX402PaymentPayloadEncryptionPrivateKey,
} from '#lib/x402/helpers';
import { NegativeAmountInUsdCentsError } from '#services/payments/errors';
import { encryptEppAuthCode } from '#lib/epp-code-encryption';
import {
  orderService,
  type CreateOrderItemInput,
} from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import {
  processOrderWorkflow,
  getOrderProgressQuery,
  type ProcessOrderWorkflowPublicState,
} from '../../temporal/workflows/processOrder.workflow';
import { eppRegisterOrImportProceed } from '../../temporal/workflows/domain-ownership/epp-register-or-import.workflow';
import { sldRegisterOrImportProceed } from '../../temporal/workflows/domain-ownership/sld-register-or-import.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure, withAudit } from '../base';
import {
  createOrderInputSchema,
  createOrderV2InputSchema,
  instantBuyInputSchema,
} from '../types';
import { validateDomainForInstantPurchaseOrThrow } from '../../lib/instant-buy';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import {
  reflectChangesInCartItemsIfAnyAndReturnSummary,
  validateCartItems,
} from '#lib/carts/cart-validation';
import { secrets } from '../../lib/env';
import pMap from 'p-map';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
import { gaEventOrderPlaced } from '#lib/tracking/checkout/events';
import {
  getAllowedChainsForNft,
  getAllowedChainsForNftByDomainNames,
} from '#lib/env/allowed-chains';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);
type PaymentMethodDetailsOnChain = {
  paymentId: string;
  isOnChainPayment: true;
  txHash?: string | null;
  chainId: number;
  walletAddress: string;
};
type PaymentMethodDetailsOffChain = {
  paymentId: string;
  isOnChainPayment: false;
  brand?: string;
  last4?: string;
};
type PaymentMethodDetailsX402 = {
  paymentId: string;
  isOnChainPayment: true;
  isX402Payment: true;
  network: string;
  buyerWalletAddress: string;
  receiverWalletAddress?: string;
  settlementTxHash?: string | null;
};
type PaymentMethodDetailsMpp = {
  paymentId: string;
  isMppPayment: true;
  method: 'stripe' | 'tempo';
  isOnChainPayment: boolean;
  payerWalletAddress?: string;
  reference?: string | null;
  brand?: string;
  last4?: string;
};

type PaymentMethodDetails =
  | PaymentMethodDetailsOnChain
  | PaymentMethodDetailsOffChain
  | PaymentMethodDetailsX402
  | PaymentMethodDetailsMpp;

type OrderProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: ProcessOrderWorkflowPublicState | null;
};

type OrderProgressPayload = OrderProgressSnapshot & {
  orderStatus: OrderStatus;
  fetchedAt: string;
};

const workflowIdForOrder = (orderId: string) => `process-order-${orderId}`;

const ensureOrderOwnership = async (orderId: string, userId: string) => {
  const orderRecord = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    columns: {
      userId: true,
      status: true,
    },
  });

  if (!orderRecord) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  if (orderRecord.userId !== userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to view this order',
    });
  }

  return orderRecord;
};

const fetchOrderWorkflowSnapshot = async (
  orderId: string,
): Promise<OrderProgressSnapshot> => {
  const workflowId = workflowIdForOrder(orderId);
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: ProcessOrderWorkflowPublicState | null = null;
    const isQueryable =
      workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED';
    if (isQueryable) {
      try {
        state = await handle.query(getOrderProgressQuery);
      } catch (error) {
        logger.debug(
          { error, workflowId, orderId },
          'Order workflow state query failed',
        );
        state = null;
      }
    }

    return {
      workflowStatus,
      runId: description.runId,
      state,
    };
  } catch (error) {
    logger.debug(
      { error, workflowId, orderId },
      'Failed to fetch order workflow snapshot',
    );

    return {
      workflowStatus: 'NOT_FOUND',
      runId: null,
      state: null,
    };
  }
};

export const ordersRouter = createTRPCRouter({
  createOrder: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: (ctx as any).user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'create',
      extraInput: redactX402PaymentPayloadsFromAuditInput(input),
    }),
  )
    .input(createOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { cartItemIds } = input;
      const gaEventTracking =
        await orderService.shouldTrackOrderCheckoutFlowForUser(user.id);

      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      await validateCartItems(ctx.user.id, cartItemIds);

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
        });
      }

      const totalAmountInUsdCents = sum(pluck('amountInUSDCents', cartItems));

      const order = await db.transaction(async (tx) => {
        const payment: PaymentSelect = await _createPaymentForOrder(
          {
            totalAmountInUsdCents,
            paymentProviderDetails: input.paymentProviderDetails,
            user,
          },
          { tx },
        );

        // Create order with existing payment
        const order = await orderService.createOrderWithExistingSinglePayment(
          {
            amountInUSDCents: totalAmountInUsdCents,
            userId: ctx.user.id,
            paymentId: payment.id,
            nftWalletAddress: input.nftMetadata.nftWalletAddress,
            nftChainId: input.nftMetadata.nftChainId,
            items: cartItems.map(
              (item) =>
                ({
                  normalizedDomainName: item.normalizedDomainName,
                  amountInUSDCents: item.amountInUSDCents,
                  durationInYears: item.durationInYears,
                  type: item.type,
                  registrar: item.registrar,
                  metadata: item.metadata ?? undefined,
                  encryptionKeyId: item.encryptionKeyId ?? undefined,
                  encryptedEppAuthorizationCode:
                    item.encryptedEppAuthorizationCode ?? undefined,
                }) satisfies CreateOrderItemInput,
            ),
          },
          { tx },
        );

        // Delete cart items that were used to create the order
        await _removeCartItems(ctx.user.id, cartItemIds, { tx });

        const paymentsMetadata = {
          [payment.id]: input.paymentMetadata,
        };
        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
                gaEventTracking,
              },
            ],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: `process-order-${order.id}`,
          });
        } catch (error) {
          logger.error({ error }, 'Could not start process order workflow');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'Could not initiate the order, please contact support if the issue persists',
          });
        }
        return order;
      });
      if (gaEventTracking.trackGaEvents) {
        void gaEventOrderPlaced({
          userId: ctx.user.id,
          orderId: order.id,
          amountUsdCents: order.amountInUSDCents,
          itemCount: order.items.length,
          paymentCount: 1,
          orderSource: 'checkout',
        });
      } else {
        logger.info(
          {
            orderId: order.id,
            userId: ctx.user.id,
            gaEventTracking,
          },
          'Skipping GA order_placed event because tracking is disabled',
        );
      }
      return order;
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { orderId } = input;
      const data = await orderService.getOrderDetailsOrThrow(orderId);
      if (data.order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      return data;
    }),

  updateImportAuthCode: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order_item',
      resourceId: input.orderItemId || '',
      action: 'update_import_auth_code',
      extraInput: {
        orderId: input.orderId,
        orderItemId: input.orderItemId,
      },
    }),
  )
    .input(
      z.object({
        orderId: z.string().min(1),
        orderItemId: z.string().min(1),
        eppAuthorizationCode: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, orderItemId, eppAuthorizationCode } = input;

      await ensureOrderOwnership(orderId, ctx.user.id);

      const orderItem = await db.query.orderItemsTable.findFirst({
        where: and(
          eq(orderItemsTable.id, orderItemId),
          eq(orderItemsTable.orderId, orderId),
        ),
      });

      if (!orderItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order item not found',
        });
      }

      if (orderItem.type !== itemTypeSchema.enum.IMPORT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Auth code updates are only available for import items',
        });
      }

      if (
        orderItem.metadata?.requiredAction !== 'EPP_AUTH_CODE_UPDATE_REQUIRED'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Auth code update is not required for this item',
        });
      }

      if (!eppAuthorizationCode.trim()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Auth code is required',
        });
      }

      const { encryptedEppAuthorizationCode, encryptionKeyId } =
        await encryptEppAuthCode(eppAuthorizationCode);

      const updatedItems = await db
        .update(orderItemsTable)
        .set({
          encryptedEppAuthorizationCode,
          encryptionKeyId,
        })
        .where(
          and(
            eq(orderItemsTable.id, orderItemId),
            eq(orderItemsTable.orderId, orderId),
          ),
        )
        .returning({
          id: orderItemsTable.id,
          normalizedDomainName: orderItemsTable.normalizedDomainName,
        });

      if (updatedItems.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order item not found',
        });
      }

      const normalizedDomainName = updatedItems[0].normalizedDomainName;

      try {
        await temporalClient.connection.ensureConnected();
        const workflowId = `eppRegisterOrImport-[${normalizedDomainName}]`;
        const handle = temporalClient.workflow.getHandle(workflowId);
        await handle.signal(eppRegisterOrImportProceed, {
          actor: 'USER',
          actorId: ctx.user.id,
          action: 'PROCEED',
        });
      } catch (error) {
        logger.error(
          { error, orderId, orderItemId },
          'Failed to signal import auth code update for order %s',
          orderId,
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Auth code saved, but we could not resume the import yet. Please try again.',
          cause: error,
        });
      }

      return { success: true };
    }),

  cancelRequiredActionOrderItem: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order_item',
      resourceId: input.orderItemId || '',
      action: 'cancel_required_action',
      extraInput: {
        orderId: input.orderId,
        orderItemId: input.orderItemId,
      },
    }),
  )
    .input(
      z.object({
        orderId: z.string().min(1),
        orderItemId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, orderItemId } = input;

      await ensureOrderOwnership(orderId, ctx.user.id);

      const orderItem = await db.query.orderItemsTable.findFirst({
        where: and(
          eq(orderItemsTable.id, orderItemId),
          eq(orderItemsTable.orderId, orderId),
        ),
      });

      if (!orderItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order item not found',
        });
      }

      if (!orderItem.metadata?.requiredAction) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This item does not require action',
        });
      }

      const normalizedDomainName = orderItem.normalizedDomainName;
      const workflowId = `eppRegisterOrImport-[${normalizedDomainName}]`;

      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);
        let workflowTypeName: string | undefined;

        try {
          const description = await handle.describe();
          workflowTypeName = description.type;
        } catch (error) {
          logger.error(
            { error, orderId, orderItemId, workflowId },
            'Failed to load workflow details for order %s',
            orderId,
          );
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This item is no longer awaiting action',
            cause: error,
          });
        }

        if (workflowTypeName === 'eppRegisterOrImportWorkflow') {
          await handle.signal(eppRegisterOrImportProceed, {
            actor: 'USER',
            actorId: ctx.user.id,
            action: 'CANCEL',
          });
        } else if (workflowTypeName === 'sldRegisterOrImportWorkflow') {
          await handle.signal(sldRegisterOrImportProceed, { action: 'FAIL' });
        } else {
          logger.error(
            { orderId, orderItemId, workflowId, workflowTypeName },
            'Unsupported workflow type for required action cancellation',
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to cancel this item right now',
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          { error, orderId, orderItemId, workflowId },
          'Failed to cancel required action for order %s',
          orderId,
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to cancel this item right now',
          cause: error,
        });
      }

      return { success: true };
    }),

  confirmDomainUnlocked: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order_item',
      resourceId: input.orderItemId || '',
      action: 'confirm_domain_unlocked',
      extraInput: {
        orderId: input.orderId,
        orderItemId: input.orderItemId,
      },
    }),
  )
    .input(
      z.object({
        orderId: z.string().min(1),
        orderItemId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, orderItemId } = input;

      await ensureOrderOwnership(orderId, ctx.user.id);

      const orderItem = await db.query.orderItemsTable.findFirst({
        where: and(
          eq(orderItemsTable.id, orderItemId),
          eq(orderItemsTable.orderId, orderId),
        ),
      });

      if (!orderItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order item not found',
        });
      }

      if (orderItem.metadata?.requiredAction !== 'EPP_UNLOCK_REQUIRED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unlock confirmation is not required for this item',
        });
      }

      const normalizedDomainName = orderItem.normalizedDomainName;
      const workflowId = `eppRegisterOrImport-[${normalizedDomainName}]`;

      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);
        let workflowTypeName: string | undefined;

        try {
          const description = await handle.describe();
          workflowTypeName = description.type;
        } catch (error) {
          logger.error(
            { error, orderId, orderItemId, workflowId },
            'Failed to load workflow details for order %s',
            orderId,
          );
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This item is no longer awaiting action',
            cause: error,
          });
        }

        if (workflowTypeName === 'eppRegisterOrImportWorkflow') {
          await handle.signal(eppRegisterOrImportProceed, {
            actor: 'USER',
            actorId: ctx.user.id,
            action: 'PROCEED',
          });
        } else if (workflowTypeName === 'sldRegisterOrImportWorkflow') {
          await handle.signal(sldRegisterOrImportProceed, {
            action: 'PROCEED',
          });
        } else {
          logger.error(
            { orderId, orderItemId, workflowId, workflowTypeName },
            'Unsupported workflow type for unlock confirmation',
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to confirm unlock right now',
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          { error, orderId, orderItemId, workflowId },
          'Failed to confirm domain unlock for order %s',
          orderId,
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to confirm unlock right now',
          cause: error,
        });
      }

      return { success: true };
    }),

  getOrderItems: protectedProcedure.query(
    async ({ ctx: { user, poweredByNamefiDomain } }) => {
      // TODO: (sid) Consider addding pagination to this query if we start to have a lot of order
      const items = await db
        .select({
          ...getTableColumns(orderItemsTable),
          nftWalletAddress: ordersTable.nftWalletAddress,
          nftChainId: ordersTable.nftChainId,
          orderMetadata: ordersTable.metadata,
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
    },
  ),

  getOrderProgress: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { orderId } = input;

      const orderRecord = await ensureOrderOwnership(orderId, user.id);
      const snapshot = await fetchOrderWorkflowSnapshot(orderId);
      const orderStatus: OrderStatus =
        snapshot.state?.status ?? orderRecord.status;

      const payload: OrderProgressPayload = {
        ...snapshot,
        orderStatus,
        fetchedAt: new Date().toISOString(),
      };

      return payload;
    }),

  createOrderV2: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'create',
      extraInput: redactX402PaymentPayloadsFromAuditInput(input),
    }),
  )
    .input(
      createOrderV2InputSchema.superRefine((input, ctx) => {
        if (!input.nftMetadata.nftChainId) {
          ctx.addIssue({
            code: 'custom',
            message: 'NFT chain ID is required',
          });
        }
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { cartItemIds, payments, nftMetadata } = input;
      const gaEventTracking =
        await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id);

      const [error, privyUser] = await resolve(
        privyClient.getUserById(ctx.user.privyUserId),
      );
      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not find user details',
        });
      }

      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      await validateCartItems(ctx.user.id, cartItemIds);

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const allowedNftChainIds = getAllowedChainsForNft(
        ctx.poweredByNamefiDomain ?? undefined,
      );
      if (!allowedNftChainIds.includes(nftMetadata.nftChainId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `NFT chain ID ${nftMetadata.nftChainId} is not allowed for the selected domains`,
        });
      }

      const totalAmountInUsdCents = sum(pluck('amountInUSDCents', cartItems));
      const inputPaymentsTotal = sum(pluck('amountInUsdCents', payments));
      if (inputPaymentsTotal !== totalAmountInUsdCents) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payments total (${inputPaymentsTotal}) does not match cart total (${totalAmountInUsdCents})`,
        });
      }

      const userWallets = new Set(
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        }),
      );
      const nfscPayments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p) => isNfscPayment(p)) as NfscPaymentProviderDetails[];

      for (const p of nfscPayments) {
        const validWalletAddress = checksumWalletAddressSchema.safeParse(
          p.nfscPaymentDetails.walletAddress,
        );
        if (!validWalletAddress.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'NFSC payment walletAddress is not a valid Ethereum wallet address',
          });
        }
        if (!userWallets.has(validWalletAddress.data)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NFSC payment walletAddress is not linked to the user',
          });
        }
      }

      const x402Payments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p): p is X402PaymentProviderDetails => isX402Payment(p));

      for (const p of x402Payments) {
        validateX402PaymentProviderDetails({
          paymentProviderDetails: p,
          userWallets,
        });
      }

      const order = await db.transaction(async (tx) => {
        // 1) Create payments first, capturing each paymentId
        const createdPayments: PaymentSelect[] = [];
        for (const p of payments) {
          const paymentProviderDetails = isX402Payment(p.paymentProviderDetails)
            ? encryptX402PaymentProviderDetails(p.paymentProviderDetails)
            : p.paymentProviderDetails;

          const created = await createPayment(
            {
              amountInUsdCents: p.amountInUsdCents,
              paymentProviderDetails,
            },
            { tx },
          );
          createdPayments.push(created);
        }

        // 2) Create order linked to multiple payments (guarded linking inside service)
        const order =
          await orderService.createOrderWithExistingMultiplePayments(
            {
              amountInUSDCents: totalAmountInUsdCents,
              userId: ctx.user.id,
              paymentIds: createdPayments.map((p) => p.id),
              nftWalletAddress: nftMetadata.nftWalletAddress,
              nftChainId: nftMetadata.nftChainId,
              items: cartItems.map(
                (item) =>
                  ({
                    normalizedDomainName: item.normalizedDomainName,
                    amountInUSDCents: item.amountInUSDCents,
                    durationInYears: item.durationInYears,
                    type: item.type,
                    registrar: item.registrar,
                    metadata: item.metadata ?? undefined,
                    encryptionKeyId: item.encryptionKeyId ?? undefined,
                    encryptedEppAuthorizationCode:
                      item.encryptedEppAuthorizationCode ?? undefined,
                  }) satisfies CreateOrderItemInput,
              ),
            },
            { tx },
          );

        // 3) Delete used cart items
        await _removeCartItems(ctx.user.id, cartItemIds, { tx });

        // 4) Build per-payment metadata map and start workflow
        const paymentsMetadata = createdPayments.reduce<{
          [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
        }>((acc, p, i) => {
          acc[p.id] = payments[i]?.paymentMetadata as
            | ChargeUserWorkflowInput['metadata']
            | undefined;
          return acc;
        }, {});

        // TODO: [HIGH-IMPACT RACE CONDITION] Temporal workflow started inside database transaction.
        // If the workflow.start() call succeeds but the transaction later fails to commit
        // (e.g., due to serialization conflict), the workflow will be running for an order
        // that doesn't exist in the database. Conversely, if the transaction commits but
        // workflow.start() fails, we have an order without a processing workflow.
        // Current mitigation: The catch block throws, rolling back the transaction.
        // However, Temporal workflow start is not transactional with the database.
        // Impact: High - Could lead to orphaned workflows or orders stuck in PENDING state.
        // Fix: Consider starting the workflow AFTER the transaction commits, with a separate
        // cleanup mechanism for orders that fail to start their workflow.
        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
                gaEventTracking,
              },
            ],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: `process-order-${order.id}`,
          });
        } catch (error) {
          logger.error({ error }, 'Could not start process order workflow');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'Could not initiate the order, please contact support if the issue persists',
          });
        }

        return order;
      });
      if (gaEventTracking.trackGaEvents) {
        void gaEventOrderPlaced({
          userId: ctx.user.id,
          orderId: order.id,
          amountUsdCents: order.amountInUSDCents,
          itemCount: order.items.length,
          paymentCount: payments.length,
          orderSource: 'checkout',
        });
      } else {
        logger.info(
          {
            orderId: order.id,
            userId: ctx.user.id,
            gaEventTracking,
          },
          'Skipping GA order_placed event because tracking is disabled',
        );
      }
      return order;
    }),

  // Instant buy - single domain purchase without cart
  instantBuy: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'instant_buy',
      extraInput: redactX402PaymentPayloadsFromAuditInput(input),
    }),
  )
    .input(
      instantBuyInputSchema.superRefine((input, ctx) => {
        if (!input.nftMetadata.nftChainId) {
          ctx.addIssue({
            code: 'custom',
            message: 'NFT chain ID is required',
          });
        }
        if (
          !getAllowedChainsForNftByDomainNames([
            input.normalizedDomainName,
          ]).includes(input.nftMetadata.nftChainId)
        ) {
          ctx.addIssue({
            code: 'custom',
            message: `NFT chain ID ${input.nftMetadata.nftChainId} is not allowed for ${input.normalizedDomainName}`,
          });
        }
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, durationInYears, payments, nftMetadata } =
        input;
      const gaEventTracking =
        await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id);

      // 1. Get user details from Privy
      const [error, privyUser] = await resolve(
        privyClient.getUserById(ctx.user.privyUserId),
      );
      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not find user details',
        });
      }

      // 2. Validate domain availability and get pricing
      const validation = await validateDomainForInstantPurchaseOrThrow({
        normalizedDomainName,
        durationInYears,
        user: { id: ctx.user.id, privyUserId: ctx.user.privyUserId },
      });

      // 3. Validate payments total matches price
      const inputPaymentsTotal = sum(pluck('amountInUsdCents', payments));
      if (inputPaymentsTotal !== validation.priceInUsdCents) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payments total (${inputPaymentsTotal}) does not match domain price (${validation.priceInUsdCents})`,
        });
      }

      // 4. Validate NFSC wallet addresses are linked to user
      const userWallets = new Set(
        getPrivyUserLinkedEthereumChecksumWalletAddresses({ privyUser }),
      );
      const nfscPayments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p) => isNfscPayment(p)) as NfscPaymentProviderDetails[];

      for (const p of nfscPayments) {
        const validWalletAddress = checksumWalletAddressSchema.safeParse(
          p.nfscPaymentDetails.walletAddress,
        );
        if (!validWalletAddress.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'NFSC payment walletAddress is not a valid Ethereum wallet address',
          });
        }
        if (!userWallets.has(validWalletAddress.data)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NFSC payment walletAddress is not linked to the user',
          });
        }
      }

      // 5. Create order in transaction
      const order = await db.transaction(async (tx) => {
        // Create payments
        const createdPayments: PaymentSelect[] = [];
        for (const p of payments) {
          const paymentProviderDetails = isX402Payment(p.paymentProviderDetails)
            ? encryptX402PaymentProviderDetails(p.paymentProviderDetails)
            : p.paymentProviderDetails;

          const created = await createPayment(
            {
              amountInUsdCents: p.amountInUsdCents,
              paymentProviderDetails,
            },
            { tx },
          );
          createdPayments.push(created);
        }

        // Create order with single item
        const order =
          await orderService.createOrderWithExistingMultiplePayments(
            {
              amountInUSDCents: validation.priceInUsdCents,
              userId: ctx.user.id,
              paymentIds: createdPayments.map((p) => p.id),
              nftWalletAddress: nftMetadata.nftWalletAddress,
              nftChainId: nftMetadata.nftChainId,
              items: [
                {
                  normalizedDomainName,
                  amountInUSDCents: validation.priceInUsdCents,
                  durationInYears,
                  type: itemTypeSchema.enum.REGISTER,
                  registrar: validation.registrar,
                } satisfies CreateOrderItemInput,
              ],
            },
            { tx },
          );

        // Remove from cart if exists (cleanup)
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user.id),
              eq(cartItemsTable.normalizedDomainName, normalizedDomainName),
            ),
          );

        // Build per-payment metadata map and start workflow
        const paymentsMetadata = createdPayments.reduce<{
          [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
        }>((acc, p, i) => {
          acc[p.id] = payments[i]?.paymentMetadata as
            | ChargeUserWorkflowInput['metadata']
            | undefined;
          return acc;
        }, {});

        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
                gaEventTracking,
              },
            ],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: `process-order-${order.id}`,
          });
        } catch (workflowError) {
          logger.error(
            { error: workflowError },
            'Could not start process order workflow for instant buy',
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'Could not initiate the order, please contact support if the issue persists',
          });
        }

        logger.debug(
          {
            orderId: order.id,
            domain: normalizedDomainName,
            userId: ctx.user.id,
            priceInUsdCents: validation.priceInUsdCents,
          },
          'Instant buy order created successfully',
        );

        return order;
      });
      if (gaEventTracking.trackGaEvents) {
        void gaEventOrderPlaced({
          userId: ctx.user.id,
          orderId: order.id,
          amountUsdCents: order.amountInUSDCents,
          itemCount: order.items.length,
          paymentCount: payments.length,
          orderSource: 'instant_buy',
        });
      } else {
        logger.info(
          {
            orderId: order.id,
            userId: ctx.user.id,
            gaEventTracking,
          },
          'Skipping GA order_placed event because tracking is disabled',
        );
      }
      return order;
    }),

  getOrderPaymentMethodsDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }): Promise<PaymentMethodDetails[]> => {
      const { user } = ctx;
      const { orderId } = input;

      const { order, payments } =
        await orderService.getOrderDetailsOrThrow(orderId);

      if (order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      if (!payments.length) {
        return [];
      }
      const res = await pMap(
        payments,
        async (payment): Promise<PaymentMethodDetails> => {
          if (isX402Payment(payment)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: true,
              isX402Payment: true,
              network: payment.x402PaymentDetails.network,
              buyerWalletAddress: payment.x402PaymentDetails.buyerWalletAddress,
              receiverWalletAddress:
                payment.x402PaymentDetails.receiverWalletAddress,
              settlementTxHash: payment.x402PaymentDetails.settlementTxHash,
            };
          }

          if (isNfscPayment(payment)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: true,
              txHash: payment.paymentProviderReferenceId,
              chainId: payment.nfscPaymentDetails.chainId,
              walletAddress: payment.nfscPaymentDetails.walletAddress,
            };
          }

          if (isMppPayment(payment)) {
            if (payment.metadata.mppPaymentDetails.method === 'tempo') {
              return {
                isMppPayment: true,
                method: 'tempo',
                payerWalletAddress:
                  payment.metadata.mppPaymentDetails.payerWalletAddress,
                paymentId: payment.id,
                isOnChainPayment: true,
                reference: payment.paymentProviderReferenceId,
              };
            }

            if (isNil(payment.paymentProviderReferenceId)) {
              return {
                paymentId: payment.id,
                isOnChainPayment: false,
                brand: undefined,
                last4: undefined,
              };
            }

            const stripePaymentIntent = await stripe.paymentIntents.retrieve(
              payment.paymentProviderReferenceId,
              { expand: ['payment_method'] },
            );

            const paymentMethod =
              stripePaymentIntent.payment_method as Stripe.PaymentMethod | null;

            return {
              isMppPayment: true,
              method: 'stripe',
              paymentId: payment.id,
              isOnChainPayment: false,
              brand: paymentMethod?.card?.brand,
              last4: paymentMethod?.card?.last4,
              reference: payment.paymentProviderReferenceId,
            };
          }

          if (isNil(payment.paymentProviderReferenceId)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: false,
              brand: undefined,
              last4: undefined,
            };
          }

          const stripePaymentIntent = await stripe.paymentIntents.retrieve(
            payment.paymentProviderReferenceId,
            { expand: ['payment_method'] },
          );

          if (isNil(stripePaymentIntent.payment_method)) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message:
                'payment information missing, Namefi Payment ID: ' +
                payment.id +
                ' Stripe Payment Intent ID: ' +
                payment.paymentProviderReferenceId,
            });
          }

          const paymentMethod =
            stripePaymentIntent.payment_method as Stripe.PaymentMethod;

          return {
            paymentId: payment.id,
            isOnChainPayment: false,
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
          };
        },
      );

      return res;
    }),

  getPaymentMethodDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }): Promise<PaymentMethodDetails> => {
      const { user } = ctx;
      const { paymentId } = input;

      const payment = await db.query.paymentsTable.findFirst({
        where: eq(paymentsTable.id, paymentId),
        with: {
          order: true,
        },
      });

      if (!payment || !payment.order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }
      // TODO userId should be present in the payment table
      if (payment.order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this payment',
        });
      }

      if (isX402Payment(payment)) {
        return {
          paymentId: payment.id,
          isOnChainPayment: true,
          isX402Payment: true,
          network: payment.x402PaymentDetails.network,
          buyerWalletAddress: payment.x402PaymentDetails.buyerWalletAddress,
          receiverWalletAddress:
            payment.x402PaymentDetails.receiverWalletAddress,
          settlementTxHash: payment.x402PaymentDetails.settlementTxHash,
        };
      }

      if (isNfscPayment(payment)) {
        return {
          paymentId: payment.id,
          isOnChainPayment: true,
          txHash: payment.paymentProviderReferenceId,
          chainId: payment.nfscPaymentDetails.chainId,
          walletAddress: payment.nfscPaymentDetails.walletAddress,
        };
      }

      if (isMppPayment(payment)) {
        if (payment.metadata.mppPaymentDetails.method === 'tempo') {
          return {
            isMppPayment: true,
            method: 'tempo',
            payerWalletAddress:
              payment.metadata.mppPaymentDetails.payerWalletAddress,
            paymentId: payment.id,
            isOnChainPayment: true,
            reference: payment.paymentProviderReferenceId,
          };
        }

        if (isNil(payment.paymentProviderReferenceId)) {
          return {
            paymentId: payment.id,
            isOnChainPayment: false,
            brand: undefined,
            last4: undefined,
          };
        }

        const stripePaymentIntent = await stripe.paymentIntents.retrieve(
          payment.paymentProviderReferenceId,
          { expand: ['payment_method'] },
        );

        const paymentMethod =
          stripePaymentIntent.payment_method as Stripe.PaymentMethod | null;

        return {
          isMppPayment: true,
          method: 'stripe',
          paymentId: payment.id,
          isOnChainPayment: false,
          brand: paymentMethod?.card?.brand,
          last4: paymentMethod?.card?.last4,
          reference: payment.paymentProviderReferenceId,
        };
      }

      if (isNil(payment.paymentProviderReferenceId)) {
        return {
          paymentId: payment.id,
          isOnChainPayment: false,
          brand: undefined,
          last4: undefined,
        };
      }

      const stripePaymentIntent = await stripe.paymentIntents.retrieve(
        payment.paymentProviderReferenceId,
        { expand: ['payment_method'] },
      );

      if (isNil(stripePaymentIntent.payment_method)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'payment information missing, Namefi Payment ID: ' +
            payment.id +
            ' Stripe Payment Intent ID: ' +
            payment.paymentProviderReferenceId,
        });
      }

      const paymentMethod =
        stripePaymentIntent.payment_method as Stripe.PaymentMethod;

      return {
        paymentId: payment.id,
        isOnChainPayment: false,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
      };
    }),

  // Get refunds for a given payment (amounts and provider reference ids)
  getPaymentRefunds: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { paymentId } = input;

      const payment = await db.query.paymentsTable.findFirst({
        where: eq(paymentsTable.id, paymentId),
        with: { order: true },
      });

      if (!payment || !payment.order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }
      if (payment.order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this payment',
        });
      }

      const refunds = await db.query.refundsTable.findMany({
        columns: {
          id: true,
          amountInUSDCents: true,
          status: true,
          paymentProviderReferenceId: true,
          chainId: true,
          walletAddress: true,
          createdAt: true,
        },
        where: eq(refundsTable.paymentId, paymentId),
        orderBy: [desc(refundsTable.createdAt)],
      });

      return refunds.map((r) => ({
        refundId: r.id,
        amountInUSDCents: r.amountInUSDCents,
        status: r.status,
        txHash: r.paymentProviderReferenceId,
        chainId: r.chainId,
        walletAddress: r.walletAddress,
        createdAt: r.createdAt,
      }));
    }),

  reflectChangesInCartItemsIfAnyAndReturnSummary: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }: any) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: ctx.user?.id || 'unknown',
      action: 'refresh_cart_items',
      extraInput: input,
    }),
  )
    .input(z.object({ cartItemIds: z.array(z.string()).optional() }))
    .mutation(({ ctx, input }) => {
      const { cartItemIds } = input;
      return reflectChangesInCartItemsIfAnyAndReturnSummary(
        ctx.user.id,
        cartItemIds,
      );
    }),
});

function validateX402PaymentProviderDetails({
  paymentProviderDetails,
  userWallets,
}: {
  paymentProviderDetails: X402PaymentProviderDetails;
  userWallets: Set<string>;
}) {
  if (!config.X402_ENABLED) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 payment protocol is disabled',
    });
  }

  const signerWalletAddress = checksumWalletAddressSchema.safeParse(
    config.X402_SIGNER_ADDRESS,
  );
  if (!signerWalletAddress.success) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'x402 signer wallet address is not configured correctly',
    });
  }

  const buyerWalletAddress = checksumWalletAddressSchema.safeParse(
    paymentProviderDetails.x402PaymentDetails.buyerWalletAddress,
  );
  if (!buyerWalletAddress.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 buyerWalletAddress is not a valid Ethereum wallet address',
    });
  }
  if (!userWallets.has(buyerWalletAddress.data)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 buyerWalletAddress is not linked to the user',
    });
  }

  const receiverWalletAddress = checksumWalletAddressSchema.safeParse(
    paymentProviderDetails.x402PaymentDetails.receiverWalletAddress,
  );
  if (!receiverWalletAddress.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'x402 receiverWalletAddress is not a valid Ethereum wallet address',
    });
  }
  if (receiverWalletAddress.data !== signerWalletAddress.data) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 receiverWalletAddress does not match configured signer',
    });
  }

  if (
    paymentProviderDetails.x402PaymentDetails.network !== config.X402_NETWORK
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `x402 network must be ${config.X402_NETWORK}`,
    });
  }

  const paymentPayload =
    paymentProviderDetails.x402PaymentDetails.paymentPayload;
  if (!paymentPayload) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 payment payload is required for cart checkout',
    });
  }

  if (paymentPayload.accepted.network !== config.X402_NETWORK) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `x402 payment payload network must be ${config.X402_NETWORK}`,
    });
  }

  const acceptedPayTo = checksumWalletAddressSchema.safeParse(
    paymentPayload.accepted.payTo,
  );
  if (
    !acceptedPayTo.success ||
    acceptedPayTo.data !== signerWalletAddress.data
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 payment payload payTo does not match configured signer',
    });
  }

  const payloadRecord = paymentPayload.payload;
  const signature =
    payloadRecord && typeof payloadRecord === 'object'
      ? (payloadRecord as Record<string, unknown>).signature
      : undefined;

  if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 payment payload signature must be a hex string',
    });
  }
}

function encryptX402PaymentProviderDetails(
  paymentProviderDetails: X402PaymentProviderDetails,
): X402PaymentProviderDetails {
  const paymentPayload =
    paymentProviderDetails.x402PaymentDetails.paymentPayload;
  if (!paymentPayload) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'x402 payment payload is required for encryption',
    });
  }

  const privateKey = resolveX402PaymentPayloadEncryptionPrivateKey({
    onMissing: () =>
      new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'x402 payment payload encryption key is not configured',
      }),
  });
  const {
    paymentPayload: encryptedSignaturePaymentPayload,
    paymentPayloadEncryptionVersion,
  } = encryptX402PaymentPayloadSignature({
    paymentPayload: paymentPayload as PaymentPayload,
    privateKey,
  });

  return {
    paymentProvider: paymentProviderDetails.paymentProvider,
    x402PaymentDetails: {
      ...paymentProviderDetails.x402PaymentDetails,
      paymentPayload: encryptedSignaturePaymentPayload,
      paymentPayloadEncryptionVersion,
      presettled: false,
      settlementTxHash: undefined,
      settledAt: undefined,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function redactX402PaymentPayloadsFromAuditInput(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  if (!Array.isArray(input.payments)) {
    return input;
  }

  const payments = input.payments.map((payment) => {
    if (!isRecord(payment)) {
      return payment;
    }

    const paymentProviderDetails = payment.paymentProviderDetails;
    if (
      !isRecord(paymentProviderDetails) ||
      paymentProviderDetails.paymentProvider !== 'X402'
    ) {
      return payment;
    }

    const x402PaymentDetails = paymentProviderDetails.x402PaymentDetails;
    if (!isRecord(x402PaymentDetails)) {
      return payment;
    }

    return {
      ...payment,
      paymentProviderDetails: {
        ...paymentProviderDetails,
        x402PaymentDetails: {
          ...x402PaymentDetails,
          paymentPayload: x402PaymentDetails.paymentPayload
            ? '[REDACTED]'
            : x402PaymentDetails.paymentPayload,
        },
      },
    };
  });

  return {
    ...input,
    payments,
  };
}

async function _createPaymentForOrder(
  {
    totalAmountInUsdCents,
    paymentProviderDetails,
    user,
  }: {
    totalAmountInUsdCents: number;
    paymentProviderDetails: PaymentProviderDetails;
    user: UserSelect;
  },
  { tx }: { tx?: typeof db } = {},
) {
  if (totalAmountInUsdCents < 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid cart items total',
    });
  }

  if (totalAmountInUsdCents === 0) {
    // for zero, we create a NFSC with 0 address
    try {
      return await createPayment(
        {
          amountInUsdCents: totalAmountInUsdCents,
          paymentProviderDetails: {
            paymentProvider: 'NFSC_BASE',
            nfscPaymentDetails: {
              chainId: 8453,
              walletAddress: zeroAddress,
            },
          },
        },
        { tx },
      );
    } catch (error) {
      logger.error({ error }, 'Could not create payment');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not create payment',
      });
    }
  }

  // Validate payment walletAddress (if present) belongs to user
  if (isNfscPayment(paymentProviderDetails)) {
    const [error, privyUser] = await resolve(
      privyClient.getUserById(user.privyUserId),
    );

    if (error || isNil(privyUser)) {
      logger.error(
        {
          privyUserId: user.privyUserId,
          error,
        },
        'Privy fetch failed',
      );
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Could not find user details',
      });
    }

    const paymentWalletChecksumAddress = checksumWalletAddressSchema.safeParse(
      paymentProviderDetails.nfscPaymentDetails.walletAddress,
    );
    if (!paymentWalletChecksumAddress.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment walletAddress format is incorrect',
      });
    }

    const privyUserLinkedEthereumChecksumWalletAddresses =
      getPrivyUserLinkedEthereumChecksumWalletAddresses({
        privyUser,
      });

    if (
      !privyUserLinkedEthereumChecksumWalletAddresses.includes(
        paymentWalletChecksumAddress.data,
      )
    ) {
      logger.error('Payment walletAddress validation failed');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment walletAddress',
      });
    }
  }

  try {
    return await createPayment(
      {
        amountInUsdCents: totalAmountInUsdCents,
        paymentProviderDetails: paymentProviderDetails,
      },
      { tx },
    );
  } catch (error) {
    logger.error(
      {
        error: (error as Error).message,
      },
      'Could not create payment',
    );
    if (error instanceof NegativeAmountInUsdCentsError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid cart items total',
      });
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not create payment',
    });
  }
}
async function _removeCartItems(
  userId: string,
  cartItemIds: string[],
  { tx }: { tx?: typeof db } = {},
) {
  const res = await (tx ?? db)
    .delete(cartItemsTable)
    .where(
      and(
        inArray(cartItemsTable.id, cartItemIds),
        eq(cartItemsTable.userId, userId),
      ),
    );
  if (res.rowCount !== cartItemIds.length) {
    logger.error({ res }, 'Cart items removal failed');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Cart items removal failed',
    });
  }
  logger.debug({ res }, 'Cart items removed');
  return res;
}
