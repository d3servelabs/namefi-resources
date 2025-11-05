import { CartCard } from '@/components/cart-card';
import { formatDate } from '@/lib/string';
import { PaymentMethodsDetails } from '@/components/orders/payment-method-details';
import type { AppRouterOutput } from '@/lib/trpc';

type OrderWithPayments = AppRouterOutput['orders']['getOrder'];

export const PaymentDetailsSummary = ({
  orderWithPayments,
}: {
  orderWithPayments: OrderWithPayments;
}) => {
  return (
    <CartCard
      title="Order Details"
      className="mb-6 bg-black/[0.03] border-white/10"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDate(new Date(orderWithPayments.order.createdAt))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Grand total</span>
          <span>${orderWithPayments.order.amountInUSDCents / 100} USD</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">
            Payments (
            {orderWithPayments.payments.length === 1 ? 'Single' : 'Multiple'})
          </span>
          <PaymentMethodsDetails
            orderId={orderWithPayments.order.id}
            payments={orderWithPayments.payments}
          />
        </div>
      </div>
    </CartCard>
  );
};
