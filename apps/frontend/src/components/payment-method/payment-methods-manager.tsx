'use client';

import { AuthRequired } from '@/components/auth-required';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { PageShell } from '@/components/page-shell';
import { SavePaymentMethodDialog } from './save-payment-method-dialog';
import { ControlledGlareCard } from '@/components/ui/aceternity/controlled-glare-card';
import { CreditCard } from '@/components/ui/untitled/credit-card';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
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
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import {
  formatCardExpiration,
  formatCardNumber,
  getCardStyleByBrand,
  normalizeCardBrand,
} from '@/lib/utils/card-brand';
import type { SetupIntent } from '@stripe/stripe-js';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { inferOutput } from '@trpc/tanstack-react-query';
import { CreditCardIcon, Loader2, TrashIcon, Wallet2 } from 'lucide-react';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useEnsName } from 'wagmi';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { PaymentMethodsManagerPlaceholder } from './payment-methods-manager-placeholder';
import { NFSCWalletCard } from '../ui/untitled/nfsc-wallet-card';
import { useUserChainBalances } from '@/hooks/use-user-chain-balances';
import {
  useLinkedWalletAddresses,
  useLinkedWallets,
} from '@/hooks/use-user-wallet-addresses';
import { prop, groupBy, range } from 'ramda';
import type { WalletProvider } from '../ui/untitled/wallet-card';
import { mapPrivyWalletToProvider } from '@/hooks/use-privy-wallet-card-data';
import {
  useControlLinkedWallets,
  UnlinkWalletDialog,
} from '../profile/wallets';
import { useRegisterAdminFlags } from '../admin/feature-flags/register';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { useAdminFeatureFlag } from '../admin/feature-flags/use-flag';
import { useWatchAssets } from '@/hooks/use-watch-assets';
import { useActiveWallet } from '@/hooks/use-active-wallet';
import NfscSwapDialog from '../dialogs/nfsc-swap-dialog';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '../dialogs/request-wallet-connection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

const LoadingSkeletons = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {range(0, 3).map((index) => (
        <div key={`loading-skeleton-${index}`} className="relative">
          <Skeleton className="w-full aspect-[1.586] rounded-xl" />
        </div>
      ))}
    </div>
  );
};

const EmptyPlaceholder = () => (
  <PaymentMethodsManagerPlaceholder
    title="No payment methods found"
    description="Consider adding a new payment method"
    icon={<CreditCardIcon className="size-10 text-muted-foreground" />}
  />
);

export default function PaymentMethodsManager() {
  const [showSavePaymentMethodDialog, setShowSavePaymentMethodDialog] =
    useState(false);
  const [paymentMethodsRefetchRequired, setPaymentMethodsRefetchRequired] =
    useState(true);

  const { isAuthenticated } = useAuth();

  const handleSavePaymentMethodSuccess = useCallback(
    (_setupIntent: SetupIntent) => {
      setShowSavePaymentMethodDialog(false);
      setPaymentMethodsRefetchRequired(true);
    },
    [],
  );

  const handleSavePaymentMethodError = useCallback((error: Error) => {
    toast('Failed to save your payment method', { description: error.message });
  }, []);

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  return (
    <PageShell className="gap-6 flex flex-col">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <SavePaymentMethodDialog
            amountInUsdCents={1000}
            dialogTrigger={<NamefiButton>Add Credit Card</NamefiButton>}
            onSavePaymentMethodError={handleSavePaymentMethodError}
            onSavePaymentMethodSuccess={handleSavePaymentMethodSuccess}
            onOpenChange={setShowSavePaymentMethodDialog}
            showSavePaymentMethodDialog={showSavePaymentMethodDialog}
          />
        </div>
        <Suspense fallback={<LoadingSkeletons />}>
          <PaymentMethodsGrid
            paymentMethodsRefetchRequired={paymentMethodsRefetchRequired}
            onPaymentMethodsRefetch={() =>
              setPaymentMethodsRefetchRequired(false)
            }
          />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeletons />}>
        <UserWalletCardsGrid />
      </Suspense>
    </PageShell>
  );
}

interface PaymentMethodsGridProps {
  paymentMethodsRefetchRequired: boolean;
  onPaymentMethodsRefetch: () => void;
}

function PaymentMethodsGrid({
  paymentMethodsRefetchRequired,
  onPaymentMethodsRefetch,
}: PaymentMethodsGridProps) {
  type CreditCard = inferOutput<typeof trpc.payments.getPaymentMethods>[number];

  const [deletedPaymentMethodIds, setDeletedPaymentMethodIds] = useState<
    string[]
  >([]);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{
    id: string;
    last4: string;
    brand: string;
  } | null>(null);

  const { privyUser } = useAuth();
  const trpc = useTRPC();

  // Get ENS name for primary wallet
  const primaryWallet = privyUser?.wallet?.address;
  const { data: ensName } = useEnsName({
    address: primaryWallet as `0x${string}` | undefined,
    chainId: 1,
    query: { enabled: Boolean(primaryWallet) },
  });

  // Determine card holder name with priority: fullName > ENS > email > wallet address
  const cardHolderName = useMemo(() => {
    const fullName = privyUser?.customMetadata?.fullName;
    const email = privyUser?.email?.address;
    const wallet = primaryWallet;

    const name = fullName || ensName || email || wallet || 'CARD HOLDER';
    return name.toUpperCase();
  }, [privyUser, ensName, primaryWallet]);

  const {
    data: getPaymentMethodsData,
    refetch: refetchPaymentMethods,
    isFetching: getPaymentMethodsFetching,
  } = useSuspenseQuery({
    ...trpc.payments.getPaymentMethods.queryOptions(),
  });

  const {
    mutate: deletePaymentMethod,
    isPending: deletePaymentMethodPending,
    variables: deletePaymentMethodVariables,
  } = useMutation(
    trpc.payments.deletePaymentMethod.mutationOptions({
      onSuccess: (
        data: inferOutput<typeof trpc.payments.deletePaymentMethod>,
      ) => {
        if (data.isSuccess && deletePaymentMethodVariables?.paymentMethodId) {
          setDeletedPaymentMethodIds([
            ...deletedPaymentMethodIds,
            deletePaymentMethodVariables.paymentMethodId,
          ]);
          toast('Successfully deleted your payment method');
        }
      },
      onError: (error) => {
        setDeletedPaymentMethodIds(
          deletedPaymentMethodIds.filter(
            (id) => id !== deletePaymentMethodVariables?.paymentMethodId,
          ),
        );

        toast('Failed to delete your payment method', {
          description: error.message,
        });
      },
    }),
  );

  const creditCards: CreditCard[] = useMemo(() => {
    return (
      getPaymentMethodsData?.filter(
        (method) => !deletedPaymentMethodIds.includes(method.id),
      ) ?? []
    );
  }, [getPaymentMethodsData, deletedPaymentMethodIds]);

  const handleOpenDeleteDialog = useCallback(
    (method: { id: string; last4: string; brand: string }) => {
      setCardToDelete(method);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (cardToDelete) {
      deletePaymentMethod({ paymentMethodId: cardToDelete.id });
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  }, [cardToDelete, deletePaymentMethod]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setCardToDelete(null);
  }, []);

  useEffect(() => {
    if (paymentMethodsRefetchRequired) {
      refetchPaymentMethods();
      onPaymentMethodsRefetch();
    }
  }, [
    onPaymentMethodsRefetch,
    paymentMethodsRefetchRequired,
    refetchPaymentMethods,
  ]);

  if (getPaymentMethodsFetching) {
    return <LoadingSkeletons />;
  }

  if (creditCards.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creditCards.map((method) => {
        const isHovered = hoveredCardId === method.id;

        return (
          <div key={method.id} className="relative group">
            <ControlledGlareCard
              onHoverChange={(hover) =>
                setHoveredCardId(hover ? method.id : null)
              }
              containerClassName="w-full"
              className="bg-transparent"
              rotateIntensity={0.3}
              backgroundMovement={0.8}
              glareOpacity={0.4}
              glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
              diagonalPattern={{ spacing: 15, intensity: 0.6 }}
              rainbowEffect={{ enabled: true, intensity: 0.7 }}
            >
              <CreditCard
                type={getCardStyleByBrand(method.brand || 'visa')}
                brand={normalizeCardBrand(method.brand || 'visa')}
                cardNumber={formatCardNumber(method.last4 || '0000')}
                cardHolder={cardHolderName}
                cardExpiration={formatCardExpiration(
                  method.exp_month || 12,
                  method.exp_year || 99,
                )}
                className="w-full h-full"
              />
              {/* Delete button overlay - positioned inside with proper z-index above glare layers */}
              <div className="absolute top-4 right-4 transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`
                    bg-black/50 hover:bg-black/70 text-white hover:text-red-400
                    backdrop-blur-sm rounded-full transition-all duration-200
                    ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={
                    (deletePaymentMethodPending &&
                      deletePaymentMethodVariables?.paymentMethodId ===
                        method.id) ||
                    getPaymentMethodsFetching
                  }
                  onClick={() =>
                    handleOpenDeleteDialog({
                      id: method.id,
                      last4: method.last4 || '****',
                      brand: method.brand || 'card',
                    })
                  }
                >
                  {deletePaymentMethodPending &&
                  deletePaymentMethodVariables?.paymentMethodId ===
                    method.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </ControlledGlareCard>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your {cardToDelete?.brand} card
              ending in {cardToDelete?.last4}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const _userWalletCardsGridFlags = [
  {
    key: 'separateByChain',
    label: 'Separate By Chain',
    description: 'Separate the wallet cards by chain',
    scope: 'page',
    pageKey: 'paymentmethods',
  },
  {
    key: 'forceNfscVariant',
    label: 'Force NFSC Variant',
    description: 'Force the NFSC variant for the wallet cards',
    scope: 'page',
    pageKey: 'paymentmethods',
  },
] as FeatureFlagDefinition[];

function UserWalletCardsGrid(props: {}) {
  const {
    isUnlinkWalletDialogOpen,
    setIsUnlinkWalletDialogOpen,
    walletToUnlink,
    handleConfirmUnlinkWalletClicked,
    handleUnlinkWalletClicked,
    isUnlinkWalletPending,
    handleLinkWalletClicked,
  } = useControlLinkedWallets();

  useRegisterAdminFlags(_userWalletCardsGridFlags);
  const [separateByChain] = useAdminFeatureFlag(_userWalletCardsGridFlags[0]);
  const [forceNfscVariant] = useAdminFeatureFlag(_userWalletCardsGridFlags[1]);

  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const { linkedWallets } = useLinkedWallets();

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [walletConnectionRequest, setWalletConnectionRequest] = useState<{
    walletAddress: string;
    action: 'addAssets' | 'chargeWallet';
  } | null>(null);
  const requestWalletConnectionRef = useRef<RequestWalletConnectionRef | null>(
    null,
  );

  const { privyUser } = useAuth();
  const { watchNfscInWallet, isAnyWalletConnected } = useWatchAssets();
  const { switchToWallet, activeWalletAddress } = useActiveWallet();

  // Request wallet connection and set pending action
  const requestWalletConnection = useCallback(
    (walletAddress: string, action: 'addAssets' | 'chargeWallet') => {
      setWalletConnectionRequest({
        walletAddress,
        action,
      });
      setTimeout(() => {
        requestWalletConnectionRef.current?.requestWalletConnection(
          walletAddress,
        );
      }, 100);
    },
    [],
  );

  const handleAddAssets = useCallback(async () => {
    try {
      toast('Request sent to wallet', {
        description: 'Please check your wallet to add the NFSC token',
      });
      const result = await watchNfscInWallet();

      if (result) {
        toast('Successfully added NFSC token to your wallet');
      } else {
        toast('Failed to add NFSC token to your wallet');
      }
    } catch (error) {
      toast('Failed to add token', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [watchNfscInWallet]);

  const handleChargeWallet = useCallback(async (walletAddress?: string) => {
    try {
      setIsSwapDialogOpen(true);
    } catch (error) {
      toast('Failed to switch wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  // Handle when wallet is successfully connected via modal
  const handleWalletConnected = useCallback(
    async (walletAddress: string) => {
      if (!walletConnectionRequest) return;

      // Execute the requested action based on what was requested
      if (walletConnectionRequest.action === 'addAssets') {
        await handleAddAssets();
      } else if (walletConnectionRequest.action === 'chargeWallet') {
        await handleChargeWallet(walletAddress);
      }
      setWalletConnectionRequest(null);
    },
    [walletConnectionRequest, handleAddAssets, handleChargeWallet],
  );

  const { chainBalances, isLoadingBalance } = useUserChainBalances({
    walletAddresses: linkedWalletAddresses as `0x${string}`[],
    enabled: !!linkedWalletsReady,
  });

  const chainBalancesByWalletAddress = useMemo(
    () => groupBy(prop('walletAddress'), chainBalances),
    [chainBalances],
  );

  const isFirstConnectedWallet = useCallback(
    (walletAddress: string) => {
      if (!privyUser?.wallet) {
        return false;
      }

      return privyUser.wallet.address === walletAddress;
    },
    [privyUser],
  );

  // Create card items based on separateByChain flag
  const cardItems = useMemo(() => {
    if (separateByChain) {
      // Create a card for each wallet + chain combination
      return chainBalances.map((chainBalance) => ({
        key: `${chainBalance.walletAddress}-${chainBalance.chainId}`,
        walletAddress: chainBalance.walletAddress,
        balances: [chainBalance],
        linkedWallet: linkedWallets.find(
          (w) =>
            w.address.toLowerCase() ===
            chainBalance.walletAddress.toLowerCase(),
        ),
      }));
    }
    // Default: one card per wallet with all chains combined
    return linkedWallets.map((linkedWallet) => ({
      key: linkedWallet.address,
      walletAddress: linkedWallet.address as `0x${string}`,
      balances:
        chainBalancesByWalletAddress[linkedWallet.address as `0x${string}`] ||
        [],
      linkedWallet,
    }));
  }, [
    separateByChain,
    chainBalances,
    linkedWallets,
    chainBalancesByWalletAddress,
  ]);

  const content = useMemo(() => {
    if (linkedWallets.length === 0) {
      return (
        <PaymentMethodsManagerPlaceholder
          title="No linked wallets found"
          description="Consider adding a new wallet"
          icon={<Wallet2 className="size-10 text-muted-foreground" />}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardItems.map((item) => {
          const { key, walletAddress, balances, linkedWallet } = item;
          const isHovered = hoveredCardId === key;
          const provider = forceNfscVariant
            ? 'nfsc'
            : linkedWallet
              ? (mapPrivyWalletToProvider(
                  linkedWallet.walletClientType,
                ) as WalletProvider)
              : 'nfsc';

          return (
            <div key={key} className="relative group">
              <ControlledGlareCard
                onHoverChange={(hover) => setHoveredCardId(hover ? key : null)}
                containerClassName="w-full"
                className="bg-transparent"
                rotateIntensity={0.3}
                backgroundMovement={0.8}
                glareOpacity={0.4}
                glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
                diagonalPattern={{ spacing: 15, intensity: 0.6 }}
                rainbowEffect={{ enabled: true, intensity: 0.7 }}
              >
                <NFSCWalletCard
                  address={walletAddress}
                  provider={provider}
                  balances={balances}
                  showSingleChain={separateByChain}
                  bottomActions={
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          requestWalletConnection(walletAddress, 'addAssets')
                        }
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        Show in Wallet
                      </Button>
                      <Button
                        onClick={() =>
                          requestWalletConnection(walletAddress, 'chargeWallet')
                        }
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        Add Funds
                      </Button>
                    </div>
                  }
                />
                {/* Delete button overlay - positioned inside with proper z-index above glare layers */}
                {!separateByChain && !isFirstConnectedWallet(walletAddress) ? (
                  <div className="absolute top-4 right-4 transition-all duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`
                  bg-black/50 hover:bg-black/70 text-white hover:text-red-400
                  backdrop-blur-sm rounded-full transition-all duration-200
                  ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                      disabled={
                        isUnlinkWalletPending &&
                        walletToUnlink === walletAddress
                      }
                      onClick={() =>
                        handleUnlinkWalletClicked(
                          walletAddress as `0x${string}`,
                        )
                      }
                    >
                      {isUnlinkWalletPending &&
                      walletToUnlink === walletAddress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : null}
              </ControlledGlareCard>
            </div>
          );
        })}
      </div>
    );
  }, [
    linkedWallets,
    cardItems,
    forceNfscVariant,
    separateByChain,
    isFirstConnectedWallet,
    isUnlinkWalletPending,
    walletToUnlink,
    hoveredCardId,
    handleUnlinkWalletClicked,
    requestWalletConnection,
  ]);

  if (isLoadingBalance || !linkedWalletsReady) {
    return <LoadingSkeletons />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Linked Wallets</h2>
        <NamefiButton
          onClick={handleLinkWalletClicked}
          className="font-bold"
          size="sm"
        >
          Link Wallet
        </NamefiButton>
      </div>
      {content}
      <UnlinkWalletDialog
        isUnlinkWalletDialogOpen={isUnlinkWalletDialogOpen}
        setIsUnlinkWalletDialogOpen={setIsUnlinkWalletDialogOpen}
        walletToUnlink={walletToUnlink}
        handleUnlinkWalletConfirm={handleConfirmUnlinkWalletClicked}
        isUnlinkWalletPending={isUnlinkWalletPending}
      />
      <NfscSwapDialog
        open={isSwapDialogOpen}
        onOpenChange={setIsSwapDialogOpen}
        walletAddress={activeWalletAddress}
      />
      <RequestWalletConnection
        ref={requestWalletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription={
          walletConnectionRequest?.action === 'addAssets'
            ? 'to add NFSC token to your wallet'
            : 'to charge your wallet'
        }
      />
    </div>
  );
}
