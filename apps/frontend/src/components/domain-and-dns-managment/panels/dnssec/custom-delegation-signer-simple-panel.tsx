'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldPlusIcon,
  ShieldXIcon,
  Trash2Icon,
} from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/buttons/loading-button';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useInvalidateNotifications } from '@/hooks/use-invalidate-notifications';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
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

import type { ActiveSigner, PendingSigner } from './delegation-signers-table';

type DnssecStatusDetails =
  AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];
type EnableStatus =
  AppRouterOutput['domainConfig']['dnssec']['getCustomDnssecEnableStatus'];
type EnableResult =
  AppRouterOutput['domainConfig']['dnssec']['enableCustomDnssec'];

export type CustomDelegationSignerSimplePanelProps = {
  domainName: PunycodeDomainName;
  dnssecDetails: DnssecStatusDetails;
  disableAllButtons: boolean;
};

export function CustomDelegationSignerSimplePanel({
  domainName,
  dnssecDetails,
  disableAllButtons,
}: CustomDelegationSignerSimplePanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const customSigners = (dnssecDetails.delegationSigners ??
    []) as ActiveSigner[];

  const { data: pendingResult } = useQuery(
    trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryOptions(
      { domainName },
      { refetchInterval: 15_000 },
    ),
  );
  const pending = pendingResult?.pending ?? [];

  // Refresh the bell when a deferred-DS workflow settles — observed as
  // the pending-signers list shrinking (an entry leaves the list whether
  // it succeeded, timed out, or failed). The deferred-DS activity writes
  // an in-app notification on every terminal outcome.
  const invalidateNotifications = useInvalidateNotifications();
  const prevPendingCount = useRef(pending.length);
  useEffect(() => {
    if (pending.length < prevPendingCount.current) {
      invalidateNotifications();
    }
    prevPendingCount.current = pending.length;
  }, [pending.length, invalidateNotifications]);

  const {
    data: status,
    isLoading: isStatusLoading,
    isRefetching: isStatusRefetching,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useQuery(
    trpc.domainConfig.dnssec.getCustomDnssecEnableStatus.queryOptions(
      { domainName },
      { refetchInterval: 30_000 },
    ),
  );

  const enableMutation = useMutation(
    trpc.domainConfig.dnssec.enableCustomDnssec.mutationOptions({
      async onSuccess(data) {
        const counts = countOutcomes(data.results);
        toast.success(buildSuccessToast(counts));
        await refetchAll(queryClient, trpc, domainName);
        // Registrar + Temporal state can lag a moment after the mutation
        // returns (deferred workflows in particular need a beat to register
        // as RUNNING). Re-poll at 1s and 3s so the UI catches up without
        // the user having to hit Refresh.
        setTimeout(() => {
          void refetchAll(queryClient, trpc, domainName);
        }, 1000);
        setTimeout(() => {
          void refetchAll(queryClient, trpc, domainName);
        }, 3000);
      },
      onError(error) {
        toast.error(`Couldn't enable DNSSEC: ${error.message}`);
      },
    }),
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <ReadinessCard
        status={status}
        isLoading={isStatusLoading}
        isRefetching={isStatusRefetching}
        isError={isStatusError}
        pending={pending}
        activeSigners={customSigners}
        domainName={domainName}
        onEnable={() => enableMutation.mutate({ domainName })}
        onRecheck={() => {
          void refetchStatus();
        }}
        enabling={enableMutation.isPending}
        disabled={disableAllButtons}
      />
    </div>
  );
}

async function refetchAll(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  domainName: PunycodeDomainName,
) {
  // Force refetch over invalidate: workflow-listing queries
  // (`getPendingDeferredDelegationSigners`) and registrar state must update
  // the UI immediately after a mutation, not whenever a stale-window
  // happens to lapse.
  await Promise.all([
    queryClient.refetchQueries({
      queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
        domainName,
      }),
    }),
    queryClient.refetchQueries({
      queryKey:
        trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryKey({
          domainName,
        }),
    }),
    queryClient.refetchQueries({
      queryKey: trpc.domainConfig.dnssec.getCustomDnssecEnableStatus.queryKey({
        domainName,
      }),
    }),
  ]);
}

type OutcomeCounts = {
  immediate: number;
  deferred: number;
  skipped: number;
};

function countOutcomes(results: EnableResult['results']): OutcomeCounts {
  const counts: OutcomeCounts = { immediate: 0, deferred: 0, skipped: 0 };
  for (const r of results) {
    if (r.outcome === 'submitted-immediate') counts.immediate += 1;
    else if (r.outcome === 'submitted-deferred') counts.deferred += 1;
    else counts.skipped += 1;
  }
  return counts;
}

function buildSuccessToast(counts: OutcomeCounts): string {
  const parts: string[] = [];
  if (counts.immediate > 0) parts.push(`${counts.immediate} active`);
  if (counts.deferred > 0) parts.push(`${counts.deferred} pending validation`);
  if (counts.skipped > 0 && parts.length === 0) {
    return `DNSSEC already enabled (${counts.skipped} key${counts.skipped > 1 ? 's' : ''})`;
  }
  if (parts.length === 0) return 'DNSSEC enable submitted.';
  return `DNSSEC submitted (${parts.join(', ')})`;
}

function ReadinessCard({
  status,
  isLoading,
  isRefetching,
  isError,
  pending,
  activeSigners,
  domainName,
  onEnable,
  onRecheck,
  enabling,
  disabled,
}: {
  status: EnableStatus | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  pending: PendingSigner[];
  activeSigners: ActiveSigner[];
  domainName: PunycodeDomainName;
  onEnable: () => void;
  onRecheck: () => void;
  enabling: boolean;
  disabled: boolean;
}) {
  // Pending takes precedence: the user just clicked Enable and a deferred
  // workflow is now polling. Show the pending card regardless of what the
  // readiness query reports (it might still be `'ready'` until the DS lands
  // at the registrar).
  if (pending.length > 0) {
    return (
      <PendingCard
        pending={pending}
        domainName={domainName}
        disabled={disabled}
      />
    );
  }

  // Status missing: separate the loading case (initial fetch / refetch) from
  // the error case (registrar API failure, DNS lookup throw, etc.). Without
  // the split, an error after the first load would silently show the spinner
  // forever.
  if (!status) {
    if (isLoading || isRefetching) return <DetectingCard />;
    if (isError) return <ErrorCard onRecheck={onRecheck} />;
    return <DetectingCard />;
  }

  if (status.readiness === 'mismatch') {
    return (
      <MismatchCard
        detectedProvider={status.detectedProvider}
        activeSigners={activeSigners}
        domainName={domainName}
        disabled={disabled}
      />
    );
  }
  if (status.readiness === 'already-active') {
    // `status` and `activeSigners` come from separate queries
    // (`getCustomDnssecEnableStatus` vs `getDomainDnssecDetails`). If the
    // status query flips to `'already-active'` before the details refetch
    // catches up, this would render "0 DS records" with a disabled
    // Disable button. Show the detecting state until both align.
    if (activeSigners.length === 0) {
      return <DetectingCard />;
    }
    return (
      <AlreadyActiveCard
        activeSigners={activeSigners}
        domainName={domainName}
        disabled={disabled}
      />
    );
  }
  if (status.readiness === 'ready') {
    return (
      <ReadyCard
        kskCount={status.kskCount}
        sampleNameservers={status.sampleNameservers}
        onEnable={onEnable}
        enabling={enabling}
        disabled={disabled}
      />
    );
  }
  return (
    <NoDnskeyCard
      detectedProvider={status.detectedProvider}
      sampleNameservers={status.sampleNameservers}
      onRecheck={onRecheck}
      isRefetching={isRefetching}
    />
  );
}

function DetectingCard() {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500">
      Detecting DNSKEY at your nameservers…
    </div>
  );
}

function ErrorCard({ onRecheck }: { onRecheck: () => void }) {
  const tDns = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">
            {tDns('status.checkFailedTitle')}
          </p>
          <p className="text-xs text-zinc-400">
            We couldn't reach your registrar or nameservers. Try again in a
            moment.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onRecheck}
          className="text-xs"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          {tCommon('actions.tryAgain')}
        </Button>
      </div>
    </div>
  );
}

function PendingCard({
  pending,
  domainName,
  disabled,
}: {
  pending: PendingSigner[];
  domainName: PunycodeDomainName;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const tDns = useTranslations('dnsManagement');
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelMutation = useMutation(
    trpc.domainConfig.dnssec.cancelDeferredDelegationSigner.mutationOptions({}),
  );

  const handleCancelAll = async () => {
    setIsCancelling(true);
    try {
      let cancelled = 0;
      let failed = 0;
      for (const item of pending) {
        const result = await cancelOneWorkflow(
          item.workflowId,
          domainName,
          (input) => cancelMutation.mutateAsync(input),
        );
        if (result === 'cancelled') cancelled += 1;
        else failed += 1;
      }
      notifyCancelResult(cancelled, failed, pending.length);
      await refetchAll(queryClient, trpc, domainName);
      setCancelDialogOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const keyWord = pending.length === 1 ? 'key' : 'keys';
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Loader2Icon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-spin" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">
            {tDns('status.pendingTitle')}
          </p>
          <p className="text-xs text-zinc-400">
            Waiting for your DNSSEC {keyWord} to propagate globally. Usually a
            few hours, up to 48. We'll email you when it's done.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                disabled={disabled || pending.length === 0}
              >
                {tDns('actions.cancelSetup')}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Cancel DNSSEC setup{pending.length === 1 ? '' : 's'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This stops the validation poll for{' '}
                {pending.length === 1
                  ? 'your pending DNSSEC key'
                  : `all ${pending.length} pending DNSSEC keys`}
                . No DS will be associated. You can start again any time by
                clicking Enable DNSSEC.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                {tDns('actions.keepWaiting')}
              </AlertDialogCancel>
              <AlertDialogAction
                render={
                  <LoadingButton
                    variant="destructive"
                    isLoading={isCancelling}
                    loadingText="Cancelling…"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleCancelAll();
                    }}
                  >
                    {tDns('actions.cancelSetup')}
                  </LoadingButton>
                }
              />
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AlreadyActiveCard({
  activeSigners,
  domainName,
  disabled,
}: {
  activeSigners: ActiveSigner[];
  domainName: PunycodeDomainName;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const tCommon = useTranslations('common');
  const tDns = useTranslations('dnsManagement');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const disassociateMutation = useMutation(
    trpc.domainConfig.dnssec.disassociateDelegationSigner.mutationOptions({}),
  );

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      let removed = 0;
      let failed = 0;
      for (const signer of activeSigners) {
        const result = await removeOneSigner(signer, domainName, (input) =>
          disassociateMutation.mutateAsync(input),
        );
        if (result === 'removed') removed += 1;
        else failed += 1;
      }
      notifyRemoveResult(removed, failed, activeSigners.length);
      await refetchAll(queryClient, trpc, domainName);
      setDisableDialogOpen(false);
    } finally {
      setIsDisabling(false);
    }
  };

  const count = activeSigners.length;
  const recordWord = count === 1 ? 'DS record' : 'DS records';

  return (
    <div className="rounded-md border border-green-500/30 bg-green-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">
            {tDns('status.activeTitle')}
          </p>
          <p className="text-xs text-zinc-400">
            Your domain is signed with {count} {recordWord}. Disable to remove
            the {recordWord} and turn DNSSEC off.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <AlertDialog
          open={disableDialogOpen}
          onOpenChange={setDisableDialogOpen}
        >
          <AlertDialogTrigger
            render={
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                disabled={disabled || count === 0}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                {tDns('actions.disable')}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tDns('disableDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {count} {recordWord} at the registrar and turns
                DNSSEC off for this domain. You can re-enable it any time by
                clicking Enable DNSSEC.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDisabling}>
                {tCommon('actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                render={
                  <LoadingButton
                    variant="destructive"
                    isLoading={isDisabling}
                    loadingText="Disabling…"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDisable();
                    }}
                  >
                    {tCommon('actions.disable')}
                  </LoadingButton>
                }
              />
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ReadyCard({
  kskCount,
  sampleNameservers,
  onEnable,
  enabling,
  disabled,
}: {
  kskCount: number;
  sampleNameservers: string[];
  onEnable: () => void;
  enabling: boolean;
  disabled: boolean;
}) {
  const tDns = useTranslations('dnsManagement');
  const kskWord = kskCount === 1 ? 'DNSKEY' : 'DNSKEYs';
  const sample = firstAndMore(sampleNameservers);
  return (
    <div className="rounded-md border border-green-500/30 bg-green-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ShieldPlusIcon className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">
            {tDns('actions.enable')}
          </p>
          <p className="text-xs text-zinc-400">
            We detected{' '}
            <span className="text-zinc-200">
              {kskCount} {kskWord}
            </span>{' '}
            at your nameservers
            {sample ? (
              <>
                {' ('}
                <span className="font-mono text-zinc-300">{sample}</span>
                {')'}
              </>
            ) : null}
            . Click Enable to set it up.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <LoadingButton
          variant="default"
          isLoading={enabling}
          loadingText="Enabling…"
          disabled={disabled}
          onClick={onEnable}
        >
          <ShieldPlusIcon className="h-4 w-4" />
          {tDns('actions.enable')}
        </LoadingButton>
      </div>
    </div>
  );
}

function NoDnskeyCard({
  detectedProvider,
  sampleNameservers,
  onRecheck,
  isRefetching,
}: {
  detectedProvider: EnableStatus['detectedProvider'];
  sampleNameservers: string[];
  onRecheck: () => void;
  isRefetching: boolean;
}) {
  const providerName =
    detectedProvider.name !== 'unknown' ? detectedProvider.name : null;
  const setupUrl = detectedProvider.dnssecSetupUrl;
  const title = `Enable DNSSEC at ${providerName || 'your DNS provider'} first`;
  const body = `We checked your nameservers and it seems DNSSEC is not enabled. Enable DNSSEC at ${providerName || 'your DNS provider'}, then come back to enable it here.`;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ShieldXIcon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-400">{body}</p>
          {sampleNameservers.length > 0 ? (
            <p className="text-xs text-zinc-500 mt-1">
              Detected nameservers:{' '}
              <span className="font-mono text-zinc-400">
                {firstAndMore(sampleNameservers)}
              </span>
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRecheck}
          disabled={isRefetching}
          className="text-xs"
        >
          <RefreshCwIcon
            className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`}
          />
          Re-check
        </Button>
        {setupUrl && providerName ? (
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            render={
              <a href={setupUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                Open {providerName} DNSSEC setup
              </a>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function MismatchCard({
  detectedProvider,
  activeSigners,
  domainName,
  disabled,
}: {
  detectedProvider: EnableStatus['detectedProvider'];
  activeSigners: ActiveSigner[];
  domainName: PunycodeDomainName;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const tDns = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const providerName =
    detectedProvider.name !== 'unknown' ? detectedProvider.name : null;
  const setupUrl = detectedProvider.dnssecSetupUrl;

  const disassociateMutation = useMutation(
    trpc.domainConfig.dnssec.disassociateDelegationSigner.mutationOptions({}),
  );

  const handleRemoveAll = async () => {
    setIsRemoving(true);
    try {
      let removed = 0;
      let failed = 0;
      for (const signer of activeSigners) {
        const result = await removeOneSigner(signer, domainName, (input) =>
          disassociateMutation.mutateAsync(input),
        );
        if (result === 'removed') removed += 1;
        else failed += 1;
      }
      notifyRemoveResult(removed, failed, activeSigners.length);
      await refetchAll(queryClient, trpc, domainName);
      setRemoveDialogOpen(false);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-zinc-100">
            {tDns('status.misconfiguredTitle')}
          </p>
          <p className="text-xs text-zinc-400">
            A DNSSEC is enabled here, but it's not enabled on your custom
            nameservers. Either enable it at{' '}
            {providerName || 'your DNS provider'}, or remove the DS record.
          </p>
          <p className="text-xs text-zinc-400">
            If no action is taken, Namefi will automatically fix it for you to
            avoid issues with your domain.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                disabled={disabled || activeSigners.length === 0}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                Remove DS record{activeSigners.length === 1 ? '' : 's'}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {activeSigners.length} DS record
                {activeSigners.length === 1 ? '' : 's'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This disassociates every DS at the registrar. DNSSEC will be
                turned off for this domain. You can re-enable it later once your
                DNS provider is publishing a DNSKEY again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>
                {tCommon('actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                render={
                  <LoadingButton
                    variant="destructive"
                    isLoading={isRemoving}
                    loadingText="Removing…"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleRemoveAll();
                    }}
                  >
                    {tCommon('actions.remove')}
                  </LoadingButton>
                }
              />
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {setupUrl && providerName ? (
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            render={
              <a href={setupUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                Open {providerName} DNSSEC setup
              </a>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function resolveKeyId(signer: ActiveSigner): string | null {
  if (signer.id) return signer.id;
  if (signer.publicKey) return signer.publicKey;
  if (typeof signer.keyTag === 'number') return String(signer.keyTag);
  return null;
}

async function cancelOneWorkflow(
  workflowId: string,
  domainName: PunycodeDomainName,
  mutate: (input: {
    domainName: PunycodeDomainName;
    workflowId: string;
  }) => Promise<unknown>,
): Promise<'cancelled' | 'failed'> {
  try {
    await mutate({ domainName, workflowId });
    return 'cancelled';
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: surfaced via toast at caller
    console.error('Failed to cancel deferred-DS workflow', {
      workflowId,
      error,
    });
    return 'failed';
  }
}

function notifyCancelResult(
  cancelled: number,
  failed: number,
  total: number,
): void {
  if (failed === 0) {
    toast.success(
      `Cancelled ${cancelled} pending setup${cancelled === 1 ? '' : 's'}.`,
    );
    return;
  }
  if (cancelled > 0) {
    toast.warning(
      `Cancelled ${cancelled} of ${total} pending setups. ${failed} couldn't be cancelled.`,
    );
    return;
  }
  toast.error('Failed to cancel pending setup.');
}

async function removeOneSigner(
  signer: ActiveSigner,
  domainName: PunycodeDomainName,
  mutate: (input: {
    domainName: PunycodeDomainName;
    keyId: string;
  }) => Promise<unknown>,
): Promise<'removed' | 'failed'> {
  const keyId = resolveKeyId(signer);
  if (!keyId) return 'failed';
  try {
    await mutate({ domainName, keyId });
    return 'removed';
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: surfaced via toast at caller
    console.error('Failed to remove DS', { keyId, error });
    return 'failed';
  }
}

function notifyRemoveResult(
  removed: number,
  failed: number,
  total: number,
): void {
  if (failed === 0) {
    toast.success(`Removed ${removed} DS record${removed === 1 ? '' : 's'}.`);
    return;
  }
  if (removed > 0) {
    toast.warning(
      `Removed ${removed} of ${total} DS records. ${failed} couldn't be removed.`,
    );
    return;
  }
  toast.error('Failed to remove DS records.');
}

function firstAndMore(items: string[]) {
  if (items.length > 0) {
    const first = items.slice(0, 1);
    const remaining = items.slice(1);
    const remainingCount = remaining.length;
    if (remainingCount <= 1) {
      return items.join(', ');
    }

    return [first, `+${remainingCount} more`].join(', ');
  }
  return null;
}
