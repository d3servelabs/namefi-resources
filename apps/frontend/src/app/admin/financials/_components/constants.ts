import type { DrizzlerFilterFieldConfig } from '@/components/table/filters/types';
import {
  itemTypeValues,
  orderStatusValues,
  paymentProviderValues,
  paymentStatusValues,
} from '@namefi-astra/common/shared-schemas';
import { CHAINS } from '@namefi-astra/utils/chains';
import type { TableMode } from './types';

export const tableModeLabels: Record<TableMode, string> = {
  orderItemsByOrder: 'OrderItems Grouped by Order',
  paymentsByOrder: 'Payments Grouped by Order',
  ordersWithItems: 'Orders Expand OrderItems and Payments',
};

export const absoluteDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const chainOptions = [
  { value: String(CHAINS.base.id), label: CHAINS.base.name },
  { value: String(CHAINS.mainnet.id), label: CHAINS.mainnet.name },
  { value: String(CHAINS.sepolia.id), label: CHAINS.sepolia.name },
];

export const globalFilterConfig: Record<string, DrizzlerFilterFieldConfig> = {
  orderStatus: {
    id: 'orderStatus',
    label: 'Order Status',
    type: 'select',
    columnId: 'orderStatus',
    options: orderStatusValues.map((status) => ({
      value: status,
      label: status,
    })),
    allowedOperators: ['eq', 'neq'],
    defaultLogicalOperator: 'or',
  },
  autoRenew: {
    id: 'autoRenew',
    label: 'Auto-renew Order',
    type: 'select',
    columnId: 'autoRenew',
    options: [
      { value: 'true', label: 'Auto-renew only' },
      { value: 'false', label: 'Manual only' },
    ],
    allowedOperators: ['eq', 'neq'],
    maxConditions: 1,
  },
  legacyBackfilled: {
    id: 'legacyBackfilled',
    label: 'Legacy Backfilled',
    type: 'select',
    columnId: 'legacyBackfilled',
    options: [
      { value: 'true', label: 'Backfilled only' },
      { value: 'false', label: 'Native only' },
    ],
    allowedOperators: ['eq', 'neq'],
    maxConditions: 1,
  },
};

export const orderItemFilterConfig: Record<string, DrizzlerFilterFieldConfig> =
  {
    orderItemId: {
      id: 'orderItemId',
      label: 'Order Item ID',
      type: 'text',
      columnId: 'orderItemId',
    },
    orderId: {
      id: 'orderId',
      label: 'Order ID',
      type: 'text',
      columnId: 'orderId',
    },
    orderCreatedAt: {
      id: 'orderCreatedAt',
      label: 'Order Created At',
      type: 'date',
      columnId: 'orderCreatedAt',
    },
    userEmail: {
      id: 'userEmail',
      label: 'User Email',
      type: 'text',
      columnId: 'userEmail',
    },
    normalizedDomainName: {
      id: 'normalizedDomainName',
      label: 'Domain',
      type: 'text',
      columnId: 'normalizedDomainName',
    },
    amountInUsdCents: {
      id: 'amountInUsdCents',
      label: 'Item Amount (USD cents)',
      type: 'number',
      columnId: 'amountInUsdCents',
    },
    durationInYears: {
      id: 'durationInYears',
      label: 'Duration Years',
      type: 'number',
      columnId: 'durationInYears',
    },
    type: {
      id: 'type',
      label: 'Item Type',
      type: 'select',
      columnId: 'type',
      options: itemTypeValues.map((type) => ({ value: type, label: type })),
      allowedOperators: ['eq', 'neq'],
    },
    registrar: {
      id: 'registrar',
      label: 'Registrar',
      type: 'text',
      columnId: 'registrar',
    },
    status: {
      id: 'status',
      label: 'Item Status',
      type: 'text',
      columnId: 'status',
    },
    nftWalletAddress: {
      id: 'nftWalletAddress',
      label: 'Receiving Wallet',
      type: 'text',
      columnId: 'nftWalletAddress',
    },
    nftChainId: {
      id: 'nftChainId',
      label: 'NFT Chain ID',
      type: 'number',
      columnId: 'nftChainId',
    },
    createdAt: {
      id: 'createdAt',
      label: 'Item Created At',
      type: 'date',
      columnId: 'createdAt',
    },
  };

export const paymentFilterConfig: Record<string, DrizzlerFilterFieldConfig> = {
  paymentId: {
    id: 'paymentId',
    label: 'Payment ID',
    type: 'text',
    columnId: 'paymentId',
  },
  orderId: {
    id: 'orderId',
    label: 'Order ID',
    type: 'text',
    columnId: 'orderId',
  },
  orderCreatedAt: {
    id: 'orderCreatedAt',
    label: 'Order Created At',
    type: 'date',
    columnId: 'orderCreatedAt',
  },
  userEmail: {
    id: 'userEmail',
    label: 'User Email',
    type: 'text',
    columnId: 'userEmail',
  },
  status: {
    id: 'status',
    label: 'Payment Status',
    type: 'select',
    columnId: 'status',
    options: paymentStatusValues.map((status) => ({
      value: status,
      label: status,
    })),
    allowedOperators: ['eq', 'neq'],
  },
  paymentProvider: {
    id: 'paymentProvider',
    label: 'Payment Provider',
    type: 'select',
    columnId: 'paymentProvider',
    options: paymentProviderValues.map((provider) => ({
      value: provider,
      label: provider,
    })),
    allowedOperators: ['eq', 'neq'],
  },
  paymentProviderReferenceId: {
    id: 'paymentProviderReferenceId',
    label: 'Provider Reference ID',
    type: 'text',
    columnId: 'paymentProviderReferenceId',
  },
  amountInUsdCents: {
    id: 'amountInUsdCents',
    label: 'Payment Amount (USD cents)',
    type: 'number',
    columnId: 'amountInUsdCents',
  },
  chainId: {
    id: 'chainId',
    label: 'Chain',
    type: 'select',
    columnId: 'chainId',
    options: chainOptions,
    allowedOperators: ['eq', 'neq'],
  },
  nftWalletAddress: {
    id: 'nftWalletAddress',
    label: 'Receiving Wallet',
    type: 'text',
    columnId: 'nftWalletAddress',
  },
  nftChainId: {
    id: 'nftChainId',
    label: 'NFT Chain ID',
    type: 'number',
    columnId: 'nftChainId',
  },
  createdAt: {
    id: 'createdAt',
    label: 'Payment Created At',
    type: 'date',
    columnId: 'createdAt',
  },
};

export const orderFilterConfig: Record<string, DrizzlerFilterFieldConfig> = {
  orderId: {
    id: 'orderId',
    label: 'Order ID',
    type: 'text',
    columnId: 'orderId',
  },
  userId: {
    id: 'userId',
    label: 'User ID',
    type: 'text',
    columnId: 'userId',
  },
  userEmail: {
    id: 'userEmail',
    label: 'User Email',
    type: 'text',
    columnId: 'userEmail',
  },
  amountInUsdCents: {
    id: 'amountInUsdCents',
    label: 'Order Amount (USD cents)',
    type: 'number',
    columnId: 'amountInUsdCents',
  },
  nftWalletAddress: {
    id: 'nftWalletAddress',
    label: 'Receiving Wallet',
    type: 'text',
    columnId: 'nftWalletAddress',
  },
  nftChainId: {
    id: 'nftChainId',
    label: 'NFT Chain ID',
    type: 'number',
    columnId: 'nftChainId',
  },
  createdAt: {
    id: 'createdAt',
    label: 'Order Created At',
    type: 'date',
    columnId: 'createdAt',
  },
};
