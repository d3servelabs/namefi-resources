import { CartCard } from '@/components/cart-card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';

export const OrderNotFound = () => {
  const router = useRouter();

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <CartCard
          title="Order not found"
          description="The order you are looking for could not be found. Please check the order ID and try again."
          footer={
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          }
        />
      </div>
    </PageShell>
  );
};
