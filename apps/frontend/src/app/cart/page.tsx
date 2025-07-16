'use client';
import { AuthRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { CartCard } from '@/components/cart-card';
import { CartItem } from '@/components/cart-item';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import {
  NoPaymentMethodRequiredCard,
  SelectPaymentMethodCard,
  SelectedPaymentMethod,
} from '@/components/payment-method/select-payment-method-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import {
  InteractionLoggingEventName,
  type PurchaseEvent,
  type SubmitOrderFailureEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import type { DeepPartial } from '@/utils/types';
import { createOrderInputSchema } from '@namefi-astra/backend/trpc/types';
import {
  isNfscPayment,
  isStripePayment,
  paymentProviderSchema,
} from '@namefi-astra/db/types';
import { CHAINS, NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { inferInput } from '@trpc/tanstack-react-query';
import { ArchiveX, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import { set } from 'ramda';

const DEFAULT_CHAIN_ID = config.ALLOWED_CHAINS.includes(CHAINS.base.id)
  ? CHAINS.base.id
  : CHAINS.sepolia.id;

const DEFAULT_NFSC_PAYMENT_PROVIDER =
  DEFAULT_CHAIN_ID === CHAINS.base.id
    ? paymentProviderSchema.Values.NFSC_BASE
    : paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA;

export default function CartPage() {
  type PaymentDetails = Omit<
    inferInput<typeof trpc.orders.createOrder>,
    'cartId' | 'nftMetadata'
  >;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    SelectedPaymentMethod | undefined | null
  >(SelectedPaymentMethod.NFSC);
  const [
    checkoutWithCartRequestPaymentMethodDetails,
    setCheckoutWithCartRequestPaymentMethodDetails,
  ] = useState<DeepPartial<PaymentDetails> | null>(null);
  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const trpc = useTRPC();

  const {
    cartData: items,
    isCartLoading,
    isCartUpdating,
    refetchCart,
  } = useCartContext();

  const [
    isExplicitlyCheckingCartItemsForUpdates,
    setExplicitlyCheckingCartItemsForUpdates,
  ] = useState(false);

  const [cartItemsChangesSummary, setCartItemsChangesSummary] =
    useState<string[]>();
  const { mutateAsync: reflectChangesInCartItemsIfAnyAndReturnSummary } =
    useMutation({
      ...trpc.orders.reflectChangesInCartItemsIfAnyAndReturnSummary.mutationOptions(),
      onSettled: () => {
        refetchCart();
      },
      onError: (err) => console.error('reflectChanges error', err),
    });

  const checkCartItemsForUpdates = useCallback(async () => {
    const _cartItemsChangesSummary =
      await reflectChangesInCartItemsIfAnyAndReturnSummary({
        cartItemIds: items?.map((item) => item.id),
      });
    if (_cartItemsChangesSummary && _cartItemsChangesSummary.length > 0) {
      setCartItemsChangesSummary(_cartItemsChangesSummary);
    }
    return _cartItemsChangesSummary;
  }, [reflectChangesInCartItemsIfAnyAndReturnSummary, items]);

  // Show loading skeletons only on initial load – avoid layout shift once the
  // user has pressed the submit button and the page is about to redirect.
  const isLoading = useMemo(
    () => (isAuthLoading || isCartLoading) && !isRedirecting,
    [isAuthLoading, isCartLoading, isRedirecting],
  );

  const totalAmountInUsdCents = useMemo(
    () => items?.reduce((sum, item) => sum + item.amountInUSDCents, 0) ?? 0,
    [items],
  );
  const cartItemsAreAllPromo = useMemo(
    () => items && items.length > 0 && totalAmountInUsdCents === 0,
    [items, totalAmountInUsdCents],
  );

  const router = useRouter();

  const { mutate: createOrder, isPending: isCreateOrderPending } = useMutation({
    ...trpc.orders.createOrder.mutationOptions({
      onSuccess: (data) => {
        setIsRedirecting(true);
        logSubmitOrder({ success: true });
        router.push(`/orders/${data.id}`);
      },
      onError: (error) => {
        logSubmitOrder({ success: false });
        setErrorMessage(error.message);
        setIsErrorDialogOpen(true);
      },
    }),
  });

  const { data: nfscBalanceData, refetch: refetchNfscBalance } = useBalance(
    (() => {
      if (
        isAuthenticated &&
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

  const ranPostAuthTasksRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run only once after auth
  useEffect(() => {
    if (!isAuthenticated) {
      ranPostAuthTasksRef.current = false;
      return;
    }

    if (!ranPostAuthTasksRef.current && !isCartUpdating && !isCartLoading) {
      ranPostAuthTasksRef.current = true;
      checkCartItemsForUpdates();
      refetchNfscBalance();
    }
  }, [isAuthenticated, isCartUpdating, isCartLoading]);

  const selectedWalletChainNfscBalanceInUsdCents = useMemo(() => {
    if (!nfscBalanceData) {
      return null;
    }

    return Number(
      formatUnits(nfscBalanceData.value, nfscBalanceData.decimals - 2),
    );
  }, [nfscBalanceData]);

  const hasSufficientBalance = useMemo(() => {
    if (cartItemsAreAllPromo) {
      return true;
    }

    return (
      selectedWalletChainNfscBalanceInUsdCents &&
      selectedWalletChainNfscBalanceInUsdCents >= totalAmountInUsdCents
    );
  }, [
    cartItemsAreAllPromo,
    selectedWalletChainNfscBalanceInUsdCents,
    totalAmountInUsdCents,
  ]);

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

  useEffect(() => {
    // TODO(Luis): consider changing how we set paymentDetails for promo-only orders.
    // When no payment method details are required because cartItemsAreAllPromo, we
    // set the paymentMethodDetails as nfscPaymentDetails with the same walletAddress
    // and chainId as the receiving wallet
    if (cartItemsAreAllPromo) {
      handleSelectedPaymentMethodChanged(SelectedPaymentMethod.NFSC);
      const newNfscPaymentMethodDetails: DeepPartial<
        Omit<PaymentDetails, 'nftMetadata'>
      > | null = selectedNftWalletAddress
        ? {
            paymentProviderDetails: {
              paymentProvider: DEFAULT_NFSC_PAYMENT_PROVIDER, // default value for receiving wallet
              nfscPaymentDetails: {
                walletAddress: selectedNftWalletAddress,
                chainId: DEFAULT_CHAIN_ID, // default value for receiving wallet
              },
            },
          }
        : null;
      handlePaymentMethodDetailsChanged(newNfscPaymentMethodDetails);
    }
  }, [
    cartItemsAreAllPromo,
    selectedNftWalletAddress,
    handlePaymentMethodDetailsChanged,
    handleSelectedPaymentMethodChanged,
  ]);

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

    if (
      isCreateOrderPending ||
      isRedirecting ||
      isExplicitlyCheckingCartItemsForUpdates
    ) {
      return 'Processing...';
    }

    return 'Submit Order';
  }, [
    isExplicitlyCheckingCartItemsForUpdates,
    isCreateOrderPending,
    isRedirecting,
    paymentMethodSelected,
    selectedNftWalletAddress,
  ]);

  const submitOrderDisabled = useMemo(() => {
    return !(
      paymentMethodSelected &&
      selectedNftWalletAddress &&
      !isCartUpdating &&
      !isCartLoading
    );
  }, [
    paymentMethodSelected,
    selectedNftWalletAddress,
    isCartUpdating,
    isCartLoading,
  ]);

  const logSubmitOrder = useCallback(
    ({ success }: { success: boolean }) => {
      if (!items) {
        return;
      }

      const interactionLoggingEvent: PurchaseEvent | SubmitOrderFailureEvent = {
        name: success
          ? InteractionLoggingEventName.Purchase
          : InteractionLoggingEventName.SubmitOrderFailure,
        properties: {
          totalAmountInUsdCents,
          cartItems: cartItemsToInteractionLoggingCartItems(items),
        },
      };
      logEventWithInteractionLoggers(interactionLoggingEvent);
    },
    [items, logEventWithInteractionLoggers, totalAmountInUsdCents],
  );

  const handleSubmitOrder = useCallback(async () => {
    if (!items || items.length === 0) {
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
      setExplicitlyCheckingCartItemsForUpdates(true);

      const cartItemsChangesSummary = await checkCartItemsForUpdates();

      setExplicitlyCheckingCartItemsForUpdates(false);

      if (cartItemsChangesSummary && cartItemsChangesSummary.length > 0) {
        return;
      }

      createOrder({
        cartItemIds: items.map((item) => item.id),
        ...validatedPaymentMethodDetails.data,
        nftMetadata: {
          nftWalletAddress: selectedNftWalletAddress,
          nftChainId: DEFAULT_CHAIN_ID,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }, [
    checkCartItemsForUpdates,
    createOrder,
    checkoutWithCartRequestPaymentMethodDetails,
    items,
    selectedNftWalletAddress,
  ]);

  const handleNftWalletAddressChange = useCallback(
    (walletAddress: string | null) => {
      setSelectedNftWalletAddress(walletAddress);
    },
    [],
  );

  const isDisabled = useMemo(
    () =>
      isCreateOrderPending ||
      isRedirecting ||
      isExplicitlyCheckingCartItemsForUpdates,
    [
      isCreateOrderPending,
      isRedirecting,
      isExplicitlyCheckingCartItemsForUpdates,
    ],
  );

  const { data: domainAvailabilityInfo } = useQuery({
    ...trpc.registry.getDomainListInfo.queryOptions({
      domains: items?.map((item) => item.normalizedDomainName) ?? [],
    }),
    enabled: Boolean(items && items.length > 0),
    placeholderData: (previousData) => previousData,
  });

  const handleRetryOrder = useCallback(() => {
    setIsErrorDialogOpen(false);
    handleSubmitOrder();
  }, [handleSubmitOrder]);

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Oops! Something went wrong.</AlertDialogTitle>
            <AlertDialogDescription>
              Don&apos;t worry, you won&apos;t be charged. Feel free to try
              again or head back to your cart.{' '}
              <p className="italic">
                {errorMessage ? `(Error - ${errorMessage})` : ''}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetryOrder}
              className="bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAuthenticated &&
        cartItemsChangesSummary &&
        cartItemsChangesSummary.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="container mx-auto py-4"
            >
              <Card
                className={cn(
                  'bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-6 gap-0',
                )}
              >
                <div className="flex flex-row justify-between pb-2">
                  <CardHeader className="p-0 flex-1">
                    <CardTitle className="text-xl font-semibold">
                      Cart Changes
                    </CardTitle>
                    <CardDescription>
                      Some changes were made to your cart.
                    </CardDescription>
                  </CardHeader>
                  <Button
                    variant="outline"
                    onClick={() => setCartItemsChangesSummary(undefined)}
                  >
                    <ArchiveX className="size-4" /> Dismiss
                  </Button>
                </div>

                <CardContent className="p-0">
                  <ul className="list-disc list-inside flex flex-col items-start justify-start gap-4 py-4">
                    {cartItemsChangesSummary.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

      {items && items.length > 0 ? (
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-4 relative',
            isDisabled && '[&>*]:opacity-50 pointer-events-none',
          )}
        >
          {/* Left Column */}
          <div className="space-y-4">
            {/* Receiving Wallet Address Card */}
            {isAuthenticated && (
              <NftWalletCard
                onWalletAddressChange={handleNftWalletAddressChange}
                selectedWalletAddress={selectedNftWalletAddress}
                disabled={isDisabled}
              />
            )}

            {/* Cart Items Card */}
            <CartCard title="In your cart">
              <div className="flex flex-col">
                {items.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    domainAvailabilityInfo={domainAvailabilityInfo?.find(
                      (domain) => domain.domain === item.normalizedDomainName,
                    )}
                    isDisabled={isDisabled}
                    showSeparator={index < items.length - 1}
                  />
                ))}
              </div>
            </CartCard>
          </div>

          {/* Right Column */}
          <div>
            {isAuthenticated ? (
              cartItemsAreAllPromo ? (
                <NoPaymentMethodRequiredCard
                  footerButton={
                    <NamefiButton
                      variant="default"
                      className="w-full"
                      disabled={submitOrderDisabled || isDisabled}
                      onClick={handleSubmitOrder}
                      size="lg"
                    >
                      {(isCreateOrderPending ||
                        isRedirecting ||
                        isExplicitlyCheckingCartItemsForUpdates) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {submitButtonText}
                    </NamefiButton>
                  }
                />
              ) : (
                <SelectPaymentMethodCard
                  cartTotalInUsdCents={totalAmountInUsdCents}
                  onPaymentMethodDetailsChanged={
                    handlePaymentMethodDetailsChanged
                  }
                  onSelectedPaymentMethodChanged={
                    handleSelectedPaymentMethodChanged
                  }
                  disabled={isDisabled}
                  footerButton={
                    <NamefiButton
                      variant="default"
                      className="w-full"
                      disabled={submitOrderDisabled || isDisabled}
                      onClick={handleSubmitOrder}
                      size="lg"
                    >
                      {(isCreateOrderPending ||
                        isRedirecting ||
                        isExplicitlyCheckingCartItemsForUpdates) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {submitButtonText}
                    </NamefiButton>
                  }
                />
              )
            ) : (
              <AuthRequiredCard
                cartTotalInUsdCents={totalAmountInUsdCents}
                footerButton={<UserDropdown className="w-full" />}
              />
            )}
          </div>
        </div>
      ) : (
        <CartCard title="Your cart is empty">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-muted-foreground text-center">
              Add some domains to your cart to get started
            </p>
            <NamefiButton variant="outline" onClick={() => router.push('/')}>
              Browse Domains
            </NamefiButton>
          </div>
        </CartCard>
      )}
    </div>
  );
}

const LoadingSkeletons = () => (
  <div className="container mx-auto py-8 px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column */}
      <div className="space-y-4">
        {/* NFT Wallet Card Skeleton */}
        <CartCard title="Select NFT Wallet">
          <div className="flex flex-col gap-4 mt-6">
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        </CartCard>

        {/* Cart Items Skeleton */}
        <CartCard title="In your cart">
          <div className="flex flex-col gap-6 mt-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index}>
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-7 w-[250px]" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-7 w-[100px]" />
                  </div>
                </div>
                {index < 1 && (
                  <div className="my-6">
                    <Separator />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CartCard>
      </div>

      {/* Right Column */}
      <div>
        <CartCard title="Payment Method">
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CartCard>
      </div>
    </div>
  </div>
);
