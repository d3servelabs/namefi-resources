'use client';
import { AuthRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { CartCard } from '@/components/cart-card';
import { CartItem } from '@/components/cart-item';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { PageShell } from '@/components/page-shell';
import { HybridPaymentCard } from '@/components/payment-method/hybrid-payment-card';
import { NoPaymentMethodRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/components/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@namefi-astra/ui/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { type AppRouterInput, type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CHAINS } from '@namefi-astra/utils/chains';
import { ArchiveX, Loader2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { getAddress, toHex } from 'viem';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { getPaymentProviderForChain } from '@/components/payment-method/hybrid-payment-utils';
import { normalizeCreateOrderV2PaymentsToSafeIntCents } from '@/lib/payment-normalization';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];
type X402PaymentConfig = Extract<
  AppRouterOutput['config']['x402Payment'],
  { enabled: true }
>;

const X402_TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

const X402_CART_PAYMENT_FLAG_DEFINITION: FeatureFlagDefinition[] = [
  {
    key: 'x402_cart_payment',
    label: 'x402 Cart Payment',
    description: 'Enable x402 (USDC) payment option in alternate cart',
    scope: 'page',
    pageKey: 'cart',
    defaultValue: false,
  },
];

function isX402PaymentDraft(
  payment: CreateOrderV2Input['payments'][0],
): boolean {
  return payment.paymentProviderDetails.paymentProvider === 'X402';
}

export default function CartPage() {
  useRegisterAdminFlags(X402_CART_PAYMENT_FLAG_DEFINITION);
  const [x402CartPaymentEnabled] = useAdminFeatureFlag(
    X402_CART_PAYMENT_FLAG_DEFINITION[0],
  );

  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);
  const [selectedNftChainId, setSelectedNftChainId] = useState<number>(
    CHAINS.base.id,
  );
  const [isLinkedOrUserConfirmed, setIsLinkedOrUserConfirmed] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [isClearCartDialogOpen, setIsClearCartDialogOpen] = useState(false);

  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { linkedWallets: _linkedWallets } = useLinkedWallets();
  const _linkedWalletsAddresses = _linkedWallets.map(
    (wallet: { address: string }) => wallet.address,
  ) as `0x${string}`[];
  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to do this to avoid unnecessary re-renders
  const linkedWalletAddresses = useMemo(
    () => _linkedWalletsAddresses,
    [_linkedWalletsAddresses.sort().join(',')],
  );

  const trpc = useTRPC();
  const { address: connectedWalletAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const { data: x402PaymentConfigResponse } = useQuery({
    ...trpc.config.x402Payment.queryOptions(),
    enabled: x402CartPaymentEnabled,
  });
  const x402PaymentConfig = useMemo<X402PaymentConfig | null>(() => {
    if (!x402CartPaymentEnabled || !x402PaymentConfigResponse?.enabled) {
      return null;
    }
    return x402PaymentConfigResponse;
  }, [x402CartPaymentEnabled, x402PaymentConfigResponse]);

  const {
    cartData: items,
    isCartLoading,
    isCartUpdating,
    clearCart,
  } = useCartContext();
  const {
    nftChainIds: allowedNftChainIds,
    defaultNftChainId,
    defaultNfscBalanceChainId,
  } = useAllowedChains();
  const defaultNfscPaymentProvider = getPaymentProviderForChain(
    defaultNfscBalanceChainId,
  );

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
        logSubmitOrder({ success: true, transactionId: data.id });
        router.push(`/orders/${data.id}`);
      },
      onError: (error) => {
        logSubmitOrder({ success: false });
        setErrorMessage(error.message);
        setIsErrorDialogOpen(true);
      },
    }),
  });

  const ranPostAuthTasksRef = useRef(false);

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
    return (
      isCartUpdating ||
      isCartLoading ||
      !selectedNftWalletAddress ||
      !isLinkedOrUserConfirmed
    );
  }, [
    selectedNftWalletAddress,
    isLinkedOrUserConfirmed,
    isCartUpdating,
    isCartLoading,
  ]);

  const logSubmitOrder = useCallback(
    ({
      success,
      transactionId,
    }:
      | {
          success: true;
          transactionId: string;
        }
      | {
          success: false;
          transactionId?: string;
        }) => {
      if (!items) {
        return;
      }

      const cartItems = cartItemsToInteractionLoggingCartItems(items);

      if (success) {
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.Purchase,
          properties: {
            transactionId,
            totalAmountInUsdCents,
            cartItems,
          },
        });
        return;
      }

      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.SubmitOrderFailure,
        properties: {
          ...(transactionId ? { transactionId } : {}),
          totalAmountInUsdCents,
          cartItems,
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

        // Normalize payments to safe integer cents for backend schema validation.
        // Backend requires z.number().int() and exact totals. See payment-normalization.ts for details.
        const normalizeResult = normalizeCreateOrderV2PaymentsToSafeIntCents({
          payments,
          totalAmountInUsdCents,
        });

        if (!normalizeResult.success) {
          setErrorMessage(normalizeResult.error);
          setIsErrorDialogOpen(true);
          return;
        }

        let preparedPayments = normalizeResult.payments;
        const hasX402Payment = preparedPayments.some(isX402PaymentDraft);

        if (hasX402Payment) {
          if (!x402CartPaymentEnabled) {
            setErrorMessage('x402 payment is currently disabled');
            setIsErrorDialogOpen(true);
            return;
          }

          if (!x402PaymentConfig) {
            setErrorMessage('x402 payment is not available right now');
            setIsErrorDialogOpen(true);
            return;
          }

          if (!connectedWalletAddress || !walletClient) {
            setErrorMessage(
              'Connect an active wallet to sign your x402 payment',
            );
            setIsErrorDialogOpen(true);
            return;
          }

          const signerAddress = getAddress(connectedWalletAddress);
          const receiverWalletAddress = getAddress(x402PaymentConfig.payTo);
          const assetAddress = getAddress(x402PaymentConfig.asset);

          await switchChainAsync({
            chainId: x402PaymentConfig.chainId,
          });

          preparedPayments = await Promise.all(
            preparedPayments.map(async (payment) => {
              if (!isX402PaymentDraft(payment)) {
                return payment;
              }

              const value = BigInt(payment.amountInUsdCents) * 10_000n;
              const now = BigInt(Math.floor(Date.now() / 1000));
              const validAfter =
                now - BigInt(x402PaymentConfig.validAfterLeewaySeconds);
              const validBefore =
                now + BigInt(x402PaymentConfig.maxTimeoutSeconds);
              const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));

              const signature = await walletClient.signTypedData({
                account: signerAddress,
                domain: {
                  name: x402PaymentConfig.eip712DomainName,
                  version: x402PaymentConfig.eip712DomainVersion,
                  chainId: x402PaymentConfig.chainId,
                  verifyingContract: assetAddress,
                },
                types: X402_TRANSFER_WITH_AUTHORIZATION_TYPES,
                primaryType: 'TransferWithAuthorization',
                message: {
                  from: signerAddress,
                  to: receiverWalletAddress,
                  value,
                  validAfter,
                  validBefore,
                  nonce,
                },
              });

              const valueAsString = value.toString();
              const validAfterAsString = validAfter.toString();
              const validBeforeAsString = validBefore.toString();

              return {
                ...payment,
                paymentProviderDetails: {
                  paymentProvider: 'X402' as const,
                  x402PaymentDetails: {
                    buyerWalletAddress: signerAddress,
                    receiverWalletAddress,
                    network: x402PaymentConfig.network,
                    presettled: false,
                    paymentPayload: {
                      x402Version: x402PaymentConfig.x402Version,
                      payload: {
                        signature,
                        authorization: {
                          from: signerAddress,
                          to: receiverWalletAddress,
                          value: valueAsString,
                          validAfter: validAfterAsString,
                          validBefore: validBeforeAsString,
                          nonce,
                        },
                      },
                      accepted: {
                        scheme: 'exact',
                        network:
                          x402PaymentConfig.network as `${string}:${string}`,
                        asset: assetAddress,
                        amount: valueAsString,
                        payTo: receiverWalletAddress,
                        maxTimeoutSeconds: x402PaymentConfig.maxTimeoutSeconds,
                        extra: {
                          name: x402PaymentConfig.eip712DomainName,
                          version: x402PaymentConfig.eip712DomainVersion,
                        },
                      },
                      resource: {
                        url: '/cart/alternate',
                        mimeType: '*',
                        description: `Checkout cart with ${items.length} item(s)`,
                      },
                    },
                  },
                },
              } satisfies CreateOrderV2Input['payments'][0];
            }),
          );
        }

        // Always use createOrderV2 for hybrid payments
        createOrder({
          cartItemIds: items.map((item) => item.id),
          payments: preparedPayments,
          nftMetadata: {
            nftWalletAddress: selectedNftWalletAddress,
            nftChainId: selectedNftChainId ?? defaultNftChainId,
          },
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Could not submit your order. Please try again.',
        );
        setIsErrorDialogOpen(true);
      } finally {
        setExplicitlyCheckingCartItemsForUpdates(false);
      }
    },
    [
      connectedWalletAddress,
      createOrder,
      defaultNftChainId,
      items,
      selectedNftWalletAddress,
      selectedNftChainId,
      switchChainAsync,
      totalAmountInUsdCents,
      walletClient,
      x402CartPaymentEnabled,
      x402PaymentConfig,
    ],
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
    } catch (_error) {
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

  const handleNftChainIdChange = useCallback(
    (chainId: number) => {
      setSelectedNftChainId(chainId ?? defaultNftChainId);
    },
    [defaultNftChainId],
  );

  useEffect(() => {
    if (!allowedNftChainIds.includes(selectedNftChainId)) {
      setSelectedNftChainId(defaultNftChainId);
    }
  }, [allowedNftChainIds, defaultNftChainId, selectedNftChainId]);

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
    <PageShell>
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
                onChainIdChange={handleNftChainIdChange}
                selectedChainId={selectedNftChainId}
                isLinkedOrUserConfirmed={isLinkedOrUserConfirmed}
                onIsLinkedOrUserConfirmationChange={setIsLinkedOrUserConfirmed}
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
                                chainId: defaultNfscBalanceChainId,
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
                  userWalletAddresses={linkedWalletAddresses}
                  x402PaymentConfig={x402PaymentConfig}
                  x402BuyerWalletAddress={connectedWalletAddress}
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
    </PageShell>
  );
}

const LoadingSkeletons = () => (
  <PageShell>
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
  </PageShell>
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
      onError: (_err) => {},
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
        className="py-4"
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
