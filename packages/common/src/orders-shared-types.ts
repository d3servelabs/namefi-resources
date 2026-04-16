import type {
  OrderItemSelect,
  OrderStatus,
  PaymentSelect,
  UserSelect,
  orderItemsTable,
  ordersTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

type OrderItemRow = typeof orderItemsTable.$inferSelect;

/**
 * The raw drizzle row type for an order — `metadata` is `T | null` here
 * (drizzle's `$inferSelect`). The backend service `getOrderDetailsOrThrow`
 * returns `$inferSelect` for the `order` field directly (no cast), so we
 * have to use the drizzle row type here or assignability breaks. The
 * drizzle-zod-derived `OrderSelect` would say `metadata?: T | undefined`
 * which is structurally different.
 *
 * Note that the sibling `items`, `payments` and `user` fields *are*
 * explicitly cast to the drizzle-zod `*Select` types in the backend (see
 * `apps/backend/src/services/orders/orders.service.ts` lines 81-83), so we
 * use those types for those fields. This mirrors the backend's actual
 * casting choices exactly.
 */
type OrderRow = typeof ordersTable.$inferSelect;

/**
 * Wire-shape types shared between the orders router contract (in
 * `./orders-contract.ts`), the backend implementations (in
 * `apps/backend/src/services/orders/orders.service.ts` and the
 * `processOrder` workflow), and any frontend consumers.
 *
 * Defining them here avoids:
 *
 *   1. Duplicate definitions drifting between backend and frontend.
 *   2. The orders contract reaching into `apps/backend/...` for type
 *      references (which would re-introduce the package-boundary violation
 *      this move was meant to fix).
 *
 * Backend service files import these as the source of truth so that any
 * future shape change has to flow through `@namefi-astra/common`.
 */

// ---------------------------------------------------------------------------
// Order details (returned by `getOrderDetailsOrThrow` / `getOrder`)
// ---------------------------------------------------------------------------

export type OrderWithPayments = {
  order: OrderRow;
  items: OrderItemSelect[];
  payments: PaymentSelect[];
  user: UserSelect;
};

/**
 * The shape returned by
 * `createOrderWithExistingSinglePayment` /
 * `createOrderWithExistingMultiplePayments`. The backend service explicitly
 * narrows the public return type to a few columns plus `items[]` — we
 * mirror that exact shape here so the contract and the backend handler
 * line up.
 */
export type CreatedOrder = {
  id: string;
  userId: string;
  amountInUSDCents: number;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  items: OrderItemSelect[];
};

/**
 * Row shape returned by `getOrderItemsForUser` — every column of
 * `orderItemsTable` (`OrderItemRow`) plus three columns lifted from the
 * joined `ordersTable`: `nftWalletAddress`, `nftChainId`, and
 * `orderMetadata` (sourced from `OrderRow['metadata']`). The backend
 * builds this from a `db.select(...)` (no cast through drizzle-zod), so
 * we use the drizzle row type for the order-item columns to match the
 * actual `metadata: T | null` shape exactly.
 */
export type OrderItemForUser = OrderItemRow & {
  nftWalletAddress: OrderRow['nftWalletAddress'];
  nftChainId: OrderRow['nftChainId'];
  orderMetadata: OrderRow['metadata'];
};

export type OrderItemsForUser = OrderItemForUser[];

/**
 * Return type of
 * `apps/backend/src/lib/carts/cart-validation.ts:reflectChangesInCartItemsIfAnyAndReturnSummary`
 * — either an array of human-readable change summaries, or `undefined` if
 * the cart had no changes worth reporting.
 */
export type ReflectCartChangesSummary = string[] | undefined;

// ---------------------------------------------------------------------------
// Payment method details (returned by `buildPaymentMethodDetails` /
// `buildOrderPaymentMethodsDetails`)
// ---------------------------------------------------------------------------

export type PaymentMethodDetailsOnChain = {
  paymentId: string;
  isOnChainPayment: true;
  txHash?: string | null;
  chainId: number;
  walletAddress: string;
};

export type PaymentMethodDetailsOffChain = {
  paymentId: string;
  isOnChainPayment: false;
  brand?: string;
  last4?: string;
};

export type PaymentMethodDetailsX402 = {
  paymentId: string;
  isOnChainPayment: true;
  isX402Payment: true;
  network: string;
  buyerWalletAddress: string;
  receiverWalletAddress?: string;
  settlementTxHash?: string | null;
};

export type PaymentMethodDetailsMpp = {
  paymentId: string;
  isMppPayment: true;
  method: 'stripe' | 'tempo';
  isOnChainPayment: boolean;
  payerWalletAddress?: string;
  reference?: string | null;
  brand?: string;
  last4?: string;
};

export type PaymentMethodDetails =
  | PaymentMethodDetailsOnChain
  | PaymentMethodDetailsOffChain
  | PaymentMethodDetailsX402
  | PaymentMethodDetailsMpp;

// ---------------------------------------------------------------------------
// Refunds (returned by `getPaymentRefunds`)
// ---------------------------------------------------------------------------

export type PaymentRefundEntry = {
  refundId: string;
  amountInUSDCents: number;
  status: string;
  txHash: string | null;
  chainId: number | null;
  walletAddress: string | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// processOrder workflow public state (returned by `getOrderProgress`)
//
// These types describe the wire shape that the frontend sees from the
// `processOrder` Temporal workflow. The backend workflow file imports them
// from here so there is exactly one source of truth.
// ---------------------------------------------------------------------------

export type ProcessOrderWorkflowStepStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type ProcessOrderWorkflowStepId =
  | 'order-details'
  | 'payments'
  | 'items'
  | 'post-processing'
  | 'final-status'
  | 'refund'
  | 'notification';

export interface ProcessOrderWorkflowStep {
  id: ProcessOrderWorkflowStepId;
  label: string;
  status: ProcessOrderWorkflowStepStatus;
  message?: string;
  startedAt?: number;
  completedAt?: number;
}

export type ProcessOrderWorkflowItemStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface ProcessOrderWorkflowItemProgress {
  itemId: string;
  domain: NamefiNormalizedDomain;
  type: 'REGISTER' | 'IMPORT' | 'RENEW';
  durationInYears: number;
  registrarKey: string;
  status: ProcessOrderWorkflowItemStatus;
  lastUpdatedAt: number;
  message?: string;
}

export type ProcessOrderWorkflowPhase =
  | 'INITIALIZING'
  | 'FETCHING_ORDER'
  | 'CHARGING'
  | 'PROCESSING_ITEMS'
  | 'POST_PROCESSING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

export interface ProcessOrderWorkflowPublicState {
  orderId: string;
  phase: ProcessOrderWorkflowPhase;
  status: OrderStatus;
  steps: ProcessOrderWorkflowStep[];
  items: ProcessOrderWorkflowItemProgress[];
  payment: {
    status: 'PENDING' | 'CHARGING' | 'CHARGED' | 'FAILED';
    message?: string;
  };
  refund: {
    status: 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    amountInUsdCents: number;
  };
  notification: {
    status: 'PENDING' | 'SENT' | 'SKIPPED' | 'FAILED';
    message?: string;
  };
  summary: {
    totalItems: number;
    succeededItems: number;
    failedItems: number;
  };
  timestamps: {
    startedAt: number;
    lastUpdatedAt: number;
    completedAt?: number;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Order progress payload (returned by `getOrderProgress` after wrapping the
// workflow snapshot with the live order status)
// ---------------------------------------------------------------------------

/**
 * Mirror of `WorkflowExecutionStatusName` from `@temporalio/client`, plus the
 * `'NOT_FOUND'` literal we add when the workflow handle cannot be described.
 * Inlined as a literal union so this package does not need a direct dep on
 * `@temporalio/client`.
 */
export type OrderWorkflowStatusName =
  | 'UNSPECIFIED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TERMINATED'
  | 'CONTINUED_AS_NEW'
  | 'TIMED_OUT'
  | 'UNKNOWN'
  | 'NOT_FOUND';

export type OrderProgressSnapshot = {
  workflowStatus: OrderWorkflowStatusName;
  runId: string | null;
  state: ProcessOrderWorkflowPublicState | null;
};

export type OrderProgressPayload = OrderProgressSnapshot & {
  orderStatus: OrderStatus;
  fetchedAt: string;
};
