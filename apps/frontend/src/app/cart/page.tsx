'use client';

import { PaymentForm } from '@/components/paymentForm';
import { StripeProvider } from '@/components/providers/stripeProvider';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { useAuth } from '@/hooks/useAuth';
import { formatAmountInUSDCents } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function CartPage() {
  const [showPayment, setShowPayment] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();

  const trpc = useTRPC();

  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
    enabled: isAuthenticated,
  });

  const items = useMemo(
    () => cartQuery?.data?.items ?? [],
    [cartQuery?.data?.items],
  );

  const totlaAmountInUSDCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
    [items],
  );

  const { mutate: removeItem } = useMutation(
    trpc.carts.removeItem.mutationOptions({
      onSuccess: () => {
        cartQuery.refetch();
      },
    }),
  );

  const { mutate: clearCart } = useMutation(
    trpc.carts.clear.mutationOptions({
      onSuccess: () => {
        cartQuery.refetch();
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to view your cart</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
          <CardDescription>
            {items.length > 0
              ? `${items.length} items in your cart`
              : 'Your cart is empty'}
          </CardDescription>
        </CardHeader>
        {items.length > 0 && (
          <CardContent>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b py-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.normalizedDomainName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAmountInUSDCents(item.amountInUSDCents)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    removeItem(item.id);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        )}
        {items.length > 0 && (
          <CardFooter className="flex flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-lg font-medium">Total:</p>
                <p className="text-sm text-muted-foreground">
                  {formatAmountInUSDCents(totlaAmountInUSDCents)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearCart();
                  }}
                >
                  Clear Cart
                </Button>
                <Dialog open={showPayment} onOpenChange={setShowPayment}>
                  <DialogTrigger asChild={true}>
                    <Button>Proceed to Payment</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Payment Details</DialogTitle>
                      <DialogDescription>
                        Enter your card details to complete the purchase
                      </DialogDescription>
                    </DialogHeader>
                    <StripeProvider amount={totlaAmountInUSDCents}>
                      <PaymentForm
                        amount={totlaAmountInUSDCents}
                        onSuccess={() => {
                          setShowPayment(false);
                          clearCart();
                        }}
                        onError={(error) => {
                          console.error('Payment failed:', error);
                        }}
                      />
                    </StripeProvider>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
