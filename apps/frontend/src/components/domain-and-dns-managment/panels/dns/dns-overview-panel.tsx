'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { useDomainRenewal } from '@/hooks/use-domain-renewal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Switch } from '@/components/ui/shadcn/switch';
import { cn } from '@/lib/cn';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/lib/trpc';
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { isNil } from 'ramda';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  Copy,
  Info,
  ExternalLink,
  Loader2,
  Terminal,
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
} from '@/components/ui/shadcn/tooltip';
import { Button } from '@/components/ui/shadcn/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useAccount } from 'wagmi';

/**
 * EIP-712 types for approving a domain export.
 * Must match the backend APPROVE_EXPORT_EIP712_TYPES.
 */
const APPROVE_EXPORT_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  ApproveExport: [{ name: 'domainName', type: 'string' }],
};

type DomainPreferencesAndConfig =
  AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];

export const DnsOverviewPanel = ({
  domain,
}: {
  domain: NamefiNormalizedDomain;
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

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>Domain Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
          {(isInLateRenewalPeriod || isInGraceRestorationPeriod) &&
            (canAttemptRenewal ? (
              <Alert variant="warning" className="col-span-2">
                <AlertOctagon />
                <AlertTitle>Domain Expired</AlertTitle>
                <AlertDescription>
                  Your domain has expired. You can still submit a request to
                  renew the domain and it might go through depending on the
                  TLD(.com, .org, ...)
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning" className="col-span-2">
                <AlertOctagon />
                <AlertTitle>Domain Expired</AlertTitle>
                <AlertDescription>
                  Your domain has expired. You can contact support to check if
                  it can be restored (this might not be possible for all
                  TLDs(.com, .org, ...))
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
            <DomainExportSection domain={domain} disabled={false} />
          )}

          <PendingTransferSection domain={domain} />
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
      <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-y-2">
      <div className="space-y-0.5">
        <Label htmlFor="auto-renew">Auto Renew</Label>
        <p className="text-sm text-muted-foreground">
          Automatically renew the domain
        </p>
        {domainDetails?.expirationTime && !isDomainDetailsLoading ? (
          <p className="text-xs text-zinc-400">
            Expires:{' '}
            {new Date(domainDetails.expirationTime).toLocaleDateString()}
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
        <Label htmlFor="manual-renew">Manual Renew</Label>
        <p className="text-sm text-muted-foreground">
          Renew the domain manually
        </p>
        {domainDetails?.expirationTime && !isDomainDetailsLoading ? (
          <p className="text-xs text-zinc-400">
            Expires:{' '}
            {new Date(domainDetails.expirationTime).toLocaleDateString()}
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
      className={className}
    >
      Renew now
    </AsyncButton>
  );
};

export const DomainExportSection = ({
  domain,
  disabled,
}: {
  domain: NamefiNormalizedDomain;
  disabled: boolean;
}) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const [isRequestingExport, setIsRequestingExport] = useState(false);

  const handleRequestExport = async () => {
    try {
      setIsRequestingExport(true);
      await trpcClient.domainConfig.requestDomainExport.mutate({
        domainName: domain,
      });
      toast.success('Export request submitted successfully');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getDomainExportDetails.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      toast.error('Failed to request domain export');
    } finally {
      setIsRequestingExport(false);
    }
  };

  const handleCopyAuthCode = async () => {
    if (authCode?.authCode) {
      try {
        await navigator.clipboard.writeText(authCode.authCode);
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

  const [fetchAuthCode, setFetchAuthCode] = useState(false);
  const { data: authCode, isLoading: isAuthCodeLoading } = useQuery(
    trpc.domainConfig.getAuthCode.queryOptions(
      {
        domainName: domain,
      },
      {
        enabled: fetchAuthCode && domainExportDetails?.readyToExport,
        refetchInterval: false,
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
        Something went wrong with fetching domain export details! Please try
        again later.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-y-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label htmlFor="domain-export">Domain Export</Label>
          {!domainExportDetails.supportsExport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{domainExportDetails.message}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Export domain to another registrar
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
            <ExternalLink className="h-4 w-4 mr-2" />
            Export Unavailable
          </Button>
        ) : domainExportDetails.pendingRequestToEnableExport ? (
          <Button disabled className="w-full sm:w-auto">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enable Export Request Pending...</span>
          </Button>
        ) : domainExportDetails.readyToExport ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {authCode?.authCode ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded border text-sm font-mono">
                <span className="text-green-400">{authCode.authCode}</span>
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
                onClick={async () => {
                  setFetchAuthCode(true);
                }}
                disabled={isAuthCodeLoading}
                className="w-full sm:w-auto"
              >
                {isAuthCodeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Get Auth Code
              </Button>
            )}
          </div>
        ) : (
          <AsyncButton
            onClick={handleRequestExport}
            disabled={disabled || isRequestingExport}
            loadingText="Requesting Export..."
            loadingIcon={<Loader2 className="h-4 w-4 animate-spin mr-2" />}
            size="sm"
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Request Export
          </AsyncButton>
        )}
      </div>
    </div>
  );
};

export const PendingTransferSection = ({
  domain,
}: {
  domain: NamefiNormalizedDomain;
}) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { signTypedData } = useSignTypedData();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const { address: activeWalletAddress } = useAccount();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

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

      // Get the owner wallet address
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error('Unable to determine domain owner wallet');
        return;
      }
      // Sign the payload with EIP-712
      const payload = { domainName: domain };
      const signature = await signTypedData({
        types: APPROVE_EXPORT_EIP712_TYPES,
        primaryType: 'ApproveExport',
        message: payload,
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

  const handleApprove = async () => {
    // Get the owner wallet address
    const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
    if (!ownerWalletAddress) {
      toast.error('Unable to determine domain owner wallet');
      return;
    }
    if (activeWalletAddress !== ownerWalletAddress) {
      walletConnectionRef.current?.requestWalletConnection(ownerWalletAddress);
      return;
    }
    return handleApproveInner();
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await trpcClient.domainConfig.rejectTransfer.mutate({
        domainName: domain,
      });
      toast.success('Export rejected successfully');
      await queryClient.refetchQueries({
        queryKey: trpc.domainConfig.getPendingTransfer.queryKey({
          domainName: domain,
        }),
      });
    } catch (error) {
      toast.error('Failed to reject export');
    } finally {
      setIsRejecting(false);
    }
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
        onRequestedWalletConnected={handleApprove}
        actionDescription="to approve the domain export"
      />
      <div className="flex flex-wrap items-center justify-between rounded-2xl bg-zinc-900 border border-amber-600 p-4 gap-y-2 col-span-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            <Label htmlFor="pending-export" className="text-amber-500">
              Pending Export
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Export requested by: {pendingTransfer.requestingRegistrarId}
          </p>
          <p className="text-xs text-zinc-400">
            Action required by:{' '}
            {new Date(pendingTransfer.actionDate).toLocaleDateString()}
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
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve
          </AsyncButton>
          <AsyncButton
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            size="sm"
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Reject
          </AsyncButton>
        </div>
      </div>
    </>
  );
};
