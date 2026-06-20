'use client';

import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { ReactNode } from 'react';
import type {
  FinancialOrderItemRow,
  FinancialOrderRow,
  FinancialPaymentRow,
} from './types';
import {
  formatChain,
  formatDateTime,
  formatInteger,
  formatPaymentChain,
  formatUsdCents,
} from './utils';

// ---------------------------------------------------------------------------
// Shared per-cell rendering. The desktop table columns (`columns.tsx`), the raw
// sub-tables, AND the mobile cards all render from these helpers so the layouts
// can never drift — one source of truth for status pills, mono IDs, amounts and
// timestamps. Only the surrounding layout differs (wide table row vs. compact
// iOS-style grouped-list card).
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  return (
    <Badge
      variant="outline"
      className={cn('w-fit', getStatusClassName(status))}
    >
      {status}
    </Badge>
  );
}

function getStatusClassName(status: string) {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'created':
    case 'processing':
    case 'requires_capture':
    case 'requires_action':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'refund_requested':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function MonoId({ value }: { value: string }) {
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={10}
      minCharactersToDisplay={10}
      className="font-mono text-xs"
    >
      {value}
    </AutoTruncateTextV2>
  );
}

function DomainNameValue({ row }: { row: FinancialOrderItemRow }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{row.normalizedDomainName}</span>
      {row.metadataAutoRenew && <Badge variant="outline">Auto-renew</Badge>}
    </div>
  );
}

function AmountValue({ cents }: { cents: number }) {
  return <span className="font-medium">{formatUsdCents(cents)}</span>;
}

/**
 * One detail row of a mobile card: label pinned to the start, value to the end —
 * the iOS grouped-list convention, matching `my-domains/domain-card.tsx` and
 * `parked-domains/parked-domain-card.tsx`.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
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
 * Mobile card for a single order-item row (EDT `renderMobileCard`). Reuses the
 * exact same cell helpers as the desktop columns; only the layout differs.
 */
export function OrderItemCard({ row }: { row: FinancialOrderItemRow }) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <DomainNameValue row={row} />
        </div>
        <StatusBadge status={row.status} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Order">
          <MonoId value={row.orderId} />
        </CardRow>
        <CardRow label="Order Created">
          {formatDateTime(row.orderCreatedAt)}
        </CardRow>
        <CardRow label="Item ID">
          <MonoId value={row.orderItemId} />
        </CardRow>
        <CardRow label="Type">
          <StatusBadge status={row.type} />
        </CardRow>
        <CardRow label="Registrar">{row.registrar}</CardRow>
        <CardRow label="Item Amount (USD)">
          <AmountValue cents={row.amountInUsdCents} />
        </CardRow>
        <CardRow label="Years">{formatInteger(row.durationInYears)}</CardRow>
        <CardRow label="User">{row.userEmail ?? '-'}</CardRow>
        <CardRow label="Item Created">{formatDateTime(row.createdAt)}</CardRow>
      </dl>
    </Card>
  );
}

/**
 * Mobile card for a single payment row (EDT `renderMobileCard`). Reuses the
 * exact same cell helpers as the desktop columns; only the layout differs.
 */
export function PaymentCard({ row }: { row: FinancialPaymentRow }) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <MonoId value={row.paymentId} />
        </div>
        <StatusBadge status={row.status} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Order">
          <MonoId value={row.orderId} />
        </CardRow>
        <CardRow label="Order Created">
          {formatDateTime(row.orderCreatedAt)}
        </CardRow>
        <CardRow label="Provider">{row.paymentProvider}</CardRow>
        <CardRow label="Gross (USD)">
          <AmountValue cents={row.grossAmountInUsdCents} />
        </CardRow>
        <CardRow label="Refunds (USD)">
          <AmountValue cents={row.refundAmountInUsdCents} />
        </CardRow>
        <CardRow label="Net (USD)">
          <AmountValue cents={row.netAmountInUsdCents} />
        </CardRow>
        <CardRow label="Payment Chain">{formatPaymentChain(row.chain)}</CardRow>
        <CardRow label="Reference ID">
          {row.paymentProviderReferenceId ?? '-'}
        </CardRow>
        <CardRow label="User">{row.userEmail ?? '-'}</CardRow>
        <CardRow label="Payment Created">
          {formatDateTime(row.createdAt)}
        </CardRow>
      </dl>
    </Card>
  );
}

/**
 * Mobile card for a single order row (EDT `renderMobileCard`). Surfaces every
 * meaningful column and the same expanded item/payment sub-content the desktop
 * row reveals on expand — reusing the shared helpers.
 */
export function OrderCard({
  row,
  children,
}: {
  row: FinancialOrderRow;
  children?: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="flex items-start justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <MonoId value={row.orderId} />
        </div>
        <StatusBadge status={row.orderStatus} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Order Created">{formatDateTime(row.createdAt)}</CardRow>
        <CardRow label="User">{row.userEmail ?? '-'}</CardRow>
        <CardRow label="Order Amount (USD)">
          <AmountValue cents={row.amountInUsdCents} />
        </CardRow>
        <CardRow label="Gross (USD)">
          <AmountValue cents={row.grossAmountInUsdCents} />
        </CardRow>
        <CardRow label="Refunds (USD)">
          <AmountValue cents={row.refundAmountInUsdCents} />
        </CardRow>
        <CardRow label="Net (USD)">
          <AmountValue cents={row.netAmountInUsdCents} />
        </CardRow>
        <CardRow label="Items">{formatInteger(row.itemCount)}</CardRow>
        <CardRow label="Payments">{formatInteger(row.paymentCount)}</CardRow>
        <CardRow label="NFT Chain">{formatChain(row.nftChainId)}</CardRow>
        <CardRow label="Receiving Wallet">
          {row.nftWalletAddress ?? '-'}
        </CardRow>
      </dl>
      {children ? (
        <div className="border-t border-border/50 px-3.5 py-3">{children}</div>
      ) : null}
    </Card>
  );
}

/**
 * Mobile card for one order-item inside the expanded order sub-content. Mirrors
 * the columns of the desktop `OrderItemsSubTable` raw table.
 */
export function OrderItemSubCard({ item }: { item: FinancialOrderItemRow }) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="px-3.5 py-3">
        <DomainNameValue row={item} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Type">{item.type}</CardRow>
        <CardRow label="Registrar">{item.registrar}</CardRow>
        <CardRow label="Status">
          <StatusBadge status={item.status} />
        </CardRow>
        <CardRow label="Amount (USD)">
          <AmountValue cents={item.amountInUsdCents} />
        </CardRow>
        <CardRow label="Created">{formatDateTime(item.createdAt)}</CardRow>
      </dl>
    </Card>
  );
}

/**
 * Mobile card for one payment inside the expanded order sub-content. Mirrors the
 * columns of the desktop `PaymentsSubTable` raw table.
 */
export function PaymentSubCard({ payment }: { payment: FinancialPaymentRow }) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="px-3.5 py-3 font-mono text-xs">{payment.paymentId}</div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Provider">{payment.paymentProvider}</CardRow>
        <CardRow label="Status">
          <StatusBadge status={payment.status} />
        </CardRow>
        <CardRow label="Chain">{formatPaymentChain(payment.chain)}</CardRow>
        <CardRow label="Gross (USD)">
          <AmountValue cents={payment.grossAmountInUsdCents} />
        </CardRow>
        <CardRow label="Refunds (USD)">
          <AmountValue cents={payment.refundAmountInUsdCents} />
        </CardRow>
        <CardRow label="Net (USD)">
          <AmountValue cents={payment.netAmountInUsdCents} />
        </CardRow>
        <CardRow label="Refund IDs">
          {payment.refunds.length > 0
            ? payment.refunds.map((refund) => refund.id).join(', ')
            : '-'}
        </CardRow>
        <CardRow label="Created">{formatDateTime(payment.createdAt)}</CardRow>
      </dl>
    </Card>
  );
}
