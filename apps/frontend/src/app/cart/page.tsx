'use client';
import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { CartItemDurationControl } from '@/components/cart-item-duration-stepper';
import { NamefiButton } from '@/components/namefi-button';
import { NftWalletCard } from '@/components/nftWalletCard';
import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import {
  NoPaymentMethodRequiredCard,
  SelectPaymentMethodCard,
  SelectedPaymentMethod,
} from '@/components/selectPaymentMethodCard/selectPaymentMethodCard';
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
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useCart } from '@/hooks/landing/use-cart';
import { useAuth } from '@/hooks/useAuth';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import {
  InteractionLoggingEventName,
  type PurchaseEvent,
  type SubmitOrderFailureEvent,
} from '@/utils/interaction-logging/events';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import type { DeepPartial } from '@/utils/types';
import {
  createOrderInputSchema,
  getDomainPricingForOperation,
} from '@namefi-astra/backend/trpc/types';
import {
  isNfscPayment,
  isStripePayment,
  paymentProviderSchema,
  itemTypeSchema,
} from '@namefi-astra/db/types';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import { CHAINS, NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferInput } from '@trpc/tanstack-react-query';
import { ArchiveX, Loader2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';

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
    isCartDataLoading,
    isRemovingFromCart,
    removeItem,
  } = useCart();

  const [cartItemsAreUpToDate, setCartItemsAreUpToDate] = useState(false);
  const [cartItemsAreUpdating, setCartItemsAreUpdating] = useState(false);
  const [cartItemsChangesSummary, setCartItemsChangesSummary] =
    useState<string[]>();
  const { mutateAsync: reflectChangesInCartItemsIfAnyAndReturnSummary } =
    useMutation(
      trpc.orders.reflectChangesInCartItemsIfAnyAndReturnSummary.mutationOptions(),
    );

  const queryClient = useQueryClient();

  const checkCartItemsForUpdates = useCallback(async () => {
    if (!cartItemsAreUpdating) {
      setCartItemsAreUpdating(true);
      const _cartItemsChangesSummary =
        await reflectChangesInCartItemsIfAnyAndReturnSummary({
          cartItemIds: items?.map((item) => item.id),
        });
      if (_cartItemsChangesSummary && _cartItemsChangesSummary.length > 0) {
        setCartItemsChangesSummary(_cartItemsChangesSummary);
      }

      await queryClient.refetchQueries({
        queryKey: trpc.carts.getItems.queryKey(),
      });
      setCartItemsAreUpdating(false);
      setCartItemsAreUpToDate(true);
    }
  }, [
    reflectChangesInCartItemsIfAnyAndReturnSummary,
    items,
    queryClient,
    cartItemsAreUpdating,
    trpc,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    checkCartItemsForUpdates();
  }, []);

  // Show loading skeletons only on initial load – avoid layout shift once the
  // user has pressed the submit button and the page is about to redirect.
  const isLoading = useMemo(
    () => (isAuthLoading || isCartDataLoading) && !isRedirecting,
    [isAuthLoading, isCartDataLoading, isRedirecting],
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

    if (isCreateOrderPending || isRedirecting) {
      return 'Processing...';
    }

    return 'Submit Order';
  }, [
    isCreateOrderPending,
    isRedirecting,
    paymentMethodSelected,
    selectedNftWalletAddress,
  ]);

  const submitOrderDisabled = useMemo(() => {
    return !(
      paymentMethodSelected &&
      selectedNftWalletAddress &&
      cartItemsAreUpToDate
    );
  }, [paymentMethodSelected, selectedNftWalletAddress, cartItemsAreUpToDate]);

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
          cartItems: items,
        },
      };
      logEventWithInteractionLoggers(interactionLoggingEvent);
    },
    [items, logEventWithInteractionLoggers, totalAmountInUsdCents],
  );

  const handleSubmitOrder = useCallback(() => {
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
    () => isCreateOrderPending || isRedirecting,
    [isCreateOrderPending, isRedirecting],
  );

  const { mutateAsync: updateCartItem, reset: resetUpdateCartItem } =
    useMutation(
      trpc.carts.updateItem.mutationOptions({
        onSuccess: () => {
          queryClient.refetchQueries({
            queryKey: trpc.carts.getItems.queryKey(),
          });
        },
      }),
    );

  const handleDurationChange = useCallback(
    async (itemId: string, newDuration: number) => {
      if (isAuthenticated) {
        // Find the item for optimistic pricing calculation
        const item = items?.find((i) => i.id === itemId);

        if (item?.domainAvailabilityInfo) {
          try {
            // Calculate optimistic price update based on item type
            const pricingDetails = getDomainPricingForOperation(
              item.domainAvailabilityInfo,
              item.type,
            );

            if (!pricingDetails) {
              throw new Error(`${item.type} pricing details are unavailable`);
            }

            const chargeAmountInUsd = computeChargesInUsdOrThrow(
              pricingDetails,
              newDuration,
            );
            const optimisticAmount = usdToCents(chargeAmountInUsd);

            // Optimistically update the local state
            queryClient.setQueryData(
              trpc.carts.getItems.queryKey(),
              (oldData) => {
                if (!oldData) {
                  return oldData;
                }
                return oldData.map((cartItem) =>
                  cartItem.id === itemId
                    ? {
                        ...cartItem,
                        durationInYears: newDuration,
                        amountInUSDCents: optimisticAmount,
                      }
                    : cartItem,
                );
              },
            );
          } catch (error) {
            // If optimistic pricing fails, just update duration
            // The server will provide the correct pricing
            console.warn('Failed to calculate optimistic pricing:', error);
            queryClient.setQueryData(
              trpc.carts.getItems.queryKey(),
              (oldData) => {
                if (!oldData) {
                  return oldData;
                }
                return oldData.map((cartItem) =>
                  cartItem.id === itemId
                    ? {
                        ...cartItem,
                        durationInYears: newDuration,
                      }
                    : cartItem,
                );
              },
            );
          }
        }

        resetUpdateCartItem();

        queryClient.cancelQueries({
          queryKey: trpc.carts.getItems.queryKey(),
        });

        await updateCartItem({
          id: itemId,
          durationInYears: newDuration,
        });
      }
    },
    [
      isAuthenticated,
      updateCartItem,
      resetUpdateCartItem,
      items,
      queryClient,
      trpc,
    ],
  );

  const handleRetryOrder = useCallback(() => {
    setIsErrorDialogOpen(false);
    handleSubmitOrder();
  }, [handleSubmitOrder]);

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
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
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cartItemsChangesSummary && cartItemsChangesSummary.length > 0 && (
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
            <NftWalletCard
              onWalletAddressChange={handleNftWalletAddressChange}
              selectedWalletAddress={selectedNftWalletAddress}
              disabled={isDisabled}
            />

            {/* Cart Items Card */}
            <CartCard title="In your cart">
              <div className="flex flex-col">
                {items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {item.normalizedDomainName}
                        </span>
                        {(item.type === itemTypeSchema.Values.IMPORT ||
                          item.type === itemTypeSchema.Values.RENEW) && (
                          <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-400/50">
                            {item.type === itemTypeSchema.Values.IMPORT
                              ? 'Import'
                              : 'Renew'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            className="p-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              removeItem(item.id);
                            }}
                            disabled={isDisabled || isRemovingFromCart}
                          >
                            {isRemovingFromCart ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                          <CartItemDurationControl
                            item={item}
                            onDurationChange={handleDurationChange}
                            isDisabled={isDisabled}
                          />
                        </div>
                        <span className="text-xl">
                          {formatAmountInUSD(item.amountInUSDCents, true)}
                        </span>
                      </div>
                    </div>
                    {index < items.length - 1 && (
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
            {cartItemsAreAllPromo ? (
              <NoPaymentMethodRequiredCard
                footerButton={
                  <NamefiButton
                    variant="default"
                    className="w-full"
                    disabled={submitOrderDisabled || isDisabled}
                    onClick={handleSubmitOrder}
                    size="lg"
                  >
                    {(isCreateOrderPending || isRedirecting) && (
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
                    {(isCreateOrderPending || isRedirecting) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {submitButtonText}
                  </NamefiButton>
                }
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
