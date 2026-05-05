import type { DrizzlerFilterFieldConfig } from '@/components/table/filters/types';
import type { SortingState } from '@tanstack/react-table';

export type TableMode =
  | 'orderItemsByOrder'
  | 'paymentsByOrder'
  | 'ordersWithItems';
export type PageTab = 'overview' | 'details';
export type ExportFormat = 'csv' | 'json';

export type DateRangeInput = {
  startDate: string;
  endDate: string;
};

export type GlobalFilters = {
  searchTerm?: string;
  filterOptions?: unknown;
};

export type BackendSorting = Array<{ column: string; order: 'asc' | 'desc' }>;

export type ExportRequest = {
  mode: TableMode;
  format: ExportFormat;
  tableFilters?: unknown;
  sorting?: BackendSorting;
};

export type FinancialSummary = {
  totals: {
    orderCount: number;
    paidOrderCount: number;
    itemCount: number;
    paymentCount: number;
    refundCount: number;
    grossAmountInUsdCents: number;
    refundAmountInUsdCents: number;
    netAmountInUsdCents: number;
    averageOrderValueInUsdCents: number;
    refundRate: number;
  };
  byItemType: Array<{
    type: string;
    itemCount: number;
    grossAmountInUsdCents: number;
    netAmountInUsdCents: number;
  }>;
  autoRenew: {
    itemCount: number;
    grossAmountInUsdCents: number;
    netAmountInUsdCents: number;
  };
  byRegistrar: Array<{
    registrar: string;
    itemCount: number;
    grossAmountInUsdCents: number;
    netAmountInUsdCents: number;
  }>;
  byPaymentMethod: Array<{
    paymentProvider: string;
    chain: string | null;
    paymentCount: number;
    grossAmountInUsdCents: number;
    refundAmountInUsdCents: number;
    netAmountInUsdCents: number;
  }>;
  daily: Array<{
    date: string;
    grossAmountInUsdCents: number;
    refundAmountInUsdCents: number;
    netAmountInUsdCents: number;
  }>;
  byOrderStatus: Array<{
    status: string;
    orderCount: number;
  }>;
};

export type FinancialRefundRow = {
  id: string;
  paymentId: string;
  status: string;
  amountInUsdCents: number;
  paymentProviderReferenceId: string | null;
  chainId: number | null;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialPaymentRow = {
  paymentId: string;
  orderId: string;
  orderStatus: string;
  orderCreatedAt: Date;
  orderUpdatedAt: Date;
  orderAmountInUsdCents: number;
  orderGrossAmountInUsdCents: number;
  orderRefundAmountInUsdCents: number;
  orderNetAmountInUsdCents: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  status: string;
  paymentProvider: string;
  paymentProviderReferenceId: string | null;
  amountInUsdCents: number;
  grossAmountInUsdCents: number;
  refundAmountInUsdCents: number;
  netAmountInUsdCents: number;
  chain: string | null;
  walletAddress: string | null;
  refunds: FinancialRefundRow[];
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialOrderItemRow = {
  orderItemId: string;
  orderId: string;
  orderStatus: string;
  orderCreatedAt: Date;
  orderUpdatedAt: Date;
  orderAmountInUsdCents: number;
  orderGrossAmountInUsdCents: number;
  orderRefundAmountInUsdCents: number;
  orderNetAmountInUsdCents: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  normalizedDomainName: string;
  amountInUsdCents: number;
  durationInYears: number;
  type: string;
  registrar: string;
  status: string | null;
  metadataAutoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialOrderRow = {
  orderId: string;
  orderStatus: string;
  amountInUsdCents: number;
  grossAmountInUsdCents: number;
  refundAmountInUsdCents: number;
  netAmountInUsdCents: number;
  itemCount: number;
  paymentCount: number;
  refundCount: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  registrars: string[];
  itemTypes: string[];
  paymentProviders: string[];
  items: FinancialOrderItemRow[];
  payments: FinancialPaymentRow[];
  createdAt: Date;
  updatedAt: Date;
};

export type DetailTableProps = {
  active: boolean;
  dateRange: DateRangeInput;
  globalFilters: GlobalFilters;
  onExport: (request: ExportRequest) => void;
  isExporting: boolean;
};

export type TableControlsParams = {
  tableId: string;
  defaultSorting: SortingState;
  defaultColumnVisibility?: Record<string, boolean>;
  filterConfig: Record<string, DrizzlerFilterFieldConfig>;
};
