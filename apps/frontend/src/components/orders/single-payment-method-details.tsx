import { useMemo } from 'react';
import { getChain } from '@namefi-astra/utils/chains';
import { getShortAddress } from '@/lib/string';
import { StatusBadge } from '@/components/status-badge';
import type { PaymentSelect } from '@namefi-astra/db/types';
import type { AppRouterOutput } from '@/lib/trpc';

type PaymentMethodDetails =
  AppRouterOutput['orders']['getOrderPaymentMethodsDetails'][number];

export function SinglePaymentMethodDetails({
  payment,
  paymentMethodDetails,
}: {
  payment: PaymentSelect;
  paymentMethodDetails: PaymentMethodDetails;
}) {
  const isCreditCardPayment = useMemo(
    () => payment.paymentProvider === 'STRIPE',
    [payment.paymentProvider],
  );
  const primaryPaymentMethod = paymentMethodDetails;
  const creditCardPreviewText = useMemo(() => {
    if (!isCreditCardPayment || !primaryPaymentMethod) {
      return '-';
    }

    if (
      !(
        !primaryPaymentMethod.isOnChainPayment &&
        primaryPaymentMethod.brand &&
        primaryPaymentMethod.last4
      )
    ) {
      return 'Credit Card';
    }

    return `${primaryPaymentMethod.brand.toLocaleUpperCase()}(${primaryPaymentMethod.last4})`;
  }, [isCreditCardPayment, primaryPaymentMethod]);

  const onChainPaymentPreviewText = useMemo(() => {
    if (isCreditCardPayment) {
      return '';
    }

    if (!payment.nfscPaymentDetails) {
      return '-';
    }

    const chain = getChain(payment.nfscPaymentDetails.chainId);
    const chainName =
      chain?.name || `Chain ID ${payment.nfscPaymentDetails.chainId}`;
    return `(${chainName}) ${getShortAddress(payment.nfscPaymentDetails.walletAddress)}`;
  }, [isCreditCardPayment, payment.nfscPaymentDetails]);

  return (
    <div className="flex flex-row gap-2 items-center">
      {isCreditCardPayment ? (
        <span className="font-medium text-muted-foreground text-sm">
          {creditCardPreviewText}
        </span>
      ) : (
        <span className="font-medium text-muted-foreground text-sm">
          {onChainPaymentPreviewText}
        </span>
      )}
      {payment.status && (
        <div className="scale-90">
          <StatusBadge status={payment.status} type="payment" />
        </div>
      )}
      <span className="w-[8ch] text-end whitespace-pre">
        ${payment.amountInUSDCents / 100}{' '}
        {isCreditCardPayment ? '  USD' : 'NFSC'}
      </span>
    </div>
  );
}
