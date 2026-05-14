'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { useDomainRenewal } from '@/hooks/use-domain-renewal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { cn } from '@namefi-astra/ui/lib/cn';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/lib/trpc';
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { isNil } from 'ramda';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import {
  Copy,
  Info,
  ExternalLink,
  Loader2,
  AlertOctagon,
  ArrowRightLeft,
  Check,
  X,
  Calendar,
  RefreshCw,
  Shield,
  Globe,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  FileCheck,
} from 'lucide-react';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import { getShortAddress } from '@/lib/string';
import {
  getNftExplorerUrl,
  getTokenIdFromDomainName,
} from '@namefi-astra/utils/nft-hash';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@namefi-astra/ui/components/shadcn/alert';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useAccount } from 'wagmi';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { TransferLockGuard } from './transfer-lock-guard';

const DOMAIN_ACTION_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  DomainAction: [
    { name: 'domainName', type: 'string' },
    { name: 'action', type: 'string' },
    { name: 'payload', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

const DOMAIN_ACTIONS = {
  APPROVE_EXPORT: 'APPROVE_EXPORT',
  REJECT_EXPORT: 'REJECT_EXPORT',
  ENABLE_EXPORT: 'ENABLE_EXPORT',
  CHANGE_NAMESERVERS: 'CHANGE_NAMESERVERS',
  RESET_NAMESERVERS: 'RESET_NAMESERVERS',
  GET_AUTH_CODE: 'GET_AUTH_CODE',
} as const;

type DomainPreferencesAndConfig =
  AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Sign-aware day diff: any past instant maps to a negative day count, any
// future instant to a positive one. Avoids `Math.ceil(-0.5) === 0` flipping
// recently-expired domains into "Expires today".
function diffDaysSigned(date: Date, now: Date): number {
  const diffMs = date.getTime() - now.getTime();
  return diffMs >= 0
    ? Math.ceil(diffMs / MS_PER_DAY)
    : Math.floor(diffMs / MS_PER_DAY);
}

function formatExpirationDate(date: Date): string {
  const diffDays = diffDaysSigned(date, new Date());

  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} days ago`;
  }
  if (diffDays === 0) {
    return 'Expires today';
  }
  if (diffDays === 1) {
    return 'Expires tomorrow';
  }
  if (diffDays <= 30) {
    return `Expires in ${diffDays} days`;
  }
  if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    return `Expires in ${months} month${months > 1 ? 's' : ''}`;
  }
  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);
  if (remainingMonths > 0) {
    return `Expires in ${years}y ${remainingMonths}m`;
  }
  return `Expires in ${years} year${years > 1 ? 's' : ''}`;
}

function getExpirationStatus(
  date: Date,
): 'expired' | 'critical' | 'warning' | 'good' {
  const diffDays = diffDaysSigned(date, new Date());

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'critical';
  if (diffDays <= 90) return 'warning';
  return 'good';
}

// EVM addresses are case-insensitive; wagmi and backend may return different
// checksum casings, so always normalize before comparing.
function isSameAddress(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

function InfoTooltip({
  content,
  learnMoreUrl,
}: {
  content: string;
  learnMoreUrl?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="More information"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            />
          }
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-primary hover:underline mt-1 inline-block"
            >
              Learn more
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function EducationalBanner({
  title,
  description,
  icon: Icon,
  onDismiss,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onDismiss?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative rounded-xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-primary/10">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function NFTOwnershipCard({
  chainId,
  tokenId,
  ownerAddress,
  explorerUrl,
  isLoading,
}: {
  chainId: number;
  tokenId: string | null;
  ownerAddress: string | null;
  explorerUrl: string | null;
  isLoading: boolean;
}) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);

  const handleCopyAddress = async () => {
    if (!ownerAddress) return;
    try {
      await navigator.clipboard.writeText(ownerAddress);
      setCopiedAddress(true);
      toast.success('Wallet address copied');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error('Failed to copy wallet address');
    }
  };

  const handleCopyTokenId = async () => {
    if (!tokenId) return;
    try {
      await navigator.clipboard.writeText(tokenId);
      setCopiedTokenId(true);
      toast.success('Token ID copied');
      setTimeout(() => setCopiedTokenId(false), 2000);
    } catch {
      toast.error('Failed to copy token ID');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-zinc-900/50 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-medium">
              Blockchain Ownership
            </CardTitle>
          </div>
          <InfoTooltip content="Your domain is stored as an NFT (Non-Fungible Token) on the blockchain. This digital certificate proves you own this domain and is secured by cryptography." />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-3">
            <NetworkLogo network={chainId} className="size-8" />
            <div>
              <p className="text-xs text-muted-foreground">Secured on</p>
              <p className="text-sm font-medium">
                {chainId === 1
                  ? 'Ethereum'
                  : chainId === 8453
                    ? 'Base'
                    : `Chain ${chainId}`}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          >
            <Lock className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>

        {ownerAddress && (
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserWalletAvatar
                  address={ownerAddress}
                  className="size-8 rounded-full"
                />
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Owner Wallet
                    <InfoTooltip content="This is the wallet address that owns this domain NFT. Only this wallet can manage or transfer the domain." />
                  </p>
                  <p className="text-sm font-mono">
                    {getShortAddress(ownerAddress)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-8 w-8 p-0"
              >
                {copiedAddress ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {tokenId && (
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Token ID
                  <InfoTooltip content="A unique identifier for your domain NFT on the blockchain. Think of it like a serial number for your digital asset." />
                </p>
                <p className="text-sm font-mono">
                  {tokenId.length > 12
                    ? `${tokenId.slice(0, 6)}...${tokenId.slice(-4)}`
                    : tokenId}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTokenId}
                className="h-8 w-8 p-0"
              >
                {copiedTokenId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {explorerUrl && (
          <Button
            variant="outline"
            className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50"
            render={
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                <FileCheck className="h-4 w-4 mr-2" />
                Verify on Block Explorer
                <ExternalLink className="h-3.5 w-3.5 ml-auto" />
              </a>
            }
            nativeButton={false}
          />
        )}
      </CardContent>
    </Card>
  );
}

function Web3ConceptsCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  const concepts = [
    {
      term: 'NFT',
      forTraditional:
        'A digital certificate of ownership stored in your wallet - like a deed to a house',
      forWeb3: 'ERC-721 token representing domain ownership on-chain',
    },
    {
      term: 'Blockchain',
      forTraditional:
        'A secure digital ledger that permanently records your ownership',
      forWeb3: 'Decentralized network (Ethereum/Base) securing your asset',
    },
    {
      term: 'Wallet',
      forTraditional: 'Your personal digital vault - only you can access it',
      forWeb3: 'EOA or smart contract holding your domain NFT',
    },
    {
      term: 'ICANN',
      forTraditional: 'The global authority managing .com, .io, .xyz domains',
      forWeb3:
        'Traditional DNS registry - NameFi bridges ICANN domains to NFTs',
    },
  ];

  return (
    <Card className="border-0 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Understanding Your Domain
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-3">
            {concepts.map((concept) => (
              <div
                key={concept.term}
                className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30"
              >
                <p className="text-xs font-semibold text-brand-primary mb-1">
                  {concept.term}
                </p>
                <p className="text-xs text-muted-foreground">
                  {concept.forTraditional}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            NameFi bridges traditional domains with blockchain ownership
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export const DomainOverviewPanel = ({
  domain,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const {
    data: {
      features: domainSupportedFeatures,
      isInLateRenewalPeriod,
      isInGraceRestorationPeriod,
      canAttemptRenewal,
    },
  } = useSuspenseQuery(
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions(
      {
        normalizedDomainName: domain,
      },
      {
        refetchInterval: 10000,
      },
    ),
  );

  const { data: domainDetails, isLoading: isDomainDetailsLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions(
      {
        domainName: domain,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const { data: ownerWalletData } = useQuery(
    trpc.domainConfig.getDomainOwnerWallet.queryOptions({
      domainName: domain,
    }),
  );

  const expirationDate = domainDetails?.expirationTime
    ? new Date(domainDetails.expirationTime)
    : null;
  const expirationStatus = expirationDate
    ? getExpirationStatus(expirationDate)
    : 'good';

  const chainIdNumber =
    typeof nftChainId === 'bigint' ? Number(nftChainId) : nftChainId;
  const tokenId = getTokenIdFromDomainName(domain);
  const explorerUrl = getNftExplorerUrl(chainIdNumber, tokenId);
  const ownerAddress = ownerWalletData?.ownerWalletAddress ?? null;

  return (
    <div className="space-y-6">
      <EducationalBanner
        icon={Sparkles}
        title="Your domain is secured on the blockchain"
        description="Unlike traditional registrars, your domain is stored as an NFT in your wallet. This means you truly own it - no company can take it away without your permission."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 border border-brand-primary/20">
                    <Globe className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Domain Overview
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage your domain settings and renewal
                    </p>
                  </div>
                </div>
                {expirationDate && !isDomainDetailsLoading && (
                  <ExpirationBadge
                    date={expirationDate}
                    status={expirationStatus}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="relative pt-4">
              {(isInLateRenewalPeriod || isInGraceRestorationPeriod) && (
                <Alert
                  variant="default"
                  className="mb-6 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-200"
                >
                  <AlertOctagon className="h-5 w-5" />
                  <AlertTitle className="font-semibold">
                    Domain Expired
                  </AlertTitle>
                  <AlertDescription className="text-amber-200/80">
                    {canAttemptRenewal
                      ? 'Your domain has expired. You can still submit a request to renew the domain and it might go through depending on the TLD (.com, .org, ...)'
                      : 'Your domain has expired. Contact support to check if it can be restored (this might not be possible for all TLDs).'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canAttemptRenewal &&
                  (isInLateRenewalPeriod || isInGraceRestorationPeriod ? (
                    <ManualRenewalCard domain={domain} disabled={false} />
                  ) : (
                    <DomainRenewalCard domain={domain} disabled={false} />
                  ))}

                {domainSupportedFeatures?.domainExport?.enabled && (
                  <DomainExportCard
                    domain={domain}
                    disabled={false}
                    nftChainId={nftChainId}
                  />
                )}

                <PendingTransferCard domain={domain} nftChainId={nftChainId} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <NFTOwnershipCard
            chainId={chainIdNumber}
            tokenId={tokenId}
            ownerAddress={ownerAddress}
            explorerUrl={explorerUrl}
            isLoading={!ownerWalletData}
          />

          <Web3ConceptsCard />
        </div>
      </div>
    </div>
  );
};

function ExpirationBadge({
  date,
  status,
}: {
  date: Date;
  status: 'expired' | 'critical' | 'warning' | 'good';
}) {
  const statusConfig = {
    expired: {
      className:
        'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
      icon: AlertOctagon,
    },
    critical: {
      className:
        'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
      icon: Clock,
    },
    warning: {
      className:
        'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
      icon: Calendar,
    },
    good: {
      className:
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
      icon: Check,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-3 py-1.5 text-xs font-medium transition-colors',
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {formatExpirationDate(date)}
    </Badge>
  );
}

function FeatureCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
  className,
  highlight,
}: {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80',
        highlight && 'border-amber-600 hover:border-amber-500',
        className,
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 transition-colors group-hover:border-zinc-600/50',
                highlight && 'bg-amber-500/10 border-amber-500/30',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 text-zinc-400 group-hover:text-zinc-300 transition-colors',
                  highlight && 'text-amber-500',
                  iconClassName,
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-zinc-200">
                {title}
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">{children}</div>
      </div>
    </div>
  );
}

export const DomainRenewalCard = ({
  domain,
  disabled,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
}) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const {
    data: domainPreferencesAndConfig,
    isLoading: isDomainPreferencesAndConfigLoading,
  } = useQuery(
    trpc.domainConfig.getDomainPreferencesAndConfig.queryOptions(
      {
        domainName: domain,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const { data: domainDetails, isLoading: isDomainDetailsLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions(
      {
        domainName: domain,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const disableAllButtons = useMemo(() => {
    return (
      isDomainPreferencesAndConfigLoading || isDomainDetailsLoading || disabled
    );
  }, [isDomainPreferencesAndConfigLoading, isDomainDetailsLoading, disabled]);

  const [isPending, setIsPending] = useState(false);

  const handleAutoRenewChange = async (value: boolean) => {
    const updatedDomainPreferencesAndConfig = {
      autoRenewEnabled: value,
    };

    try {
      setIsPending(true);
      const queryKey = trpc.domainConfig.getDomainPreferencesAndConfig.queryKey(
        {
          domainName: domain,
        },
      );
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          autoRenewEnabled: value,
        };
      });
      await trpcClient.domainConfig.updateDomainPreferencesAndConfig.mutate({
        domainName: domain,
        domainPreferencesAndConfig: updatedDomainPreferencesAndConfig,
      });
      toast.success('Preferences updated');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
          domainName: domain,
        }),
      });
    } catch (_error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsPending(false);
    }
  };

  if (isDomainPreferencesAndConfigLoading || isDomainDetailsLoading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  const expirationDate = domainDetails?.expirationTime
    ? new Date(domainDetails.expirationTime)
    : null;

  return (
    <FeatureCard
      icon={RefreshCw}
      iconClassName={
        domainPreferencesAndConfig?.autoRenewEnabled
          ? 'text-emerald-400'
          : undefined
      }
      title="Auto Renewal"
      description={
        expirationDate
          ? `${formatExpirationDate(expirationDate)} - ${expirationDate.toLocaleDateString()}`
          : 'Automatically renew your domain before expiration'
      }
    >
      <RenewDomainButton
        domain={domain}
        disabled={disableAllButtons}
        isPending={isPending}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Auto</span>
        <Switch
          id="auto-renew"
          className={cn(isPending ? 'animate-pulse cursor-progress' : '')}
          checked={domainPreferencesAndConfig?.autoRenewEnabled}
          disabled={disableAllButtons || isPending}
          onCheckedChange={handleAutoRenewChange}
        />
      </div>
    </FeatureCard>
  );
};

export const ManualRenewalCard = ({
  domain,
  disabled,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
}) => {
  const trpc = useTRPC();

  const { data: domainDetails, isLoading: isDomainDetailsLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions(
      {
        domainName: domain,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const disableAllButtons = useMemo(() => {
    return isDomainDetailsLoading || disabled;
  }, [isDomainDetailsLoading, disabled]);

  if (isDomainDetailsLoading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  const expirationDate = domainDetails?.expirationTime
    ? new Date(domainDetails.expirationTime)
    : null;

  return (
    <FeatureCard
      icon={RefreshCw}
      title="Manual Renewal"
      description={
        expirationDate
          ? `${formatExpirationDate(expirationDate)} - Renew now to restore your domain`
          : 'Renew your domain manually'
      }
    >
      <RenewDomainButton
        domain={domain}
        disabled={disableAllButtons}
        isPending={false}
      />
    </FeatureCard>
  );
};

export const RenewDomainButton = ({
  domain,
  disabled,
  isPending,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
  isPending: boolean;
}) => {
  const trpc = useTRPC();
  const { renewDomains } = useDomainRenewal();

  const { data: domainDetails, isLoading: isDomainDetailsLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions(
      {
        domainName: domain,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  return (
    <AsyncButton
      onClick={async () => {
        if (!domainDetails?.expirationTime) {
          toast.error('Domain expiration information not available');
          return;
        }

        await renewDomains([
          {
            normalizedDomainName: domain,
            expirationDate: new Date(domainDetails.expirationTime),
          },
        ]);
      }}
      disabled={
        disabled ||
        isPending ||
        isDomainDetailsLoading ||
        !domainDetails?.expirationTime
      }
      size="sm"
      className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 hover:border-brand-primary/50 transition-all"
    >
      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
      Renew now
    </AsyncButton>
  );
};

export const DomainExportCard = ({
  domain,
  disabled,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { signTypedData } = useSignTypedData();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const { address: activeWalletAddress } = useAccount();

  const [isRequestingExport, setIsRequestingExport] = useState(false);
  const [isFetchingAuthCode, setIsFetchingAuthCode] = useState(false);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const authCodeWalletConnectionRef = useRef<RequestWalletConnectionRef>(null);

  const { data: ownerWalletData } = useQuery(
    trpc.domainConfig.getDomainOwnerWallet.queryOptions({
      domainName: domain,
    }),
  );

  const handleRequestExportInner = async () => {
    try {
      setIsRequestingExport(true);

      const timestamp = Math.floor(Date.now() / 1000);
      const payload = {
        domainName: domain,
        action: DOMAIN_ACTIONS.ENABLE_EXPORT,
        payload: '',
        message: `Enable export for ${domain}. This will prepare your domain to be transferred to another registrar.`,
        timestamp,
      };
      const signature = await signTypedData({
        types: DOMAIN_ACTION_EIP712_TYPES,
        primaryType: 'DomainAction',
        message: payload,
        chainId: nftChainId,
      });

      await trpcClient.domainConfig.requestDomainExport.mutate({
        signature,
        payload,
      });
      toast.success('Export request submitted successfully');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getDomainExportDetails.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to request domain export');
      }
    } finally {
      setIsRequestingExport(false);
    }
  };

  const handleRequestExport = async () => {
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error('Unable to determine domain owner wallet');
      return;
    }
    if (!isSameAddress(activeWalletAddress, ownerWalletAddress)) {
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleRequestExportInner();
  };

  const handleGetAuthCodeInner = async () => {
    setIsFetchingAuthCode(true);
    setAuthCode(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = {
        domainName: domain,
        action: DOMAIN_ACTIONS.GET_AUTH_CODE,
        payload: '',
        message: `Retrieve auth code for ${domain}. This code is required to transfer your domain to another registrar.`,
        timestamp,
      };
      let signature: string;
      try {
        signature = await signTypedData({
          types: DOMAIN_ACTION_EIP712_TYPES,
          primaryType: 'DomainAction',
          message: payload,
          chainId: nftChainId,
        });
      } catch (error) {
        console.error(error);
        toast.error(
          'Failed to request signature. This could be due to a browser error or a problem with your wallet.',
        );
        setIsFetchingAuthCode(false);
        return;
      }
      const result = await trpcClient.domainConfig.getAuthCode.mutate({
        signature,
        payload,
      });
      setAuthCode(result.authCode);
    } catch (error) {
      setAuthCode(null);
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to get auth code');
      }
    } finally {
      setIsFetchingAuthCode(false);
    }
  };

  const handleGetAuthCode = async () => {
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error('Unable to determine domain owner wallet');
      return;
    }
    if (!isSameAddress(activeWalletAddress, ownerWalletAddress)) {
      authCodeWalletConnectionRef.current?.requestWalletConnection(
        ownerWalletAddress,
      );
      return;
    }
    return handleGetAuthCodeInner();
  };

  const handleCopyAuthCode = async () => {
    if (authCode) {
      try {
        await navigator.clipboard.writeText(authCode);
        toast.success('Auth code copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy auth code');
      }
    }
  };

  const { data: domainExportDetails, isLoading: isDomainExportDetailsLoading } =
    useQuery(
      trpc.domainConfig.getDomainExportDetails.queryOptions(
        {
          domainName: domain,
        },
        {
          refetchInterval: 8_000,
        },
      ),
    );

  if (isDomainExportDetailsLoading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  if (isNil(domainExportDetails)) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center">
        <p className="text-sm text-red-400">
          Failed to load export details. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <>
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleRequestExportInner}
        actionDescription="to enable domain export"
      />
      <RequestWalletConnection
        ref={authCodeWalletConnectionRef}
        onRequestedWalletConnected={handleGetAuthCodeInner}
        actionDescription="to get the auth code"
      />
      <FeatureCard
        icon={ExternalLink}
        title="Domain Export"
        description={
          domainExportDetails.supportsExport
            ? 'Transfer your domain to another registrar'
            : (domainExportDetails.message ??
              'Export not available for this domain')
        }
      >
        {!domainExportDetails.supportsExport ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    disabled
                    size="sm"
                    variant="secondary"
                    className="opacity-50"
                  >
                    <Info className="h-3.5 w-3.5 mr-1.5" />
                    Unavailable
                  </Button>
                }
              />
              <TooltipContent>
                <p>{domainExportDetails.message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : domainExportDetails.pendingRequestToEnableExport ? (
          <Button disabled size="sm" className="animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Pending...
          </Button>
        ) : domainExportDetails.readyToExport ? (
          authCode ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <span className="text-sm font-mono text-emerald-400">
                {authCode}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyAuthCode}
                className="h-6 w-6 p-0 hover:bg-emerald-500/20"
              >
                <Copy className="h-3 w-3 text-emerald-400" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleGetAuthCode}
              disabled={isFetchingAuthCode}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50"
            >
              {isFetchingAuthCode ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Shield className="h-3.5 w-3.5 mr-1.5" />
              )}
              Get Auth Code
            </Button>
          )
        ) : (
          <TransferLockGuard domainExportDetails={domainExportDetails}>
            <AsyncButton
              onClick={handleRequestExport}
              disabled={disabled || isRequestingExport}
              loadingText="Requesting..."
              loadingIcon={
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              }
              size="sm"
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-100"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Request Export
            </AsyncButton>
          </TransferLockGuard>
        )}
      </FeatureCard>
    </>
  );
};

export const PendingTransferCard = ({
  domain,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { signTypedData } = useSignTypedData();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const { address: activeWalletAddress } = useAccount();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const pendingAction = useRef<'approve' | 'reject' | null>(null);

  const { data: pendingTransfer, isLoading: isPendingTransferLoading } =
    useQuery(
      trpc.domainConfig.getPendingTransfer.queryOptions(
        {
          domainName: domain,
        },
        {
          refetchInterval: 10_000,
          retry: 1,
        },
      ),
    );

  const { data: ownerWalletData } = useQuery(
    trpc.domainConfig.getDomainOwnerWallet.queryOptions(
      {
        domainName: domain,
      },
      {
        enabled: !!pendingTransfer && pendingTransfer.status === 'pending',
      },
    ),
  );

  const handleApproveInner = async () => {
    try {
      setIsApproving(true);

      const timestamp = Math.floor(Date.now() / 1000);
      const payload = {
        domainName: domain,
        action: DOMAIN_ACTIONS.APPROVE_EXPORT,
        payload: '',
        message: `Approve transfer of ${domain} to another registrar. This action cannot be undone.`,
        timestamp,
      };
      const signature = await signTypedData({
        types: DOMAIN_ACTION_EIP712_TYPES,
        primaryType: 'DomainAction',
        message: payload,
        chainId: nftChainId,
      });

      await trpcClient.domainConfig.approveTransfer.mutate({
        signature,
        payload,
      });
      toast.success('Export approved successfully');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getPendingTransfer.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to approve export');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectInner = async () => {
    try {
      setIsRejecting(true);

      const timestamp = Math.floor(Date.now() / 1000);
      const payload = {
        domainName: domain,
        action: DOMAIN_ACTIONS.REJECT_EXPORT,
        payload: '',
        message: `Reject transfer of ${domain}. The pending transfer request will be cancelled.`,
        timestamp,
      };
      const signature = await signTypedData({
        types: DOMAIN_ACTION_EIP712_TYPES,
        primaryType: 'DomainAction',
        message: payload,
        chainId: nftChainId,
      });

      await trpcClient.domainConfig.rejectTransfer.mutate({
        signature,
        payload,
      });
      toast.success('Export rejected successfully');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getPendingTransfer.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error('Failed to reject export');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleWalletConnected = async () => {
    if (pendingAction.current === 'approve') {
      await handleApproveInner();
    } else if (pendingAction.current === 'reject') {
      await handleRejectInner();
    }
    pendingAction.current = null;
  };

  const handleApprove = async () => {
    if (isApproving || isRejecting) return;
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error('Unable to determine domain owner wallet');
      return;
    }
    if (!isSameAddress(activeWalletAddress, ownerWalletAddress)) {
      // Set the loading flag before opening the wallet-connect dialog so the
      // sibling button is disabled and a second click can't overwrite
      // `pendingAction.current` mid-connection. NOTE: if the user cancels the
      // wallet dialog this stays true until next mount — `RequestWalletConnection`
      // does not currently expose a cancel callback. Tracked as follow-up.
      setIsApproving(true);
      pendingAction.current = 'approve';
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleApproveInner();
  };

  const handleReject = async () => {
    if (isApproving || isRejecting) return;
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error('Unable to determine domain owner wallet');
      return;
    }
    if (!isSameAddress(activeWalletAddress, ownerWalletAddress)) {
      setIsRejecting(true);
      pendingAction.current = 'reject';
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleRejectInner();
  };

  if (isPendingTransferLoading) {
    return null;
  }

  if (!pendingTransfer || pendingTransfer.status !== 'pending') {
    return null;
  }

  return (
    <>
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription="to manage the domain export"
      />
      <FeatureCard
        icon={ArrowRightLeft}
        iconClassName="text-amber-500"
        title="Pending Export Request"
        description={`Requested by: ${pendingTransfer.requestingRegistrarId} - Action required by ${new Date(pendingTransfer.actionDate).toLocaleDateString()}`}
        highlight
        className="lg:col-span-2"
      >
        <AsyncButton
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          size="sm"
          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50"
        >
          {isApproving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1.5" />
          )}
          Approve
        </AsyncButton>
        <AsyncButton
          onClick={handleReject}
          disabled={isApproving || isRejecting}
          size="sm"
          variant="destructive"
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50"
        >
          {isRejecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <X className="h-3.5 w-3.5 mr-1.5" />
          )}
          Reject
        </AsyncButton>
      </FeatureCard>
    </>
  );
};
