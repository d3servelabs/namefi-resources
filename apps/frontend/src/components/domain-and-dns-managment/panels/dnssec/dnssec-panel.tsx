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
} from '@/components/ui/shadcn/alert-dialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  Info,
  Loader2,
  ShieldCheckIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  ShieldXIcon,
} from 'lucide-react';
import { isNotEmpty, isNotNil } from 'ramda';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { ActiveNameserversChangeWorkflowBanner } from '../nameservers/nameservers-panel';

type DnssecStatusDetails =
  AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          DNSSEC Management
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Info className="h-4 w-4 text-zinc-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  DNSSEC is a security feature that helps to protect your domain
                  from phishing attacks.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
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
  if (!dnssecManagement.config.showPanel) {
    return false;
  }
  if (dnssecManagement.enabled) {
    if (dnssecManagement.config.autoManaged) {
      return <AutoManagedDnssecPanel />;
    }
    return <DnssecPanelInner domainName={domainName} />;
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
}: {
  domainName: PunycodeDomainName;
}) => {
  const trpc = useTRPC();

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
    <Layout>
      <div className="flex flex-col items-start gap-4">
        <ActiveNameserversChangeWorkflowBanner
          activeNameserversChangeWorkflow={activeNameserversChangeWorkflow}
        />
        {isUsingNamefiSigning ? (
          <div className="flex items-center gap-2">
            <p>Namefi is signing records for this domain</p>
          </div>
        ) : undefined}

        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {isNotNil(data.delegationSigners) &&
            isNotEmpty(data.delegationSigners) ? (
              <>
                {data.isUsingNamefiDelegationSigner &&
                data.delegationSigners.length === 1 ? (
                  <>
                    <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                    <p>Namefi is the only delegation signer for this domain</p>
                  </>
                ) : (
                  <>
                    <p>Custom delegation signers:</p>
                    <p>
                      {data.delegationSigners
                        ?.map((signer) => signer.keyTag)
                        .join(', ')}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <ShieldXIcon className="w-6 h-6 text-red-500" />
                <p>No delegation signers</p>
              </>
            )}
          </div>

          {zoneSigningStatus}
        </div>

        <DnssecPanelAction
          domainName={domainName}
          dnssecDetails={data}
          disableAllButtons={disableAllButtons}
        />

        <div className="text-sm text-zinc-500 mt-4">
          <p>
            Changes to DNSSEC are not immediate. It can take up to 24-48 hours
            to propagate globally.
          </p>
        </div>
      </div>
    </Layout>
  );
};

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
    trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryOptions({
      domainName,
    }),
  );

  const isUsingNamefiSigning =
    dnssecDetails.isUsingNamefiDelegationSigner &&
    dnssecDetails.zoneHasActiveDnssec;

  const refetchQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
        domainName,
      }),
    });
    await queryClient.refetchQueries({
      queryKey:
        trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryKey({
          domainName,
        }),
    });
  };

  const enableDnssecMutationOptions =
    trpc.domainConfig.dnssec.enableDnssec.mutationOptions();

  const enableNamefiSigning = useMutation({
    ...enableDnssecMutationOptions,
    mutationFn: async () => {
      if (enableDnssecMutationOptions?.mutationFn) {
        try {
          await enableDnssecMutationOptions.mutationFn({ domainName });
          await refetchQueries();
          toast.success('Request to Enable DNSSEC has been sent');
        } catch (error) {
          console.error(error);
          toast.error('Request to Enable DNSSEC has failed');
        }
      }
    },
  });

  const disableDnssecMutationOptions =
    trpc.domainConfig.dnssec.disableDnssec.mutationOptions();

  const disableNamefiSigning = useMutation({
    ...disableDnssecMutationOptions,
    mutationFn: async () => {
      if (disableDnssecMutationOptions?.mutationFn) {
        try {
          await disableDnssecMutationOptions.mutationFn({ domainName });
          await refetchQueries();
          toast.success('Request to Disable DNSSEC has been sent');
        } catch (error) {
          console.error(error);
          toast.error('Request to Disable DNSSEC has failed');
        }
      }
    },
  });

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
        <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p>
            A request to {operation === 'REMOVE_DNSSEC' ? 'disable' : 'enable'}{' '}
            DNSSEC is already in progress
          </p>
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
          <AlertDialogTrigger asChild={true}>
            <LoadingButton
              disabled={disableAllButtons}
              isLoading={disableNamefiSigning.isPending}
              loadingText="Disabling..."
            >
              <ShieldMinusIcon width={20} height={20} /> Disable Namefi Signing
            </LoadingButton>
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
                asChild={true}
              >
                <Button variant={'destructive'}>Confirm and Disable</Button>
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
