'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { HybridPaymentCard } from '@/components/payment-method/hybrid-payment-card';
import {
  AuthRequiredCard,
  NoPaymentMethodRequiredCard,
} from '@/components/payment-method/select-payment-method-card';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { CartCard } from '@/components/cart-card';
import { useFeedback } from '@/components/providers/feedback';
import { getPaymentProviderForChain } from '@/components/payment-method/hybrid-payment-utils';
import { useAuth } from '@/hooks/use-auth';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { type AppRouterInput, useTRPC } from '@/lib/trpc';
import { feedbackTriggerSchema } from '@/lib/feedback-triggers';
import { formatAmountInUSD } from '@/lib/number';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/data/multi-year-pricing';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';

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
  const t = useTranslations('shared');
  const router = useRouter();
  const { requestFeedback } = useFeedback();
  const parentDomain = useMemo(() => {
    const parsedDomainName = parseDomainName(domainAvailabilityInfo.domain);

    return parsedDomainName.valid &&
      parsedDomainName.registryType === 'subdomain'
      ? parsedDomainName.nearestTraditionalParentDomain
      : undefined;
  }, [domainAvailabilityInfo.domain]);
  const {
    nftChainIds: allowedNftChainIds,
    defaultNftChainId,
    defaultNfscBalanceChainId,
  } = useAllowedChains(parentDomain);
  const defaultNfscPaymentProvider = getPaymentProviderForChain(
    defaultNfscBalanceChainId,
  );
  const [isLinkedOrUserConfirmed, setIsLinkedOrUserConfirmed] = useState(true);

  const [selectedNftWalletAddress, setSelectedNftWalletAddress] = useState<
    string | null
  >(null);
  const [selectedNftChainId, setSelectedNftChainId] =
    useState<number>(defaultNftChainId);
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
        requestFeedback(feedbackTriggerSchema.enum.MILESTONE_CHECKOUT_SUCCESS);
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
      setSelectedNftChainId(chainId ?? defaultNftChainId);
    },
    [defaultNftChainId],
  );

  useEffect(() => {
    if (!allowedNftChainIds.includes(selectedNftChainId)) {
      setSelectedNftChainId(defaultNftChainId);
    }
  }, [allowedNftChainIds, defaultNftChainId, selectedNftChainId]);

  const submitButtonText = useMemo(() => {
    if (!selectedNftWalletAddress) {
      return t('instantBuyModal.selectNftWallet');
    }

    if (isInstantBuyPending || isRedirecting) {
      return t('instantBuyModal.processing');
    }

    return t('instantBuyModal.buyNow');
  }, [isInstantBuyPending, isRedirecting, selectedNftWalletAddress, t]);

  const submitOrderDisabled = useMemo(() => {
    return !selectedNftWalletAddress || !isLinkedOrUserConfirmed;
  }, [selectedNftWalletAddress, isLinkedOrUserConfirmed]);

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
          nftChainId: selectedNftChainId ?? defaultNftChainId,
        },
      });
    },
    [
      instantBuy,
      domainAvailabilityInfo.domain,
      selectedNftWalletAddress,
      selectedNftChainId,
      defaultNftChainId,
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
            chainId: defaultNfscBalanceChainId,
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
        nftChainId: selectedNftChainId ?? defaultNftChainId,
      },
    });
  }, [
    instantBuy,
    domainAvailabilityInfo.domain,
    selectedNftWalletAddress,
    selectedNftChainId,
    defaultNftChainId,
    defaultNfscBalanceChainId,
    defaultNfscPaymentProvider,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t('instantBuyModal.title', {
                domain: domainAvailabilityInfo.domain,
              })}
            </DialogTitle>
            <DialogDescription>
              {t('instantBuyModal.description')}
            </DialogDescription>
          </DialogHeader>

          {isAuthLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-4">
              <CartCard title={t('instantBuyModal.domain')}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">
                    {domainAvailabilityInfo.domain}
                  </span>
                  <span className="text-lg">
                    {t('instantBuyModal.pricePerYear', {
                      price: formatAmountInUSD(priceInUsdCents, true),
                    })}
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
              <CartCard title={t('instantBuyModal.domain')}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">
                    {domainAvailabilityInfo.domain}
                  </span>
                  <span className="text-lg">
                    {t('instantBuyModal.pricePerYear', {
                      price: formatAmountInUSD(priceInUsdCents, true),
                    })}
                  </span>
                </div>
              </CartCard>

              {/* NFT Wallet Selection */}
              <NftWalletCard
                parentDomain={parentDomain}
                onWalletAddressChange={handleNftWalletAddressChange}
                selectedWalletAddress={selectedNftWalletAddress}
                disabled={isDisabled}
                onChainIdChange={handleNftChainIdChange}
                selectedChainId={selectedNftChainId}
                isLinkedOrUserConfirmed={isLinkedOrUserConfirmed}
                onIsLinkedOrUserConfirmationChange={setIsLinkedOrUserConfirmed}
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
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      )}
                      {submitButtonText}
                    </NamefiButton>
                  }
                />
              ) : (
                <HybridPaymentCard
                  parentDomain={parentDomain}
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
            <AlertDialogTitle>
              {t('instantBuyModal.errorTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('instantBuyModal.errorDescription')}{' '}
              <p className="italic">
                {errorMessage
                  ? t('instantBuyModal.errorDetail', { error: errorMessage })
                  : ''}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('instantBuyModal.close')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
