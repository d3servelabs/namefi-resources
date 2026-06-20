'use client';

import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type { z } from 'zod';
import type { parkedDomainVerificationSchema } from '@namefi-astra/common/contract/admin/admin-parked-domains-contract';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';

// Shared types + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type VerificationResult = z.infer<typeof parkedDomainVerificationSchema>;
export type CheckStatus = VerificationResult['overall'];

export type ParkedDomainRow = {
  normalizedDomainName: string;
  ownerAddress: string | null;
  chainId: number;
  forwardTo: string | null;
  mode: 'park' | 'forward';
};

export const STATUS_META: Record<
  CheckStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  pass: {
    label: 'Pass',
    className: 'bg-green-100 text-green-800 border-green-300',
    Icon: CheckCircle2,
  },
  warn: {
    label: 'Warn',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
    Icon: AlertTriangle,
  },
  fail: {
    label: 'Fail',
    className: 'bg-red-100 text-red-800 border-red-300',
    Icon: XCircle,
  },
  skipped: {
    label: 'N/A',
    className: 'bg-muted text-muted-foreground border-border',
    Icon: MinusCircle,
  },
};

/** Status pill for a single check, with an optional hover detail tooltip. */
export function StatusBadge({
  status,
  detail,
}: {
  status?: CheckStatus;
  detail?: string;
}) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  const badge = (
    <Badge variant="outline" className={cn('w-fit gap-1', meta.className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
  if (!detail) return badge;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="cursor-help" />}>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{detail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Park / Forward mode pill — shared by the desktop column and the card. */
export function ModeBadge({ mode }: { mode: ParkedDomainRow['mode'] }) {
  return (
    <Badge
      variant="outline"
      className={
        mode === 'forward'
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
      }
    >
      {mode === 'forward' ? 'Forward' : 'Park'}
    </Badge>
  );
}

/** Truncated forward target, or an em-dash when the row is a park. */
export function ForwardToValue({ forwardTo }: { forwardTo: string | null }) {
  if (!forwardTo) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={28}
      minCharactersToDisplay={14}
    >
      {forwardTo}
    </AutoTruncateTextV2>
  );
}

/** Domain name with the inline admin "domain details" button. */
export function DomainNameCell({ domainName }: { domainName: string }) {
  return (
    <div className="flex items-center gap-1">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={32}
        minCharactersToDisplay={16}
        className="font-medium"
      >
        {domainName}
      </AutoTruncateTextV2>
      <AdminDomainDetailsButton domainName={domainName} size="icon-xs" />
    </div>
  );
}

function CheckRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: CheckStatus;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-16 shrink-0 font-medium">{label}</span>
      <StatusBadge status={status} />
      <span className="flex-1 text-muted-foreground">{detail}</span>
    </div>
  );
}

/** Full per-domain verification breakdown shown behind the "Details" button. */
export function VerificationDetailDialog({
  result,
}: {
  result: VerificationResult;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Details
      </DialogTrigger>
      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, '!max-w-2xl')}>
        <DialogHeader>
          <DialogTitle className="break-all">{result.domain}</DialogTitle>
          <DialogDescription>
            {result.mode === 'forward'
              ? `Forward → ${result.forwardTo}`
              : 'Parking page'}{' '}
            · checked {new Date(result.checkedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <CheckRow
            label="DNS"
            status={result.dns.status}
            detail={result.dns.detail}
          />
          <div className="space-y-0.5 pl-4 text-xs text-muted-foreground">
            <div>
              Expected A {result.dns.expected.a} · AAAA{' '}
              {result.dns.expected.aaaa}
            </div>
            <div>
              Observed A {result.dns.observed.a.join(', ') || '—'} · AAAA{' '}
              {result.dns.observed.aaaa.join(', ') || '—'}
            </div>
            {result.dns.gateEnabled ? (
              <div>
                Gate TXT {result.dns.gateTxtPresent ? 'present' : 'missing'}
              </div>
            ) : null}
            {result.dns.redirectTxt ? (
              <div>Redirect TXT → {result.dns.redirectTxt}</div>
            ) : null}
          </div>
          <CheckRow
            label="SSL"
            status={result.ssl.status}
            detail={result.ssl.detail}
          />
          {result.ssl.validTo ? (
            <div className="pl-4 text-xs text-muted-foreground">
              Issuer {result.ssl.issuer ?? '—'} · expires{' '}
              {new Date(result.ssl.validTo).toLocaleDateString()} (
              {result.ssl.daysUntilExpiry} days)
            </div>
          ) : null}
          <CheckRow
            label="Serving"
            status={result.serving.status}
            detail={result.serving.detail}
          />
          <CheckRow
            label="Redirect"
            status={result.redirect.status}
            detail={result.redirect.detail}
          />
          {result.redirect.redirectChain.length > 0 ? (
            <div className="space-y-0.5 pl-4 text-xs text-muted-foreground">
              {result.redirect.redirectChain.map((hop) => (
                <div key={`${hop.status}-${hop.location}`}>
                  {hop.status} → {hop.location}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
