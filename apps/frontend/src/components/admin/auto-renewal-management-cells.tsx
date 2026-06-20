'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AddToEmailBatchButton } from '@/components/admin/email-batch/add-to-email-batch-button';
import { getTransactionExplorerUrl } from '@/components/admin/bulk-burn-management';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { UserWalletAvatar } from '@/components/user-avatar';

// Shared row type + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type DomainRow = {
  domain: string;
  userId: string;
  userEmail?: string;
  walletAddress?: string;
  registrar?: string;
  chainId?: number;
  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'PAYMENT_FAILED'
    | 'MISSING_PRICE'
    | 'SKIPPED_INSUFFICIENT_FUNDS';
  chargeAmountUsd?: number | null;
  errorReason?: string;
  actionRequired?: string;
  txHash?: string;
  eppOperationStatus?: string;
  /**
   * User-level payment status (SUCCEEDED / FAILED / SKIPPED).
   * Carried on every row of the same user so the group header — which
   * is computed from the currently visible (filtered + paginated) rows —
   * can still display the user-level status without round-tripping back
   * to the full userResults set.
   */
  userPaymentStatus?: string;
  /**
   * Per-user run-start snapshot fields. Same values on every row in the
   * same group; duplicated so the group header (which derives from visible
   * rows) can render balance + payment-method info without a separate map.
   * USD. `availableBalanceInNfsc` is summed across chains at workflow start
   * and does NOT reflect post-charge debits.
   */
  availableBalanceInNfsc?: number;
  nfscBalancesByChain?: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  availablePaymentMethods?: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  /** USD cents short of covering the full original renewal bill. */
  shortfallInUsdCents?: number;
  snapshotTakenAt?: string;
  /** All payments for the user this domain belongs to. Same array on every row in the same group. */
  payments?: Array<{
    provider: string;
    /** Amount in USD cents (1 USD = 100 cents). */
    amountInUsdCents: number;
    /**
     * Provider-specific external reference.
     * - Stripe: Payment Intent ID (e.g. `pi_...`)
     * - NFSC / X402 / MPP: on-chain transaction hash
     */
    paymentProviderReferenceId?: string;
  }>;
};

// ─── Pure helpers ────────────────────────────────────────────────

export function getStatusBadge(status: DomainRow['status']) {
  switch (status) {
    case 'SUCCESS':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-300 text-green-300"
        >
          <CheckCircle2 className="w-3 h-3" />
          Success
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="outline" className="gap-1 border-red-300 text-red-300">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case 'PAYMENT_FAILED':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-200 text-amber-200"
        >
          <AlertTriangle className="w-3 h-3" />
          Could Not Charge
        </Badge>
      );
    case 'SKIPPED_INSUFFICIENT_FUNDS':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-300/80 text-amber-300/80"
        >
          <Clock className="w-3 h-3" />
          Deferred — Low Balance
        </Badge>
      );
    case 'MISSING_PRICE':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-orange-300 text-orange-300"
        >
          <AlertTriangle className="w-3 h-3" />
          Missing Price
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return `$${amount.toFixed(2)}`;
}

/**
 * Build a provider-specific external URL for a single payment.
 *
 * - Stripe → Stripe dashboard payment intent page (https://dashboard.stripe.com/payments/<pi_...>).
 * - NFSC_BASE / X402 / MPP → Base block explorer (chain 8453).
 * - NFSC_ETHEREUM → Ethereum mainnet block explorer (chain 1).
 * - NFSC_ETHEREUM_SEPOLIA → Sepolia testnet block explorer (chain 11155111).
 * - Anything else → null.
 *
 * For on-chain providers, prefers the payment-specific reference (the actual
 * settlement tx hash from `paymentsTable.paymentProviderReferenceId`), but
 * falls back to the renewal-tx hash from the row when that field is missing
 * (e.g. for older payments that predate the reference being persisted, or
 * providers that didn't record one). This matches the previous behavior
 * where the cell linked to the renewal tx hash.
 */
export function getPaymentExplorerUrl(
  provider: string,
  reference: string | undefined,
  renewalTxHash?: string,
  renewalChainId?: number,
): string | null {
  if (provider === 'STRIPE') {
    if (!reference) return null;
    return `https://dashboard.stripe.com/payments/${reference}`;
  }
  // Map provider → chain id for on-chain settlements.
  const providerChainId =
    provider === 'NFSC_ETHEREUM'
      ? 1
      : provider === 'NFSC_ETHEREUM_SEPOLIA'
        ? 11155111
        : 8453; // NFSC_BASE, X402, MPP — all default to Base mainnet

  // Prefer the payment-specific settlement tx hash; fall back to the
  // renewal tx hash on the same row (which always lives on the NFT chain).
  if (reference) {
    return getTransactionExplorerUrl(providerChainId, reference);
  }
  if (renewalTxHash && renewalChainId) {
    return getTransactionExplorerUrl(renewalChainId, renewalTxHash);
  }
  return null;
}

export function formatRegistrar(registrar: string | undefined): string {
  switch (registrar) {
    case 'dynadot_gdg':
      return 'Dynadot (GDG)';
    case 'dynadot_regular':
      return 'Dynadot (Regular)';
    case 'route53':
      return 'Route 53';
    default:
      return registrar || 'Unknown';
  }
}

// ─── Cell components ─────────────────────────────────────────────
// Each is a tiny presentational component the desktop column `cell` and the
// mobile card both call, so values/links/actions stay identical across layouts.

/** Monospaced domain name. */
export function DomainCell({ domain }: { domain: string }) {
  return <span className="font-mono text-xs">{domain}</span>;
}

/** Owner wallet avatar (admin-openable), or "-". */
export function WalletCell({ row }: { row: DomainRow }) {
  return row.walletAddress ? (
    <UserWalletAvatar
      address={row.walletAddress}
      adminOpenTarget="wallet"
      userId={row.userId}
      className="size-6"
    />
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );
}

/** Truncated owner email linked to the admin user-lookup, or "-". */
export function OwnerEmailCell({ row }: { row: DomainRow }) {
  return row.userEmail ? (
    <AdminUserLookupButton
      reference={{ userId: row.userId }}
      variant="ghost"
      size="sm"
      className="h-auto px-0 py-0 text-xs hover:underline justify-start max-w-[200px]"
    >
      <TruncatedTextWithHover maxLength={24}>
        {row.userEmail}
      </TruncatedTextWithHover>
    </AdminUserLookupButton>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );
}

/** Truncated owner id linked to the admin user-lookup. */
export function OwnerIdCell({ row }: { row: DomainRow }) {
  return (
    <AdminUserLookupButton
      reference={{ userId: row.userId }}
      variant="ghost"
      size="sm"
      className="h-auto px-0 py-0 text-xs font-mono hover:underline justify-start max-w-[140px]"
    >
      <TruncatedTextWithHover maxLength={12}>
        {row.userId}
      </TruncatedTextWithHover>
    </AdminUserLookupButton>
  );
}

/** Status badge. */
export function StatusCell({ status }: { status: DomainRow['status'] }) {
  return getStatusBadge(status);
}

/** Registrar label. */
export function RegistrarCell({
  registrar,
}: {
  registrar: string | undefined;
}) {
  return <span className="text-sm">{formatRegistrar(registrar)}</span>;
}

/** Charge amount in USD. */
export function ChargeCell({
  chargeAmountUsd,
}: {
  chargeAmountUsd: number | null | undefined;
}) {
  return (
    <span className="text-sm font-mono">{formatUsd(chargeAmountUsd)}</span>
  );
}

/** Per-payment provider + amount, each linked to its explorer when known. */
export function PaymentsCell({ row }: { row: DomainRow }) {
  const payments = row.payments;
  if (!payments || payments.length === 0)
    return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {payments.map((p, i) => {
        const url = getPaymentExplorerUrl(
          p.provider,
          p.paymentProviderReferenceId,
          row.txHash,
          row.chainId,
        );
        const inner = (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-muted-foreground">{p.provider}</span>
            <span className="font-mono">
              ${(p.amountInUsdCents / 100).toFixed(2)}
            </span>
            {url && <ExternalLink className="h-3 w-3 opacity-60" />}
          </span>
        );
        return url ? (
          <a
            key={`${p.provider}-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:underline text-blue-300"
            title={`View on ${p.provider === 'STRIPE' ? 'Stripe dashboard' : 'block explorer'}`}
          >
            {inner}
          </a>
        ) : (
          <div key={`${p.provider}-${i}`}>{inner}</div>
        );
      })}
    </div>
  );
}

/** Error reason + optional action-required badge (with contact-user mailto). */
export function ErrorActionCell({ row }: { row: DomainRow }) {
  if (!row.errorReason) return <span className="text-sm">-</span>;
  const isContactAction = row.actionRequired === 'Contact user about payment';
  const canEmail = isContactAction && row.userEmail;
  return (
    <div className="flex flex-col gap-0.5 max-w-[250px]">
      <span className="text-xs text-red-400">
        <TruncatedTextWithHover maxLength={40}>
          {row.errorReason}
        </TruncatedTextWithHover>
      </span>
      {row.actionRequired &&
        (canEmail ? (
          (() => {
            const subject = `Domain Renewal Issue: ${row.domain}`;
            const body =
              'Hi,\n\n' +
              `We noticed an issue with the renewal of your domain ${row.domain}.\n\n` +
              `Reason: ${row.errorReason ?? 'Unknown'}\n\n` +
              'Please contact us if you need assistance.';
            const params = new URLSearchParams({ subject, body });
            const href = `mailto:${row.userEmail}?${params.toString()}`;
            return (
              <>
                <a href={href} onClick={(e) => e.stopPropagation()}>
                  <Badge
                    variant="outline"
                    className="text-xs w-fit border-blue-300 text-blue-300 hover:bg-blue-300/10 cursor-pointer"
                  >
                    {row.actionRequired}
                  </Badge>
                </a>
                <AddToEmailBatchButton
                  email={row.userEmail}
                  userId={row.userId}
                />
              </>
            );
          })()
        ) : (
          <Badge variant="outline" className="text-xs w-fit">
            {row.actionRequired}
          </Badge>
        ))}
    </div>
  );
}

/** Truncated tx hash with copy + explorer-link affordances, or "-". */
export function TxHashCell({ row }: { row: DomainRow }) {
  if (!row.txHash) return <span className="text-sm">-</span>;
  const hash = row.txHash;
  const url = row.chainId ? getTransactionExplorerUrl(row.chainId, hash) : null;
  return (
    <div className="flex items-center gap-1 max-w-[160px]">
      <span className="font-mono text-xs flex-1 min-w-0">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={8}
          minCharactersToDisplay={8}
        >
          {hash}
        </AutoTruncateTextV2>
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0"
        title="Copy tx hash"
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(hash);
            toast.success('Copied tx hash');
          } catch {
            toast.error('Failed to copy');
          }
        }}
      >
        <Copy className="h-3 w-3" />
      </Button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="View on explorer"
          className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
