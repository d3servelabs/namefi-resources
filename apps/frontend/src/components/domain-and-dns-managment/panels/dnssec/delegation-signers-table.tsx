'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import type { ReactNode } from 'react';

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
  emptyMessage,
}: DelegationSignersTableProps) {
  const t = useTranslations('dnsManagement');
  const tDomains = useTranslations('domains');
  const isMobile = useIsMobile();

  const rows: DisplayRow[] = [
    ...activeSigners.map((signer) => ({ kind: 'active' as const, signer })),
    ...pendingSigners.map((p) => ({ kind: 'pending' as const, pending: p })),
  ];

  if (rows.length === 0) {
    return (
      <p
        className="text-xs text-zinc-500 italic"
        data-testid="dnsManagement.delegation-signers.empty"
      >
        {emptyMessage ?? t('dnssecPanel.signersTable.empty')}
      </p>
    );
  }

  if (isMobile) {
    // Mobile: a vertical stack of cards built from the SAME rows and SAME
    // action buttons as the desktop table — only the layout differs (a
    // labeled grouped list instead of a wide table row).
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="dnsManagement.delegation-signers.list"
      >
        {rows.map((row, idx) =>
          row.kind === 'active' ? (
            <ActiveSignerCard
              key={`active-${row.signer.keyTag ?? idx}-${row.signer.digest ?? idx}`}
              domainName={domainName}
              signer={row.signer}
              disabled={disableAllButtons}
            />
          ) : (
            <PendingSignerCard
              key={`pending-${row.pending.workflowId}`}
              domainName={domainName}
              pending={row.pending}
              disabled={disableAllButtons}
            />
          ),
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-zinc-800">
      {/* desktop-only table; mobile renders cards via useIsMobile above */}
      <table
        className="w-full text-xs" /* mobile-ok */
        data-testid="dnsManagement.delegation-signers.table"
      >
        <thead className="bg-zinc-900/60 text-zinc-400">
          <tr>
            <th className="text-start p-2">
              {t('dnssecPanel.signersTable.keyTag')}
            </th>
            <th className="text-start p-2">
              {t('dnssecPanel.signersTable.algorithm')}
            </th>
            <th className="text-start p-2">
              {t('dnssecPanel.signersTable.digestType')}
            </th>
            <th className="text-start p-2">
              {t('dnssecPanel.signersTable.digest')}
            </th>
            <th
              className="text-end p-2 w-10"
              aria-label={tDomains('dnssec.actionsAriaLabel')}
            />
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

/**
 * One labeled detail row of a mobile DS card: label pinned to the start, value
 * to the end (the iOS grouped-list convention), mirroring DomainTable's card.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <dt className="shrink-0 pt-0.5 text-[13px] text-zinc-400">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-end font-mono">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card for an active DS row. Renders the SAME key-tag/algorithm/
 * digest-type/digest values and the SAME DisassociateButton as the desktop
 * ActiveSignerRow — only the layout differs.
 */
function ActiveSignerCard({
  domainName,
  signer,
  disabled,
}: {
  domainName: PunycodeDomainName;
  signer: ActiveSigner;
  disabled: boolean;
}) {
  return (
    <Card
      className="gap-0 overflow-hidden px-0 py-0"
      data-testid={`dnsManagement.delegation-signers.row.${signer.keyTag ?? signer.id ?? signer.digest ?? 'unknown'}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="font-mono text-sm font-medium text-zinc-200">
          {signer.keyTag ?? '—'}
        </span>
        <DisassociateButton
          domainName={domainName}
          signer={signer}
          disabled={disabled}
        />
      </div>
      <dl className="divide-y divide-zinc-800 border-t border-zinc-800 text-xs">
        <CardRow label="Algorithm">{signer.algorithm ?? '—'}</CardRow>
        <CardRow label="Digest type">{signer.digestType ?? '—'}</CardRow>
        <CardRow label="Digest">
          <span className="break-all" title={signer.digest ?? ''}>
            {signer.digest ?? '—'}
          </span>
        </CardRow>
      </dl>
    </Card>
  );
}

/**
 * Mobile card for a pending (deferred) DS row. Reuses the SAME pending badge,
 * phase tooltip, signing-config values and CancelDeferredButton as the desktop
 * PendingSignerRow.
 */
function PendingSignerCard({
  domainName,
  pending,
  disabled,
}: {
  domainName: PunycodeDomainName;
  pending: PendingSigner;
  disabled: boolean;
}) {
  return (
    <Card
      className="gap-0 overflow-hidden px-0 py-0"
      data-testid={`dnsManagement.delegation-signers.pending-row.${pending.workflowId}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="font-mono text-sm font-medium text-zinc-200">
            {pending.signingConfig.keyTag}
          </span>
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-300 border-amber-500/30"
          >
            Pending
          </Badge>
          <PendingPhaseTooltip pending={pending} />
        </div>
        <CancelDeferredButton
          domainName={domainName}
          pending={pending}
          disabled={disabled}
        />
      </div>
      <dl className="divide-y divide-zinc-800 border-t border-zinc-800 text-xs">
        <CardRow label="Algorithm">{pending.signingConfig.algorithm}</CardRow>
        <CardRow label="Digest type">
          {pending.signingConfig.digestType}
        </CardRow>
        <CardRow label="Digest">
          <span className="break-all" title={pending.signingConfig.digest}>
            {pending.signingConfig.digest}
          </span>
        </CardRow>
      </dl>
    </Card>
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
    <tr
      className="border-t border-zinc-800"
      data-testid={`dnsManagement.delegation-signers.row.${signer.keyTag ?? signer.id ?? signer.digest ?? 'unknown'}`}
    >
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
  const t = useTranslations('dnsManagement');
  return (
    <tr
      className="border-t border-zinc-800"
      data-testid={`dnsManagement.delegation-signers.pending-row.${pending.workflowId}`}
    >
      <td className="p-2">
        <div className="flex items-center gap-1.5">
          <span>{pending.signingConfig.keyTag}</span>
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-300 border-amber-500/30"
          >
            {t('dnssecPanel.signersTable.pending')}
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
  const t = useTranslations('dnsManagement');
  const tooltipBody = describePendingPhase(pending, t);
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

type DnsManagementTranslator = ReturnType<
  typeof useTranslations<'dnsManagement'>
>;

function describePendingPhase(
  pending: PendingSigner,
  t: DnsManagementTranslator,
): string {
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
        t,
      );
      return t('dnssecPanel.signersTable.phaseAuthoritative', { remaining });
    }
    case 'await-public-dns-validation': {
      const remaining = formatRemaining(
        phaseStart + pending.publicDnsTimeoutMs - Date.now(),
        t,
      );
      return t('dnssecPanel.signersTable.phasePublicDns', { remaining });
    }
    case 'submit-to-registrar':
      return t('dnssecPanel.signersTable.phaseSubmit');
  }
}

function formatRemaining(ms: number, t: DnsManagementTranslator): string {
  if (ms <= 0) return t('dnssecPanel.signersTable.remainingNow');
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0)
    return t('dnssecPanel.signersTable.remainingMinutes', { minutes });
  return t('dnssecPanel.signersTable.remainingHoursMinutes', {
    hours,
    minutes,
  });
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
  const t = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const keyId = resolveSignerKeyId(signer);

  const mutation = useMutation(
    trpc.domainConfig.dnssec.disassociateDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          t('dnssecPanel.signersTable.removeSuccess', {
            keyTagSuffix: signer.keyTag
              ? t('dnssecPanel.signersTable.removeSuccessKeyTagSuffix', {
                  keyTag: signer.keyTag,
                })
              : '',
          }),
        );
        await queryClient.refetchQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        });
        setOpen(false);
      },
      onError(error) {
        toast.error(
          t('dnssecPanel.signersTable.removeFailed', { error: error.message }),
        );
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
            aria-label={t('dnssecPanel.signersTable.removeAria')}
            data-testid={`dnsManagement.delegation-signers.remove-button.${keyId ?? signer.keyTag ?? 'unknown'}`}
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dnssecPanel.signersTable.removeTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('dnssecPanel.signersTable.removeDescription', {
              keyTagSuffix: signer.keyTag
                ? t('dnssecPanel.signersTable.removeKeyTagSuffix', {
                    keyTag: signer.keyTag,
                  })
                : '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            render={
              <LoadingButton
                variant="destructive"
                isLoading={mutation.isPending}
                loadingText={t('dnssecPanel.signersTable.removing')}
                onClick={(event) => {
                  event.preventDefault();
                  if (!keyId) {
                    toast.error(t('dnssecPanel.signersTable.noKeyId'));
                    return;
                  }
                  mutation.mutate({ domainName, keyId });
                }}
                data-testid="dnsManagement.delegation-signers.remove-confirm-button"
              >
                {t('dnssecPanel.signersTable.remove')}
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
  const t = useTranslations('dnsManagement');
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation(
    trpc.domainConfig.dnssec.cancelDeferredDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          t('dnssecPanel.signersTable.cancelSuccess', {
            keyTag: pending.signingConfig.keyTag,
          }),
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
        toast.error(
          t('dnssecPanel.signersTable.cancelFailed', { error: error.message }),
        );
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
            aria-label={t('dnssecPanel.signersTable.cancelDeferredAria')}
            data-testid={`dnsManagement.delegation-signers.cancel-pending-button.${pending.workflowId}`}
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dnssecPanel.signersTable.cancelDeferredTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('dnssecPanel.signersTable.cancelDeferredDescription', {
              keyTag: pending.signingConfig.keyTag,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.keepWaiting')}</AlertDialogCancel>
          <AlertDialogAction
            render={
              <LoadingButton
                variant="destructive"
                isLoading={mutation.isPending}
                loadingText={t('dnssecPanel.signersTable.cancelling')}
                onClick={(event) => {
                  event.preventDefault();
                  mutation.mutate({
                    domainName,
                    workflowId: pending.workflowId,
                  });
                }}
                data-testid="dnsManagement.delegation-signers.cancel-pending-confirm-button"
              >
                {t('dnssecPanel.signersTable.cancelSubmission')}
              </LoadingButton>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
