'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/buttons/loading-button';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
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
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

export type ActiveSigner = {
  id?: string;
  keyTag?: number;
  algorithm?: number;
  digestType?: number;
  digest?: string;
  publicKey?: string;
};

export type PendingSigner =
  AppRouterOutput['domainConfig']['dnssec']['getPendingDeferredDelegationSigners']['pending'][number];

type DisplayRow =
  | { kind: 'active'; signer: ActiveSigner }
  | { kind: 'pending'; pending: PendingSigner };

export type DelegationSignersTableProps = {
  domainName: PunycodeDomainName;
  activeSigners: ActiveSigner[];
  pendingSigners: PendingSigner[];
  disableAllButtons: boolean;
  /** Copy shown when no active or pending DS rows exist. */
  emptyMessage?: string;
};

/**
 * Shared active+pending DS table used by both the Simple and Advanced
 * custom-DNSSEC panels. Rows render their own destructive actions
 * (disassociate for active, cancel-workflow for pending) so the table
 * stays unchanged across modes.
 */
export function DelegationSignersTable({
  domainName,
  activeSigners,
  pendingSigners,
  disableAllButtons,
  emptyMessage = 'No delegation signers associated yet.',
}: DelegationSignersTableProps) {
  const rows: DisplayRow[] = [
    ...activeSigners.map((signer) => ({ kind: 'active' as const, signer })),
    ...pendingSigners.map((p) => ({ kind: 'pending' as const, pending: p })),
  ];

  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500 italic">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-800">
      <table className="w-full text-xs">
        <thead className="bg-zinc-900/60 text-zinc-400">
          <tr>
            <th className="text-start p-2">Key tag</th>
            <th className="text-start p-2">Algorithm</th>
            <th className="text-start p-2">Digest type</th>
            <th className="text-start p-2">Digest</th>
            <th className="text-end p-2 w-10" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row, idx) =>
            row.kind === 'active' ? (
              <ActiveSignerRow
                key={`active-${row.signer.keyTag ?? idx}-${row.signer.digest ?? idx}`}
                domainName={domainName}
                signer={row.signer}
                disabled={disableAllButtons}
              />
            ) : (
              <PendingSignerRow
                key={`pending-${row.pending.workflowId}`}
                domainName={domainName}
                pending={row.pending}
                disabled={disableAllButtons}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActiveSignerRow({
  domainName,
  signer,
  disabled,
}: {
  domainName: PunycodeDomainName;
  signer: ActiveSigner;
  disabled: boolean;
}) {
  return (
    <tr className="border-t border-zinc-800">
      <td className="p-2">{signer.keyTag ?? '—'}</td>
      <td className="p-2">{signer.algorithm ?? '—'}</td>
      <td className="p-2">{signer.digestType ?? '—'}</td>
      <td className="p-2 truncate max-w-[28ch]" title={signer.digest ?? ''}>
        {signer.digest ?? '—'}
      </td>
      <td className="p-2 text-end">
        <DisassociateButton
          domainName={domainName}
          signer={signer}
          disabled={disabled}
        />
      </td>
    </tr>
  );
}

function PendingSignerRow({
  domainName,
  pending,
  disabled,
}: {
  domainName: PunycodeDomainName;
  pending: PendingSigner;
  disabled: boolean;
}) {
  return (
    <tr className="border-t border-zinc-800">
      <td className="p-2">
        <div className="flex items-center gap-1.5">
          <span>{pending.signingConfig.keyTag}</span>
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-300 border-amber-500/30"
          >
            Pending
          </Badge>
          <PendingPhaseTooltip pending={pending} />
        </div>
      </td>
      <td className="p-2">{pending.signingConfig.algorithm}</td>
      <td className="p-2">{pending.signingConfig.digestType}</td>
      <td
        className="p-2 truncate max-w-[28ch]"
        title={pending.signingConfig.digest}
      >
        {pending.signingConfig.digest}
      </td>
      <td className="p-2 text-end">
        <CancelDeferredButton
          domainName={domainName}
          pending={pending}
          disabled={disabled}
        />
      </td>
    </tr>
  );
}

function PendingPhaseTooltip({ pending }: { pending: PendingSigner }) {
  const tooltipBody = describePendingPhase(pending);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex h-4 w-4 items-center justify-center text-zinc-500 cursor-help" />
          }
        >
          <InfoIcon className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipBody}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function describePendingPhase(pending: PendingSigner): string {
  // `authoritativeTimeoutMs` and `publicDnsTimeoutMs` are *phase-specific*
  // — they're the `failThresholdMs` passed into each `pollWithTimeoutAlert`
  // call, counted from the moment that phase's polling starts (not from
  // workflow start). Use `phaseStartedAtMs` when available; fall back to
  // workflow start for the auth phase since they coincide there.
  const phaseStart = pending.phaseStartedAtMs ?? pending.startedAtMs;
  switch (pending.phase) {
    case 'await-authoritative-validation': {
      const remaining = formatRemaining(
        phaseStart + pending.authoritativeTimeoutMs - Date.now(),
      );
      return `Awaiting authoritative-NS validation. Times out in ~${remaining}.`;
    }
    case 'await-public-dns-validation': {
      const remaining = formatRemaining(
        phaseStart + pending.publicDnsTimeoutMs - Date.now(),
      );
      return `Awaiting public-DNS propagation. Times out in ~${remaining}.`;
    }
    case 'submit-to-registrar':
      return 'Validation passed; submitting DS to the registrar.';
  }
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'now';
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function resolveSignerKeyId(signer: ActiveSigner): string | null {
  if (signer.id) return signer.id;
  if (signer.publicKey) return signer.publicKey;
  if (typeof signer.keyTag === 'number') return String(signer.keyTag);
  return null;
}

function DisassociateButton({
  domainName,
  signer,
  disabled,
}: {
  domainName: PunycodeDomainName;
  signer: ActiveSigner;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const keyId = resolveSignerKeyId(signer);

  const mutation = useMutation(
    trpc.domainConfig.dnssec.disassociateDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          `Removed delegation signer${signer.keyTag ? ` (key tag ${signer.keyTag})` : ''}`,
        );
        await queryClient.refetchQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        });
        setOpen(false);
      },
      onError(error) {
        toast.error(`Failed to remove delegation signer: ${error.message}`);
      },
    }),
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-red-400"
            disabled={disabled || !keyId}
            aria-label="Remove delegation signer"
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove delegation signer?</AlertDialogTitle>
          <AlertDialogDescription>
            This disassociates the DS at the registrar.{' '}
            {signer.keyTag ? `Key tag ${signer.keyTag}. ` : ''}If this is the
            only DS for the domain, DNSSEC validation will break globally within
            a few hours. Make sure you've already published a replacement at the
            parent or are intentionally turning DNSSEC off.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={
              <LoadingButton
                variant="destructive"
                isLoading={mutation.isPending}
                loadingText="Removing..."
                onClick={(event) => {
                  event.preventDefault();
                  if (!keyId) {
                    toast.error(
                      'Cannot determine which key to remove (no id, publicKey, or keyTag).',
                    );
                    return;
                  }
                  mutation.mutate({ domainName, keyId });
                }}
              >
                Remove
              </LoadingButton>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelDeferredButton({
  domainName,
  pending,
  disabled,
}: {
  domainName: PunycodeDomainName;
  pending: PendingSigner;
  disabled: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation(
    trpc.domainConfig.dnssec.cancelDeferredDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          `Cancelled deferred submission (key tag ${pending.signingConfig.keyTag})`,
        );
        await queryClient.refetchQueries({
          queryKey:
            trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryKey(
              { domainName },
            ),
        });
        setOpen(false);
      },
      onError(error) {
        toast.error(`Failed to cancel: ${error.message}`);
      },
    }),
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-red-400"
            disabled={disabled}
            aria-label="Cancel deferred DS submission"
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel deferred DS submission?</AlertDialogTitle>
          <AlertDialogDescription>
            This stops the validation poll for key tag{' '}
            {pending.signingConfig.keyTag}. No DS will be associated. The
            submission can be retried later by clicking Enable DNSSEC again or
            from the Add Delegation Signer dialog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep waiting</AlertDialogCancel>
          <AlertDialogAction
            render={
              <LoadingButton
                variant="destructive"
                isLoading={mutation.isPending}
                loadingText="Cancelling..."
                onClick={(event) => {
                  event.preventDefault();
                  mutation.mutate({
                    domainName,
                    workflowId: pending.workflowId,
                  });
                }}
              >
                Cancel submission
              </LoadingButton>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
