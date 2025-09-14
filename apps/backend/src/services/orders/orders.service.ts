import { db, ordersTable, paymentsTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { OrderNotFoundError } from './errors';
import type {
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/db';
import { omit } from 'ramda';

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
};
