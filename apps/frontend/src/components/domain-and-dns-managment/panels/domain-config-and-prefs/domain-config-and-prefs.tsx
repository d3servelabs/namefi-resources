'use client';

import { useTranslations } from 'next-intl';
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
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
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
  const tDns = useTranslations('dnsManagement');
  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tDns('prefs.panelTitle')}
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
  const tDns = useTranslations('dnsManagement');

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
        <div className="text-center py-12">{tDns('prefs.loadFailed')}</div>
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
  const tCommon = useTranslations('common');
  const tDns = useTranslations('dnsManagement');

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
                <Label htmlFor="auto-ens">{tDns('prefs.autoEns.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {tDns('prefs.autoEns.description')}
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
                          {tDns('prefs.autoEns.unavailableTooltip')}
                          <br />
                          {dnssecDetails?.supportsDnssec ? (
                            <p>{tDns('prefs.autoEns.enableDnssecFirst')}</p>
                          ) : (
                            <p>{tDns('prefs.autoEns.dnssecUnsupported')}</p>
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
                <Label htmlFor="auto-park">
                  {tDns('prefs.autoPark.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {tDns('prefs.autoPark.description')}
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
                <Label htmlFor="forward-to">
                  {tDns('prefs.forwardTo.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {tDns('prefs.forwardTo.description')}
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
                    {tCommon('actions.cancel')}
                  </Button>
                ) : undefined}
                <AsyncButton
                  onClick={() => handleChange('forwardTo')(forwardTo)}
                  disabled={!forwardToChanged}
                >
                  {tCommon('actions.save')}
                </AsyncButton>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p>{tDns('prefs.notManagingNameservers')}</p>
          </div>
        )}
      </div>

      <div className="text-sm text-zinc-500 mt-4">
        <p>{tDns('prefs.propagationNotice')}</p>
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
              {tDns('prefs.conflictDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-zinc-400">
              <p>{tDns('prefs.conflictDialog.description')}</p>
              {pendingPreferenceConflict?.hasApexCnameConflict && (
                <p>{tDns('prefs.conflictDialog.apexCname')}</p>
              )}
              {pendingPreferenceConflict?.hasApexAddressConflict && (
                <p>{tDns('prefs.conflictDialog.apexAddress')}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={() => setPendingPreferenceConflict(null)}
            >
              {tDns('prefs.conflictDialog.keepRecords')}
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
                  <Loader2 className="h-4 w-4 animate-spin" />{' '}
                  {tDns('prefs.conflictDialog.applying')}
                </>
              ) : (
                tDns('prefs.conflictDialog.removeAndContinue')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
