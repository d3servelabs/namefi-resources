import {
  type PaymentProviderDetails,
  db,
  ordersTable,
  paymentsTable,
  orderItemsTable,
  orderNfscItemsTable,
  cartItemsTable,
  $withTransaction,
  isMppPayment,
  isNfscPayment,
  isX402Payment,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type {
  GetMyOrdersResult,
  NfscOrderItemForUser,
  OrderWithItemsForUser,
  OrderWithPayments,
  PaymentMethodDetails,
} from '@namefi-astra/common/orders-shared-types';
import type { OrderStatus } from '@namefi-astra/common/shared-schemas';
import type {
  OrderItemSelect,
  OrderNfscItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/common/contract/entity-schemas';
import type { NfscPaymentProviderDetails } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { isNil, isNotNil, indexBy, omit, prop } from 'ramda';
import Stripe from 'stripe';
import pMap from 'p-map';
import { OrderNotFoundError } from './errors';
import type {
  OrderItemInsert,
  OrderInsert,
  OrderNfscItemInsert,
} from '@namefi-astra/db';
import { logger } from '#lib/logger';
import { secrets } from '#lib/env';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { emitOrderPlacedIfTracked } from '#lib/tracking/checkout/events';
import {
  toGaEventTracking,
  type CheckoutTrackingContext,
} from '#lib/tracking/checkout/context';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

export type { OrderWithPayments, PaymentMethodDetails };

export async function getOrderDetailsOrThrow(
  orderId: string,
): Promise<OrderWithPayments> {
  const orderWithDetails = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    with: {
      items: true,
      nfscItems: true,
      user: true,
      payments: true,
    },
  });

  if (!orderWithDetails) {
    throw new OrderNotFoundError({ orderId });
  }

  const { items, nfscItems, user, payments, ...order } = orderWithDetails;
  return {
    order,
    payments: payments as PaymentSelect[],
    items: items as OrderItemSelect[],
    nfscItems: nfscItems as OrderNfscItemSelect[],
    user: user as UserSelect,
  };
}

export const orderService = {
  getOrderDetailsOrThrow,
  createOrderWithExistingMultiplePayments,
  createOrderWithExistingSinglePayment,
  createNfscOrderWithExistingPayments,
  ensureOrderOwnership,
  getOrderItemsForUser,
  getNfscOrderItemsForUser,
  buildPaymentMethodDetails,
  buildOrderPaymentMethodsDetails,
  validateNfscWalletAddresses,
  removeCartItems,
  createOrderWithWorkflow,
};

// -------- Stage 2: Storage-agnostic write utilities --------

export type CreateOrderItemInput = Omit<
  OrderItemInsert,
  'orderId' | 'id' | 'createdAt' | 'updatedAt' //we could allow id if needed
>;

export type CreateOrderWithExistingMultiplePaymentsInput = Omit<
  OrderInsert,
  'id' | 'createdAt' | 'updatedAt'
> & {
  paymentIds: string[];
  items: CreateOrderItemInput[];
};

export async function createOrderWithExistingMultiplePayments(
  {
    paymentIds,
    items,
    ...orderInsert
  }: CreateOrderWithExistingMultiplePaymentsInput,
  { tx }: { tx?: typeof db } = {},
): Promise<{
  id: string;
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  items: OrderItemSelect[];
}> {
  if (!paymentIds.length) {
    throw new Error('At least one paymentId is required');
  }

  return $withTransaction(
    async (tx) => {
      // Load and validate payments (within tx)
      const payments = await tx.query.paymentsTable.findMany({
        where: inArray(paymentsTable.id, paymentIds),
      });

      if (paymentIds.length !== payments.length) {
        throw new Error('Some payments not found');
      }
      if (payments.some((p) => p.orderId)) {
        throw new Error('Some payments are already linked to an order');
      }

      const totalAmountFromItems = items.reduce(
        (acc, it) => acc + (it.amountInUSDCents ?? 0),
        0,
      );
      const paymentsTotal = payments.reduce(
        (acc, p) => acc + p.amountInUSDCents,
        0,
      );

      if (
        paymentsTotal !== totalAmountFromItems ||
        orderInsert.amountInUSDCents !== totalAmountFromItems
      ) {
        throw new Error(
          `Payments total (${paymentsTotal}) does not match order total (${totalAmountFromItems})`,
        );
      }

      const [order] = await tx
        .insert(ordersTable)
        .values({
          ...orderInsert,
        })
        .returning();

      const insertedItems = await tx
        .insert(orderItemsTable)
        .values(
          items.map((it) => ({
            ...it,
            orderId: order.id,
          })),
        )
        .returning();

      // Link provided payments to this order (one-to-many via payments.orderId)
      // Guard against reusing a payment: only link payments that are not already linked
      const updated = await tx
        .update(paymentsTable)
        .set({ orderId: order.id })
        .where(
          and(
            inArray(paymentsTable.id, paymentIds),
            isNull(paymentsTable.orderId),
          ),
        )
        .returning({ id: paymentsTable.id });

      if (updated.length !== paymentIds.length) {
        throw new Error('One or more payments are already linked to an order');
      }

      return { ...order, items: insertedItems as OrderItemSelect[] };
    },
    { deferrable: true, isolationLevel: 'serializable' },
    tx,
  );
}

export async function createOrderWithExistingSinglePayment(
  input: Omit<CreateOrderWithExistingMultiplePaymentsInput, 'paymentIds'> & {
    paymentId: string;
  },
  { tx }: { tx?: typeof db } = {},
) {
  const { paymentId, ...rest } = input;
  return createOrderWithExistingMultiplePayments(
    { ...rest, paymentIds: [paymentId] },
    { tx },
  );
}

export type CreateOrderNfscItemInput = Omit<
  OrderNfscItemInsert,
  'orderId' | 'id' | 'createdAt' | 'updatedAt'
>;

export type CreateNfscOrderWithExistingPaymentsInput = Omit<
  OrderInsert,
  'id' | 'createdAt' | 'updatedAt'
> & {
  paymentIds: string[];
  nfscItems: CreateOrderNfscItemInput[];
};

/**
 * Create an NFSC top-up order from already-created payments.
 *
 * Sibling of `createOrderWithExistingMultiplePayments`, but writes into
 * `order_nfsc_items` (not `order_items`) so the domain-shaped table is left
 * untouched. Same serializable/deferrable transaction and payment-linking
 * guards. Additionally rejects any `NFSC_*` payment provider — an NFSC
 * top-up cannot be paid for with NFSC (the tRPC contract enforces this too;
 * this is defense in depth).
 */
export async function createNfscOrderWithExistingPayments(
  {
    paymentIds,
    nfscItems,
    ...orderInsert
  }: CreateNfscOrderWithExistingPaymentsInput,
  { tx }: { tx?: typeof db } = {},
): Promise<{
  id: string;
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  nfscItems: OrderNfscItemSelect[];
}> {
  if (!paymentIds.length) {
    throw new Error('At least one paymentId is required');
  }
  if (!nfscItems.length) {
    throw new Error('At least one NFSC item is required');
  }

  return $withTransaction(
    async (tx) => {
      // Load and validate payments (within tx)
      const payments = await tx.query.paymentsTable.findMany({
        where: inArray(paymentsTable.id, paymentIds),
      });

      if (paymentIds.length !== payments.length) {
        throw new Error('Some payments not found');
      }
      if (payments.some((p) => p.orderId)) {
        throw new Error('Some payments are already linked to an order');
      }
      if (payments.some((p) => p.paymentProvider.startsWith('NFSC_'))) {
        throw new Error('NFSC top-up orders cannot be paid with NFSC');
      }

      const totalAmountFromItems = nfscItems.reduce(
        (acc, it) => acc + (it.amountInUSDCents ?? 0),
        0,
      );
      const paymentsTotal = payments.reduce(
        (acc, p) => acc + p.amountInUSDCents,
        0,
      );

      if (
        paymentsTotal !== totalAmountFromItems ||
        orderInsert.amountInUSDCents !== totalAmountFromItems
      ) {
        throw new Error(
          `Payments total (${paymentsTotal}) does not match order total (${totalAmountFromItems})`,
        );
      }

      const [order] = await tx
        .insert(ordersTable)
        .values({
          ...orderInsert,
        })
        .returning();

      const insertedNfscItems = await tx
        .insert(orderNfscItemsTable)
        .values(
          nfscItems.map((it) => ({
            ...it,
            orderId: order.id,
          })),
        )
        .returning();

      // Link provided payments to this order, guarding against reusing a
      // payment that is already linked elsewhere.
      const updated = await tx
        .update(paymentsTable)
        .set({ orderId: order.id })
        .where(
          and(
            inArray(paymentsTable.id, paymentIds),
            isNull(paymentsTable.orderId),
          ),
        )
        .returning({ id: paymentsTable.id });

      if (updated.length !== paymentIds.length) {
        throw new Error('One or more payments are already linked to an order');
      }

      return {
        ...order,
        nfscItems: insertedNfscItems as OrderNfscItemSelect[],
      };
    },
    { deferrable: true, isolationLevel: 'serializable' },
    tx,
  );
}

// -------- Extracted shared functions --------

export async function ensureOrderOwnership(orderId: string, userId: string) {
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
}

export async function getOrderItemsForUser(
  userId: string,
  poweredByNamefiDomain?: string | null,
) {
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
        eq(ordersTable.userId, userId),
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
}

/**
 * Input shape for `getMyOrders` — mirrors the parsed contract input.
 */
export type GetMyOrdersInput = {
  sortBy: 'date' | 'price';
  sortDirection: 'asc' | 'desc';
  filters: {
    domainName?: string;
    orderStatuses?: OrderStatus[];
    orderId?: string;
    nftReceivingWalletAddress?: string;
    nftReceivingChainId?: number;
  };
  limit: number;
  cursor?: string;
  /** When true, do not restrict to orders containing PBN-matching items. */
  includeAllParents: boolean;
};

/**
 * Keyset cursor payload. `v` is the sort value of the last row of the
 * previous page (either a `createdAt` epoch ms or an `amountInUSDCents`
 * integer) and `i` is its order id — the deterministic tie-breaker so
 * pagination stays stable when two orders share the same sort value.
 *
 * Pagination has to be keyset rather than row-number-based because the
 * row number is computed against the user's full chronological history
 * (regardless of the current sort) and so isn't monotonic with the
 * outer-query sort.
 */
type MyOrdersCursor = { v: number; i: string };

function encodeMyOrdersCursor(c: MyOrdersCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeMyOrdersCursor(s: string): MyOrdersCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.v === 'number' &&
      Number.isFinite(parsed.v) &&
      typeof parsed.i === 'string' &&
      parsed.i.length > 0
    ) {
      return { v: parsed.v, i: parsed.i };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Escape PostgreSQL `LIKE`/`ILIKE` wildcards (`%`, `_`) and the escape
 * character itself (`\`) so user-supplied search text is matched literally.
 * Backslash is PostgreSQL's default `LIKE` escape character, so escaping
 * inside the pattern works without an explicit `ESCAPE` clause.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

/**
 * v2 orders feed — return a page of the current user's orders with their
 * items nested.
 *
 * The row number is a stable per-user identity: the oldest order is always
 * `#1`, the newest is `#n`. It does NOT depend on the active filter or
 * sort — it's computed in an inner subquery over the user's full orders
 * table (including NFSC top-ups, so that a domain order's `#5` doesn't
 * silently shift when an unrelated NFSC top-up is created). The outer
 * query then applies all filters (structural and user-controlled), sorts
 * by the requested column, and paginates with a keyset cursor on the sort
 * column + id. `COUNT(*) OVER ()` in the outer query yields the post-
 * filter total so the UI can show "Showing K of T".
 *
 * Structural filters (always applied):
 * - at least one row in `order_items` — excludes NFSC-top-up-only orders,
 *   which live in `order_nfsc_items` only.
 * - on PBN deployments, at least one item under the request's PBN
 *   parent. Caller can opt out via `includeAllParents`.
 *
 * Perf note: numbering is O(N) in the user's total orders (the planner has
 * to read all of them before assigning row numbers). For typical histories
 * (<1k orders) it's negligible. Users with tens of thousands of orders
 * would want a composite `(user_id, created_at, id)` index — not present
 * today.
 */
export async function getMyOrders(
  userId: string,
  poweredByNamefiDomain: string | null | undefined,
  input: GetMyOrdersInput,
): Promise<GetMyOrdersResult> {
  const { sortBy, sortDirection, filters, limit, cursor, includeAllParents } =
    input;

  const decodedCursor = cursor ? decodeMyOrdersCursor(cursor) : null;
  // A cursor that fails to decode is a client bug, not "start from page 1" —
  // silently falling back would return duplicate first-page data and hide it.
  if (cursor && !decodedCursor) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid or malformed pagination cursor',
    });
  }

  // Inner subquery: every order the user has ever placed, numbered by
  // chronological position (oldest = 1). NO filters here — the row number
  // is a stable identity, not a query-relative position.
  const numbered = db
    .select({
      id: ordersTable.id,
      status: ordersTable.status,
      amountInUSDCents: ordersTable.amountInUSDCents,
      nftWalletAddress: ordersTable.nftWalletAddress,
      nftChainId: ordersTable.nftChainId,
      metadata: ordersTable.metadata,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
      rowNum:
        sql<number>`row_number() over (order by ${ordersTable.createdAt} asc, ${ordersTable.id} asc)`.as(
          'row_num',
        ),
    })
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .as('numbered_orders');

  // EXISTS subquery builder — every condition we attach to `order_items`
  // already joins on `order_id = numbered.id`, so we factor that out.
  const itemsExistsWhere = (...extraConditions: (SQL | undefined)[]) =>
    exists(
      db
        .select({ one: sql`1` })
        .from(orderItemsTable)
        .where(
          and(eq(orderItemsTable.orderId, numbered.id), ...extraConditions),
        ),
    );

  // Structural: at least one domain item. Excludes NFSC-top-up-only orders
  // from the visible list (they still consume a row number in the inner
  // subquery so the user's other order numbers stay stable).
  const hasAnyDomainItemCondition = itemsExistsWhere();

  // Structural-ish: on PBN deployments, hide orders with no PBN-matching
  // items unless the caller opts out via `includeAllParents`.
  const pbnFilterActive = Boolean(poweredByNamefiDomain) && !includeAllParents;
  const hasPbnItemCondition =
    pbnFilterActive && poweredByNamefiDomain
      ? itemsExistsWhere(
          ilike(
            orderItemsTable.normalizedDomainName,
            `%.${poweredByNamefiDomain}`,
          ),
        )
      : undefined;

  // User's `domainName` substring filter — a separate EXISTS so it doesn't
  // collide with the PBN clause (an order may satisfy both via different
  // items: one under the PBN parent and one matching the user's pattern
  // outside it). The input is escaped so a literal `%`/`_` isn't treated
  // as a wildcard.
  const domainNameCondition = filters.domainName
    ? itemsExistsWhere(
        ilike(
          orderItemsTable.normalizedDomainName,
          `%${escapeLikePattern(filters.domainName)}%`,
        ),
      )
    : undefined;

  const sortColumn =
    sortBy === 'date' ? numbered.createdAt : numbered.amountInUSDCents;
  const sortFn = sortDirection === 'asc' ? asc : desc;
  const cmpFn = sortDirection === 'asc' ? gt : lt;

  const cursorSortValue: Date | number | null = decodedCursor
    ? sortBy === 'date'
      ? new Date(decodedCursor.v)
      : decodedCursor.v
    : null;

  const cursorCondition =
    decodedCursor && cursorSortValue !== null
      ? or(
          cmpFn(sortColumn, cursorSortValue as never),
          and(
            eq(sortColumn, cursorSortValue as never),
            cmpFn(numbered.id, decodedCursor.i),
          ),
        )
      : undefined;

  // Outer query: apply all filters + sort + cursor + limit, and emit a
  // post-filter total via COUNT(*) OVER ().
  const orderRows = await db
    .select({
      id: numbered.id,
      status: numbered.status,
      amountInUSDCents: numbered.amountInUSDCents,
      nftWalletAddress: numbered.nftWalletAddress,
      nftChainId: numbered.nftChainId,
      metadata: numbered.metadata,
      createdAt: numbered.createdAt,
      updatedAt: numbered.updatedAt,
      rowNum: numbered.rowNum,
      totalCount: sql<number>`count(*) over ()`.as('total_count'),
    })
    .from(numbered)
    .where(
      and(
        hasAnyDomainItemCondition,
        hasPbnItemCondition,
        filters.orderId ? eq(numbered.id, filters.orderId) : undefined,
        filters.orderStatuses && filters.orderStatuses.length > 0
          ? inArray(numbered.status, filters.orderStatuses)
          : undefined,
        // Case-insensitive: stored addresses are checksummed, but a user
        // can paste any casing into the filter.
        filters.nftReceivingWalletAddress
          ? sql`lower(${numbered.nftWalletAddress}) = lower(${filters.nftReceivingWalletAddress})`
          : undefined,
        filters.nftReceivingChainId !== undefined
          ? eq(numbered.nftChainId, filters.nftReceivingChainId)
          : undefined,
        domainNameCondition,
        cursorCondition,
      ),
    )
    .orderBy(sortFn(sortColumn), sortFn(numbered.id))
    .limit(limit + 1);

  const hasMore = orderRows.length > limit;
  const keptOrders = hasMore ? orderRows.slice(0, limit) : orderRows;

  // COUNT(*) OVER () is the same value on every returned row. When the
  // slice is empty there were no matches, so 0 is the correct fallback.
  const totalCount = keptOrders[0]?.totalCount ?? 0;

  const nextCursor =
    hasMore && keptOrders.length > 0
      ? encodeMyOrdersCursor({
          v:
            sortBy === 'date'
              ? keptOrders[keptOrders.length - 1].createdAt.getTime()
              : keptOrders[keptOrders.length - 1].amountInUSDCents,
          i: keptOrders[keptOrders.length - 1].id,
        })
      : null;

  if (keptOrders.length === 0) {
    return { orders: [], nextCursor, totalCount };
  }

  const orderIds = keptOrders.map((o) => o.id);
  const itemRows = await db
    .select()
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds))
    .orderBy(asc(orderItemsTable.createdAt));

  const itemsByOrderId = new Map<string, (typeof itemRows)[number][]>();
  for (const item of itemRows) {
    const list = itemsByOrderId.get(item.orderId);
    if (list) {
      list.push(item);
    } else {
      itemsByOrderId.set(item.orderId, [item]);
    }
  }

  const orders = keptOrders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) ?? [],
  })) as unknown as OrderWithItemsForUser[];

  return { orders, nextCursor, totalCount };
}

/**
 * Return a user's NFSC top-up order items, newest first, with the parent
 * order's status and createdAt joined in for UI grouping/filtering. All
 * filters are optional and AND-combined.
 */
export async function getNfscOrderItemsForUser(
  userId: string,
  filters?: {
    recipientWalletAddress?: string;
    chainId?: number;
    statuses?: OrderStatus[];
    limit?: number;
  },
): Promise<NfscOrderItemForUser[]> {
  const limit = Math.min(Math.max(filters?.limit ?? 20, 1), 100);

  const rows = await db
    .select({
      ...getTableColumns(orderNfscItemsTable),
      orderStatus: ordersTable.status,
      orderCreatedAt: ordersTable.createdAt,
    })
    .from(orderNfscItemsTable)
    .innerJoin(ordersTable, eq(orderNfscItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, userId),
        filters?.recipientWalletAddress
          ? eq(
              orderNfscItemsTable.recipientWalletAddress,
              filters.recipientWalletAddress,
            )
          : undefined,
        filters?.chainId !== undefined
          ? eq(orderNfscItemsTable.chainId, filters.chainId)
          : undefined,
        filters?.statuses && filters.statuses.length > 0
          ? inArray(ordersTable.status, filters.statuses)
          : undefined,
      ),
    )
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  return rows as NfscOrderItemForUser[];
}

export async function buildPaymentMethodDetails(
  payment: PaymentSelect,
): Promise<PaymentMethodDetails> {
  if (isX402Payment(payment)) {
    return {
      paymentId: payment.id,
      isOnChainPayment: true,
      isX402Payment: true,
      network: payment.x402PaymentDetails.network,
      buyerWalletAddress: payment.x402PaymentDetails.buyerWalletAddress,
      receiverWalletAddress: payment.x402PaymentDetails.receiverWalletAddress,
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
}

export async function buildOrderPaymentMethodsDetails(
  payments: PaymentSelect[],
): Promise<PaymentMethodDetails[]> {
  return pMap(payments, buildPaymentMethodDetails);
}

// -------- Wallet validation --------

export function validateNfscWalletAddresses(
  nfscPayments: NfscPaymentProviderDetails[],
  userWallets: Set<string>,
) {
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
}

// -------- Cart cleanup --------

export async function removeCartItems(
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

// -------- Order creation with workflow --------

export type CreateOrderWithWorkflowInput = {
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string;
  nftChainId: number;
  payments: Array<{
    amountInUsdCents: number;
    paymentProviderDetails: PaymentProviderDetails;
  }>;
  items: CreateOrderItemInput[];
  paymentsMetadataFromInput?: Array<
    ChargeUserWorkflowInput['metadata'] | undefined
  >;
  cartCleanup?:
    | { type: 'ids'; userId: string; cartItemIds: string[] }
    | {
        type: 'domain';
        userId: string;
        normalizedDomainName: NamefiNormalizedDomain;
      };
  gaEventTracking: CheckoutTrackingContext;
  orderSource?: 'checkout' | 'instant_buy';
};

export async function createOrderWithWorkflow(
  input: CreateOrderWithWorkflowInput,
) {
  const order = await db.transaction(async (tx) => {
    // 1. Create payments
    const createdPayments: PaymentSelect[] = [];
    for (const p of input.payments) {
      const created = await createPayment(
        {
          amountInUsdCents: p.amountInUsdCents,
          paymentProviderDetails: p.paymentProviderDetails,
        },
        { tx },
      );
      createdPayments.push(created);
    }

    // 2. Create order linked to payments
    const order = await createOrderWithExistingMultiplePayments(
      {
        amountInUSDCents: input.amountInUSDCents,
        userId: input.userId,
        paymentIds: createdPayments.map((p) => p.id),
        nftWalletAddress: input.nftWalletAddress,
        nftChainId: input.nftChainId,
        items: input.items,
      },
      { tx },
    );

    // 3. Clean up cart items
    if (input.cartCleanup) {
      if (input.cartCleanup.type === 'ids') {
        await removeCartItems(
          input.cartCleanup.userId,
          input.cartCleanup.cartItemIds,
          { tx },
        );
      } else if (input.cartCleanup.type === 'domain') {
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, input.cartCleanup.userId),
              eq(
                cartItemsTable.normalizedDomainName,
                input.cartCleanup.normalizedDomainName,
              ),
            ),
          );
      }
    }

    // 4. Build per-payment metadata map
    const paymentsMetadata: Record<
      string,
      ChargeUserWorkflowInput['metadata'] | undefined
    > = {};
    for (let i = 0; i < createdPayments.length; i++) {
      paymentsMetadata[createdPayments[i].id] =
        input.paymentsMetadataFromInput?.[i];
    }

    // 5. Start temporal workflow
    try {
      await temporalClient.workflow.start(processOrderWorkflow, {
        args: [
          {
            orderId: order.id,
            paymentsMetadata,
            gaEventTracking: toGaEventTracking(input.gaEventTracking),
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

  // 6. GA event tracking (after transaction)
  void emitOrderPlacedIfTracked({
    tracking: input.gaEventTracking,
    userId: input.userId,
    order,
    paymentCount: input.payments.length,
    orderSource: input.orderSource,
  });

  return order;
}
