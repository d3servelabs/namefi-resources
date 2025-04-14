'use client';
import { NamefiButton } from '@/components/namefi-button';
import { NftWalletCard } from '@/components/nftWalletCard';
import {
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
import type { DeepPartial } from '@/utils/types';
import { createOrderInputSchema } from '@namefi-astra/backend/trpc/types';
import { isNfscPayment, isStripePayment } from '@namefi-astra/db/types';
import { CHAINS, NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferInput } from '@trpc/tanstack-react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';

export default function CartPage() {
  type PaymentDetails = Omit<
    inferInput<typeof trpc.orders.createOrder>,
    'cartId' | 'nftMetadata'
  >;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    SelectedPaymentMethod | undefined | null
  >(null);
  const [
    checkoutWithCartRequestPaymentMethodDetails,
    setCheckoutWithCartRequestPaymentMethodDetails,
  ] = useState<DeepPartial<PaymentDetails> | null>(null);
  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);

  const { isAuthenticated, isLoading } = useAuth();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: explicitly want to run this effect when isAuthenticated changes
  useEffect(() => {
    queryClient.invalidateQueries(trpc.carts.getItems.queryFilter());
  }, [isAuthenticated, queryClient, trpc.carts.getItems.queryFilter]);

  const items = useMemo(() => cartQuery?.data ?? [], [cartQuery?.data]);

  const totalAmountInUsdCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
    [items],
  );

  const { mutate: removeItem } = useMutation(
    trpc.carts.removeItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.carts.getItems.queryFilter());
      },
    }),
  );

  const { mutate: clearCart } = useMutation(
    trpc.carts.clear.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.carts.getItems.queryFilter());
      },
    }),
  );

  const router = useRouter();

  const { mutate: createOrder, isPending: isCreateOrderPending } = useMutation({
    ...trpc.orders.createOrder.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.carts.getItems.queryFilter());
        router.push(`/orders/${data.id}`);
      },
    }),
  });

  const { data: nfscBalanceData, refetch: refetchNfscBalance } = useBalance(
    (() => {
      if (
        checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails &&
        isNfscPayment(
          checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails,
        )
      ) {
        const { nfscPaymentDetails } =
          checkoutWithCartRequestPaymentMethodDetails.paymentProviderDetails;
        return {
          address: nfscPaymentDetails?.walletAddress as `0x${string}`,
          chainId: nfscPaymentDetails?.chainId,
          token: NFSC_CONTRACT_ADDRESS,
          query: {
            enabled: !!nfscPaymentDetails,
          },
        };
      }

      return {
        query: {
          enabled: false,
        },
      };
    })(),
  );

  const selectedWalletChainNfscBalanceInUsdCents = useMemo(() => {
    if (!nfscBalanceData) {
      return null;
    }

    return Number(
      formatUnits(nfscBalanceData.value, nfscBalanceData.decimals - 2),
    );
  }, [nfscBalanceData]);

  const hasSufficientBalance = useMemo(() => {
    return (
      selectedWalletChainNfscBalanceInUsdCents &&
      selectedWalletChainNfscBalanceInUsdCents >= totalAmountInUsdCents
    );
  }, [selectedWalletChainNfscBalanceInUsdCents, totalAmountInUsdCents]);

  const handlePaymentMethodDetailsChanged = useCallback(
    (
      paymentMethodDetails: DeepPartial<
        Omit<PaymentDetails, 'nftMetadata'>
      > | null,
    ) => {
      if (paymentMethodDetails === null || paymentMethodDetails === undefined) {
        setCheckoutWithCartRequestPaymentMethodDetails(null);
        return;
      }

      setCheckoutWithCartRequestPaymentMethodDetails(paymentMethodDetails);

      if (isNfscPayment(paymentMethodDetails.paymentProviderDetails)) {
        refetchNfscBalance();
      }
    },
    [refetchNfscBalance],
  );

  const handleSelectedPaymentMethodChanged = useCallback(
    (selectedPaymentMethod: SelectedPaymentMethod | undefined | null) => {
      setSelectedPaymentMethod(selectedPaymentMethod);
    },
    [],
  );

  const paymentMethodSelected = useMemo(() => {
    switch (selectedPaymentMethod) {
      case SelectedPaymentMethod.NFSC: {
        if (
          isNfscPayment(
            checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails,
          )
        ) {
          return (
            hasSufficientBalance &&
            checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails
              ?.nfscPaymentDetails?.walletAddress !== undefined &&
            checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails
              ?.nfscPaymentDetails?.chainId !== undefined
          );
        }
        return false;
      }

      case SelectedPaymentMethod.CREDIT_CARD: {
        if (
          isStripePayment(
            checkoutWithCartRequestPaymentMethodDetails?.paymentProviderDetails,
          )
        ) {
          return (
            checkoutWithCartRequestPaymentMethodDetails?.paymentMetadata
              ?.confirmationTokenId !== null &&
            checkoutWithCartRequestPaymentMethodDetails?.paymentMetadata
              ?.confirmationTokenId !== undefined
          );
        }
        return false;
      }
      default:
        return false;
    }
  }, [
    checkoutWithCartRequestPaymentMethodDetails,
    hasSufficientBalance,
    selectedPaymentMethod,
  ]);

  const submitButtonText = useMemo(() => {
    if (!selectedNftWalletAddress) {
      return 'Select NFT Wallet to Continue';
    }

    if (!paymentMethodSelected) {
      return 'Select Payment Method to Continue';
    }

    if (isCreateOrderPending) {
      return 'Processing...';
    }

    return 'Submit Order';
  }, [isCreateOrderPending, paymentMethodSelected, selectedNftWalletAddress]);

  const submitOrderDisabled = useMemo(() => {
    return !(paymentMethodSelected && selectedNftWalletAddress);
  }, [paymentMethodSelected, selectedNftWalletAddress]);

  const handleSubmitOrder = useCallback(() => {
    if (!cartQuery.data || cartQuery.data.length === 0) {
      throw new Error('Tried to submit order with no cart items.');
    }

    if (!selectedNftWalletAddress) {
      return;
    }

    const validatedPaymentMethodDetails = createOrderInputSchema
      .pick({
        paymentProviderDetails: true,
        paymentMetadata: true,
      })
      .safeParse(checkoutWithCartRequestPaymentMethodDetails);

    if (!validatedPaymentMethodDetails.success) {
      throw new Error(
        'Tried to submit payment with no payment method attached.',
      );
    }

    try {
      createOrder({
        cartItemIds: cartQuery.data.map((item) => item.id),
        ...validatedPaymentMethodDetails.data,
        nftMetadata: {
          nftWalletAddress: selectedNftWalletAddress,
          nftChainId: CHAINS.base.id,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }, [
    createOrder,
    checkoutWithCartRequestPaymentMethodDetails,
    cartQuery.data,
    selectedNftWalletAddress,
  ]);

  const handleNftWalletAddressChange = useCallback(
    (walletAddress: string | null) => {
      setSelectedNftWalletAddress(walletAddress);
    },
    [],
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
        <>
          <NftWalletCard
            onWalletAddressChange={handleNftWalletAddressChange}
            selectedWalletAddress={selectedNftWalletAddress}
          />

          <SelectPaymentMethodCard
            cartTotalInUsdCents={totalAmountInUsdCents}
            onPaymentMethodDetailsChanged={(
              paymentMethodDetails: DeepPartial<PaymentDetails> | null,
            ) => handlePaymentMethodDetailsChanged(paymentMethodDetails)}
            onSelectedPaymentMethodChanged={handleSelectedPaymentMethodChanged}
            footerButton={
              <NamefiButton
                variant="default"
                className="w-full"
                disabled={submitOrderDisabled || isCreateOrderPending}
                onClick={handleSubmitOrder}
                size="lg"
              >
                {isCreateOrderPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <></>
                )}
                {submitButtonText}
              </NamefiButton>
            }
          />
        </>
      )}
    </div>
  );
}
