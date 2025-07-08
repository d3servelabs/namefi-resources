'use client';

import { AsyncButton } from '@/components/buttons/AsyncButton';
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
import { cn } from '@/lib/utils';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/utils/trpc';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isNil } from 'ramda';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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

  const { renewDomains } = useDomainRenewal();

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

  const disableAllButtons = useMemo(() => {
    return isDomainPreferencesAndConfigLoading || isDomainDetailsLoading;
  }, [isDomainPreferencesAndConfigLoading, isDomainDetailsLoading]);

  if (isDomainPreferencesAndConfigLoading || isDomainDetailsLoading) {
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
            <div />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isNil(domainPreferencesAndConfig) || isNil(domainDetails)) {
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
          <div />
        </div>
      </CardContent>
    </Card>
  );
};
