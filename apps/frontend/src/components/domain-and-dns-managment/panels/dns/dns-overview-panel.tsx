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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'ramda';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { Copy, Info, ExternalLink, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Button } from '@/components/ui/shadcn/button';

type DomainPreferencesAndConfig =
  AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];

export const DnsOverviewPanel = ({
  domain,
}: {
  domain: NamefiNormalizedDomain;
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

  const { renewDomains } = useDomainRenewal();

  const [isPending, setIsPending] = useState(false);
  const [isRequestingExport, setIsRequestingExport] = useState(false);

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

  const disableAllButtons = useMemo(() => {
    return isDomainPreferencesAndConfigLoading || isDomainDetailsLoading;
  }, [isDomainPreferencesAndConfigLoading, isDomainDetailsLoading]);

  if (
    isDomainPreferencesAndConfigLoading ||
    isDomainDetailsLoading ||
    isDomainExportDetailsLoading
  ) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>DNS Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    isNil(domainPreferencesAndConfig) ||
    isNil(domainDetails) ||
    isNil(domainExportDetails)
  ) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>DNS Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            Something went wrong! Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>DNS Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
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
            <div className="flex items-center gap-3">
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
                  disableAllButtons ||
                  isPending ||
                  isDomainDetailsLoading ||
                  !domainDetails?.expirationTime
                }
                size="sm"
              >
                Renew now
              </AsyncButton>
              <Switch
                id="auto-renew"
                className={cn(isPending ? 'animate-pulse cursor-progress' : '')}
                checked={domainPreferencesAndConfig?.autoRenewEnabled}
                disabled={disableAllButtons || isPending}
                onCheckedChange={handleChange('autoRenewEnabled')}
              />
            </div>
          </div>

          {/* Domain Export Section */}
          <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
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
            <div className="flex items-center gap-2">
              {!domainExportDetails.supportsExport ? (
                <Button disabled size="sm" variant="secondary">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export Unavailable
                </Button>
              ) : domainExportDetails.pendingRequestToEnableExport ? (
                <Button disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enable Export Request Pending...</span>
                </Button>
              ) : domainExportDetails.readyToExport ? (
                <div className="flex items-center gap-2">
                  {authCode?.authCode ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded border text-sm font-mono">
                        <span className="text-green-400">
                          {authCode.authCode}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyAuthCode}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={async () => {
                        setFetchAuthCode(true);
                      }}
                      disabled={isAuthCodeLoading}
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
                  disabled={disableAllButtons || isRequestingExport}
                  loadingText="Requesting Export..."
                  loadingIcon={
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  }
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Request Export
                </AsyncButton>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
