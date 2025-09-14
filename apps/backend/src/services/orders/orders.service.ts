import {
  db,
  ordersTable,
  paymentsTable,
  orderItemsTable,
  $withTransaction,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { OrderNotFoundError } from './errors';
import type {
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/db';
import { omit } from 'ramda';
import type { OrderItemInsert, OrderInsert } from '@namefi-astra/db';

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
    },
  });

  if (!orderWithDetails) {
    throw new OrderNotFoundError({ orderId });
  }

  const payments: PaymentSelect[] = [];
  if (orderWithDetails.paymentId) {
    const p = await db.query.paymentsTable.findFirst({
      where: eq(paymentsTable.id, orderWithDetails.paymentId),
    });
    if (p) payments.push(p);
  }

  const { items, user, ...order } = orderWithDetails;
  return {
    order,
    payments,
    items: items as OrderItemSelect[],
    user: user as UserSelect,
  };
}

export const orderService = {
  getOrderDetailsOrThrow,
  createOrderWithExistingMultiplePayments,
  createOrderWithExistingSinglePayment,
};

// -------- Stage 2: Storage-agnostic write utilities --------

export type CreateOrderItemInput = Omit<
  OrderItemInsert,
  'orderId' | 'id' | 'createdAt' | 'updatedAt' //we could allow id if needed
>;

export type CreateOrderWithExistingMultiplePaymentsInput = Omit<
  OrderInsert,
  'id' | 'createdAt' | 'updatedAt' | 'paymentId'
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
  paymentId: string | null;
  items: OrderItemSelect[];
}> {
  if (!paymentIds.length) {
    throw new Error('At least one paymentId is required');
  }
  if (paymentIds.length > 1) {
    throw new Error('Multiple paymentIds are not supported yet');
  }

  return $withTransaction(
    async (tx) => {
      // Load and validate payments (within tx)
      const payments = await Promise.all(
        paymentIds.map(async (pid) => {
          const p = await tx.query.paymentsTable.findFirst({
            where: eq(paymentsTable.id, pid),
          });
          if (!p) throw new Error(`Payment not found: ${pid}`);
          return p as PaymentSelect;
        }),
      );

      // Prefer STRIPE as primary if present (forward-compatible with refund priority)
      const primaryPayment =
        payments.find((p) => p.paymentProvider === 'STRIPE') ?? payments[0]!;

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
          paymentId: primaryPayment.id,
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

      // Note: Additional payments beyond primary are intentionally ignored in Stage 2 (no join table yet)
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
