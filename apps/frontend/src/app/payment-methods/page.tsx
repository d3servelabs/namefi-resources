import dynamic from 'next/dynamic';
import { PaymentMethodsManagerPlaceholder } from '@/components/payment-method/payment-methods-manager-placeholder';
import { CreditCardIcon } from 'lucide-react';

const PaymentMethodsManager = dynamic(
  () => import('@/components/payment-method/payment-methods-manager'),
  {
    loading: () => (
      <PaymentMethodsManagerPlaceholder
        title="Loading payment methods"
        description="Getting things ready…"
        icon={<CreditCardIcon className="size-10 text-muted-foreground" />}
      />
    ),
  },
);

export default function PaymentMethodsPage() {
  return (
    <div>
      <PaymentMethodsManager />
    </div>
  );
}
