'use client';

import { AsyncButton } from '@/components/buttons/AsyncButton';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Switch } from '@/components/ui/shadcn/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/utils';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/utils/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { isNil } from 'ramda';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActiveNameserversChangeWorkflowBanner } from '../Nameservers/NameserversPanel';

type DomainPreferencesAndConfig =
  AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Domain Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export const DomainConfigAndPrefs = ({
  domainName,
}: {
  domainName: PunycodeDomainName;
}) => {
  const trpc = useTRPC();
  const { data: domainSupportedFeatures } = useQuery(
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions(
      {
        normalizedDomainName: domainName,
      },
      {
        refetchInterval: 10000,
      },
    ),
  );
  const dnssecManagement = useMemo(() => {
    return (
      domainSupportedFeatures?.features?.dnssecManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);

  if (!dnssecManagement.config.showPanel) {
    return false;
  }
  if (dnssecManagement.enabled) {
    return <DomainConfigAndPrefsInner domainName={domainName} />;
  }
  if (dnssecManagement.config.message) {
    return (
      <Layout>
        <div
          className="text-center py-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: dnssecManagement.config.message,
          }}
        />
      </Layout>
    );
  }
  return false;
};

export const DomainConfigAndPrefsInner = ({
  domainName,
}: {
  domainName: PunycodeDomainName;
}) => {
  const trpc = useTRPC();

  const { data: dnssecDetails, isLoading: isDnssecLoading } = useQuery(
    trpc.domainConfig.dnssec.getDomainDnssecDetails.queryOptions(
      {
        domainName,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const {
    data: domainPreferencesAndConfig,
    isLoading: isDomainPreferencesAndConfigLoading,
  } = useQuery(
    trpc.domainConfig.getDomainPreferencesAndConfig.queryOptions(
      {
        domainName,
      },
      {
        refetchInterval: 8_000,
      },
    ),
  );

  const {
    data: activeNameserversChangeWorkflow,
    isLoading: isLoadingActiveNameserversChangeWorkflow,
  } = useQuery(
    trpc.domainConfig.queryActiveNameserversChangeWorkflow.queryOptions({
      domainName,
    }),
  );

  if (
    isDnssecLoading ||
    isDomainPreferencesAndConfigLoading ||
    isLoadingActiveNameserversChangeWorkflow
  ) {
    return (
      <Layout>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex items-center flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-4 col-span-2 gap-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isNil(dnssecDetails) || isNil(domainPreferencesAndConfig)) {
    return (
      <Layout>
        <div className="text-center py-12">
          Something went wrong! Please try again later.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {' '}
      <DomainConfigAndPrefsForm
        domainName={domainName}
        domainPreferencesAndConfig={domainPreferencesAndConfig}
        activeNameserversChangeWorkflow={
          activeNameserversChangeWorkflow ?? null
        }
        dnssecDetails={dnssecDetails}
      />
    </Layout>
  );
};

export const DomainConfigAndPrefsForm = ({
  domainName,
  domainPreferencesAndConfig,
  activeNameserversChangeWorkflow,
  dnssecDetails,
}: {
  domainName: PunycodeDomainName;
  domainPreferencesAndConfig: AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];
  activeNameserversChangeWorkflow: AppRouterOutput['domainConfig']['queryActiveNameserversChangeWorkflow'];
  dnssecDetails: AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];
}) => {
  const trpc = useTRPC();

  const [forwardTo, setForwardTo] = useState<string | undefined>(
    domainPreferencesAndConfig?.forwardTo,
  );
  const forwardToChanged = useMemo(() => {
    return forwardTo !== domainPreferencesAndConfig?.forwardTo;
  }, [forwardTo, domainPreferencesAndConfig?.forwardTo]);

  const disableAllButtons = useMemo(() => {
    return !!activeNameserversChangeWorkflow;
  }, [activeNameserversChangeWorkflow]);

  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const [isPending, setIsPending] = useState(false);

  const handleChange =
    (key: keyof DomainPreferencesAndConfig) => async (value: any) => {
      const updatedDomainPreferencesAndConfig = {
        autoEnsEnabled:
          key === 'autoEnsEnabled'
            ? value
            : domainPreferencesAndConfig?.autoEnsEnabled,
        autoParkEnabled:
          key === 'autoParkEnabled'
            ? value
            : domainPreferencesAndConfig?.autoParkEnabled,
        forwardTo:
          key === 'forwardTo' ? value : domainPreferencesAndConfig?.forwardTo,
        autoRenewEnabled:
          key === 'autoRenewEnabled'
            ? value
            : domainPreferencesAndConfig?.autoRenewEnabled,
      };

      try {
        setIsPending(true);
        const queryKey =
          trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName,
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
          domainName,
          domainPreferencesAndConfig: updatedDomainPreferencesAndConfig,
        });
        toast.success('Preferences updated');
        await queryClient.refetchQueries({
          queryKey: trpc.domainConfig.getDomainPreferencesAndConfig.queryKey({
            domainName,
          }),
        });
      } catch (_error) {
        toast.error('Failed to update preferences');
      } finally {
        setIsPending(false);
      }
    };

  const isUsingNamefiSigning =
    dnssecDetails.isUsingNamefiDelegationSigner &&
    dnssecDetails.zoneHasActiveDnssec;

  return (
    <>
      <div className="flex flex-col items-start gap-4">
        <ActiveNameserversChangeWorkflowBanner
          activeNameserversChangeWorkflow={activeNameserversChangeWorkflow}
        />

        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-renew">Auto Renew</Label>
              <p className="text-sm text-muted-foreground">
                Automatically renew the domain
              </p>
            </div>
            <Switch
              id="auto-renew"
              className={cn(isPending ? 'animate-pulse cursor-progress' : '')}
              checked={domainPreferencesAndConfig?.autoRenewEnabled}
              disabled={disableAllButtons || isPending}
              onCheckedChange={handleChange('autoRenewEnabled')}
            />
          </div>

          <div className="invisible">intentional empty div</div>

          {dnssecDetails.isUsingNamefiNameservers ? (
            <>
              <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-ens">Auto ENS</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enable ENS for the domain
                  </p>
                </div>
                <Switch
                  id="auto-ens"
                  className={cn(isPending ? 'animate-pulse cursor-wait' : '')}
                  checked={domainPreferencesAndConfig?.autoEnsEnabled}
                  onCheckedChange={handleChange('autoEnsEnabled')}
                  disabled={
                    isPending ||
                    disableAllButtons ||
                    !isUsingNamefiSigning ||
                    !dnssecDetails?.supportsDnssec
                  }
                />
                {isUsingNamefiSigning &&
                dnssecDetails?.supportsDnssec ? undefined : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild={true}>
                        <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          AutoENS is not available for this domain. ENS Requires
                          DNSSEC.
                          <br />
                          {dnssecDetails?.supportsDnssec ? (
                            <p>You need to enable DNSSEC first.</p>
                          ) : (
                            <p>And this domain does not support DNSSEC.</p>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-park">Auto Park</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically park the domain
                  </p>
                </div>
                <Switch
                  id="auto-park"
                  className={cn(
                    isPending ? 'animate-pulse cursor-progress' : '',
                  )}
                  checked={domainPreferencesAndConfig?.autoParkEnabled}
                  onCheckedChange={handleChange('autoParkEnabled')}
                  disabled={disableAllButtons || isPending}
                />
              </div>

              <div className="flex flex-col items-start justify-between col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="forward-to">Forward To</Label>
                  <p className="text-sm text-muted-foreground">
                    Forward the domain to a different address
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <Input
                    id="forward-to"
                    onChange={(e) => setForwardTo(e.target.value)}
                    value={forwardTo}
                    disabled={disableAllButtons || isPending}
                  />
                  {forwardToChanged ? (
                    <Button
                      variant="destructive"
                      onClick={() =>
                        setForwardTo(domainPreferencesAndConfig?.forwardTo)
                      }
                    >
                      Cancel
                    </Button>
                  ) : undefined}
                  <AsyncButton
                    onClick={() => handleChange('forwardTo')(forwardTo)}
                    disabled={!forwardToChanged}
                  >
                    Save
                  </AsyncButton>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p>Namefi is not managing the nameservers for this domain</p>
            </div>
          )}
        </div>

        <div className="text-sm text-zinc-500 mt-4">
          <p>
            Changes to DNSSEC are not immediate. It can take up to 24-48 hours
            to propagate globally.
          </p>
        </div>
      </div>
    </>
  );
};
