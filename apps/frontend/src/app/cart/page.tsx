'use client';
import {
  type PaymentMethodDetails,
  SelectPaymentMethodCard,
  SelectedPaymentMethod,
} from '@/components/selectPaymentMethodCard/selectPaymentMethodCard';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { inferInput } from '@trpc/tanstack-react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const USER_BALANCE_IN_USD_CENTS = 2000;

export default function CartPage() {
  type CheckoutWithCartInput = inferInput<
    typeof trpc.checkouts.checkoutWithCart
  >;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    SelectedPaymentMethod | undefined | null
  >(null);
  const [checkoutWithCartRequest, setCheckoutWithCartRequest] =
    useState<CheckoutWithCartInput | null>(null);

  const { isAuthenticated, isLoading, privyUser } = useAuth();

  const trpc = useTRPC();

  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
    enabled: isAuthenticated,
  });

  const items = useMemo(
    () => cartQuery?.data?.items ?? [],
    [cartQuery?.data?.items],
  );

  const totalAmountInUsdCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
    [items],
  );

  const hasSufficientBalance = useMemo(() => {
    return USER_BALANCE_IN_USD_CENTS >= totalAmountInUsdCents;
  }, [totalAmountInUsdCents]);

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

  const { mutate: checkoutWithCart } = useMutation(
    trpc.checkouts.checkoutWithCart.mutationOptions({
      onSuccess: (data) => {
        console.log(data);
      },
    }),
  );

  const handlePaymentMethodDetailsChanged = useCallback(
    (paymentMethodDetails: PaymentMethodDetails | null) => {
      if (paymentMethodDetails === null || paymentMethodDetails === undefined) {
        setCheckoutWithCartRequest(null);
        return;
      }

      const newCheckoutWithCartRequst: CheckoutWithCartInput = {
        ...paymentMethodDetails,
        totalAmountInUsdCents,
      };
      setCheckoutWithCartRequest(newCheckoutWithCartRequst);
    },
    [totalAmountInUsdCents],
  );

  const handleSelectedPaymentMethodChanged = useCallback(
    (selectedPaymentMethod: SelectedPaymentMethod | undefined | null) => {
      setSelectedPaymentMethod(selectedPaymentMethod);
    },
    [],
  );

  const submitPaymentButtonDisabled = useMemo(() => {
    switch (selectedPaymentMethod) {
      case SelectedPaymentMethod.NFSC: {
        return (
          !hasSufficientBalance ||
          checkoutWithCartRequest?.paymentProviderOptions?.walletAddress ===
            undefined ||
          checkoutWithCartRequest?.paymentProviderOptions?.walletAddress ===
            null
        );
      }
      case SelectedPaymentMethod.SAVED_CARD: {
        return (
          checkoutWithCartRequest?.paymentProvider !== 'STRIPE' ||
          checkoutWithCartRequest?.paymentProviderOptions?.paymentMethodId ===
            null ||
          checkoutWithCartRequest?.paymentProviderOptions?.paymentMethodId ===
            undefined
        );
      }
      case SelectedPaymentMethod.NEW_CARD: {
        return (
          checkoutWithCartRequest?.paymentProvider !== 'STRIPE' ||
          checkoutWithCartRequest?.paymentProviderOptions
            ?.confirmationTokenId === null ||
          checkoutWithCartRequest?.paymentProviderOptions
            ?.confirmationTokenId === undefined
        );
      }
      default:
        return true;
    }
  }, [checkoutWithCartRequest, hasSufficientBalance, selectedPaymentMethod]);

  const submitButtonText = useMemo(() => {
    if (!submitPaymentButtonDisabled) {
      return 'Submit Order';
    }

    switch (selectedPaymentMethod) {
      case SelectedPaymentMethod.NFSC: {
        if (!(isAuthenticated && privyUser)) {
          return 'Sign in to Use NFSC';
        }

        if (!privyUser?.wallet) {
          return 'Connect a Wallet to Use NFSC';
        }

        return 'Insufficient Balance';
      }

      case SelectedPaymentMethod.SAVED_CARD: {
        return 'Select a Saved Card';
      }

      case SelectedPaymentMethod.NEW_CARD: {
        return 'Add a New Card';
      }
      default:
        return 'Select a Payment Method';
    }
  }, [
    isAuthenticated,
    privyUser,
    selectedPaymentMethod,
    submitPaymentButtonDisabled,
  ]);

  const handleSubmitPayment = useCallback(() => {
    if (
      checkoutWithCartRequest === null ||
      checkoutWithCartRequest === undefined
    ) {
      throw new Error(
        'Tried to submit payment with no payment method attached.',
      );
    }

    try {
      checkoutWithCart(checkoutWithCartRequest);
      clearCart();
    } catch (error) {
      console.log(error);
    }
  }, [checkoutWithCart, checkoutWithCartRequest, clearCart]);

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
    <div className="flex flex-col gap-2 container mx-auto py-8">
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
                    {formatAmountInUSD(item.amountInUSDCents, true)}
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
                  {formatAmountInUSD(totalAmountInUsdCents, true)}
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
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      {items.length > 0 && (
        <SelectPaymentMethodCard
          cartTotalInUsdCents={totalAmountInUsdCents}
          footerButton={
            <Button
              className="w-full"
              disabled={submitPaymentButtonDisabled}
              onClick={handleSubmitPayment}
            >
              {submitButtonText}
            </Button>
          }
          onPaymentMethodDetailsChanged={(
            paymentMethodDetails: PaymentMethodDetails | null,
          ) => handlePaymentMethodDetailsChanged(paymentMethodDetails)}
          onSelectedPaymentMethodChanged={handleSelectedPaymentMethodChanged}
        />
      )}
    </div>
  );
}
