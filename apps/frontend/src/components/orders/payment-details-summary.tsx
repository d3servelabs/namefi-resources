import { CartCard } from '@/components/cart-card';
import { formatDate } from '@/lib/string';
import { PaymentMethodsDetails } from '@/components/orders/payment-method-details';
import type { AppRouterOutput } from '@/lib/trpc';
import { useTranslations } from 'next-intl';

type OrderWithPayments = AppRouterOutput['orders']['getOrder'];

export const PaymentDetailsSummary = ({
  orderWithPayments,
}: {
  orderWithPayments: OrderWithPayments;
}) => {
  const t = useTranslations('orders');
  return (
    <CartCard
      title={t('summary.orderDetails')}
      className="mb-6 bg-black/[0.03] border-white/10"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t('summary.date')}</span>
          <span>{formatDate(new Date(orderWithPayments.order.createdAt))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {t('summary.grandTotal')}
          </span>
          <span>${orderWithPayments.order.amountInUSDCents / 100} USD</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground">
            {orderWithPayments.payments.length === 1
              ? t('summary.paymentsSingle')
              : t('summary.paymentsMultiple')}
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
