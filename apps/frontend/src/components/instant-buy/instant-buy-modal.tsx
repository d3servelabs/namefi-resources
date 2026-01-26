'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { HybridPaymentCard } from '@/components/payment-method/hybrid-payment-card';
import {
  AuthRequiredCard,
  NoPaymentMethodRequiredCard,
} from '@/components/payment-method/select-payment-method-card';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { CartCard } from '@/components/cart-card';
import { getPaymentProviderForChain } from '@/components/payment-method/hybrid-payment-utils';
import { useAuth } from '@/hooks/use-auth';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { useDefaultChainId } from '@/hooks/use-allowed-chains';
import { type AppRouterInput, useTRPC } from '@/lib/trpc';
import { formatAmountInUSD } from '@/lib/number';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';

type InstantBuyInput = AppRouterInput['orders']['instantBuy'];

export interface InstantBuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainAvailabilityInfo: DomainAvailabilityInfo;
}

export function InstantBuyModal({
  open,
  onOpenChange,
  domainAvailabilityInfo,
}: InstantBuyModalProps) {
  const router = useRouter();
  const defaultChainId = useDefaultChainId();
  const defaultNfscPaymentProvider = getPaymentProviderForChain(defaultChainId);

  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);
  const [selectedNftChainId, setSelectedNftChainId] =
    useState<number>(defaultChainId);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { linkedWallets } = useLinkedWallets();
  const linkedWalletAddresses = useMemo(
    () =>
      linkedWallets.map(
        (wallet: { address: string }) => wallet.address,
      ) as `0x${string}`[],
    [linkedWallets],
  );

  const trpc = useTRPC();

  // Calculate price for 1 year registration (convert USD to cents)
  const priceInUsdCents = useMemo(() => {
    const registrationPrice =
      domainAvailabilityInfo.pricingDetails?.registrationPrice;
    if (!registrationPrice) return 0;
    const priceInUsd = computeChargesInUsdOrThrow(registrationPrice, 1);
    return usdToCents(priceInUsd);
  }, [domainAvailabilityInfo]);

  const isPromo = priceInUsdCents === 0;

  const { mutate: instantBuy, isPending: isInstantBuyPending } = useMutation({
    ...trpc.orders.instantBuy.mutationOptions({
      onSuccess: (data) => {
        setIsRedirecting(true);
        router.push(`/orders/${data.id}`);
        onOpenChange(false);
      },
      onError: (error) => {
        setErrorMessage(error.message);
        setIsErrorDialogOpen(true);
      },
    }),
  });

  const handleNftWalletAddressChange = useCallback(
    (walletAddress: string | null) => {
      setSelectedNftWalletAddress(walletAddress);
    },
    [],
  );

  const handleNftChainIdChange = useCallback(
    (chainId: number) => {
      setSelectedNftChainId(chainId ?? defaultChainId);
    },
    [defaultChainId],
  );

  const submitButtonText = useMemo(() => {
    if (!selectedNftWalletAddress) {
      return 'Select NFT Wallet to Continue';
    }

    if (isInstantBuyPending || isRedirecting) {
      return 'Processing...';
    }

    return 'Buy Now';
  }, [isInstantBuyPending, isRedirecting, selectedNftWalletAddress]);

  const submitOrderDisabled = useMemo(() => {
    return !selectedNftWalletAddress;
  }, [selectedNftWalletAddress]);

  const isDisabled = useMemo(
    () => isRedirecting || isInstantBuyPending,
    [isRedirecting, isInstantBuyPending],
  );

  const handleHybridPaymentSubmit = useCallback(
    (payments: InstantBuyInput['payments']) => {
      if (!selectedNftWalletAddress) {
        return;
      }

      instantBuy({
        normalizedDomainName: domainAvailabilityInfo.domain,
        durationInYears: 1,
        payments,
        nftMetadata: {
          nftWalletAddress: selectedNftWalletAddress,
          nftChainId: selectedNftChainId ?? defaultChainId,
        },
      });
    },
    [
      instantBuy,
      domainAvailabilityInfo.domain,
      selectedNftWalletAddress,
      selectedNftChainId,
      defaultChainId,
    ],
  );

  const handlePromoSubmit = useCallback(() => {
    if (!selectedNftWalletAddress) {
      return;
    }

    const zeroPayment: InstantBuyInput['payments'] = [
      {
        amountInUsdCents: 0,
        paymentProviderDetails: {
          paymentProvider: defaultNfscPaymentProvider,
          nfscPaymentDetails: {
            walletAddress: selectedNftWalletAddress,
            chainId: defaultChainId,
          },
        },
      },
    ];

    instantBuy({
      normalizedDomainName: domainAvailabilityInfo.domain,
      durationInYears: 1,
      payments: zeroPayment,
      nftMetadata: {
        nftWalletAddress: selectedNftWalletAddress,
        nftChainId: selectedNftChainId ?? defaultChainId,
      },
    });
  }, [
    instantBuy,
    domainAvailabilityInfo.domain,
    selectedNftWalletAddress,
    selectedNftChainId,
    defaultChainId,
    defaultNfscPaymentProvider,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Buy {domainAvailabilityInfo.domain}
            </DialogTitle>
            <DialogDescription>
              Complete your purchase for 1 year registration
            </DialogDescription>
          </DialogHeader>

          {isAuthLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-4">
              <CartCard title="Domain">
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">
                    {domainAvailabilityInfo.domain}
                  </span>
                  <span className="text-lg">
                    {formatAmountInUSD(priceInUsdCents, true)} USD / year
                  </span>
                </div>
              </CartCard>
              <AuthRequiredCard
                cartTotalInUsdCents={priceInUsdCents}
                footerButton={<UserDropdown className="w-full" />}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Domain Info */}
              <CartCard title="Domain">
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">
                    {domainAvailabilityInfo.domain}
                  </span>
                  <span className="text-lg">
                    {formatAmountInUSD(priceInUsdCents, true)} USD / year
                  </span>
                </div>
              </CartCard>

              {/* NFT Wallet Selection */}
              <NftWalletCard
                onWalletAddressChange={handleNftWalletAddressChange}
                selectedWalletAddress={selectedNftWalletAddress}
                disabled={isDisabled}
                onChainIdChange={handleNftChainIdChange}
                selectedChainId={selectedNftChainId}
              />

              {/* Payment */}
              {isPromo ? (
                <NoPaymentMethodRequiredCard
                  footerButton={
                    <NamefiButton
                      variant="default"
                      className="w-full"
                      disabled={submitOrderDisabled || isDisabled}
                      onClick={handlePromoSubmit}
                      size="lg"
                    >
                      {(isInstantBuyPending || isRedirecting) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {submitButtonText}
                    </NamefiButton>
                  }
                />
              ) : (
                <HybridPaymentCard
                  totalAmountInUsdCents={priceInUsdCents}
                  userWalletAddresses={linkedWalletAddresses}
                  isDisabled={isDisabled}
                  isProcessing={isInstantBuyPending || isRedirecting}
                  submitButtonText={submitButtonText}
                  submitOrderDisabled={submitOrderDisabled}
                  onSubmit={handleHybridPaymentSubmit}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Oops! Something went wrong.</AlertDialogTitle>
            <AlertDialogDescription>
              Don&apos;t worry, you won&apos;t be charged. Feel free to try
              again.{' '}
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
    </>
  );
}
