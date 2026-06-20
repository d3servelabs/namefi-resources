'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { LoadingButton } from '@/components/buttons/loading-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { ProgressTimeline } from '@namefi-astra/ui/components/namefi/progress-timeline';
import {
  useEnableDnssecProgress,
  useDisableDnssecProgress,
  enableDnssecStepDisplayInfo,
  disableDnssecStepDisplayInfo,
} from '@/hooks/use-dnssec-progress';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { Nameserver } from '@namefi-astra/registrars/data/types/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  Info,
  Loader2,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  ShieldXIcon,
  XCircleIcon,
} from 'lucide-react';
import { isNotEmpty, isNotNil } from 'ramda';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useInvalidateNotifications } from '@/hooks/use-invalidate-notifications';
import { ActiveNameserversChangeWorkflowBanner } from '../nameservers/nameservers-panel';
import { CustomDelegationSignerPanel } from './custom-delegation-signer-panel';
import { CustomDelegationSignerSimplePanel } from './custom-delegation-signer-simple-panel';
import { DnssecModeToggle } from './dnssec-mode-toggle';
import { useDnssecModePreference } from './use-dnssec-mode-preference';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { CANCEL_DNS_WORKFLOW_FLAG } from '@/lib/openfeature-flags';

const CUSTOM_DELEGATION_SIGNER_FLAG: FeatureFlagDefinition = {
  key: 'dnssec_custom_delegation_signer',
  label: 'DNSSEC: Custom Delegation Signer',
  description:
    'Show the advanced Custom Delegation Signer panel (add + DNSKEY validation) for domains not on Namefi nameservers. Hides the Namefi enable/disable buttons in that case.',
  scope: 'page',
  pageKey: 'dnssec',
  defaultValue: true,
};

const DNSSEC_PANEL_FLAGS: FeatureFlagDefinition[] = [
  CUSTOM_DELEGATION_SIGNER_FLAG,
];

type DnssecStatusDetails =
  AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];

const Layout = ({
  children,
  headerActions,
}: {
  children: React.ReactNode;
  /**
   * Optional content rendered on the right side of the header. Used by the
   * custom-NS branch to host the Simple/Advanced toggle without bloating
   * every other Layout call site.
   */
  headerActions?: React.ReactNode;
}) => {
  return (
    <Card className="relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            DNSSEC Management
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
                  <p>
                    DNSSEC is a security feature that helps to protect your
                    domain from phishing attacks.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export type DomainNameserversFormProps = {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
};
export type DomainNameserversFormData = {
  nameservers: Nameserver[];
};

export const DnssecPanel = ({
  domainName,
}: {
  domainName: PunycodeDomainName;
}) => {
  const trpc = useTRPC();
  useRegisterAdminFlags(DNSSEC_PANEL_FLAGS);
  const [customDelegationSignerEnabled] = useAdminFeatureFlag(
    CUSTOM_DELEGATION_SIGNER_FLAG,
  );
  const {
    data: { features: domainSupportedFeatures },
  } = useSuspenseQuery(
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
      domainSupportedFeatures.dnssecManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);
  const customDnssecManagement = useMemo(() => {
    return (
      domainSupportedFeatures.customDnssecManagement ?? {
        enabled: false,
        config: { showPanel: false },
      }
    );
  }, [domainSupportedFeatures]);
  // Custom DS only takes over when the admin flag is on AND the backend
  // says custom DS is the right path for this domain (i.e. domain is on
  // third-party authoritative NS, not in late renewal, not a subdomain).
  const customDnssecActive =
    customDelegationSignerEnabled && customDnssecManagement.enabled;
  if (!dnssecManagement.config.showPanel && !customDnssecActive) {
    return false;
  }
  if (dnssecManagement.enabled) {
    if (dnssecManagement.config.autoManaged) {
      return <AutoManagedDnssecPanel />;
    }
    return (
      <DnssecPanelInner
        domainName={domainName}
        customDnssecActive={customDnssecActive}
      />
    );
  }
  if (customDnssecActive) {
    return (
      <DnssecPanelInner
        domainName={domainName}
        customDnssecActive={customDnssecActive}
      />
    );
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

export const DnssecPanelInner = ({
  domainName,
  customDnssecActive,
}: {
  domainName: PunycodeDomainName;
  /**
   * Whether the custom-DNSSEC flow should take over for this domain.
   * Computed by the outer `DnssecPanel` from both the admin feature flag
   * and the backend's per-domain `customDnssecManagement.enabled` so the
   * inner branch can't drift from the backend's decision.
   */
  customDnssecActive: boolean;
}) => {
  const trpc = useTRPC();
  useRegisterAdminFlags(DNSSEC_PANEL_FLAGS);
  const [dnssecMode, setDnssecMode] = useDnssecModePreference(domainName);

  const { data, isLoading } = useQuery(
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
    data: activeNameserversChangeWorkflow,
    isLoading: isLoadingActiveNameserversChangeWorkflow,
  } = useQuery(
    trpc.domainConfig.queryActiveNameserversChangeWorkflow.queryOptions({
      domainName,
    }),
  );

  const disableAllButtons = useMemo(() => {
    return !!activeNameserversChangeWorkflow;
  }, [activeNameserversChangeWorkflow]);

  if (isLoading || isLoadingActiveNameserversChangeWorkflow) {
    return (
      <Layout>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-80" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-4" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>No DNSSEC details found</div>
      </Layout>
    );
  }

  if (!data.supportsDnssec) {
    return (
      <Layout>
        <div>DNSSEC is not supported for this domain</div>
      </Layout>
    );
  }

  const zoneSigningStatus = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {data.zoneHasActiveDnssec ? (
          <>
            <ShieldCheckIcon className="w-6 h-6 text-green-500" />
            <p>Zone is signing records</p>
          </>
        ) : (
          <>
            <ShieldXIcon className="w-6 h-6 text-red-500" />
            <p>Zone is not signing records</p>
          </>
        )}
      </div>
    </div>
  );
  const isUsingNamefiSigning =
    data.isUsingNamefiDelegationSigner && data.zoneHasActiveDnssec;

  return (
    <Layout
      headerActions={
        customDnssecActive ? (
          <div className="flex items-center gap-2">
            <DnssecRefreshButton domainName={domainName} />
            <DnssecModeToggle mode={dnssecMode} onChange={setDnssecMode} />
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col items-start gap-4">
        <ActiveNameserversChangeWorkflowBanner
          activeNameserversChangeWorkflow={activeNameserversChangeWorkflow}
          domainName={domainName}
        />
        {isUsingNamefiSigning ? (
          <div className="flex items-center gap-2">
            <p>Namefi is automatically handling DNSSEC for this domain.</p>
          </div>
        ) : undefined}

        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {isNotNil(data.delegationSigners) &&
            isNotEmpty(data.delegationSigners) ? (
              data.isUsingNamefiDelegationSigner &&
              data.delegationSigners.length === 1 ? (
                dnssecMode === 'simple' ? (
                  <>
                    <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                    <p>All Secure</p>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                    <p>Namefi is the only delegation signer for this domain</p>
                  </>
                )
              ) : dnssecMode === 'simple' ? (
                false
              ) : (
                <>
                  <ShieldCheckIcon className="w-6 h-6 text-sky-500" />
                  <p>Custom delegation signers</p>
                </>
              )
            ) : (
              <>
                <ShieldXIcon className="w-6 h-6 text-red-500" />
                {dnssecMode === 'simple' ? (
                  <p>DNSSEC not enabled</p>
                ) : (
                  <p>No delegation signers</p>
                )}
              </>
            )}
          </div>

          {data.isUsingNamefiNameservers ? zoneSigningStatus : undefined}
        </div>

        {customDnssecActive ? (
          <div className="w-full animate-in fade-in-50 slide-in-from-top-2">
            {dnssecMode === 'simple' ? (
              <CustomDelegationSignerSimplePanel
                domainName={domainName}
                dnssecDetails={data}
                disableAllButtons={disableAllButtons}
              />
            ) : (
              <CustomDelegationSignerPanel
                domainName={domainName}
                dnssecDetails={data}
                disableAllButtons={disableAllButtons}
              />
            )}
          </div>
        ) : (
          <DnssecPanelAction
            domainName={domainName}
            dnssecDetails={data}
            disableAllButtons={disableAllButtons}
          />
        )}

        {/*
         * Only surface the propagation footnote in Custom-NS Advanced mode.
         * Simple mode's cards (PendingCard, ReadyCard) already mention
         * "globally" / "up to 48 hours" inline; the Namefi-managed flow
         * surfaces propagation via its progress timeline. Showing this
         * blanket line elsewhere just adds noise.
         */}
        {customDnssecActive && dnssecMode === 'advanced' ? (
          <div className="text-sm text-zinc-500 mt-4">
            <p>
              Changes to DNSSEC are not immediate. It can take up to 24-48 hours
              to propagate globally.
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

/**
 * Header refresh button shown next to the Simple/Advanced toggle when the
 * custom-DNSSEC flow is active. Force-refetches every query that drives the
 * panel body so a user can re-sync after a manual change at their DNS
 * provider without waiting for the next polling tick.
 */
function DnssecRefreshButton({
  domainName,
}: {
  domainName: PunycodeDomainName;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        }),
        queryClient.refetchQueries({
          queryKey:
            trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryKey(
              { domainName },
            ),
        }),
        queryClient.refetchQueries({
          queryKey:
            trpc.domainConfig.dnssec.getCustomDnssecEnableStatus.queryKey({
              domainName,
            }),
        }),
        queryClient.refetchQueries({
          queryKey:
            trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryKey(
              { domainName },
            ),
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={isRefreshing}
              onClick={handleRefresh}
              aria-label="Refresh DNSSEC status"
            >
              <RefreshCwIcon
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          }
        />
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Modal component to show DNSSEC operation progress
 */
function DnssecProgressModal({
  domainName,
  operation,
}: {
  domainName: PunycodeDomainName;
  operation: 'ENABLE_DNSSEC' | 'REMOVE_DNSSEC';
}) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [canCancel] = useAdminFeatureFlag(CANCEL_DNS_WORKFLOW_FLAG);

  const enableProgress = useEnableDnssecProgress(domainName, {
    enabled: open && operation === 'ENABLE_DNSSEC',
  });

  const disableProgress = useDisableDnssecProgress(domainName, {
    enabled: open && operation === 'REMOVE_DNSSEC',
  });

  // Refresh the bell the moment the DNSSEC workflow settles — the
  // enable/disable workflows write an in-app notification on success or
  // failure, and we don't want the user waiting for the next poll tick.
  const invalidateNotifications = useInvalidateNotifications();
  const hasCompleted =
    operation === 'ENABLE_DNSSEC'
      ? enableProgress.hasCompleted
      : disableProgress.hasCompleted;
  const prevHasCompleted = useRef(hasCompleted);
  useEffect(() => {
    if (hasCompleted && !prevHasCompleted.current) {
      invalidateNotifications();
    }
    prevHasCompleted.current = hasCompleted;
  }, [hasCompleted, invalidateNotifications]);

  const cancelMutation = useMutation(
    trpc.domainConfig.dnssec.cancelDnssecWorkflow.mutationOptions({
      async onSuccess() {
        toast.success('Cancellation requested');
        // Force refetch — workflow-listing query needs to drop the running
        // entry immediately, not on the next stale-window lapse.
        await queryClient.refetchQueries({
          queryKey:
            trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryKey(
              { domainName },
            ),
        });
      },
      onError(error) {
        toast.error(`Failed to cancel: ${error.message}`);
      },
    }),
  );

  const isEnabling = operation === 'ENABLE_DNSSEC';
  const title = `${isEnabling ? 'Enabling' : 'Disabling'} for ${domainName}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-6 w-6" />
                }
              />
            }
          >
            <Info className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>View progress details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isEnabling ? (
          <ProgressTimeline
            loading={enableProgress.isLoading}
            steps={enableProgress.steps}
            stepDisplayInfo={enableDnssecStepDisplayInfo}
            showTitle={false}
            className="border-none"
          />
        ) : (
          <ProgressTimeline
            loading={disableProgress.isLoading}
            steps={disableProgress.steps}
            stepDisplayInfo={disableDnssecStepDisplayInfo}
            showTitle={false}
            className="border-none"
          />
        )}
        {canCancel && (
          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <LoadingButton
              variant="destructive"
              size="sm"
              isLoading={cancelMutation.isPending}
              loadingText="Cancelling..."
              onClick={() => cancelMutation.mutate({ domainName, operation })}
            >
              <XCircleIcon className="w-4 h-4" />
              Cancel Workflow
            </LoadingButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const DnssecPanelAction = ({
  domainName,
  dnssecDetails,
  disableAllButtons,
}: {
  domainName: PunycodeDomainName;
  dnssecDetails: DnssecStatusDetails;
  disableAllButtons: boolean;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: activeDnssecOperationWorkflows,
    isLoading: isLoadingActiveDnssecOperationWorkflows,
  } = useQuery(
    trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryOptions(
      {
        domainName,
      },
      {
        refetchInterval: (query) => {
          return query.state.data?.hasActiveWorkflow ? 5000 : 15_000;
        },
      },
    ),
  );

  const isUsingNamefiSigning =
    dnssecDetails.isUsingNamefiDelegationSigner &&
    dnssecDetails.zoneHasActiveDnssec;

  const refetchQueries = async () => {
    // Force refetch on both — DNSSEC details + active-workflow list need to
    // reflect the just-fired enable/disable mutation immediately.
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
          domainName,
        }),
      }),
      queryClient.refetchQueries({
        queryKey:
          trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryKey({
            domainName,
          }),
      }),
    ]);
  };

  const enableDnssecMutationOptions =
    trpc.domainConfig.dnssec.enableDnssec.mutationOptions({
      onError(error) {
        console.error(error);
        toast.error('Request to Enable DNSSEC has failed');
      },
      async onSuccess() {
        await refetchQueries();
        toast.success('Request to Enable DNSSEC has been sent');
      },
    });

  const enableNamefiSigning = useMutation(enableDnssecMutationOptions);

  const disableDnssecMutationOptions =
    trpc.domainConfig.dnssec.disableDnssec.mutationOptions({
      onError(error) {
        console.error(error);
        toast.error('Request to Disable DNSSEC has failed');
      },
      async onSuccess() {
        await refetchQueries();
        toast.success('Request to Disable DNSSEC has been sent');
      },
    });

  const disableNamefiSigning = useMutation(disableDnssecMutationOptions);

  if (isLoadingActiveDnssecOperationWorkflows) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (activeDnssecOperationWorkflows?.hasActiveWorkflow) {
    const operation =
      activeDnssecOperationWorkflows?.workflowDetails?.operation;
    if (operation) {
      return (
        <div
          id="request-in-progress"
          className="flex items-center gap-2 bg-zinc-800 p-2 rounded-md"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <p>
            A request to {operation === 'REMOVE_DNSSEC' ? 'disable' : 'enable'}{' '}
            DNSSEC is already in progress
          </p>
          <DnssecProgressModal domainName={domainName} operation={operation} />
        </div>
      );
    }
    return (
      <div>
        <p>An operation is already in progress</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-between">
      {isUsingNamefiSigning ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <LoadingButton
                disabled={disableAllButtons}
                isLoading={disableNamefiSigning.isPending}
                loadingText="Disabling..."
              />
            }
          >
            <ShieldMinusIcon width={20} height={20} /> Disable Namefi Signing
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Namefi Signing</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disable Namefi Signing?
                <br />
                <p>
                  This will reduce the security of your domain. and it will
                  affect service that rely on it (e.g. AutoENS)
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => disableNamefiSigning.mutate({ domainName })}
                variant="destructive"
              >
                Confirm and Disable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AsyncButton
          loadingText="Enabling..."
          onClick={() => enableNamefiSigning.mutateAsync({ domainName })}
          variant={'default'}
          disabled={disableAllButtons}
        >
          <ShieldPlusIcon width={20} height={20} /> Enable Namefi Signing
        </AsyncButton>
      )}
    </div>
  );
};

export const AutoManagedDnssecPanel = () => {
  return (
    <Layout>
      <div className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          <p>Namefi is signing records for this domain</p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-green-500" />
            <p>Namefi is the only delegation signer for this domain</p>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-green-500" />
            <p>Zone is signing records for this domain</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
