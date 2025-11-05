import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { useAuth } from '@/hooks/use-auth';
import { TRPCClientError } from '@trpc/client';
import type { PaymentSelect } from '@namefi-astra/db/types';
import { SinglePaymentMethodDetails } from '@/components/orders/single-payment-method-details';
import { Loader2 } from 'lucide-react';

export function PaymentMethodsDetails({
  orderId,
  payments,
}: {
  orderId: string;
  payments: PaymentSelect[];
}) {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { data: paymentMethods, isLoading: arePaymentMethodDetailsLoading } =
    useQuery({
      ...trpc.orders.getOrderPaymentMethodsDetails.queryOptions({ orderId }),
      enabled: !!orderId && isAuthenticated,
      retry(failureCount, error) {
        if (failureCount >= 3) {
          return false;
        }
        if (
          error instanceof TRPCClientError &&
          error.data?.code === 'UNAUTHORIZED'
        ) {
          return false;
        }
        return true;
      },
    });

  const paymentMethodDetailsMap = useMemo(() => {
    return new Map(
      paymentMethods?.map((payment) => [payment.paymentId, payment]) ?? [],
    );
  }, [paymentMethods]);

  if (arePaymentMethodDetailsLoading || isAuthLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!paymentMethodDetailsMap) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {payments.map((payment) => (
        <SinglePaymentMethodDetails
          key={payment.id}
          payment={payment}
          paymentMethodDetails={
            paymentMethodDetailsMap.get(payment.id) ?? {
              paymentId: payment.id,
              isOnChainPayment: false,
              brand: undefined,
              last4: undefined,
            }
          }
        />
      ))}
    </div>
  );
}
