'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { ShieldCheckIcon, ShieldXIcon } from 'lucide-react';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';
import { UserWalletAvatar } from '@/components/user-avatar';
import type {
  DnsvizAnalysisRow,
  DnsvizAnalysisStatus,
} from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';

// Shared cell logic so the desktop data-table columns and the mobile card
// render identical values from the same source — and likewise for the
// per-analysis errors/warnings rows and their mobile card stack
// (switch layout, reuse logic).

export const STATUS_BADGE_VARIANT: Record<
  DnsvizAnalysisStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SECURE: 'default',
  INSECURE: 'secondary',
  BOGUS: 'destructive',
  ERROR: 'destructive',
  // Reclassified buckets — the underlying row landed in BOGUS/ERROR
  // but the indexed-domain state explains why, so it's not actionable.
  EXPECTED_ERROR: 'outline',
  WARN: 'secondary',
};

/** Verdict status pill. */
export function StatusBadge({ status }: { status: DnsvizAnalysisStatus }) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className="font-mono text-xs">
      {status}
    </Badge>
  );
}

/** `YYYY-MM-DD` analysis date in monospace. */
export function AnalysisDateCell({ analysisDate }: { analysisDate: string }) {
  return <span className="text-sm font-mono">{analysisDate}</span>;
}

/** Domain name as inline code + the admin details button. */
export function DomainNameCell({
  normalizedDomainName,
}: {
  normalizedDomainName: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {normalizedDomainName}
      </code>
      <AdminDomainDetailsButton
        domainName={normalizedDomainName}
        size="icon-xs"
      />
    </div>
  );
}

/** Registrar key in muted text. */
export function RegistrarCell({ registrarKey }: { registrarKey: string }) {
  return <span className="text-xs text-muted-foreground">{registrarKey}</span>;
}

/**
 * NFT-owner + Namefi user, joined server-side from
 * `namefi_nft_owners_view` → `privy_users` → `users`. All fields nullable —
 * AD_HOC dnsviz rows (third-party domains run via the on-demand workflow)
 * have no NFT and no Namefi user.
 */
export function UserCell({ row }: { row: DnsvizAnalysisRow }) {
  const { userId, ownerAddress } = row;
  if (!userId && !ownerAddress) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const tail = ownerAddress
    ? `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`
    : null;
  return (
    <div className="flex items-center gap-2">
      <UserWalletAvatar
        address={ownerAddress ?? undefined}
        userId={userId ?? undefined}
        className="size-6 rounded-md"
      />
      <div className="flex flex-col leading-tight">
        {userId ? (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={14}
            minCharactersToDisplay={10}
            className="text-xs"
          >
            {userId}
          </AutoTruncateTextV2>
        ) : (
          <span className="text-xs text-amber-600">No user</span>
        )}
        {tail ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {tail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Single-cell badge for `is_using_namefi_nameservers`. Split out of the
 * combined "Nameservers" cell so the column is filterable on its own.
 * Renders Namefi / Custom / Unknown explicitly to avoid collapsing null
 * into "Custom".
 */
export function NamefiNsBadgeCell({ value }: { value: boolean | null }) {
  if (value == null) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Unknown
      </Badge>
    );
  }
  if (value === true) {
    return (
      <Badge variant="secondary" className="text-xs">
        Namefi
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      Custom
    </Badge>
  );
}

/** Just the list of NS hostnames; the Namefi/Custom badge moved to its
 *  own column above. */
export function NameserversListCell({ row }: { row: DnsvizAnalysisRow }) {
  if (row.nameservers == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (row.nameservers.length === 0) {
    return <span className="text-xs text-amber-600">Not indexed</span>;
  }
  return (
    <ul className="text-xs text-muted-foreground font-mono leading-tight">
      {row.nameservers.map((ns) => (
        <li key={ns}>{ns}</li>
      ))}
    </ul>
  );
}

/**
 * Each of the three DNSSEC signals from `indexed_domains.dnssec_status`
 * gets its own column so it's individually filterable. Each cell handles
 * the null / true / false trichotomy with a fixed 4×4 icon (`size-4`)
 * for consistent column widths.
 */
export function SupportsDnssecCell({ value }: { value: boolean | null }) {
  if (value == null) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <ShieldXIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Unknown</span>
      </div>
    );
  }
  if (value === true) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheckIcon className="size-4 text-green-500" />
        <span>Yes</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <ShieldXIcon className="size-4 text-red-500" />
      <span>No</span>
    </div>
  );
}

export function ZoneSigningCell({ value }: { value: boolean | null }) {
  if (value == null) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <ShieldXIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Unknown</span>
      </div>
    );
  }
  if (value === true) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheckIcon className="size-4 text-green-500" />
        <span>On</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <ShieldXIcon className="size-4 text-red-500" />
      <span>Off</span>
    </div>
  );
}

/**
 * Combines the two DS flags (`hasDelegationSigner` +
 * `isUsingNamefiDelegationSigner`) into a single 4-state cell — Namefi
 * DS / Custom DS / No DS / Unknown. They're inherently coupled (you
 * can't have "Namefi DS" without "has DS"), so a single column is the
 * right granularity even though the underlying source has two booleans.
 */
export function DsStatusCell({
  hasDs,
  isNamefiDs,
}: {
  hasDs: boolean | null;
  isNamefiDs: boolean | null;
}) {
  if (hasDs == null || isNamefiDs == null) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <ShieldXIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Unknown</span>
      </div>
    );
  }
  if (hasDs === true) {
    return isNamefiDs === true ? (
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheckIcon className="size-4 text-green-500" />
        <span>Namefi DS</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheckIcon className="size-4 text-amber-500" />
        <span>Custom DS</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <ShieldXIcon className="size-4 text-red-500" />
      <span>No DS</span>
    </div>
  );
}

/** Errors count, destructive when non-zero, with an optional ignored tail. */
export function ErrorsCountCell({ row }: { row: DnsvizAnalysisRow }) {
  const n = row.errorsCount;
  const ignored = row.summary?.ignoredErrorsCount ?? 0;
  return (
    <span
      className={
        n > 0
          ? 'text-sm font-mono text-destructive'
          : 'text-sm font-mono text-muted-foreground'
      }
    >
      {n}
      {ignored > 0 ? (
        <span className="ms-1 text-muted-foreground">({ignored} ignored)</span>
      ) : null}
    </span>
  );
}

/** Derived one-line reasoning for the verdict. */
export function ReasoningCell({ reasoning }: { reasoning: string }) {
  return <span className="text-xs text-muted-foreground">{reasoning}</span>;
}

/** Format the analysis-started timestamp as `YYYY-MM-DD HH:mm UTC`. */
export function formatAnalyzedAt(analysisStartedAt: Date): string {
  return format(new UTCDate(analysisStartedAt), "yyyy-MM-dd HH:mm 'UTC'");
}

/** Analyzed-at timestamp in muted text. */
export function AnalyzedAtCell({
  analysisStartedAt,
}: {
  analysisStartedAt: Date;
}) {
  return (
    <span className="text-xs text-muted-foreground">
      {formatAnalyzedAt(analysisStartedAt)}
    </span>
  );
}

/**
 * One labeled detail row of the card: label pinned to the start, value to the
 * end — the iOS grouped-list (Settings) convention, matching the other admin
 * mobile cards (`nft-management-card`, `parked-domain-card`).
 */
export function CardRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card for a single DNSViz analysis row. Reuses the same cell components
 * and helpers the desktop data-table columns use (`StatusBadge`, `UserCell`,
 * the DNSSEC trichotomy cells, the actions cell, …) so the values and actions
 * stay identical — only the layout differs: a compact iOS-style grouped list.
 * `selectControl` / `actions` are forwarded from the page so the row's checkbox
 * and the actions cell stay wired to the same handlers as the desktop rows.
 */
export function DnsvizAnalysisCard({
  row,
  selectControl,
  actions,
}: {
  row: DnsvizAnalysisRow;
  selectControl: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <DomainNameCell normalizedDomainName={row.normalizedDomainName} />
        </div>
        <div className="shrink-0">{selectControl}</div>
      </div>

      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Date">
          <AnalysisDateCell analysisDate={row.analysisDate} />
        </CardRow>

        <CardRow label="Status">
          <StatusBadge status={row.status} />
        </CardRow>

        <CardRow label="Registrar">
          <RegistrarCell registrarKey={row.registrarKey} />
        </CardRow>

        <CardRow label="User">
          <div className="w-full max-w-[220px]">
            <UserCell row={row} />
          </div>
        </CardRow>

        <CardRow label="Namefi NS">
          <NamefiNsBadgeCell value={row.isUsingNamefiNameservers} />
        </CardRow>

        <CardRow label="Nameservers">
          <NameserversListCell row={row} />
        </CardRow>

        <CardRow label="Supports DNSSEC">
          <SupportsDnssecCell value={row.supportsDnssec} />
        </CardRow>

        <CardRow label="Zone Signing">
          <ZoneSigningCell value={row.dnssecZoneHasActiveDnssec} />
        </CardRow>

        <CardRow label="DS Status">
          <DsStatusCell
            hasDs={row.dnssecHasDelegationSigner}
            isNamefiDs={row.dnssecIsUsingNamefiDelegationSigner}
          />
        </CardRow>

        <CardRow label="Errors">
          <ErrorsCountCell row={row} />
        </CardRow>

        <CardRow label="Reasoning">
          <ReasoningCell reasoning={row.reasoning} />
        </CardRow>

        <CardRow label="Analyzed">
          <AnalyzedAtCell analysisStartedAt={row.analysisStartedAt} />
        </CardRow>
      </dl>

      <div className="border-t border-border/50 px-3.5 py-3">{actions}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Per-analysis errors/warnings — shared cells for the desktop table rows and
// the mobile card stack inside the details dialog.
// ---------------------------------------------------------------------------

/** One zone/code/description/path entry in the details dialog. */
export type DnsvizDetailMessage = {
  zone: string;
  path: string;
  code: string | null;
  description: string;
  ignored: boolean;
};

/** Code cell: the code (or em-dash) plus an "ignored" badge when applicable. */
export function MessageCodeCell({ message }: { message: DnsvizDetailMessage }) {
  return (
    <>
      {message.code ?? '—'}
      {message.ignored ? (
        <Badge variant="outline" className="ms-1 text-[10px]">
          ignored
        </Badge>
      ) : null}
    </>
  );
}

/**
 * Mobile card for a single error/warning message in the details dialog. Reuses
 * `MessageCodeCell` so the code + ignored badge match the desktop table row;
 * only the layout differs (a labeled grouped list instead of a table row).
 */
export function DnsvizMessageCard({
  message,
}: {
  message: DnsvizDetailMessage;
}) {
  return (
    <Card
      className={`gap-0 overflow-hidden px-0 py-0 ${
        message.ignored ? 'opacity-60' : ''
      }`}
    >
      <dl className="divide-y divide-border/50">
        <CardRow label="Zone">
          <span className="font-mono text-xs">{message.zone}</span>
        </CardRow>
        <CardRow label="Code">
          <span className="font-mono text-xs">
            <MessageCodeCell message={message} />
          </span>
        </CardRow>
        <CardRow label="Description">
          <span className="text-xs">{message.description}</span>
        </CardRow>
        <CardRow label="Path">
          <span className="font-mono text-[10px] text-muted-foreground break-all">
            {message.path}
          </span>
        </CardRow>
      </dl>
    </Card>
  );
}
