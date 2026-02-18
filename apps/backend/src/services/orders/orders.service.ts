import {
  db,
  ordersTable,
  paymentsTable,
  orderItemsTable,
  $withTransaction,
  usersTable,
} from '@namefi-astra/db';
import { and, eq, ilike, inArray, isNull } from 'drizzle-orm';
import { OrderNotFoundError } from './errors';
import type {
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/db';
import { indexBy, omit, pluck, prop, filter, isNotNil } from 'ramda';
import type { OrderItemInsert, OrderInsert } from '@namefi-astra/db';
import z from 'zod';
import { defaultKeyv } from '#lib/keyv';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { logger } from '#lib/logger';

type OrderRow = typeof ordersTable.$inferSelect;

export type OrderWithPayments = {
  order: OrderRow;
  items: OrderItemSelect[];
  payments: PaymentSelect[];
  user: UserSelect;
};

export async function getOrderDetailsOrThrow(
  orderId: string,
): Promise<OrderWithPayments> {
  const orderWithDetails = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    with: {
      items: true,
      user: true,
      payments: true,
    },
  });

  if (!orderWithDetails) {
    throw new OrderNotFoundError({ orderId });
  }

  const { items, user, payments, ...order } = orderWithDetails;
  return {
    order,
    payments: payments as PaymentSelect[],
    items: items as OrderItemSelect[],
    user: user as UserSelect,
  };
}

export const GA_EVENT_TRACKING_REASON_LITERALS = [
  'DEFAULT',
  'BACKFILL',
  'TEST',
  'PRIVACY',
  'EXPERIMENT',
  'INCIDENT_MITIGATION',
  'INTERNAL', // requests coming from our team
  'OTHER',
] as const;

export const gaEventTrackingReasonLiteralSchema = z.enum(
  GA_EVENT_TRACKING_REASON_LITERALS,
);

export type GaEventTrackingReasonLiteral =
  (typeof GA_EVENT_TRACKING_REASON_LITERALS)[number];

export const gaEventTrackingReasonSchema = z
  .string()
  .trim()
  .min(1, 'GA event tracking reason is required')
  .max(200, 'GA event tracking reason must be at most 200 characters');

export const gaEventTrackingSchema = z.object({
  trackGaEvents: z.boolean(),
  reason: gaEventTrackingReasonSchema.optional(),
});

let teamMembersPromise: Promise<string[] | null> | null = null;

async function getTeamMembersIds(): Promise<string[] | null> {
  try {
    const cached = await defaultKeyv.get<string[]>('namefi-team-members');
    if (cached) return cached;

    // Reuse in-flight promise if exists
    if (teamMembersPromise) return teamMembersPromise;

    teamMembersPromise = (async () => {
      const users = await db
        .select({ userId: usersTable.id })
        .from(privyUsersTableSchema)
        .leftJoin(
          usersTable,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .where(ilike(privyUsersTableSchema.email, '%@d3serve.xyz'));
      const usersIds = filter(isNotNil, pluck('userId', users)) as string[];
      await defaultKeyv.set<string[]>('namefi-team-members', usersIds);
      teamMembersPromise = null;
      return usersIds;
    })();

    return teamMembersPromise;
  } catch (error) {
    teamMembersPromise = null;
    logger.warn({ error }, 'getTeamMemebersIds failed');
  }
  return null;
}

export async function shouldTrackOrderCheckoutFlowForUser(
  userId: string,
): Promise<z.infer<typeof gaEventTrackingSchema>> {
  const namefiTeamMembersIds = await getTeamMembersIds();

  if (namefiTeamMembersIds?.includes(userId)) {
    return {
      trackGaEvents: false,
      reason: 'INTERNAL',
    };
  }

  return {
    trackGaEvents: true,
  };
}

export const orderService = {
  getOrderDetailsOrThrow,
  createOrderWithExistingMultiplePayments,
  createOrderWithExistingSinglePayment,
  shouldTrackOrderCheckoutFlowForUser,
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
