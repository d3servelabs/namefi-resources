'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
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
import { ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type Address, formatUnits, getAddress, parseUnits } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
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
import { useCreateListing } from './use-listings';

const DURATION_OPTIONS: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: '1 day', seconds: 24 * 60 * 60 },
  { label: '7 days', seconds: 7 * 24 * 60 * 60 },
  { label: '30 days', seconds: 30 * 24 * 60 * 60 },
];

interface Props {
  domain: string;
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
}

export function CreateListingCard({
  domain,
  chainId,
  tokenAddress,
  tokenId,
}: Props) {
  const { address: connectedAddress } = useAccount();
  const activeChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const supportedMarketplaces = useMemo(
    () => getMarketplacesSupportedOnChain(chainId),
    [chainId],
  );
  const availableMarketplaceOptions = useMemo(
    () =>
      MARKETPLACE_OPTIONS.filter((o) => supportedMarketplaces.includes(o.id)),
    [supportedMarketplaces],
  );

  const [marketplaceId, setMarketplaceId] = useState<MarketplaceId>(
    () => availableMarketplaceOptions[0]?.id ?? 'opensea',
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(
    DURATION_OPTIONS[1]?.seconds ?? 7 * 24 * 60 * 60,
  );

  useEffect(() => {
    if (!supportedMarketplaces.includes(marketplaceId)) {
      const next = supportedMarketplaces[0];
      if (next) setMarketplaceId(next);
    }
  }, [supportedMarketplaces, marketplaceId]);

  // OpenSea SDK 10.5 settles listings in the chain's native asset only. The currency
  // selector therefore shows the single native option per chain; we leave the UI in
  // place so adding ERC-20 support later is a one-line change in `currencies.ts`.
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

  const createMutation = useCreateListing({
    chainId,
    tokenAddress,
    tokenId,
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
        `Listed for ${listing.price.decimal.toFixed(4)} ${listing.price.currency.symbol}`,
        {
          description: 'It may take a moment to appear on the marketplace.',
          action: {
            label: 'View',
            onClick: () =>
              window.open(listing.externalUrl, '_blank', 'noopener,noreferrer'),
          },
        },
      );
    },
  });

  if (availableMarketplaceOptions.length === 0) {
    return (
      <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <ShoppingBag className="h-4 w-4 text-brand-primary" />
            Create listing
          </CardTitle>
          <CardDescription>
            No marketplaces support this network yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!connectedAddress) {
      toast.error('Connect a wallet to list this domain.');
      return;
    }
    if (!currency) {
      toast.error('Pick a payment currency.');
      return;
    }
    if (!priceWei) {
      toast.error('Enter a valid price greater than 0.');
      return;
    }
    if (activeChainId !== chainId) {
      try {
        await switchChainAsync({ chainId });
      } catch (error) {
        toast.error('Switch to the correct network to continue.', {
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
      const friendly = friendlyErrorMessage(message);
      toast.error('Failed to create listing', { description: friendly });
      throw error;
    }
  };

  const selectedMarketplace = availableMarketplaceOptions.find(
    (o) => o.id === marketplaceId,
  );
  const selectedDuration = DURATION_OPTIONS.find(
    (d) => d.seconds === durationSeconds,
  );

  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <CardTitle className="text-zinc-100">Create listing</CardTitle>
        <CardDescription>
          Sell this domain on OpenSea. The listing is signed by your wallet and
          posted to OpenSea's Seaport orderbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm text-zinc-300">Marketplace</Label>
          <Select
            value={marketplaceId}
            onValueChange={(v) => setMarketplaceId(v as MarketplaceId)}
          >
            <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-100">
              <SelectValue>{selectedMarketplace?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableMarketplaceOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMarketplace ? (
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
              Price ({currency?.symbol ?? '—'})
            </Label>
            <Input
              id="marketplace-price"
              type="number"
              min="0"
              step="0.0001"
              placeholder="0.05"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="bg-zinc-950/40 border-zinc-800 text-zinc-100 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-zinc-300">Currency</Label>
            <Select
              value={currencyAddress}
              onValueChange={(v) => setCurrencyAddress(v as Address)}
            >
              <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-100">
                <SelectValue>{currency?.symbol}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((c) => (
                  <SelectItem key={c.contract} value={c.contract}>
                    {c.symbol} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-zinc-300">Duration</Label>
          <Select
            value={String(durationSeconds)}
            onValueChange={(v) => setDurationSeconds(Number(v))}
          >
            <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-100">
              <SelectValue>{selectedDuration?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.seconds} value={String(d.seconds)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FeePreview fees={fees} currency={currency} priceWei={priceWei} />

        <div className="flex justify-end">
          <AsyncButton
            size="lg"
            onClick={handleSubmit}
            disabled={!priceWei || !connectedAddress || !currency}
            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            List on {selectedMarketplace?.label ?? marketplaceId}
          </AsyncButton>
        </div>
      </CardContent>
    </Card>
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
  if (!priceWei || !currency || !fees) return null;
  // Use formatUnits to avoid precision loss when netToSellerWei exceeds
  // Number.MAX_SAFE_INTEGER (true for 18-decimal token amounts above ~9 ETH).
  const netDecimal = formatUnits(fees.netToSellerWei, currency.decimals);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm space-y-2">
      <div className="flex justify-between text-zinc-400">
        <span>Marketplace fee</span>
        <span>{(fees.marketplaceFeeBps / 100).toFixed(2)}%</span>
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>Creator royalty</span>
        <span>{(fees.royaltyFeeBps / 100).toFixed(2)}%</span>
      </div>
      <div className="flex justify-between text-zinc-100 font-medium pt-2 border-t border-zinc-800">
        <span className="flex items-center gap-1">
          You receive
          {fees.isEstimate ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] border-amber-500/40 text-amber-300"
                  >
                    estimate
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Final fees are computed by the marketplace at signing time.
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

function useEstimatedFees(
  priceWei: bigint | undefined,
): ListingFees | undefined {
  return useMemo(() => {
    if (!priceWei) return undefined;
    // Mirror the adapter's `OPENSEA_PROTOCOL_FEE_BPS` (1.0% as of Sep 2025). Royalty
    // is left at 0 in the preview; the SDK adds it from the collection's on-chain
    // ERC-2981 implementation at signing time.
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

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function friendlyErrorMessage(message: string): string {
  const lowered = message.toLowerCase();
  if (lowered.includes('user rejected') || lowered.includes('user denied')) {
    return 'Signature cancelled in your wallet.';
  }
  if (lowered.includes('insufficient funds')) {
    return 'Wallet does not have enough native ETH for the approval transaction.';
  }
  if (
    lowered.includes('marketplace is not configured') ||
    lowered.includes('api key')
  ) {
    return 'The marketplace integration is not configured for this environment.';
  }
  if (
    lowered.includes('call_exception') ||
    lowered.includes('missing revert data')
  ) {
    return "Couldn't reach the marketplace contract on this network. Make sure your wallet is connected to the same chain as the domain NFT.";
  }
  return message;
}
