'use client';

import { LoadingButton } from '@/components/buttons/loading-button';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { ProgressTimeline } from '@/components/ui/progress-timeline';
import {
  useChangeNameserversProgress,
  changeNameserversStepDisplayInfo,
  changeNameserversSubstepDisplayInfo,
  resetNameserversStepDisplayInfo,
  resetNameserversChangeSubstepDisplayInfo,
  resetNameserversEnableDnssecSubstepDisplayInfo,
} from '@/hooks/use-change-nameservers-progress';
import { cn } from '@/lib/cn';
import { type AppRouterOutput, useTRPC, useTRPCClient } from '@/lib/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import {
  type PunycodeDomainName,
  punycodeFqdnSchema,
} from '@namefi-astra/registrars/lib/data/validations';
import { toPunycodeFqdn } from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Info, Loader2, RotateCw, SaveIcon, XCircleIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import React from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useAccount } from 'wagmi';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';

const CANCEL_WORKFLOW_FLAG: FeatureFlagDefinition = {
  key: 'cancel_dns_workflow',
  label: 'Cancel Workflow',
  description: 'Show cancel button for active DNS/DNSSEC workflows',
  scope: 'global',
  defaultValue: false,
};

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
  CHANGE_NAMESERVERS: 'CHANGE_NAMESERVERS',
  RESET_NAMESERVERS: 'RESET_NAMESERVERS',
} as const;

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Nameservers Management
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
                <p>Nameservers direct traffic to your domain</p>
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
  nftChainId: number | bigint;
};
export type DomainNameserversFormData = {
  nameservers: Nameserver[];
};

const NameserversPanelForm = React.memo(
  function NameserversPanelForm({
    domainName,
    nameservers,
    nftChainId,
  }: DomainNameserversFormProps) {
    const trpc = useTRPC();
    const [loadingOperation, setLoadingOperation] = useState<string | null>(
      null,
    );

    const trpcClient = useTRPCClient();
    const queryClient = useQueryClient();
    const { signTypedData } = useSignTypedData();
    const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
    const { address: activeWalletAddress } = useAccount();

    // Store pending form values for after wallet connection
    // - undefined: no pending operation
    // - null: reset nameservers operation
    // - DomainNameserversFormData: change nameservers operation
    const pendingFormValues = useRef<
      DomainNameserversFormData | null | undefined
    >(undefined);

    // Fetch the owner wallet address for this domain's NFT
    const { data: ownerWalletData } = useQuery(
      trpc.domainConfig.getDomainOwnerWallet.queryOptions({
        domainName,
      }),
    );

    const { data: domainDnssecDetails, isLoading: isDnssecLoading } = useQuery(
      trpc.domainConfig.dnssec.getDomainDnssecDetails.queryOptions(
        {
          domainName,
        },
        {
          refetchInterval: 8_000,
          refetchOnWindowFocus: true,
        },
      ),
    );

    const {
      data: activeNameserversChangeWorkflow,
      refetch: refetchActiveNameserversChangeWorkflow,
    } = useQuery(
      trpc.domainConfig.queryActiveNameserversChangeWorkflow.queryOptions(
        {
          domainName,
        },
        {
          refetchInterval: 8_000,
          refetchOnWindowFocus: true,
        },
      ),
    );

    const [submittedChanges, setSubmittedChanges] = useState(false);

    const disableAllButtons = useMemo(() => {
      return !!loadingOperation || !!activeNameserversChangeWorkflow;
    }, [loadingOperation, activeNameserversChangeWorkflow]);

    const invalidateQueries = useCallback(async () => {
      // Refetch active workflow first so the banner appears immediately
      await refetchActiveNameserversChangeWorkflow();
      // Then invalidate other queries in parallel
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.getDomainDetails.queryKey({ domainName }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.getDomainSupportedFeatures.queryKey({
            normalizedDomainName: domainName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        }),
      ]);
    }, [trpc, queryClient, domainName, refetchActiveNameserversChangeWorkflow]);

    const resetWithSignature = useCallback(async () => {
      setLoadingOperation('resetting');

      try {
        // Sign the payload with EIP-712 using unified domain action type
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = {
          domainName,
          action: DOMAIN_ACTIONS.RESET_NAMESERVERS,
          payload: '',
          message: `Reset nameservers for ${domainName} to Namefi defaults. Your DNS records will be managed by Namefi.`,
          timestamp,
        };
        const signature = await signTypedData({
          types: DOMAIN_ACTION_EIP712_TYPES,
          primaryType: 'DomainAction',
          message: payload,
          chainId: nftChainId,
        });

        await trpcClient.domainConfig.resetDomainNameservers.mutate({
          signature,
          payload,
        });
        toast.success('Nameservers reset to Namefi defaults');
        setSubmittedChanges(true);
      } catch (error: any) {
        if (error.message?.includes('rejected')) {
          toast.error('Signature request was rejected');
        } else {
          toast.error(error.message ?? 'Failed to reset nameservers');
        }
      }
      await invalidateQueries();
      setLoadingOperation(null);
    }, [trpcClient, domainName, invalidateQueries, signTypedData, nftChainId]);

    const handleResetToNamefi = useCallback(async () => {
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error('Unable to determine domain owner wallet');
        return;
      }
      if (activeWalletAddress !== ownerWalletAddress) {
        // Store that we want to reset after wallet connection
        pendingFormValues.current = null; // null indicates reset operation
        walletConnectionRef.current?.requestWalletConnection(
          ownerWalletAddress,
        );
        return;
      }
      await resetWithSignature();
    }, [ownerWalletData, activeWalletAddress, resetWithSignature]);

    const validationSchema = useMemo(
      () =>
        z.object({
          nameservers: z
            .array(
              z
                .string()
                .transform((val) => val.replace(/\.$/, '').trim())
                .pipe(namefiNormalizedDomainSchema)
                .transform((val) => `${val}.`)
                .pipe(punycodeFqdnSchema)
                .transform(toPunycodeFqdn),
            )
            .min(2)
            .max(4),
        }),
      [],
    );

    const form = useForm<DomainNameserversFormData>({
      defaultValues: {
        nameservers,
      },
      resolver: zodResolver(validationSchema),
      mode: 'all',
      reValidateMode: 'onChange',
    });

    const {
      control,
      handleSubmit,
      watch,
      formState: { isSubmitting, isValid },
      setValue: setFieldValue,
      trigger,
    } = form;

    const submitWithSignature = async (values: DomainNameserversFormData) => {
      try {
        if (domainName) {
          const nameserversList = values.nameservers.join(', ');
          const timestamp = Math.floor(Date.now() / 1000);
          // Create payload with nameservers as comma-separated string in payload field
          const payload = {
            domainName,
            action: DOMAIN_ACTIONS.CHANGE_NAMESERVERS,
            payload: values.nameservers.join(','),
            message: `Change nameservers for ${domainName} to: ${nameserversList}`,
            timestamp,
          };

          // Sign the payload with EIP-712 using unified domain action type
          const signature = await signTypedData({
            types: DOMAIN_ACTION_EIP712_TYPES,
            primaryType: 'DomainAction',
            message: payload,
            chainId: nftChainId,
          });

          await trpcClient.domainConfig.changeDomainNameservers.mutate({
            signature,
            payload,
          });
          toast.success('Nameservers Updated Successfully');
          setSubmittedChanges(true);
        }
      } catch (error: any) {
        if (error.message?.includes('rejected')) {
          toast.error('Signature request was rejected');
        } else {
          toast.error(error.message ?? 'Failed to update Nameservers');
        }
      }

      await invalidateQueries();
    };

    const onSubmit: SubmitHandler<DomainNameserversFormData> = async (
      values,
    ) => {
      const ownerWalletAddress = ownerWalletData?.ownerWalletAddress;
      if (!ownerWalletAddress) {
        toast.error('Unable to determine domain owner wallet');
        return;
      }
      if (activeWalletAddress !== ownerWalletAddress) {
        // Store values and request wallet connection
        pendingFormValues.current = values;
        walletConnectionRef.current?.requestWalletConnection(
          ownerWalletAddress,
        );
        return;
      }
      await submitWithSignature(values);
    };

    const handleWalletConnected = async () => {
      if (pendingFormValues.current !== undefined) {
        if (pendingFormValues.current === null) {
          // null indicates reset operation
          await resetWithSignature();
        } else {
          // Form values indicate change nameservers operation
          await submitWithSignature(pendingFormValues.current);
        }
        pendingFormValues.current = undefined;
      }
    };

    const values = watch();

    const shouldReduceMotion = useReducedMotion();

    const handleUpdateNameserver = useCallback(
      (index: number, value: string) => {
        setFieldValue(`nameservers.${index}`, value as any);
        trigger('nameservers');
      },
      [setFieldValue, trigger],
    );

    const handleAddNameserver = useCallback(() => {
      setFieldValue('nameservers', [...values.nameservers, '' as any]);
    }, [values, setFieldValue]);

    const handleRemoveNameserver = useCallback(
      (index: number) => {
        const newNameservers = [...values.nameservers];
        newNameservers.splice(index, 1);
        setFieldValue('nameservers', newNameservers);
      },
      [values, setFieldValue],
    );

    const resetButton = useMemo(() => {
      if (isDnssecLoading) {
        return <Skeleton className="h-6 w-24" />;
      }
      if (!domainDnssecDetails) {
        return null;
      }

      if (domainDnssecDetails.isUsingNamefiNameservers) {
        return null;
      }

      return (
        <LoadingButton
          variant="outline"
          className="bg-brand-primary-950/20 text-brand-primary-500 hover:text-brand-primary-400 hover:bg-brand-primary-950/30 border-brand-primary-800/50"
          onClick={handleResetToNamefi}
          isLoading={loadingOperation === 'resetting'}
          disabled={disableAllButtons}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Reset to Namefi Nameservers
        </LoadingButton>
      );
    }, [
      handleResetToNamefi,
      loadingOperation,
      domainDnssecDetails,
      isDnssecLoading,
      disableAllButtons,
    ]);

    const areChanged = useMemo(() => {
      return !arrayEquals(values.nameservers, nameservers);
    }, [values, nameservers]);

    useEffect(() => {
      if (areChanged && submittedChanges) {
        setFieldValue('nameservers', nameservers);
        setSubmittedChanges(false);
      }
    }, [areChanged, nameservers, setFieldValue, submittedChanges]);

    const cancelChanges = useCallback(() => {
      setFieldValue('nameservers', nameservers);
    }, [nameservers, setFieldValue]);

    return (
      <>
        <RequestWalletConnection
          ref={walletConnectionRef}
          onRequestedWalletConnected={handleWalletConnected}
          actionDescription="to change domain nameservers"
        />
        <Form {...form}>
          <div className="flex flex-col gap-2">
            <ActiveNameserversChangeWorkflowBanner
              activeNameserversChangeWorkflow={activeNameserversChangeWorkflow}
              domainName={domainName}
            />

            {resetButton}
            <AnimatePresence mode="sync" presenceAffectsLayout={true}>
              {values.nameservers.map((_, index) => (
                <motion.div
                  {...(shouldReduceMotion
                    ? {}
                    : {
                        exit: { scaleY: 0, opacity: 0.2, top: '10%' },
                        animate: { scaleY: 1, opacity: 1, top: '0%' },
                        initial: { scaleY: 0, opacity: 0.2, top: '-10%' },
                        transition: {
                          duration: 0.5,
                          ease: 'easeInOut',
                          transformOrigin: 'top',
                        },
                      })}
                  style={{
                    transformOrigin: 'top',
                  }}
                  key={`nameserver-motion-${index}`}
                >
                  <FormField
                    control={control}
                    name={`nameservers.${index}`}
                    disabled={disableAllButtons}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm text-zinc-400">
                          Nameserver {index + 1}{' '}
                          {index < 2 && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) =>
                                handleUpdateNameserver(index, e.target.value)
                              }
                              className="bg-zinc-950 border-zinc-800"
                              placeholder="e.g., ns1.example.com"
                            />
                          </FormControl>
                          {values.nameservers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNameserver(index)}
                              className="text-zinc-400 hover:text-red-500"
                              disabled={disableAllButtons}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              ))}

              <div className="flex items-center gap-2 justify-between mt-4">
                {values.nameservers.length < 4 && (
                  <Button
                    variant="outline"
                    onClick={handleAddNameserver}
                    className="w-auto py-1.25 px-5 "
                    disabled={disableAllButtons}
                  >
                    Add nameserver
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  {areChanged ? (
                    <Button
                      variant="destructive"
                      onClick={cancelChanges}
                      disabled={disableAllButtons}
                    >
                      Cancel
                    </Button>
                  ) : (
                    false
                  )}
                  <LoadingButton
                    isLoading={isSubmitting}
                    loadingText="Saving..."
                    className={cn('w-auto py-1.25 px-5')}
                    onClick={handleSubmit(onSubmit)}
                    disabled={
                      isSubmitting ||
                      !isValid ||
                      !areChanged ||
                      disableAllButtons
                    }
                    variant={'default'}
                  >
                    <SaveIcon width={20} height={20} /> Save Changes
                  </LoadingButton>
                </div>
              </div>
            </AnimatePresence>

            <div className="text-sm text-zinc-500 mt-4">
              <p>
                Changes to nameservers can take 24-48 hours to propagate
                globally.
              </p>
            </div>
          </div>
        </Form>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.domainName === nextProps.domainName &&
      arrayEquals(prevProps.nameservers, nextProps.nameservers)
    );
  },
);

function arrayEquals(a: Nameserver[], b: Nameserver[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export const NameserversPanelInner = ({
  domainName,
  nftChainId,
}: {
  domainName: PunycodeDomainName;
  nftChainId: number | bigint;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions({ domainName }),
  );
  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-2 items-start">
          <div className="flex flex-col items-start gap-1 w-full">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-1/12" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 w-full">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-1/12" />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between w-full mt-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-96 mt-4" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NameserversPanelForm
        domainName={domainName}
        nameservers={data?.nameservers ?? []}
        nftChainId={nftChainId}
      />
    </Layout>
  );
};

export const NameserversPanel = ({
  domainName,
  nftChainId,
}: {
  domainName: PunycodeDomainName;
  nftChainId: number | bigint;
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
  const nameserversManagement = useMemo(() => {
    return (
      domainSupportedFeatures.nameserversManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);
  if (!nameserversManagement.config.showPanel) {
    return false;
  }
  if (nameserversManagement.enabled) {
    return (
      <NameserversPanelInner domainName={domainName} nftChainId={nftChainId} />
    );
  }
  if (nameserversManagement.config.message) {
    return (
      <Layout>
        <div
          className="text-center py-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: nameserversManagement.config.message,
          }}
        />
      </Layout>
    );
  }
  return false;
};

/**
 * Get substep display info for a step based on workflow type and step ID.
 */
function getSubstepDisplayInfo(
  workflowType: 'change-nameservers' | 'reset-nameservers' | null,
  stepId: string,
) {
  if (workflowType === 'reset-nameservers') {
    if (stepId === 'change-nameservers') {
      return resetNameserversChangeSubstepDisplayInfo;
    }
    if (stepId === 'enable-dnssec') {
      return resetNameserversEnableDnssecSubstepDisplayInfo;
    }
  }
  // For change-nameservers workflow, disable-dnssec has substeps
  if (stepId === 'disable-dnssec') {
    return changeNameserversSubstepDisplayInfo;
  }
  return undefined;
}

/**
 * Modal component to show nameservers change operation progress
 */
function NameserversProgressModal({
  domainName,
  operation,
  onClose,
}: {
  domainName: string;
  operation: 'CHANGE_NAMESERVERS' | 'RESET_NAMESERVERS';
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [canCancel] = useAdminFeatureFlag(CANCEL_WORKFLOW_FLAG);

  const progress = useChangeNameserversProgress(domainName, {
    enabled: open,
  });

  const cancelMutation = useMutation(
    trpc.domainConfig.cancelNameserversWorkflow.mutationOptions({
      onSuccess() {
        toast.success('Cancellation requested');
        queryClient.invalidateQueries({
          queryKey:
            trpc.domainConfig.queryActiveNameserversChangeWorkflow.queryKey({
              domainName,
            }),
        });
      },
      onError(error) {
        toast.error(`Failed to cancel: ${error.message}`);
      },
    }),
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset stale data before opening
      progress.reset();
    }
    setOpen(isOpen);
    if (!isOpen) {
      onClose?.();
    }
  };

  const title =
    operation === 'RESET_NAMESERVERS'
      ? `Resetting nameservers for ${domainName}`
      : `Changing nameservers for ${domainName}`;

  // Determine which step display info to use based on actual workflow type
  const isResetWorkflow = progress.workflowType === 'reset-nameservers';
  const stepDisplayInfo: Record<string, { label: string; helper: string }> =
    isResetWorkflow
      ? resetNameserversStepDisplayInfo
      : changeNameserversStepDisplayInfo;

  // Create a function to get substep display info per step
  const getSubstepDisplayInfoForStep = useCallback(
    (stepId: string) => getSubstepDisplayInfo(progress.workflowType, stepId),
    [progress.workflowType],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ProgressTimeline
          loading={progress.isLoading}
          steps={progress.steps}
          stepDisplayInfo={stepDisplayInfo}
          getSubstepDisplayInfo={getSubstepDisplayInfoForStep}
          showTitle={false}
          className="border-none"
        />
        {canCancel && (
          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <LoadingButton
              variant="destructive"
              size="sm"
              isLoading={cancelMutation.isPending}
              loadingText="Cancelling..."
              onClick={() => cancelMutation.mutate({ domainName })}
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

export const ActiveNameserversChangeWorkflowBanner = ({
  activeNameserversChangeWorkflow,
  domainName,
}: {
  activeNameserversChangeWorkflow?: AppRouterOutput['domainConfig']['queryActiveNameserversChangeWorkflow'];
  domainName: string;
}) => {
  // Track the last known operation so modal can stay open after workflow completes
  const [lastOperation, setLastOperation] = useState<
    'CHANGE_NAMESERVERS' | 'RESET_NAMESERVERS' | null
  >(null);

  // Update last operation when workflow becomes active
  React.useEffect(() => {
    if (activeNameserversChangeWorkflow?.operation) {
      setLastOperation(
        activeNameserversChangeWorkflow.operation as
          | 'CHANGE_NAMESERVERS'
          | 'RESET_NAMESERVERS',
      );
    }
  }, [activeNameserversChangeWorkflow?.operation]);

  const isActive = !!activeNameserversChangeWorkflow;
  const operation =
    (activeNameserversChangeWorkflow?.operation as
      | 'CHANGE_NAMESERVERS'
      | 'RESET_NAMESERVERS'
      | undefined) ?? lastOperation;

  // Keep component mounted but hidden when no active workflow (to preserve modal state)
  // Only fully unmount if we've never had an operation
  if (!isActive && !lastOperation) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex bg-zinc-800 border-zinc-700 rounded-md p-2 w-full justify-center items-center gap-2',
        !isActive && 'hidden',
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <p>
        {operation === 'RESET_NAMESERVERS'
          ? 'An operation to reset nameservers to Namefi defaults is in progress...'
          : 'An operation to update nameservers is in progress...'}
      </p>
      {operation && (
        <NameserversProgressModal
          domainName={domainName}
          operation={operation}
          onClose={() => setLastOperation(null)}
        />
      )}
    </div>
  );
};
