'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  MonoId,
  OrderItemSubCard,
  PaymentSubCard,
  StatusBadge,
} from './financials-cells';
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
import { forwardRef } from 'react';

export function buildOrderItemColumns(): ColumnDef<FinancialOrderItemRow>[] {
  return [
    expandColumn<FinancialOrderItemRow>(),
    orderIdColumn<FinancialOrderItemRow>(),
    {
      accessorKey: 'orderCreatedAt',
      header: 'Order Created',
      cell: ({ row }) => formatDateTime(row.original.orderCreatedAt),
      size: 140,
    },
    {
      accessorKey: 'orderItemId',
      header: 'Item ID',
      cell: ({ row }) => <MonoId value={row.original.orderItemId} />,
      size: 140,
    },
    {
      accessorKey: 'normalizedDomainName',
      header: 'Domain',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {row.original.normalizedDomainName}
          </span>
          {row.original.metadataAutoRenew && (
            <Badge variant="outline">Auto-renew</Badge>
          )}
        </div>
      ),
      size: 260,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
      size: 120,
    },
    {
      accessorKey: 'registrar',
      header: 'Registrar',
      cell: ({ row }) => row.original.registrar,
      size: 140,
    },
    {
      accessorKey: 'status',
      header: 'Item Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 140,
    },
    amountColumn<FinancialOrderItemRow>('amountInUsdCents', 'Item Amount'),
    {
      accessorKey: 'durationInYears',
      header: 'Years',
      cell: ({ row }) => formatInteger(row.original.durationInYears),
      size: 90,
    },
    userEmailColumn<FinancialOrderItemRow>(),
    {
      accessorKey: 'createdAt',
      header: 'Item Created',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      size: 140,
    },
  ];
}

export function buildPaymentColumns(): ColumnDef<FinancialPaymentRow>[] {
  return [
    expandColumn<FinancialPaymentRow>(),
    orderIdColumn<FinancialPaymentRow>(),
    {
      accessorKey: 'orderCreatedAt',
      header: 'Order Created',
      cell: ({ row }) => formatDateTime(row.original.orderCreatedAt),
      size: 140,
    },
    {
      accessorKey: 'paymentId',
      header: 'Payment ID',
      cell: ({ row }) => <MonoId value={row.original.paymentId} />,
      size: 140,
    },
    {
      accessorKey: 'paymentProvider',
      header: 'Provider',
      cell: ({ row }) => row.original.paymentProvider,
      size: 150,
    },
    {
      accessorKey: 'status',
      header: 'Payment Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 150,
    },
    amountColumn<FinancialPaymentRow>('grossAmountInUsdCents', 'Gross'),
    amountColumn<FinancialPaymentRow>('refundAmountInUsdCents', 'Refunds'),
    amountColumn<FinancialPaymentRow>('netAmountInUsdCents', 'Net'),
    {
      accessorKey: 'chain',
      header: 'Payment Chain',
      cell: ({ row }) => formatPaymentChain(row.original.chain),
      size: 150,
      enableSorting: false,
    },
    {
      accessorKey: 'paymentProviderReferenceId',
      header: 'Reference ID',
      cell: ({ row }) => row.original.paymentProviderReferenceId ?? '-',
      size: 220,
    },
    userEmailColumn<FinancialPaymentRow>(),
    {
      accessorKey: 'createdAt',
      header: 'Payment Created',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      size: 150,
    },
  ];
}

export function buildOrderColumns(): ColumnDef<FinancialOrderRow>[] {
  return [
    expandColumn<FinancialOrderRow>(),
    orderIdColumn<FinancialOrderRow>(),
    {
      accessorKey: 'createdAt',
      header: 'Order Created',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      size: 140,
    },
    userEmailColumn<FinancialOrderRow>(),
    {
      accessorKey: 'orderStatus',
      header: 'Order Status',
      cell: ({ row }) => <StatusBadge status={row.original.orderStatus} />,
      size: 140,
    },
    amountColumn<FinancialOrderRow>('amountInUsdCents', 'Order Amount'),
    amountColumn<FinancialOrderRow>('grossAmountInUsdCents', 'Gross'),
    amountColumn<FinancialOrderRow>('refundAmountInUsdCents', 'Refunds'),
    amountColumn<FinancialOrderRow>('netAmountInUsdCents', 'Net'),
    {
      accessorKey: 'itemCount',
      header: 'Items',
      cell: ({ row }) => formatInteger(row.original.itemCount),
      size: 100,
    },
    {
      accessorKey: 'paymentCount',
      header: 'Payments',
      cell: ({ row }) => formatInteger(row.original.paymentCount),
      size: 110,
    },
    {
      accessorKey: 'nftChainId',
      header: 'NFT Chain',
      cell: ({ row }) => formatChain(row.original.nftChainId),
      size: 130,
    },
    {
      accessorKey: 'nftWalletAddress',
      header: 'Receiving Wallet',
      cell: ({ row }) => row.original.nftWalletAddress ?? '-',
      size: 220,
    },
  ];
}

export function renderOrderItemGroupHeader(row: Row<FinancialOrderItemRow>) {
  const visibleRows: Array<Row<FinancialOrderItemRow>> =
    row.subRows.length > 0 ? row.subRows : row.getLeafRows();
  const first = visibleRows[0]?.original;
  if (!first) return null;
  return (
    <OrderGroupHeaderShell
      orderId={first.orderId}
      orderStatus={first.orderStatus}
      createdAt={first.orderCreatedAt}
      userEmail={first.userEmail}
      rowCount={row.getLeafRows().length}
      rowLabel="item"
      grossAmountInUsdCents={first.orderGrossAmountInUsdCents}
      refundAmountInUsdCents={first.orderRefundAmountInUsdCents}
      netAmountInUsdCents={first.orderNetAmountInUsdCents}
      isExpanded={row.getIsExpanded()}
      toggleExpanded={row.toggleExpanded}
    />
  );
}

export function renderPaymentGroupHeader(row: Row<FinancialPaymentRow>) {
  const visibleRows: Array<Row<FinancialPaymentRow>> =
    row.subRows.length > 0 ? row.subRows : row.getLeafRows();
  const first = visibleRows[0]?.original;
  if (!first) return null;
  return (
    <OrderGroupHeaderShell
      orderId={first.orderId}
      orderStatus={first.orderStatus}
      createdAt={first.orderCreatedAt}
      userEmail={first.userEmail}
      rowCount={row.getLeafRows().length}
      rowLabel="payment"
      grossAmountInUsdCents={first.orderGrossAmountInUsdCents}
      refundAmountInUsdCents={first.orderRefundAmountInUsdCents}
      netAmountInUsdCents={first.orderNetAmountInUsdCents}
      isExpanded={row.getIsExpanded()}
      toggleExpanded={row.toggleExpanded}
    />
  );
}

export function OrderExpandedContent({ order }: { order: FinancialOrderRow }) {
  return (
    <div className="space-y-4">
      <OrderItemsSubTable items={order.items} />
      <PaymentsSubTable payments={order.payments} />
    </div>
  );
}

function expandColumn<Data>(): ColumnDef<Data> {
  return {
    id: 'expander',
    header: '',
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null;
      return (
        <button
          type="button"
          onClick={() => row.toggleExpanded()}
          className="rounded p-1 transition-colors hover:bg-muted"
          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          data-testid={`admin.financials.row.${row.id}.expander`}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          )}
        </button>
      );
    },
    size: 40,
    enableSorting: false,
  };
}

function orderIdColumn<Data extends { orderId: string }>(): ColumnDef<Data> {
  return {
    accessorKey: 'orderId',
    header: 'Order ID',
    cell: ({ row }) => <MonoId value={row.original.orderId} />,
    size: 150,
  };
}

function userEmailColumn<
  Data extends { userEmail: string | null },
>(): ColumnDef<Data> {
  return {
    accessorKey: 'userEmail',
    header: 'User',
    cell: ({ row }) => row.original.userEmail ?? '-',
    size: 220,
  };
}

function amountColumn<Data>(
  key: keyof Data & string,
  header: string,
): ColumnDef<Data> {
  return {
    accessorKey: key,
    header: `${header} (USD)`,
    cell: ({ row }) => (
      <span className="font-medium">
        {formatUsdCents(Number(row.original[key] ?? 0))}
      </span>
    ),
    size: 130,
  };
}

type OrderGroupHeaderShellProps = {
  orderId: string;
  orderStatus: string;
  createdAt: Date;
  userEmail: string | null;
  rowCount: number;
  rowLabel: string;
  grossAmountInUsdCents: number;
  refundAmountInUsdCents: number;
  netAmountInUsdCents: number;
  isExpanded?: boolean;
  toggleExpanded: (expanded?: boolean) => void;
};
const OrderGroupHeaderShell = forwardRef<
  HTMLDivElement,
  OrderGroupHeaderShellProps
>(function OrderGroupHeaderShell(
  {
    orderId,
    orderStatus,
    createdAt,
    userEmail,
    rowCount,
    rowLabel,
    grossAmountInUsdCents,
    refundAmountInUsdCents,
    netAmountInUsdCents,
    isExpanded,
    toggleExpanded,
  }: OrderGroupHeaderShellProps,
  ref,
) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: not needed, this just to catch the event to stop event bubbling up
    // biome-ignore lint/a11y/noStaticElementInteractions: needed to stop event bubbling up
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-[250px_1fr_1fr_auto] items-center gap-x-3 gap-y-0 text-sm w-full py-4  hover:opacity-100',
        isExpanded ? 'opacity-30' : 'opacity-60',
      )}
      onClick={() => toggleExpanded?.()}
      data-testid={`admin.financials.order-group.${orderId}`}
    >
      <div className="flex items-center gap-2 min-w-[220px]">
        <span className="font-semibold">Order</span>
        <MonoId value={orderId} />
      </div>
      <div className="grid grid-cols-2">
        <StatusBadge status={orderStatus} />

        <Badge variant="secondary">
          {formatInteger(rowCount)} {rowLabel}
          {rowCount === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="flex flex-row gap-x-2">
        <span className="text-muted-foreground">
          {formatDateTime(createdAt)}
        </span>
        <span className="text-muted-foreground">{userEmail ?? 'No email'}</span>
      </div>

      <div className="grid grid-cols-3 gap-x-3">
        <span>Gross {formatUsdCents(grossAmountInUsdCents)}</span>
        <span>Refunds {formatUsdCents(refundAmountInUsdCents)}</span>
        <span className="font-semibold">
          Net {formatUsdCents(netAmountInUsdCents)}
        </span>
      </div>
    </div>
  );
});

function OrderItemsSubTable({ items }: { items: FinancialOrderItemRow[] }) {
  const isMobile = useIsMobile();
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No order items.</p>;
  }
  if (isMobile) {
    // Mobile: a vertical stack of cards built from the SAME rows + shared cell
    // helpers as the desktop sub-table; only the layout differs.
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold">Order Items</h4>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <OrderItemSubCard key={item.orderItemId} item={item} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">Order Items</h4>
      <div className="overflow-x-auto rounded-md border bg-background">
        {/* desktop-only table; mobile renders cards via useIsMobile above */}
        <table className="w-full text-sm" /* mobile-ok */>
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">Domain</th>
              <th className="px-3 py-2 text-start">Type</th>
              <th className="px-3 py-2 text-start">Registrar</th>
              <th className="px-3 py-2 text-start">Status</th>
              <th className="px-3 py-2 text-end">Amount (USD)</th>
              <th className="px-3 py-2 text-start">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr
                key={item.orderItemId}
                data-testid={`admin.financials.order-item-row.${item.orderItemId}`}
              >
                <td className="px-3 py-2 font-medium">
                  {item.normalizedDomainName}
                  {item.metadataAutoRenew && (
                    <Badge variant="outline" className="ms-2">
                      Auto-renew
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2">{item.registrar}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-3 py-2 text-end font-medium">
                  {formatUsdCents(item.amountInUsdCents)}
                </td>
                <td className="px-3 py-2">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsSubTable({ payments }: { payments: FinancialPaymentRow[] }) {
  const isMobile = useIsMobile();
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments.</p>;
  }
  if (isMobile) {
    // Mobile: a vertical stack of cards built from the SAME rows + shared cell
    // helpers as the desktop sub-table; only the layout differs.
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold">Payments</h4>
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <PaymentSubCard key={payment.paymentId} payment={payment} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">Payments</h4>
      <div className="overflow-x-auto rounded-md border bg-background">
        {/* desktop-only table; mobile renders cards via useIsMobile above */}
        <table className="w-full text-sm" /* mobile-ok */>
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">Payment ID</th>
              <th className="px-3 py-2 text-start">Provider</th>
              <th className="px-3 py-2 text-start">Status</th>
              <th className="px-3 py-2 text-start">Chain</th>
              <th className="px-3 py-2 text-end">Gross (USD)</th>
              <th className="px-3 py-2 text-end">Refunds (USD)</th>
              <th className="px-3 py-2 text-end">Net (USD)</th>
              <th className="px-3 py-2 text-start">Refund IDs</th>
              <th className="px-3 py-2 text-start">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr
                key={payment.paymentId}
                data-testid={`admin.financials.payment-row.${payment.paymentId}`}
              >
                <td className="px-3 py-2 font-mono text-xs">
                  {payment.paymentId}
                </td>
                <td className="px-3 py-2">{payment.paymentProvider}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-3 py-2">
                  {formatPaymentChain(payment.chain)}
                </td>
                <td className="px-3 py-2 text-end font-medium">
                  {formatUsdCents(payment.grossAmountInUsdCents)}
                </td>
                <td className="px-3 py-2 text-end">
                  {formatUsdCents(payment.refundAmountInUsdCents)}
                </td>
                <td className="px-3 py-2 text-end font-medium">
                  {formatUsdCents(payment.netAmountInUsdCents)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {payment.refunds.length > 0
                    ? payment.refunds.map((refund) => refund.id).join(', ')
                    : '-'}
                </td>
                <td className="px-3 py-2">
                  {formatDateTime(payment.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
