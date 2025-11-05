import { CartCard } from '@/components/cart-card';
import { Button } from '@/components/ui/shadcn/button';
import { useRouter } from 'next/navigation';

export const OrderNotFound = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-8">
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
    </div>
  );
};
