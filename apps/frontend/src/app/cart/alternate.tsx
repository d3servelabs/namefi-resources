'use client';
import { AuthRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { CartCard } from '@/components/cart-card';
import { CartItem } from '@/components/cart-item';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { HybridPaymentCard } from '@/components/payment-method/hybrid-payment-card';
import { NoPaymentMethodRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { useUserWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { useDefaultChainId } from '@/hooks/use-allowed-chains';
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
import { useCartContext } from '@/components/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { type AppRouterInput, useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArchiveX, Loader2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getPaymentProviderForChain } from '@/components/payment-method/hybrid-payment-utils';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

export default function CartPage() {
  const defaultChainId = useDefaultChainId();
  const defaultNfscPaymentProvider = getPaymentProviderForChain(defaultChainId);

  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [isClearCartDialogOpen, setIsClearCartDialogOpen] = useState(false);

  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { userWalletAddresses } = useUserWalletAddresses();

  const trpc = useTRPC();

  const {
    cartData: items,
    isCartLoading,
    isCartUpdating,
    clearCart,
  } = useCartContext();

  const [
    isExplicitlyCheckingCartItemsForUpdates,
    setExplicitlyCheckingCartItemsForUpdates,
  ] = useState(false);

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
    ...trpc.orders.createOrderV2.mutationOptions({
      onSuccess: (data) => {
        setIsRedirecting(true);
        logSubmitOrder({ success: true });
        router.push(`/orders/${data.id}?new=true`);
      },
      onError: (error) => {
        logSubmitOrder({ success: false });
        setErrorMessage(error.message);
        setIsErrorDialogOpen(true);
      },
    }),
  });

  const ranPostAuthTasksRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run only once after auth
  useEffect(() => {
    if (!isAuthenticated) {
      ranPostAuthTasksRef.current = false;
      return;
    }

    if (!ranPostAuthTasksRef.current && !isCartUpdating && !isCartLoading) {
      ranPostAuthTasksRef.current = true;
      cartChangesSummaryCardRef.current?.checkCartItemsForUpdates();
    }
  }, [isAuthenticated, isCartUpdating, isCartLoading]);

  const submitButtonText = useMemo(() => {
    if (!selectedNftWalletAddress) {
      return 'Select NFT Wallet to Continue';
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
    selectedNftWalletAddress,
  ]);

  const submitOrderDisabled = useMemo(() => {
    if (isCartUpdating || isCartLoading) {
      return true;
    }
    return !selectedNftWalletAddress;
  }, [selectedNftWalletAddress, isCartUpdating, isCartLoading]);

  const logSubmitOrder = useCallback(
    ({ success }: { success: boolean }) => {
      if (!items) {
        return;
      }

      logEventWithInteractionLoggers({
        name: success
          ? InteractionLoggingEventName.Purchase
          : InteractionLoggingEventName.SubmitOrderFailure,
        properties: {
          totalAmountInUsdCents,
          cartItems: cartItemsToInteractionLoggingCartItems(items),
        },
      });
    },
    [items, logEventWithInteractionLoggers, totalAmountInUsdCents],
  );

  const cartChangesSummaryCardRef = useRef<CartChangesSummaryCardRef>(null);
  const handleHybridPaymentSubmit = useCallback(
    async (payments: CreateOrderV2Input['payments']) => {
      if (!items || items.length === 0) {
        throw new Error('Tried to submit order with no cart items.');
      }

      if (!selectedNftWalletAddress) {
        return;
      }

      try {
        setExplicitlyCheckingCartItemsForUpdates(true);
        const cartItemsChangesSummary: string[] | undefined =
          await cartChangesSummaryCardRef.current?.checkCartItemsForUpdates();

        if (cartItemsChangesSummary && cartItemsChangesSummary.length > 0) {
          return;
        }

        // Always use createOrderV2 for hybrid payments
        createOrder({
          cartItemIds: items.map((item) => item.id),
          payments,
          nftMetadata: {
            nftWalletAddress: selectedNftWalletAddress,
            nftChainId: defaultChainId,
          },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setExplicitlyCheckingCartItemsForUpdates(false);
      }
    },
    [createOrder, items, selectedNftWalletAddress, defaultChainId],
  );

  const handleClearCart = useCallback(async () => {
    if (!items || items.length === 0) {
      setIsClearCartDialogOpen(false);
      return;
    }

    setIsClearingCart(true);
    try {
      cartItemsToInteractionLoggingCartItems(items).forEach((cartItem) => {
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.RemoveFromCart,
          properties: { cartItem },
        });
      });
      await clearCart();
      await cartChangesSummaryCardRef.current?.checkCartItemsForUpdates();
    } catch (error) {
      console.error('clearCart error', error);
    } finally {
      setIsClearingCart(false);
      setIsClearCartDialogOpen(false);
    }
  }, [items, clearCart, logEventWithInteractionLoggers]);

  const handleNftWalletAddressChange = useCallback(
    (walletAddress: string | null) => {
      setSelectedNftWalletAddress(walletAddress);
    },
    [],
  );

  const isDisabled = useMemo(
    () =>
      isRedirecting ||
      isExplicitlyCheckingCartItemsForUpdates ||
      isClearingCart,
    [isRedirecting, isExplicitlyCheckingCartItemsForUpdates, isClearingCart],
  );

  const { data: domainAvailabilityInfo } = useQuery({
    ...trpc.registry.getDomainListInfo.queryOptions({
      domains: items?.map((item) => item.normalizedDomainName) ?? [],
    }),
    enabled: Boolean(items && items.length > 0),
    placeholderData: (previousData) => previousData,
  });

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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isClearCartDialogOpen}
        onOpenChange={(open) => {
          if (!isClearingCart) {
            setIsClearCartDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from your cart. You can add them back
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingCart}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              onClick={handleClearCart}
              disabled={isClearingCart}
            >
              {isClearingCart && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAuthenticated && (
        <CartChangesSummaryCard ref={cartChangesSummaryCardRef} />
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
            <CartCard
              title="In your cart"
              headerAction={
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsClearCartDialogOpen(true)}
                  disabled={isClearingCart || isCartUpdating || !items?.length}
                  className="gap-2"
                >
                  {isClearingCart ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  Clear Cart
                </Button>
              }
            >
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
                      onClick={() => {
                        // For promo orders, create a zero-dollar payment
                        const zeroPayment = [
                          {
                            amountInUsdCents: 0,
                            paymentProviderDetails: {
                              paymentProvider: defaultNfscPaymentProvider,
                              nfscPaymentDetails: {
                                walletAddress: selectedNftWalletAddress || '',
                                chainId: defaultChainId,
                              },
                            },
                          },
                        ];
                        handleHybridPaymentSubmit(zeroPayment);
                      }}
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
                <HybridPaymentCard
                  totalAmountInUsdCents={totalAmountInUsdCents}
                  userWalletAddresses={userWalletAddresses as `0x${string}`[]}
                  isDisabled={isDisabled}
                  isProcessing={
                    isCreateOrderPending ||
                    isRedirecting ||
                    isExplicitlyCheckingCartItemsForUpdates
                  }
                  submitButtonText={submitButtonText}
                  submitOrderDisabled={submitOrderDisabled}
                  onSubmit={handleHybridPaymentSubmit}
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
              <div key={`cart-item-${index + 1}`}>
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

type CartChangesSummaryCardRef = {
  checkCartItemsForUpdates: () => Promise<string[] | undefined>;
};
type CartChangesSummaryCardProps = {
  onSettled?: () => void;
};

const CartChangesSummaryCard = forwardRef<
  CartChangesSummaryCardRef,
  CartChangesSummaryCardProps
>((props, ref) => {
  const { cartData: items, refetchCart } = useCartContext();

  const { onSettled } = props;
  const trpc = useTRPC();
  const [cartItemsChangesSummary, setCartItemsChangesSummary] =
    useState<string[]>();
  const { mutateAsync: reflectChangesInCartItemsIfAnyAndReturnSummary } =
    useMutation({
      ...trpc.orders.reflectChangesInCartItemsIfAnyAndReturnSummary.mutationOptions(),
      onSettled: () => {
        onSettled?.();
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

  useImperativeHandle(ref, () => ({
    checkCartItemsForUpdates,
  }));

  if (!cartItemsChangesSummary || cartItemsChangesSummary.length === 0) {
    return null;
  }

  return (
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
  );
});
