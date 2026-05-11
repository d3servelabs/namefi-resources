'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/lib/trpc';
import type { DnsRecordSelect } from '@namefi-astra/common/contract/entity-schemas';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Loader2 } from 'lucide-react';
import { isNil } from 'ramda';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActiveNameserversChangeWorkflowBanner } from '../nameservers/nameservers-panel';
import { getManagedDnsRecordMetadata } from '../dns/dns-records-table/managed-records';

type DomainPreferencesAndConfig =
  AppRouterOutput['domainConfig']['getDomainPreferencesAndConfig'];

type DomainPreferencesEditableKey =
  | 'autoEnsEnabled'
  | 'autoParkEnabled'
  | 'forwardTo'
  | 'autoRenewEnabled';

type DomainPreferencesUpdateInput = Pick<
  DomainPreferencesAndConfig,
  DomainPreferencesEditableKey
>;

type PendingPreferenceConflict = {
  updatedDomainPreferencesAndConfig: DomainPreferencesUpdateInput;
  recordsToDelete: DnsRecordSelect[];
  hasApexCnameConflict: boolean;
  hasApexAddressConflict: boolean;
};

function isApexRecordName(name: string) {
  return name === '@' || name === '';
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
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
  const domainPreferencesManagement = useMemo(() => {
    return (
      domainSupportedFeatures?.features?.domainPreferencesManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);

  if (!domainPreferencesManagement.config.showPanel) {
    return false;
  }
  if (domainPreferencesManagement.enabled) {
    return <DomainConfigAndPrefsInner domainName={domainName} />;
  }
  if (domainPreferencesManagement.config.message) {
    return (
      <Layout>
        <div
          className="text-center py-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: domainPreferencesManagement.config.message,
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
  const [pendingPreferenceConflict, setPendingPreferenceConflict] =
    useState<PendingPreferenceConflict | null>(null);

  const applyDomainPreferencesUpdate = useCallback(
    async (
      updatedDomainPreferencesAndConfig: DomainPreferencesUpdateInput,
      recordsToDelete: DnsRecordSelect[] = [],
    ) => {
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

        if (recordsToDelete.length > 0) {
          await trpcClient.dnsRecords.deleteRecords.mutate({
            zoneName: domainName,
            recordsIds: recordsToDelete.map((record) => record.id),
          });
        }

        await trpcClient.domainConfig.updateDomainPreferencesAndConfig.mutate({
          domainName,
          domainPreferencesAndConfig: updatedDomainPreferencesAndConfig,
        });

        toast.success(
          recordsToDelete.length > 0
            ? `Preferences updated and ${recordsToDelete.length} conflicting top-level record(s) removed`
            : 'Preferences updated',
        );

        await queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName: domainName,
          }),
        });
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
    },
    [
      trpc.domainConfig.getDomainPreferencesAndConfig,
      trpc.dnsRecords.getRecords,
      domainName,
      queryClient,
      trpcClient.domainConfig.updateDomainPreferencesAndConfig,
      trpcClient.dnsRecords.deleteRecords,
    ],
  );

  const getPreferenceConflict = useCallback(
    async (
      key: DomainPreferencesEditableKey,
      value: boolean | string | undefined,
      updatedDomainPreferencesAndConfig: DomainPreferencesUpdateInput,
    ): Promise<PendingPreferenceConflict | null> => {
      const willEnableForwarding =
        key === 'forwardTo' &&
        typeof value === 'string' &&
        value.trim().length > 0;
      const willEnableAutoPark = key === 'autoParkEnabled' && value === true;
      const willEnableAutoEns = key === 'autoEnsEnabled' && value === true;

      const shouldCheckApexCnameConflict =
        willEnableForwarding || willEnableAutoPark || willEnableAutoEns;
      const shouldCheckApexAddressConflict =
        willEnableForwarding || willEnableAutoPark;

      if (!shouldCheckApexCnameConflict && !shouldCheckApexAddressConflict) {
        return null;
      }

      const zoneRecords = await queryClient.fetchQuery(
        trpc.dnsRecords.getRecords.queryOptions({ zoneName: domainName }),
      );

      const unmanagedApexRecords = zoneRecords.filter((record) => {
        return (
          isApexRecordName(record.name) &&
          getManagedDnsRecordMetadata(record) === null
        );
      });

      const apexCnameRecords = shouldCheckApexCnameConflict
        ? unmanagedApexRecords.filter((record) => record.type === 'CNAME')
        : [];
      const apexAddressRecords = shouldCheckApexAddressConflict
        ? unmanagedApexRecords.filter(
            (record) => record.type === 'A' || record.type === 'AAAA',
          )
        : [];

      const recordsById = new Map<string, DnsRecordSelect>();
      for (const record of [...apexCnameRecords, ...apexAddressRecords]) {
        recordsById.set(record.id, record);
      }
      const recordsToDelete = [...recordsById.values()];

      if (recordsToDelete.length === 0) {
        return null;
      }

      return {
        updatedDomainPreferencesAndConfig,
        recordsToDelete,
        hasApexCnameConflict: apexCnameRecords.length > 0,
        hasApexAddressConflict: apexAddressRecords.length > 0,
      };
    },
    [domainName, queryClient, trpc.dnsRecords.getRecords],
  );

  const handleConfirmConflictResolution = useCallback(async () => {
    if (!pendingPreferenceConflict) {
      return;
    }

    await applyDomainPreferencesUpdate(
      pendingPreferenceConflict.updatedDomainPreferencesAndConfig,
      pendingPreferenceConflict.recordsToDelete,
    );
    setPendingPreferenceConflict(null);
  }, [pendingPreferenceConflict, applyDomainPreferencesUpdate]);

  const handleChange =
    (key: DomainPreferencesEditableKey) =>
    async (value: boolean | string | undefined) => {
      const updatedDomainPreferencesAndConfig: DomainPreferencesUpdateInput = {
        autoEnsEnabled: domainPreferencesAndConfig.autoEnsEnabled,
        autoParkEnabled: domainPreferencesAndConfig.autoParkEnabled,
        forwardTo: domainPreferencesAndConfig.forwardTo,
        autoRenewEnabled: domainPreferencesAndConfig.autoRenewEnabled,
      };

      if (key === 'autoEnsEnabled' && typeof value === 'boolean') {
        updatedDomainPreferencesAndConfig.autoEnsEnabled = value;
      }

      if (key === 'autoParkEnabled' && typeof value === 'boolean') {
        updatedDomainPreferencesAndConfig.autoParkEnabled = value;
      }

      if (key === 'forwardTo') {
        updatedDomainPreferencesAndConfig.forwardTo =
          typeof value === 'string' ? value : undefined;
      }

      if (key === 'autoRenewEnabled' && typeof value === 'boolean') {
        updatedDomainPreferencesAndConfig.autoRenewEnabled = value;
      }

      const conflict = await getPreferenceConflict(
        key,
        value,
        updatedDomainPreferencesAndConfig,
      );
      if (conflict) {
        setPendingPreferenceConflict(conflict);
        return;
      }

      await applyDomainPreferencesUpdate(updatedDomainPreferencesAndConfig);
    };

  const isUsingNamefiSigning =
    dnssecDetails.isUsingNamefiDelegationSigner &&
    dnssecDetails.zoneHasActiveDnssec;

  return (
    <div className="flex flex-col items-start gap-4">
      <ActiveNameserversChangeWorkflowBanner
        activeNameserversChangeWorkflow={activeNameserversChangeWorkflow}
        domainName={domainName}
      />

      <div className="grid grid-cols-2 gap-2 w-full">
        {dnssecDetails.isUsingNamefiNameservers ? (
          <>
            <div className="flex items-center justify-between rounded-2xl bg-black/50 border border-brand-primary/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-ens">Auto ENS</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically enable ENS for the domain
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isUsingNamefiSigning &&
                dnssecDetails?.supportsDnssec ? undefined : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <span
                            {...props}
                            className={cn(
                              'inline-flex h-4 w-4 text-zinc-500 cursor-help',
                              props.className,
                            )}
                          >
                            <Info className="h-4 w-4" />
                          </span>
                        )}
                      >
                        {}
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
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-black/50 border border-brand-primary/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-park">Auto Park</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically park the domain
                </p>
              </div>
              <Switch
                id="auto-park"
                className={cn(isPending ? 'animate-pulse cursor-progress' : '')}
                checked={domainPreferencesAndConfig?.autoParkEnabled}
                onCheckedChange={handleChange('autoParkEnabled')}
                disabled={disableAllButtons || isPending}
              />
            </div>

            <div className="flex flex-col items-start justify-between col-span-2 rounded-2xl bg-black/50 border border-brand-primary/20 p-4 gap-2">
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
          Changes to DNSSEC are not immediate. It can take up to 24-48 hours to
          propagate globally.
        </p>
      </div>

      <AlertDialog
        open={pendingPreferenceConflict !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setPendingPreferenceConflict(null);
          }
        }}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove conflicting top-level records?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-zinc-400">
              <p>
                This preference change requires removing conflicting root
                records on this domain.
              </p>
              {pendingPreferenceConflict?.hasApexCnameConflict && (
                <p>Any top-level CNAME (`@`) record will be removed first.</p>
              )}
              {pendingPreferenceConflict?.hasApexAddressConflict && (
                <p>Any top-level A/AAAA (`@`) records will be removed first.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={() => setPendingPreferenceConflict(null)}
            >
              Keep records
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmConflictResolution();
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Applying...
                </>
              ) : (
                'Remove and continue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
