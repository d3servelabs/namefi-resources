import { CartCard } from '@/components/cart-card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/page-shell';
import { ErrorHelpLinks } from '@/components/error-help-links';

export const OrderNotFound = () => {
  const t = useTranslations('orders');
  const router = useRouter();

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <CartCard
          title={t('notFound.title')}
          description={t('notFound.description')}
          footer={
            <Button onClick={() => router.push('/orders')}>
              {t('notFound.backToOrders')}
            </Button>
          }
        />
        <ErrorHelpLinks className="mt-6 text-center" />
      </div>
    </PageShell>
  );
};
