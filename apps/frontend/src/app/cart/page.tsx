'use client';

import { AddPaymentMethodForm } from '@/components/addPaymentForm';
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
import { useTRPC } from '@/utils/trpc';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const trpc = useTRPC();
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [confirmationToken, setConfirmationToken] =
    useState<ConfirmationToken | null>(null);

  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
    enabled: isAuthenticated,
  });

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

  const cart = cartQuery.data;

  if (!cart?.items) {
    return null;
  }

  const totalAmount = cart.items.reduce(
    (acc, item) => acc + item.amountInUSDCents,
    0,
  );

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
          <CardDescription>
            {cart?.items.length > 0
              ? `${cart.items.length} items in your cart`
              : 'Your cart is empty'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cart?.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-4 last:border-0"
            >
              <div>
                <p className="font-medium">{item.normalizedDomainName}</p>
                <p className="text-sm text-muted-foreground">
                  ${(item.amountInUSDCents / 100).toFixed(2)}
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
        {cart?.items.length > 0 && (
          <CardFooter className="flex flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-lg font-medium">Total:</p>
                <p className="text-sm text-muted-foreground">
                  ${(totalAmount / 100).toFixed(2)}
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
                <Dialog
                  open={showAddPaymentMethod}
                  onOpenChange={(open: boolean) => {
                    if (open) {
                      setConfirmationToken(null);
                    }
                    setShowAddPaymentMethod(open);
                  }}
                >
                  <DialogTrigger asChild={true}>
                    <Button disabled={confirmationToken !== null}>
                      {confirmationToken === null
                        ? 'Add Payment Method'
                        : 'Payment Method Added'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Payment Method Details</DialogTitle>
                      <DialogDescription>
                        Enter your payment method details. We won't charge you
                        until you confirm your order.
                      </DialogDescription>
                    </DialogHeader>
                    <StripeProvider amount={totalAmount}>
                      <AddPaymentMethodForm
                        onSuccess={(confirmationToken) => {
                          setConfirmationToken(confirmationToken);
                          setShowAddPaymentMethod(false);
                        }}
                        onError={(error) => {
                          console.error('Payment failed:', error);
                        }}
                      />
                    </StripeProvider>
                  </DialogContent>
                </Dialog>
                <Button
                  disabled={confirmationToken === null}
                  onClick={() => {
                    clearCart();
                  }}
                >
                  Submit Order
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
