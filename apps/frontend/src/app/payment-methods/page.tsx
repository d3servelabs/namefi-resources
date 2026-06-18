import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { PaymentMethodsManagerPlaceholder } from '@/components/payment-method/payment-methods-manager-placeholder';
import { CreditCardIcon } from 'lucide-react';

const PaymentMethodsManager = dynamic(
  () => import('@/components/payment-method/payment-methods-manager'),
);

export default async function PaymentMethodsPage() {
  const t = await getTranslations('paymentMethods');

  return (
    <div>
      <Suspense
        fallback={
          <PaymentMethodsManagerPlaceholder
            title={t('loading.title')}
            description={t('loading.description')}
            icon={<CreditCardIcon className="size-10 text-muted-foreground" />}
          />
        }
      >
        <PaymentMethodsManager />
      </Suspense>
    </div>
  );
}
