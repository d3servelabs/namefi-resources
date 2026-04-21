'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEnsAddress } from 'wagmi';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { NftDomainCard } from '@/components/nft-domain-card';
import { ControlledGlareCard } from '@/components/ui/aceternity/controlled-glare-card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import type { OriginInfo } from '@/lib/origin';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { CHAINS, getChain } from '@namefi-astra/utils/chains';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { format } from 'date-fns';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';

type OwnerDomainsResponse = AppRouterOutput['registry']['getDomainsByOwner'];
type OwnerDomain = OwnerDomainsResponse['domains'][number];

interface WalletNftGridProps {
  walletIdentifier: string;
  origin: OriginInfo;
}

const ENS_LOOKUP_CHAIN_ID = CHAINS.mainnet.id;

const isLikelyEnsName = (value: string) => {
  if (!value.includes('.')) return false;
  return !value.startsWith('.') && !value.endsWith('.');
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const formatExpiration = (value?: OwnerDomain) => {
  if (!value?.expirationTime) {
    return 'Not indexed yet';
  }

  return format(new Date(value.expirationTime), 'PPP');
};

const splitDomain = (domain: string) => {
  const [subdomain, ...rest] = domain.split('.');
  return {
    subdomain,
    parentDomain: rest.join('.'),
  };
};

export function WalletNftGrid({
  walletIdentifier,
  origin,
}: WalletNftGridProps) {
  const trpc = useTRPC();
  const sanitizedIdentifier = useMemo(
    () => walletIdentifier.trim(),
    [walletIdentifier],
  );
  const parsedWallet = useMemo(
    () => checksumWalletAddressSchema.safeParse(sanitizedIdentifier),
    [sanitizedIdentifier],
  );
  const isEnsLookup = useMemo(() => {
    if (parsedWallet.success) {
      return false;
    }
    return isLikelyEnsName(sanitizedIdentifier);
  }, [parsedWallet.success, sanitizedIdentifier]);

  const {
    data: ensResolvedAddress,
    isLoading: isEnsResolving,
    isError: isEnsError,
  } = useEnsAddress({
    chainId: ENS_LOOKUP_CHAIN_ID,
    name: isEnsLookup ? sanitizedIdentifier.toLowerCase() : undefined,
    query: {
      enabled: isEnsLookup,
      gcTime: 0,
    },
  });

  const resolvedWalletAddress = parsedWallet.success
    ? parsedWallet.data
    : (ensResolvedAddress ?? null);

  const domainsQuery = useQuery(
    trpc.registry.getDomainsByOwner.queryOptions(
      {
        identifier: resolvedWalletAddress ?? ZERO_ADDRESS,
      },
      {
        enabled: Boolean(resolvedWalletAddress),
      },
    ),
  );

  const isLoadingDomains =
    domainsQuery.isFetching &&
    (!domainsQuery.data || domainsQuery.fetchStatus !== 'idle');

  const ownedDomains = domainsQuery.data?.domains ?? [];
  const finalWalletAddress =
    domainsQuery.data?.walletAddress ?? resolvedWalletAddress;
  const backendEnsName = domainsQuery.data?.ensName ?? null;
  const displayEnsName =
    backendEnsName ?? (isEnsLookup ? sanitizedIdentifier.toLowerCase() : null);

  const showSkeleton =
    isEnsResolving || (domainsQuery.isPending && !domainsQuery.data);

  const identifierInvalid =
    !parsedWallet.success && !isEnsLookup && sanitizedIdentifier.length > 0;

  const handleCopy = (value?: string | null) => {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() =>
        toast.success('Copied to clipboard', {
          description: value,
        }),
      )
      .catch(() =>
        toast.error('Copy failed', {
          description: 'We could not copy that value. Please try again.',
        }),
      );
  };

  if (!sanitizedIdentifier) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-base font-medium text-foreground">
          Provide a wallet address or ENS name to view NFTs.
        </p>
      </div>
    );
  }

  if (identifierInvalid) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-base font-medium text-foreground">
          That doesn&apos;t look like a valid wallet address or ENS name.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Wallets must be 0x-prefixed and ENS names need at least one dot.
        </p>
      </div>
    );
  }

  if (isEnsError) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-base font-medium text-foreground">
          We couldn&apos;t resolve that ENS name.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Double-check the spelling or try again in a moment.
        </p>
      </div>
    );
  }

  if (showSkeleton) {
    return <WalletNftGridSkeleton />;
  }

  if (!finalWalletAddress) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-base font-medium text-foreground">
          We couldn&apos;t resolve a wallet for that input.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <WalletIdentityBadge
          walletAddress={finalWalletAddress}
          lookupValue={sanitizedIdentifier}
          ensName={displayEnsName}
          onCopy={handleCopy}
        />
        <Badge variant="secondary" className="rounded-full">
          {ownedDomains.length} NFT{ownedDomains.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {domainsQuery.isError ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-base font-medium text-foreground">
            We couldn&apos;t load domains for this wallet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh the page and try again.
          </p>
        </div>
      ) : ownedDomains.length === 0 && !isLoadingDomains ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-base font-medium text-foreground">
            No Namefi NFTs found for this wallet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Double-check the wallet address or ENS name, or try again later
            while indexing catches up.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
          {ownedDomains.map((nft) => {
            const { subdomain, parentDomain } = splitDomain(
              nft.normalizedDomainName,
            );
            const chain = getChain(nft.chainId);
            const chainLabel = chain?.name ?? 'Unknown network';
            const scanName = chain?.blockExplorers?.default?.name ?? 'Explorer';

            return (
              <ControlledGlareCard
                key={`${nft.normalizedDomainName}-${nft.chainId ?? 'unknown'}`}
                containerClassName="h-full"
                className="bg-transparent"
                backgroundMovement={0.6}
                glareOpacity={0.1}
                rotateIntensity={0.3}
                glareGradient={{ inner: 0.5, mid: 0.3, midStop: 25 }}
                diagonalPattern={{ spacing: 15, intensity: 0.6 }}
                rainbowEffect={{ enabled: true, intensity: 0.7 }}
              >
                <div className="flex h-full flex-col gap-3 p-3">
                  <NftDomainCard
                    item={{
                      subdomain,
                      parentDomain,
                      fullDomain: nft.normalizedDomainName,
                      tokenId: nft.tokenId,
                      chainId: nft.chainId,
                    }}
                    origin={origin}
                    isCompleted={true}
                    canViewNft={Boolean(nft.tokenId && nft.chainId)}
                    className="flex h-full flex-col"
                    showViewDomainButton={false}
                    viewNftButtonText={
                      scanName ? `View on ${scanName}` : 'View on Explorer'
                    }
                  />
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Network</span>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {nft.chainId ? (
                          <NetworkLogo
                            className="size-4"
                            network={nft.chainId}
                          />
                        ) : null}
                        {chainLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-muted-foreground">
                      <span>Expiration</span>
                      <span className="font-medium text-foreground">
                        {formatExpiration(nft)}
                      </span>
                    </div>
                  </div>
                </div>
              </ControlledGlareCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WalletNftGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WalletIdentityBadgeProps {
  walletAddress: string;
  ensName: string | null;
  lookupValue: string;
  onCopy: (value?: string | null) => void;
}

function WalletIdentityBadge({
  walletAddress,
  ensName,
  lookupValue,
  onCopy,
}: WalletIdentityBadgeProps) {
  const formattedAddress = useMemo(() => {
    const parsed = checksumWalletAddressSchema.safeParse(walletAddress);
    return parsed.success ? parsed.data : walletAddress;
  }, [walletAddress]);

  return (
    <div className="w-full md:w-auto flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <UserWalletAvatar address={formattedAddress} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Wallet
        </p>
        <AutoTruncateTextV2
          className="font-mono text-sm"
          minCharactersToDisplay={16}
          initialCharactersCountToDisplay={42}
        >
          {formattedAddress}
        </AutoTruncateTextV2>
        {ensName ? (
          <p className="text-xs text-muted-foreground">ENS: {ensName}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="rounded-md border border-white/10 p-2 text-xs hover:bg-white/5"
        onClick={() => onCopy(formattedAddress)}
      >
        <Copy className="size-4" />
      </button>
    </div>
  );
}
