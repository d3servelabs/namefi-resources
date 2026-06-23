'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Info, Plus, ShoppingBag, Wallet2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type Address, formatUnits, getAddress, parseUnits } from 'viem';
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useSwitchChain,
} from 'wagmi';
import { useEstimateContractCall } from '@/hooks/use-estimate-contract-call';
import { Erc721ApprovalAbi } from '@/lib/marketplaces/seaport/abi';
import { OPENSEA_CONDUIT_ADDRESS } from '@/lib/marketplaces/seaport/constants';
import {
  bind,
  type RequestCancelledError,
  RequestWalletConnectionDialog,
  useRequestWalletConnection,
} from '@/components/dialogs/use-request-wallet-connection';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { getMarketplacesSupportedOnChain } from '@/lib/marketplaces/chains';
import {
  getDefaultListingCurrencyForChain,
  getListingCurrenciesForChain,
} from '@/lib/marketplaces/currencies';
import { MARKETPLACE_OPTIONS } from '@/lib/marketplaces/factory';
import type {
  ListingCurrency,
  ListingFees,
  MarketplaceId,
} from '@/lib/marketplaces/types';
import { useCreateListing, useListings } from './use-listings';

const DURATION_OPTIONS: ReadonlyArray<{ seconds: number }> = [
  { seconds: 24 * 60 * 60 },
  { seconds: 7 * 24 * 60 * 60 },
  { seconds: 30 * 24 * 60 * 60 },
];

interface Props {
  domain: string;
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  /** On-chain holder of the domain NFT — the wallet that must sign the listing. */
  ownerAddress: Address;
}

export function CreateListingModal({
  domain,
  chainId,
  tokenAddress,
  tokenId,
  defaultOpen = false,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  ownerAddress,
}: Props) {
  const t = useTranslations('domains');
  const tCommon = useTranslations('common');
  const durationLabel = (seconds: number): string => {
    if (seconds === 24 * 60 * 60)
      return t('marketplace.createListing.duration1Day');
    if (seconds === 30 * 24 * 60 * 60)
      return t('marketplace.createListing.duration30Days');
    return t('marketplace.createListing.duration7Days');
  };
  const [open, setOpenState] = useState(defaultOpen);
  const { address: connectedAddress } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const walletDialog = useRequestWalletConnection({
    actionDescription: 'to sign the listing',
  });

  // A listing is signed by the wallet that holds the NFT, on the chain the NFT
  // lives on. Until both match, the primary action prompts the user to connect
  // and switch instead of sitting disabled.
  const walletReady =
    !!connectedAddress &&
    connectedAddress.toLowerCase() === ownerAddress.toLowerCase() &&
    activeChainId === chainId;

  // Native balance of the connected signer on the listing chain. The first
  // listing of an NFT needs an on-chain `setApprovalForAll` (gas-paying) tx, so
  // a wallet with zero native balance can never complete a listing — surface the
  // balance and block submission instead of letting the approval tx fail.
  const { data: nativeBalance } = useBalance({
    address: connectedAddress,
    chainId,
    query: { enabled: !!connectedAddress },
  });
  const hasZeroNativeBalance =
    !!connectedAddress && nativeBalance?.value === 0n;

  // Existing listings — a marketplace that already has an active listing for this
  // token is disabled in the selector (OpenSea allows only one listing per NFT).
  const listingsQuery = useListings({
    chainId,
    tokenAddress,
    tokenId,
    enabled: open,
  });
  const marketplacesWithListings = useMemo(
    () => new Set((listingsQuery.data ?? []).map((l) => l.marketplace)),
    [listingsQuery.data],
  );

  const supportedMarketplaces = useMemo(
    () => getMarketplacesSupportedOnChain(chainId),
    [chainId],
  );
  const availableMarketplaceOptions = useMemo(
    () =>
      MARKETPLACE_OPTIONS.filter((o) =>
        supportedMarketplaces.includes(o.id),
      ).map((o) => ({
        ...o,
        alreadyListed: marketplacesWithListings.has(o.id),
      })),
    [supportedMarketplaces, marketplacesWithListings],
  );
  const allMarketplacesListed =
    availableMarketplaceOptions.length > 0 &&
    availableMarketplaceOptions.every((o) => o.alreadyListed);

  const [marketplaceId, setMarketplaceId] = useState<MarketplaceId>(
    () => availableMarketplaceOptions[0]?.id ?? 'opensea',
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(
    DURATION_OPTIONS[1]?.seconds ?? 7 * 24 * 60 * 60,
  );

  // Keep `marketplaceId` on a selectable (chain-supported, not-already-listed)
  // option as listings load in or the chain changes.
  useEffect(() => {
    const selectable = availableMarketplaceOptions.filter(
      (o) => !o.alreadyListed,
    );
    const current = availableMarketplaceOptions.find(
      (o) => o.id === marketplaceId,
    );
    if ((!current || current.alreadyListed) && selectable[0]) {
      setMarketplaceId(selectable[0].id);
    }
  }, [availableMarketplaceOptions, marketplaceId]);

  // OpenSea SDK 10.5 settles listings in the chain's native asset only.
  const availableCurrencies = useMemo(
    () => getListingCurrenciesForChain(chainId).filter((c) => c.isNative),
    [chainId],
  );
  const [currencyAddress, setCurrencyAddress] = useState<Address>(
    () =>
      availableCurrencies[0]?.contract ??
      getDefaultListingCurrencyForChain(chainId)?.contract ??
      ('0x0000000000000000000000000000000000000000' as Address),
  );

  useEffect(() => {
    if (
      !availableCurrencies.some(
        (c) => c.contract.toLowerCase() === currencyAddress.toLowerCase(),
      )
    ) {
      const fallback = availableCurrencies[0]?.contract;
      if (fallback) setCurrencyAddress(fallback);
    }
  }, [availableCurrencies, currencyAddress]);

  const currency = useMemo<ListingCurrency | undefined>(
    () =>
      availableCurrencies.find(
        (c) => c.contract.toLowerCase() === currencyAddress.toLowerCase(),
      ),
    [availableCurrencies, currencyAddress],
  );

  const [priceInput, setPriceInput] = useState<string>('');
  const priceWei = useMemo(() => {
    if (!currency) return undefined;
    const trimmed = priceInput.trim();
    if (!trimmed || Number(trimmed) <= 0) return undefined;
    try {
      return parseUnits(trimmed, currency.decimals);
    } catch {
      return undefined;
    }
  }, [priceInput, currency]);

  const fees = useEstimatedFees(priceWei);

  // The listing order itself is a gasless EIP-712 signature; the only on-chain
  // transaction (and gas cost) is the one-time `setApprovalForAll` that lets the
  // marketplace's conduit transfer the NFT once a buyer fills the order. We
  // estimate that approval's network fee and, when the conduit is already
  // approved, surface that the listing costs nothing to post.
  //
  // Scoped to OpenSea (the default/example marketplace): its conduit is a known
  // constant, so we can read approval state and estimate gas without first
  // building the order. Other adapters approve different operators.
  const approvalOperator =
    marketplaceId === 'opensea' ? OPENSEA_CONDUIT_ADDRESS : undefined;

  const { data: isConduitApproved } = useReadContract({
    address: tokenAddress,
    abi: Erc721ApprovalAbi,
    functionName: 'isApprovedForAll',
    args:
      connectedAddress && approvalOperator
        ? [connectedAddress, approvalOperator]
        : undefined,
    chainId,
    query: { enabled: open && !!connectedAddress && !!approvalOperator },
  });

  // `value: 0n` lets the estimator run from the connected signer (the hook skips
  // the user's own params when `value` is undefined). `setApprovalForAll` is
  // nonpayable, so the value is a no-op beyond enabling that path.
  const {
    feeFormatted: approvalFeeEth,
    isLoading: isApprovalFeeLoading,
    isFallback: isApprovalFeeFallback,
  } = useEstimateContractCall({
    contractAddress: tokenAddress,
    abi: Erc721ApprovalAbi,
    functionName: 'setApprovalForAll',
    args: [approvalOperator ?? OPENSEA_CONDUIT_ADDRESS, true],
    value: 0n,
  });

  // Only positively-known "already approved" makes the listing gasless; while
  // the read is loading or for non-OpenSea adapters, assume an approval tx may
  // be needed.
  const approvalAlreadyGranted = isConduitApproved === true;
  // Zero native balance only blocks listing when an on-chain approval tx is
  // still required — an already-approved NFT lists with a gasless signature.
  const needsApprovalTxButCannotPay =
    hasZeroNativeBalance && !approvalAlreadyGranted;
  const networkFeeDisplay = formatNetworkFee({
    approvalAlreadyGranted,
    isLoading: isApprovalFeeLoading,
    feeEth: approvalFeeEth,
    isFallback: isApprovalFeeFallback,
    noneLabel: t('marketplace.createListing.networkFeeNone'),
    loadingLabel: tCommon('actions.loading'),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpenState(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const createMutation = useCreateListing({
    domain,
    chainId,
    tokenAddress,
    tokenId,
    ownerAddress,
    onSuccess: (listing) => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.MarketplaceListingCreated,
        properties: {
          domainName: domain,
          marketplaceId: listing.marketplace,
          chainId,
          priceWei: listing.price.raw,
          currencySymbol: listing.price.currency.symbol,
        },
      });
      toast.success(
        t('marketplace.createListing.listedToast', {
          price: `${listing.price.decimal.toFixed(4)} ${listing.price.currency.symbol}`,
        }),
        {
          description: t('marketplace.createListing.listedToastDescription'),
          action: {
            label: t('marketplace.listings.view'),
            onClick: () =>
              window.open(listing.externalUrl, '_blank', 'noopener,noreferrer'),
          },
        },
      );
      handleOpenChange(false);
    },
  });

  const selectedMarketplace = availableMarketplaceOptions.find(
    (o) => o.id === marketplaceId,
  );
  const selectedDuration = DURATION_OPTIONS.find(
    (d) => d.seconds === durationSeconds,
  );
  const selectedMarketplaceListed = selectedMarketplace?.alreadyListed ?? false;
  const isListingStatusLoading = open && listingsQuery.isLoading;

  const handleConnectWallet = async () => {
    try {
      await walletDialog.request({
        chainId,
        walletAddress: ownerAddress,
        actionDescription: 'to sign the listing',
      });
    } catch (err) {
      // User dismissed the dialog, or a request was already in flight — both
      // are silent no-ops, not errors to surface.
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        ((err as RequestCancelledError).code === 'cancelled' ||
          (err as { code?: string }).code === 'blocked')
      ) {
        return;
      }
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!connectedAddress) {
      toast.error(t('marketplace.createListing.connectWalletError'));
      return;
    }
    if (isListingStatusLoading) {
      toast(t('marketplace.createListing.stillChecking'));
      return;
    }
    if (selectedMarketplaceListed) {
      toast.error(t('marketplace.createListing.alreadyListedError'), {
        description: t(
          'marketplace.createListing.alreadyListedErrorDescription',
        ),
      });
      return;
    }
    if (!currency) {
      toast.error(t('marketplace.createListing.pickCurrency'));
      return;
    }
    if (!priceWei) {
      toast.error(t('marketplace.createListing.invalidPrice'));
      return;
    }
    if (activeChainId !== chainId) {
      try {
        await switchChainAsync({ chainId });
      } catch (error) {
        toast.error(t('marketplace.createListing.switchNetwork'), {
          description: errorToMessage(error),
        });
        return;
      }
    }
    try {
      await createMutation.mutateAsync({
        marketplaceId,
        input: {
          tokenAddress,
          tokenId,
          priceWei,
          currency: getAddress(currency.contract),
          durationSeconds,
          listingType: 'fixed-price',
        },
      });
    } catch (error) {
      const message = errorToMessage(error);
      const friendly = friendlyErrorMessage(message, t);
      toast.error(t('marketplace.createListing.createFailed'), {
        description: friendly,
      });
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button
              data-testid="domains.marketplace.create-listing.trigger"
              size="sm"
              className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
            />
          }
        >
          <Plus className="h-4 w-4 me-1.5" />
          {triggerLabel ?? t('marketplace.createListing.trigger')}
        </DialogTrigger>
      ) : null}
      <DialogContent
        data-testid="domains.marketplace.create-listing.dialog"
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <ShoppingBag className="h-4 w-4 text-brand-primary" />
            {t('marketplace.createListing.title')}
          </DialogTitle>
          <DialogDescription>
            {t('marketplace.createListing.description')}
          </DialogDescription>
        </DialogHeader>

        {availableMarketplaceOptions.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {t('marketplace.createListing.noMarketplaces')}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-zinc-300">
                {t('marketplace.createListing.marketplaceLabel')}
              </Label>
              <Select
                value={marketplaceId}
                onValueChange={(v) => setMarketplaceId(v as MarketplaceId)}
              >
                <SelectTrigger
                  data-testid="domains.marketplace.create-listing.marketplace-trigger"
                  className="bg-zinc-950/40 border-zinc-800 text-zinc-100"
                >
                  <SelectValue>{selectedMarketplace?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMarketplaceOptions.map((option) => (
                    <SelectItem
                      key={option.id}
                      data-testid={`domains.marketplace.create-listing.marketplace-option.${option.id}`}
                      value={option.id}
                      disabled={option.alreadyListed}
                    >
                      {option.label}
                      {option.alreadyListed
                        ? t('marketplace.createListing.alreadyListedSuffix')
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isListingStatusLoading ? (
                <p className="text-xs text-zinc-500">
                  {t('marketplace.createListing.checkingListings')}
                </p>
              ) : allMarketplacesListed ? (
                <p className="text-xs text-amber-300">
                  {t('marketplace.createListing.allListed')}
                </p>
              ) : selectedMarketplace ? (
                <p className="text-xs text-zinc-500">
                  {selectedMarketplace.description}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="marketplace-price"
                  className="text-sm text-zinc-300"
                >
                  {t('marketplace.createListing.priceLabel', {
                    currency: currency?.symbol ?? '—',
                  })}
                </Label>
                <Input
                  data-testid="domains.marketplace.create-listing.price-input"
                  id="marketplace-price"
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder={t('marketplace.createListing.pricePlaceholder')}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="bg-zinc-950/40 border-zinc-800 text-zinc-100 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">
                  {t('marketplace.createListing.currencyLabel')}
                </Label>
                <Select
                  value={currencyAddress}
                  onValueChange={(v) => setCurrencyAddress(v as Address)}
                >
                  <SelectTrigger
                    data-testid="domains.marketplace.create-listing.currency-trigger"
                    className="bg-zinc-950/40 border-zinc-800 text-zinc-100"
                  >
                    <SelectValue>{currency?.symbol}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c) => (
                      <SelectItem
                        key={c.contract}
                        data-testid={`domains.marketplace.create-listing.currency-option.${c.contract}`}
                        value={c.contract}
                      >
                        {t('marketplace.createListing.currencyOption', {
                          symbol: c.symbol,
                          name: c.name,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-zinc-300">
                {t('marketplace.createListing.durationLabel')}
              </Label>
              <Select
                value={String(durationSeconds)}
                onValueChange={(v) => setDurationSeconds(Number(v))}
              >
                <SelectTrigger
                  data-testid="domains.marketplace.create-listing.duration-trigger"
                  className="bg-zinc-950/40 border-zinc-800 text-zinc-100"
                >
                  <SelectValue>
                    {selectedDuration
                      ? durationLabel(selectedDuration.seconds)
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem
                      key={d.seconds}
                      data-testid={`domains.marketplace.create-listing.duration-option.${d.seconds}`}
                      value={String(d.seconds)}
                    >
                      {durationLabel(d.seconds)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FeePreview fees={fees} currency={currency} priceWei={priceWei} />

            <ListingCostSummary
              connected={!!connectedAddress}
              nativeBalanceFormatted={nativeBalance?.formatted}
              nativeSymbol={nativeBalance?.symbol}
              networkFeeDisplay={networkFeeDisplay}
              needsApprovalTxButCannotPay={needsApprovalTxButCannotPay}
            />
          </div>
        )}

        <DialogFooter>
          {walletReady ? (
            <AsyncButton
              data-testid="domains.marketplace.create-listing.submit"
              size="lg"
              onClick={handleSubmit}
              disabled={
                !priceWei ||
                !connectedAddress ||
                !currency ||
                isListingStatusLoading ||
                selectedMarketplaceListed ||
                allMarketplacesListed ||
                needsApprovalTxButCannotPay
              }
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
            >
              <ShoppingBag className="h-4 w-4 me-2" />
              {t('marketplace.createListing.listOn', {
                marketplace: selectedMarketplace?.label ?? marketplaceId,
              })}
            </AsyncButton>
          ) : (
            <AsyncButton
              data-testid="domains.marketplace.create-listing.connect-wallet"
              size="lg"
              onClick={handleConnectWallet}
              disabled={
                allMarketplacesListed ||
                availableMarketplaceOptions.length === 0
              }
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
            >
              <Wallet2 className="h-4 w-4 me-2" />
              {t('marketplace.createListing.connectWallet')}
            </AsyncButton>
          )}
        </DialogFooter>
      </DialogContent>
      <RequestWalletConnectionDialog {...bind(walletDialog)} />
    </Dialog>
  );
}

function FeePreview({
  fees,
  currency,
  priceWei,
}: {
  fees: ListingFees | undefined;
  currency: ListingCurrency | undefined;
  priceWei: bigint | undefined;
}) {
  const t = useTranslations('domains');
  if (!priceWei || !currency || !fees) return null;
  // Use formatUnits to avoid precision loss when netToSellerWei exceeds
  // Number.MAX_SAFE_INTEGER (true for 18-decimal token amounts above ~9 ETH).
  const netDecimal = formatUnits(fees.netToSellerWei, currency.decimals);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm space-y-2">
      <div className="flex justify-between text-zinc-400">
        <span>{t('marketplace.createListing.feeMarketplace')}</span>
        <span>{(fees.marketplaceFeeBps / 100).toFixed(2)}%</span>
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>{t('marketplace.createListing.feeRoyalty')}</span>
        <span>{(fees.royaltyFeeBps / 100).toFixed(2)}%</span>
      </div>
      <div className="flex justify-between text-zinc-100 font-medium pt-2 border-t border-zinc-800">
        <span className="flex items-center gap-1">
          {t('marketplace.createListing.feeYouReceive')}
          {fees.isEstimate ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="ms-1 text-[10px] border-amber-500/40 text-amber-300"
                  >
                    {t('marketplace.createListing.feeEstimate')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {t('marketplace.createListing.feeEstimateTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </span>
        <span className="font-mono">
          {netDecimal} {currency.symbol}
        </span>
      </div>
    </div>
  );
}

/**
 * Wallet balance + estimated approval network fee for the listing, plus the
 * zero-balance warning. Listing is a gasless signature; the network fee is the
 * one-time conduit `setApprovalForAll` (see `networkFeeDisplay` in the modal).
 */
function ListingCostSummary({
  connected,
  nativeBalanceFormatted,
  nativeSymbol,
  networkFeeDisplay,
  needsApprovalTxButCannotPay,
}: {
  connected: boolean;
  nativeBalanceFormatted: string | undefined;
  nativeSymbol: string | undefined;
  networkFeeDisplay: string;
  needsApprovalTxButCannotPay: boolean;
}) {
  const t = useTranslations('domains');
  if (!connected) return null;
  return (
    <>
      {nativeBalanceFormatted != null ? (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">
            {t('marketplace.createListing.nativeBalanceLabel')}
          </span>
          <span
            data-testid="domains.marketplace.create-listing.native-balance"
            className={cn(
              'font-mono',
              needsApprovalTxButCannotPay ? 'text-red-400' : 'text-zinc-100',
            )}
          >
            {Number.parseFloat(nativeBalanceFormatted).toFixed(4)}{' '}
            {nativeSymbol}
          </span>
        </div>
      ) : null}

      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1 text-zinc-400">
          {t('marketplace.createListing.networkFeeLabel')}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-zinc-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {t('marketplace.createListing.networkFeeTooltip')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        <span
          data-testid="domains.marketplace.create-listing.network-fee"
          className="font-mono text-zinc-100"
        >
          {networkFeeDisplay}
        </span>
      </div>

      {needsApprovalTxButCannotPay ? (
        <p
          data-testid="domains.marketplace.create-listing.zero-balance-warning"
          className="text-xs text-red-400"
        >
          {t('marketplace.createListing.zeroBalanceWarning', {
            symbol: nativeSymbol ?? 'ETH',
          })}
        </p>
      ) : null}
    </>
  );
}

function useEstimatedFees(
  priceWei: bigint | undefined,
): ListingFees | undefined {
  return useMemo(() => {
    if (!priceWei) return undefined;
    // Mirror the adapter's `OPENSEA_PROTOCOL_FEE_BPS` (1.0% as of Sep 2025).
    // Royalty is left at 0 in the preview; the SDK adds it from the collection's
    // on-chain ERC-2981 implementation at signing time.
    const marketplaceFeeBps = 100;
    const royaltyFeeBps = 0;
    const totalBps = BigInt(marketplaceFeeBps + royaltyFeeBps);
    const feeWei = (priceWei * totalBps) / 10_000n;
    return {
      marketplaceFeeBps,
      royaltyFeeBps,
      netToSellerWei: priceWei - feeWei,
      isEstimate: true,
    } satisfies ListingFees;
  }, [priceWei]);
}

/** Resolve the network-fee row's display string for the approval-tx estimate. */
function formatNetworkFee({
  approvalAlreadyGranted,
  isLoading,
  feeEth,
  isFallback,
  noneLabel,
  loadingLabel,
}: {
  approvalAlreadyGranted: boolean;
  isLoading: boolean;
  feeEth: string | null;
  isFallback: boolean;
  noneLabel: string;
  loadingLabel: string;
}): string {
  if (approvalAlreadyGranted) return noneLabel;
  if (isLoading) return loadingLabel;
  if (feeEth == null) return '—';
  const prefix = isFallback ? '≈ ' : '';
  return `${prefix}${Number.parseFloat(feeEth).toFixed(6)} ETH`;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const HTTP_429_PATTERN = /\b429\b/;

function friendlyErrorMessage(
  message: string,
  t: ReturnType<typeof useTranslations<'domains'>>,
): string {
  const lowered = message.toLowerCase();
  if (lowered.includes('user rejected') || lowered.includes('user denied')) {
    return t('marketplace.createListing.errorSignatureCancelled');
  }
  if (lowered.includes('insufficient funds')) {
    return t('marketplace.createListing.errorInsufficientFunds');
  }
  if (
    lowered.includes('marketplace is not configured') ||
    lowered.includes('api key')
  ) {
    return t('marketplace.createListing.errorNotConfigured');
  }
  if (
    HTTP_429_PATTERN.test(lowered) ||
    lowered.includes('too many requests') ||
    lowered.includes('rate limit')
  ) {
    return t('marketplace.createListing.errorRateLimited');
  }
  if (
    lowered.includes('call_exception') ||
    lowered.includes('missing revert data') ||
    lowered.includes("seaport contract isn't available")
  ) {
    return t('marketplace.createListing.errorSeaportUnavailable');
  }
  return message;
}
