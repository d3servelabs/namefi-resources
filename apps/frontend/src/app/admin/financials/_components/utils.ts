import { getChain } from '@namefi-astra/utils/chains';
import type { SortingState } from '@tanstack/react-table';
import { format, subDays } from 'date-fns';
import { absoluteDateRegex } from './constants';
import type {
  BackendSorting,
  DateRangeInput,
  FinancialOrderItemRow,
  FinancialOrderRow,
  FinancialPaymentRow,
} from './types';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const integerFormatter = new Intl.NumberFormat('en-US');

export function normalizeOrderItemRows(
  rows: unknown[],
): FinancialOrderItemRow[] {
  return rows.map((row) => {
    const item = row as FinancialOrderItemRow;
    return {
      ...item,
      orderCreatedAt: new Date(item.orderCreatedAt),
      orderUpdatedAt: new Date(item.orderUpdatedAt),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  });
}

export function normalizePaymentRows(rows: unknown[]): FinancialPaymentRow[] {
  return rows.map((row) => {
    const payment = row as FinancialPaymentRow;
    return {
      ...payment,
      orderCreatedAt: new Date(payment.orderCreatedAt),
      orderUpdatedAt: new Date(payment.orderUpdatedAt),
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt),
      refunds: payment.refunds.map((refund) => ({
        ...refund,
        createdAt: new Date(refund.createdAt),
        updatedAt: new Date(refund.updatedAt),
      })),
    };
  });
}

export function normalizeOrderRows(rows: unknown[]): FinancialOrderRow[] {
  return rows.map((row) => {
    const order = row as FinancialOrderRow;
    return {
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      items: normalizeOrderItemRows(order.items),
      payments: normalizePaymentRows(order.payments),
    };
  });
}

export function toBackendSorting(
  sorting: SortingState | undefined,
): BackendSorting | undefined {
  if (!sorting || sorting.length === 0) return undefined;
  return sorting.map((item) => ({
    column: item.id,
    order: item.desc ? 'desc' : 'asc',
  }));
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) => entryValue !== undefined && entryValue !== '',
    ),
  ) as T;
}

export function countActiveFilters(filters: Record<string, unknown>) {
  return Object.values(filters).filter(
    (value) => value !== undefined && value !== '',
  ).length;
}

export function getDefaultDateRange(): DateRangeInput {
  const endDate = new Date();
  return {
    startDate: formatDateForBackend(subDays(endDate, 30)),
    endDate: formatDateForBackend(endDate),
  };
}

export function toNaturalDateValue(value: string) {
  return {
    display: value,
    date: parseBackendDate(value),
  };
}

export function parseBackendDate(value: string): Date | undefined {
  if (!absoluteDateRegex.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function renderParsedDateTagline(
  _display: string,
  date: Date | undefined,
) {
  return date
    ? `Applied as ${formatDateForBackend(date)}`
    : 'Enter a recognizable date, e.g. yesterday or last Monday.';
}

export function formatDateForBackend(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function downloadExport(data: {
  fileName: string;
  contentType: string;
  content: string;
}) {
  const blob = new Blob([data.content], { type: data.contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = data.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatUsdCents(cents: number) {
  return formatUsdAmount(centsToUsd(cents));
}

export function centsToUsd(cents: number) {
  return cents / 100;
}

export function formatUsdAmount(value: number) {
  return moneyFormatter.format(value);
}

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDateTime(value: Date) {
  return format(value, 'yyyy-MM-dd HH:mm');
}

export function formatChain(chainId: number | null) {
  if (!chainId) return '-';
  return getChain(chainId)?.name ?? `Chain ${chainId}`;
}

export function formatPaymentChain(chain: string | null) {
  if (!chain || chain === 'offchain') return 'Offchain';
  const numericChainId = Number(chain);
  if (Number.isFinite(numericChainId)) {
    return formatChain(numericChainId);
  }
  return chain;
}

export function formatPaymentMethod(provider: string, chain: string | null) {
  return `${provider}${chain ? ` / ${formatPaymentChain(chain)}` : ''}`;
}
