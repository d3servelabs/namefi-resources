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
} from 'lucide-react';
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
import { useTranslations } from 'next-intl';
import { TransferLockGuard } from './transfer-lock-guard';

/**
 * Unified EIP-712 types for domain actions.
 * Must match the backend DOMAIN_ACTION_EIP712_TYPES.
 */
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

/**
 * Valid domain actions for EIP-712 signing.
 * Must match the backend DOMAIN_ACTIONS.
 */
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

export const DnsOverviewPanel = ({
  domain,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');
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

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>{t('overview.panelTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
          {(isInLateRenewalPeriod || isInGraceRestorationPeriod) &&
            (canAttemptRenewal ? (
              <Alert
                variant="default"
                className="col-span-2 border-amber-500/30 bg-amber-500/10 text-amber-200"
              >
                <AlertOctagon />
                <AlertTitle>{t('overview.expired.title')}</AlertTitle>
                <AlertDescription className="text-amber-200/80">
                  {t('overview.expired.canRenew')}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert
                variant="default"
                className="col-span-2 border-amber-500/30 bg-amber-500/10 text-amber-200"
              >
                <AlertOctagon />
                <AlertTitle>{t('overview.expired.title')}</AlertTitle>
                <AlertDescription className="text-amber-200/80">
                  {t('overview.expired.cannotRenew')}
                </AlertDescription>
              </Alert>
            ))}

          {canAttemptRenewal &&
            (isInLateRenewalPeriod || isInGraceRestorationPeriod ? (
              <ManualRenewalSection domain={domain} disabled={false} />
            ) : (
              <DomainRenewalSection domain={domain} disabled={false} />
            ))}

          {domainSupportedFeatures?.domainExport?.enabled && (
            <DomainExportSection
              domain={domain}
              disabled={false}
              nftChainId={nftChainId}
            />
          )}

          <PendingTransferSection domain={domain} nftChainId={nftChainId} />
        </div>
      </CardContent>
    </Card>
  );
};

export const DomainRenewalSection = ({
  domain,
  disabled,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');
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

  const handleChange =
    (key: keyof DomainPreferencesAndConfig) => async (value: any) => {
      const updatedDomainPreferencesAndConfig = {
        autoRenewEnabled:
          key === 'autoRenewEnabled'
            ? value
            : domainPreferencesAndConfig?.autoRenewEnabled,
      };

      try {
        setIsPending(true);
        const queryKey =
          trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName: domain,
          });
        await queryClient.cancelQueries({ queryKey });

        queryClient.setQueryData(queryKey, (old) => {
          if (!old) {
            return undefined;
          }
          return {
            ...old,
            ...updatedDomainPreferencesAndConfig,
          };
        });
        await trpcClient.domainConfig.updateDomainPreferencesAndConfig.mutate({
          domainName: domain,
          domainPreferencesAndConfig: updatedDomainPreferencesAndConfig,
        });
        toast.success(t('overview.preferencesUpdated'));
        await queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName: domain,
          }),
        });
        await queryClient.refetchQueries({
          queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName: domain,
          }),
        });
      } catch (_error) {
        toast.error(t('overview.preferencesUpdateFailed'));
      } finally {
        setIsPending(false);
      }
    };

  if (isDomainPreferencesAndConfigLoading || isDomainDetailsLoading) {
    return (
      <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-y-2">
      <div className="space-y-0.5">
        <Label htmlFor="auto-renew">{t('overview.autoRenew.label')}</Label>
        <p className="text-sm text-muted-foreground">
          {t('overview.autoRenew.description')}
        </p>
        {domainDetails?.expirationTime && !isDomainDetailsLoading ? (
          <p className="text-xs text-zinc-400">
            {t('overview.autoRenew.expires', {
              date: new Date(domainDetails.expirationTime).toLocaleDateString(),
            })}
          </p>
        ) : isDomainDetailsLoading ? (
          <Skeleton className="h-3 w-24" />
        ) : null}
      </div>
      <div className="sm:hidden block items-center gap-3">
        <Switch
          id="auto-renew"
          className={cn(isPending ? 'animate-pulse cursor-progress' : '')}
          checked={domainPreferencesAndConfig?.autoRenewEnabled}
          disabled={disableAllButtons || isPending}
          onCheckedChange={handleChange('autoRenewEnabled')}
        />
      </div>
      <div className="flex items-center gap-3 sm:w-auto w-full">
        <RenewDomainButton
          domain={domain}
          disabled={disableAllButtons}
          isPending={isPending}
          className="w-full sm:w-auto"
        />
        <Switch
          id="auto-renew"
          className={cn(
            'hidden sm:block',
            isPending ? 'animate-pulse cursor-progress' : '',
          )}
          checked={domainPreferencesAndConfig?.autoRenewEnabled}
          disabled={disableAllButtons || isPending}
          onCheckedChange={handleChange('autoRenewEnabled')}
        />
      </div>
    </div>
  );
};

export const ManualRenewalSection = ({
  domain,
  disabled,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');

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
      <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="space-y-0.5">
        <Label htmlFor="manual-renew">{t('overview.manualRenew.label')}</Label>
        <p className="text-sm text-muted-foreground">
          {t('overview.manualRenew.description')}
        </p>
        {domainDetails?.expirationTime && !isDomainDetailsLoading ? (
          <p className="text-xs text-zinc-400">
            {t('overview.autoRenew.expires', {
              date: new Date(domainDetails.expirationTime).toLocaleDateString(),
            })}
          </p>
        ) : isDomainDetailsLoading ? (
          <Skeleton className="h-3 w-24" />
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <RenewDomainButton
          domain={domain}
          disabled={disableAllButtons}
          isPending={false}
        />
      </div>
    </div>
  );
};

export const RenewDomainButton = ({
  domain,
  disabled,
  isPending,
  className,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
  isPending: boolean;
  className?: string;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');
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
          toast.error(t('overview.renewExpirationUnavailable'));
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
      className={className}
    >
      {t('overview.renewNow')}
    </AsyncButton>
  );
};

export const DomainExportSection = ({
  domain,
  disabled,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { signTypedData } = useSignTypedData();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const { address: activeWalletAddress } = useAccount();

  const [isRequestingExport, setIsRequestingExport] = useState(false);
  const [isFetchingAuthCode, setIsFetchingAuthCode] = useState(false);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const authCodeWalletConnectionRef = useRef<RequestWalletConnectionRef>(null);

  // Fetch the owner wallet address for this domain's NFT
  const { data: ownerWalletData } = useQuery(
    trpc.domainConfig.getDomainOwnerWallet.queryOptions({
      domainName: domain,
    }),
  );

  const handleRequestExportInner = async () => {
    try {
      setIsRequestingExport(true);
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
        return;
      }

      // Sign the payload with EIP-712 using unified domain action type
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
        walletAddress: ownerWalletAddress,
      });

      await trpcClient.domainConfig.requestDomainExport.mutate({
        signature,
        payload,
      });
      toast.success(t('overview.exportToasts.requestSubmitted'));
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getDomainExportDetails.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error(t('overview.exportToasts.signatureRejected'));
      } else {
        toast.error(t('overview.exportToasts.requestFailed'));
      }
    } finally {
      setIsRequestingExport(false);
    }
  };

  const handleRequestExport = async () => {
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
      return;
    }
    if (activeWalletAddress !== ownerWalletAddress) {
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleRequestExportInner();
  };

  const handleGetAuthCodeInner = async () => {
    setIsFetchingAuthCode(true);

    try {
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
        return;
      }

      // Sign the payload with EIP-712 using unified domain action type
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
          walletAddress: ownerWalletAddress,
        });
      } catch (error) {
        console.error(error);
        toast.error(t('overview.exportToasts.signatureFailed'));
        setIsFetchingAuthCode(false);
        return;
      }
      const result = await trpcClient.domainConfig.getAuthCode.mutate({
        signature,
        payload,
      });
      setAuthCode(result.authCode);
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error(t('overview.exportToasts.signatureRejected'));
      } else {
        toast.error(t('overview.exportToasts.authCodeFailed'));
      }
    } finally {
      setIsFetchingAuthCode(false);
    }
  };

  const handleGetAuthCode = async () => {
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
      return;
    }
    if (activeWalletAddress !== ownerWalletAddress) {
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
        toast.success(t('overview.exportToasts.authCodeCopied'));
      } catch (error) {
        toast.error(t('overview.exportToasts.authCodeCopyFailed'));
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
      <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (isNil(domainExportDetails)) {
    return (
      <div className="text-center py-12">
        {t('overview.export.loadDetailsFailed')}
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

      <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-y-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="domain-export">{t('overview.export.label')}</Label>
            {!domainExportDetails.supportsExport && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-flex h-4 w-4 text-zinc-500 cursor-help" />
                    }
                  >
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{domainExportDetails.message}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t('overview.export.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          {!domainExportDetails.supportsExport ? (
            <Button
              disabled
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 me-2" />
              {t('overview.export.exportUnavailable')}
            </Button>
          ) : domainExportDetails.pendingRequestToEnableExport ? (
            <Button disabled className="w-full sm:w-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('overview.export.enableRequestPending')}</span>
            </Button>
          ) : domainExportDetails.readyToExport ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {authCode ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded border text-sm font-mono">
                  <span className="text-green-400">{authCode}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAuthCode}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleGetAuthCode}
                  disabled={isFetchingAuthCode}
                  className="w-full sm:w-auto"
                >
                  {isFetchingAuthCode ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 me-2" />
                  )}
                  {t('overview.export.getAuthCode')}
                </Button>
              )}
            </div>
          ) : (
            <TransferLockGuard domainExportDetails={domainExportDetails}>
              <AsyncButton
                onClick={handleRequestExport}
                disabled={disabled || isRequestingExport}
                loadingText={t('overview.export.requestingExport')}
                loadingIcon={<Loader2 className="h-4 w-4 animate-spin me-2" />}
                size="sm"
                className="w-full sm:w-auto"
              >
                <ExternalLink className="h-4 w-4 me-2" />
                {t('overview.export.requestExport')}
              </AsyncButton>
            </TransferLockGuard>
          )}
        </div>
      </div>
    </>
  );
};

export const PendingTransferSection = ({
  domain,
  nftChainId,
}: {
  domain: NamefiNormalizedDomain;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();
  const t = useTranslations('dnsManagement');
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { signTypedData } = useSignTypedData();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const { address: activeWalletAddress } = useAccount();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  // Track which action to perform after wallet connection: 'approve' or 'reject'
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

  // Fetch the owner wallet address for this domain's NFT
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
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
        return;
      }

      // Sign the payload with EIP-712 using unified domain action type
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
        walletAddress: ownerWalletAddress,
      });

      await trpcClient.domainConfig.approveTransfer.mutate({
        signature,
        payload,
      });
      toast.success(t('overview.pendingTransfer.approveSuccess'));
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getPendingTransfer.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error(t('overview.exportToasts.signatureRejected'));
      } else {
        toast.error(t('overview.pendingTransfer.approveFailed'));
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectInner = async () => {
    try {
      setIsRejecting(true);
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
        return;
      }

      // Sign the payload with EIP-712 using unified domain action type
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
        walletAddress: ownerWalletAddress,
      });

      await trpcClient.domainConfig.rejectTransfer.mutate({
        signature,
        payload,
      });
      toast.success(t('overview.pendingTransfer.rejectSuccess'));
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getPendingTransfer.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        toast.error(t('overview.exportToasts.signatureRejected'));
      } else {
        toast.error(t('overview.pendingTransfer.rejectFailed'));
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
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
      return;
    }
    if (activeWalletAddress !== ownerWalletAddress) {
      pendingAction.current = 'approve';
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleApproveInner();
  };

  const handleReject = async () => {
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error(t('overview.exportToasts.ownerWalletUnavailable'));
      return;
    }
    if (activeWalletAddress !== ownerWalletAddress) {
      pendingAction.current = 'reject';
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleRejectInner();
  };

  // Don't render anything if loading or no pending transfer
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
      <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-amber-600 p-4 gap-y-2 col-span-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            <Label htmlFor="pending-export" className="text-amber-500">
              {t('overview.pendingTransfer.label')}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('overview.pendingTransfer.requestedBy', {
              registrar: pendingTransfer.requestingRegistrarId,
            })}
          </p>
          <p className="text-xs text-zinc-400">
            {t('overview.pendingTransfer.actionRequiredBy', {
              date: new Date(pendingTransfer.actionDate).toLocaleDateString(),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <AsyncButton
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            size="sm"
            variant="default"
            className="w-full sm:w-auto"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Check className="h-4 w-4 me-2" />
            )}
            {t('overview.pendingTransfer.approve')}
          </AsyncButton>
          <AsyncButton
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            size="sm"
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <X className="h-4 w-4 me-2" />
            )}
            {t('overview.pendingTransfer.reject')}
          </AsyncButton>
        </div>
      </div>
    </>
  );
};
