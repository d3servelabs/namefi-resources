import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  orderStatusSchema,
  paymentStatusSchema,
  refundStatusSchema,
  type OrderStatus,
  type PaymentStatus,
  type RefundStatus,
} from '@namefi-astra/common/shared-schemas';
import {
  mppPaymentProviderDetailsSchema as commonMppPaymentProviderDetailsSchema,
  nfscPaymentProviderDetailsSchema as commonNfscPaymentProviderDetailsSchema,
  stripePaymentProviderDetailsSchema as commonStripePaymentProviderDetailsSchema,
  x402PaymentProviderDetailsSchema as commonX402PaymentProviderDetailsSchema,
} from '@namefi-astra/common/payment-provider';
import type {
  MppPaymentProviderDetails,
  NfscPaymentProviderDetails,
  StripePaymentProviderDetails,
  X402PaymentProviderDetails,
} from '@namefi-astra/common/payment-provider';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import {
  aiGenerationsTable,
  aiCreditAwardsTable,
  publicAiGenerationsTable,
  internalAiGenerationsTable,
  cartItemsTable,
  dnsRecordsTable,
  orderItemsTable,
  orderNfscItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
  feedbackResponsesTable,
  usersTable,
  freeClaimsTable,
  domainAiAnalysisTable,
  aiAppraisalDataSchema,
  poweredbyNamefiDomainsTable,
  pbnIssuanceReservationsTable,
  cartItemMetadataSchema,
  orderMetadataSchema,
  orderItemMetadataSchema,
  orderNfscItemMetadataSchema,
  x402PurchasesTable,
  x402PurchaseStatusEnum,
} from './schema';
export type {
  NfscMintReconciliation,
  OrderItemMetadata,
  OrderMintTransactionMetadata,
  OrderNfscItemMetadata,
} from './schema';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export {
  autoRenewalPaymentProviderSchema,
  mppPaymentDetailsSchema,
  mppPaymentMethodSchema,
  mppPaymentProviderDetailsSchema,
  mppPaymentReceiptSchema,
  nfscPaymentDetailsSchema,
  nfscPaymentProviderDetailsSchema,
  nfscPaymentProviderSchema,
  paymentProviderDetailsSchema,
  paymentProviderSchema,
  stripePaymentDetailsSchema,
  stripePaymentProviderDetailsSchema,
  x402PaymentDetailsSchema,
  x402PaymentPayloadEncryptionVersionSchema,
  x402PaymentPayloadSchema,
  x402PaymentProviderDetailsSchema,
} from '@namefi-astra/common/payment-provider';
export type {
  AutoRenewalPaymentProvider,
  MppPaymentDetails,
  MppPaymentMethod,
  MppPaymentProviderDetails,
  MppPaymentReceipt,
  NfscPaymentDetails,
  NfscPaymentProvider,
  NfscPaymentProviderDetails,
  PaymentProvider,
  PaymentProviderDetails,
  StripePaymentDetails,
  StripePaymentProviderDetails,
  X402PaymentDetails,
  X402PaymentPayload,
  X402PaymentPayloadEncryptionVersion,
  X402PaymentProviderDetails,
} from '@namefi-astra/common/payment-provider';
export {
  freeClaimClaimingStatusSchema,
  itemTypeSchema,
  orderStatusSchema,
  paymentStatusSchema,
  refundStatusSchema,
} from '@namefi-astra/common/shared-schemas';
export type {
  FreeClaimClaimingStatus,
  ItemType,
  OrderStatus,
  PaymentStatus,
  RefundStatus,
} from '@namefi-astra/common/shared-schemas';

const asPaymentRecord = (details: unknown): Record<string, unknown> | null =>
  typeof details === 'object' && details !== null
    ? (details as Record<string, unknown>)
    : null;

/**
 * DB-facing payment guards accept full payment rows. Extracting the provider
 * fields keeps the previous row-aware API without relying on unknown-key
 * stripping inside the shared provider schemas.
 */
export function isStripePayment(
  details: unknown,
): details is StripePaymentProviderDetails {
  const payment = asPaymentRecord(details);
  if (payment === null) {
    return false;
  }

  return commonStripePaymentProviderDetailsSchema.safeParse({
    paymentProvider: payment.paymentProvider,
    stripePaymentDetails: payment.stripePaymentDetails,
  }).success;
}

export function isNfscPayment(
  details: unknown,
): details is NfscPaymentProviderDetails {
  const payment = asPaymentRecord(details);
  if (payment === null) {
    return false;
  }

  return commonNfscPaymentProviderDetailsSchema.safeParse({
    paymentProvider: payment.paymentProvider,
    nfscPaymentDetails: payment.nfscPaymentDetails,
  }).success;
}

export function isX402Payment(
  details: unknown,
): details is X402PaymentProviderDetails {
  const payment = asPaymentRecord(details);
  if (payment === null) {
    return false;
  }

  return commonX402PaymentProviderDetailsSchema.safeParse({
    paymentProvider: payment.paymentProvider,
    x402PaymentDetails: payment.x402PaymentDetails,
  }).success;
}

export function isMppPayment(
  details: unknown,
): details is MppPaymentProviderDetails {
  const payment = asPaymentRecord(details);
  if (payment === null) {
    return false;
  }

  const metadata = asPaymentRecord(payment.metadata);

  return commonMppPaymentProviderDetailsSchema.safeParse({
    paymentProvider: payment.paymentProvider,
    metadata: {
      mppPaymentDetails: metadata?.mppPaymentDetails,
    },
  }).success;
}

/**
 * Zod schemas for type-safe operations
 */
export const userInsertSchema = createInsertSchema(usersTable);
export const userSelectSchema = createSelectSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export const feedbackInsertSchema = createInsertSchema(feedbackResponsesTable, {
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(1).max(2000).optional(),
});
export const feedbackSelectSchema = createSelectSchema(feedbackResponsesTable, {
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(1).max(2000).nullable(),
});
export const feedbackUpdateSchema = createUpdateSchema(feedbackResponsesTable, {
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(1).max(2000).optional(),
});

export const cartItemInsertSchema = createInsertSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: cartItemMetadataSchema.optional(),
});
export const cartItemSelectSchema = createSelectSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: cartItemMetadataSchema.optional(),
});
export const cartItemUpdateSchema = createUpdateSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: cartItemMetadataSchema.optional(),
});

export const paymentInsertSchema = createInsertSchema(paymentsTable);
export const paymentSelectSchema = createSelectSchema(paymentsTable);
export const paymentUpdateSchema = createUpdateSchema(paymentsTable);

export const refundInsertSchema = createInsertSchema(refundsTable);
export const refundSelectSchema = createSelectSchema(refundsTable);
export const refundUpdateSchema = createUpdateSchema(refundsTable);

export const orderInsertSchema = createInsertSchema(ordersTable, {
  metadata: orderMetadataSchema.optional(),
});
export const orderSelectSchema = createSelectSchema(ordersTable, {
  metadata: orderMetadataSchema.optional(),
});
export const orderUpdateSchema = createUpdateSchema(ordersTable, {
  metadata: orderMetadataSchema.optional(),
});

export const orderItemInsertSchema = createInsertSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: orderItemMetadataSchema.optional(),
});
export const orderItemSelectSchema = createSelectSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: orderItemMetadataSchema.optional(),
});
export const orderItemUpdateSchema = createUpdateSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
  metadata: orderItemMetadataSchema.optional(),
});

export const orderNfscItemInsertSchema = createInsertSchema(
  orderNfscItemsTable,
  {
    metadata: orderNfscItemMetadataSchema.optional(),
  },
);
export const orderNfscItemSelectSchema = createSelectSchema(
  orderNfscItemsTable,
  {
    metadata: orderNfscItemMetadataSchema.optional(),
  },
);
export const orderNfscItemUpdateSchema = createUpdateSchema(
  orderNfscItemsTable,
  {
    metadata: orderNfscItemMetadataSchema.optional(),
  },
);

export const freeClaimInsertSchema = createInsertSchema(freeClaimsTable, {
  exactDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  parentDomain: namefiNormalizedDomainSchema.nullable().optional(),
  claimedDomainName: namefiNormalizedDomainSchema.nullable().optional(),
});
export const freeClaimSelectSchema = createSelectSchema(freeClaimsTable, {
  exactDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  parentDomain: namefiNormalizedDomainSchema.nullable().optional(),
  claimedDomainName: namefiNormalizedDomainSchema.nullable().optional(),
});
export const freeClaimUpdateSchema = createUpdateSchema(freeClaimsTable, {
  exactDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  parentDomain: namefiNormalizedDomainSchema.nullable().optional(),
  claimedDomainName: namefiNormalizedDomainSchema.nullable().optional(),
});
/**
 * DNS Record schemas
 */
export const dnsRecordInsertSchema = createInsertSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});
export const dnsRecordSelectSchema = createSelectSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});
export const dnsRecordUpdateSchema = createUpdateSchema(dnsRecordsTable, {
  zoneName: namefiNormalizedDomainSchema,
});

/**
 * AI Generation schemas
 */
export const aiGenerationInsertSchema = createInsertSchema(aiGenerationsTable);
export const aiGenerationSelectSchema = createSelectSchema(aiGenerationsTable);
export const aiGenerationUpdateSchema = createUpdateSchema(aiGenerationsTable);

export const aiCreditAwardInsertSchema =
  createInsertSchema(aiCreditAwardsTable);
export const aiCreditAwardSelectSchema =
  createSelectSchema(aiCreditAwardsTable);
export const aiCreditAwardUpdateSchema =
  createUpdateSchema(aiCreditAwardsTable);

export const publicAiGenerationInsertSchema = createInsertSchema(
  publicAiGenerationsTable,
);
export const publicAiGenerationSelectSchema = createSelectSchema(
  publicAiGenerationsTable,
);
export const publicAiGenerationUpdateSchema = createUpdateSchema(
  publicAiGenerationsTable,
);

export const aiInternalGenerationInsertSchema = createInsertSchema(
  internalAiGenerationsTable,
);
export const aiInternalGenerationSelectSchema = createSelectSchema(
  internalAiGenerationsTable,
);
export const aiInternalGenerationUpdateSchema = createUpdateSchema(
  internalAiGenerationsTable,
);

export const domainAiAnalysisInsertSchema = createInsertSchema(
  domainAiAnalysisTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
    appraisal: aiAppraisalDataSchema.optional().nullable(),
  },
);
export const domainAiAnalysisSelectSchema = createSelectSchema(
  domainAiAnalysisTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
    appraisal: aiAppraisalDataSchema.optional().nullable(),
  },
);
export const domainAiAnalysisUpdateSchema = createUpdateSchema(
  domainAiAnalysisTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
    appraisal: aiAppraisalDataSchema.optional().nullable(),
  },
);

export const poweredbyNamefiDomainInsertSchema = createInsertSchema(
  poweredbyNamefiDomainsTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
  },
);
export const poweredbyNamefiDomainSelectSchema = createSelectSchema(
  poweredbyNamefiDomainsTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
  },
);
export const poweredbyNamefiDomainUpdateSchema = createUpdateSchema(
  poweredbyNamefiDomainsTable,
  {
    normalizedDomainName: namefiNormalizedDomainSchema,
  },
);

/**
 * Inferred Zod types for API and validation
 */

// User types
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserSelect = z.infer<typeof userSelectSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type FeedbackInsert = z.infer<typeof feedbackInsertSchema>;
export type FeedbackSelect = z.infer<typeof feedbackSelectSchema>;
export type FeedbackUpdate = z.infer<typeof feedbackUpdateSchema>;

// CartItem types
export type CartItemInsert = z.infer<typeof cartItemInsertSchema>;
export type CartItemSelect = z.infer<typeof cartItemSelectSchema>;
export type CartItemUpdate = z.infer<typeof cartItemUpdateSchema>;

// FreeClaim types
export type FreeClaimInsert = z.infer<typeof freeClaimInsertSchema>;
export type FreeClaimSelect = z.infer<typeof freeClaimSelectSchema>;
export type FreeClaimUpdate = z.infer<typeof freeClaimUpdateSchema>;

// Payment types
export type PaymentInsert = z.infer<typeof paymentInsertSchema>;
export type PaymentSelect = z.infer<typeof paymentSelectSchema>;
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>;

// Refund types
export type RefundInsert = z.infer<typeof refundInsertSchema>;
export type RefundSelect = z.infer<typeof refundSelectSchema>;
export type RefundUpdate = z.infer<typeof refundUpdateSchema>;

// Order types
export type OrderInsert = z.infer<typeof orderInsertSchema>;
export type OrderSelect = z.infer<typeof orderSelectSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

// OrderItem types
export type OrderItemInsert = z.infer<typeof orderItemInsertSchema>;
export type OrderItemSelect = z.infer<typeof orderItemSelectSchema>;
export type OrderItemUpdate = z.infer<typeof orderItemUpdateSchema>;

// OrderNfscItem types
export type OrderNfscItemInsert = z.infer<typeof orderNfscItemInsertSchema>;
export type OrderNfscItemSelect = z.infer<typeof orderNfscItemSelectSchema>;
export type OrderNfscItemUpdate = z.infer<typeof orderNfscItemUpdateSchema>;

// DNS Record types
export type DnsRecordInsert = z.infer<typeof dnsRecordInsertSchema>;
export type DnsRecordSelect = z.infer<typeof dnsRecordSelectSchema>;
export type DnsRecordUpdate = z.infer<typeof dnsRecordUpdateSchema>;

// AI Generation types
export type AiGenerationInsert = z.infer<typeof aiGenerationInsertSchema>;
export type AiGenerationSelect = z.infer<typeof aiGenerationSelectSchema>;
export type AiGenerationUpdate = z.infer<typeof aiGenerationUpdateSchema>;

export type AiCreditAwardInsert = z.infer<typeof aiCreditAwardInsertSchema>;
export type AiCreditAwardSelect = z.infer<typeof aiCreditAwardSelectSchema>;
export type AiCreditAwardUpdate = z.infer<typeof aiCreditAwardUpdateSchema>;

export type AiInternalGenerationInsert = z.infer<
  typeof aiInternalGenerationInsertSchema
>;
export type AiInternalGenerationSelect = z.infer<
  typeof aiInternalGenerationSelectSchema
>;
export type AiInternalGenerationUpdate = z.infer<
  typeof aiInternalGenerationUpdateSchema
>;

// AI Generation types
export type PoweredByNamefiDomainInsert = z.infer<
  typeof poweredbyNamefiDomainInsertSchema
>;
export type PoweredByNamefiDomainSelect = z.infer<
  typeof poweredbyNamefiDomainSelectSchema
>;
export type PoweredByNamefiDomainUpdate = z.infer<
  typeof poweredbyNamefiDomainUpdateSchema
>;

// PBN Issuance Reservations schemas
export const pbnIssuanceReservationInsertSchema = createInsertSchema(
  pbnIssuanceReservationsTable,
  {
    pbnDomain: namefiNormalizedDomainSchema,
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
  },
);
export const pbnIssuanceReservationSelectSchema = createSelectSchema(
  pbnIssuanceReservationsTable,
  {
    pbnDomain: namefiNormalizedDomainSchema,
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
  },
);
export const pbnIssuanceReservationUpdateSchema = createUpdateSchema(
  pbnIssuanceReservationsTable,
  {
    pbnDomain: namefiNormalizedDomainSchema,
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
  },
);

export const x402PurchaseInsertSchema = createInsertSchema(x402PurchasesTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const x402PurchaseSelectSchema = createSelectSchema(x402PurchasesTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const x402PurchaseUpdateSchema = createUpdateSchema(x402PurchasesTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});

export type X402PurchaseInsert = z.infer<typeof x402PurchaseInsertSchema>;
export type X402PurchaseSelect = z.infer<typeof x402PurchaseSelectSchema>;
export type X402PurchaseUpdate = z.infer<typeof x402PurchaseUpdateSchema>;

export type PbnIssuanceReservationInsert = z.infer<
  typeof pbnIssuanceReservationInsertSchema
>;
export type PbnIssuanceReservationSelect = z.infer<
  typeof pbnIssuanceReservationSelectSchema
>;
export type PbnIssuanceReservationUpdate = z.infer<
  typeof pbnIssuanceReservationUpdateSchema
>;

// Domain AI Analysis types
export type DomainAiAnalysisInsert = z.infer<
  typeof domainAiAnalysisInsertSchema
>;
export type DomainAiAnalysisSelect = z.infer<
  typeof domainAiAnalysisSelectSchema
>;
export type DomainAiAnalysisUpdate = z.infer<
  typeof domainAiAnalysisUpdateSchema
>;

export const x402PurchaseStatusSchema = z.enum(
  x402PurchaseStatusEnum.enumValues,
);
export type X402PurchaseStatus = z.infer<typeof x402PurchaseStatusSchema>;

/**
 * Forces exhaustive status handling.
 * Throws at runtime only if a new enum value is introduced without being handled.
 */
const assertNeverStatus = (value: never, statusType: string): never => {
  throw new Error(`Unhandled ${statusType}: ${value as string}`);
};

/**
 * Lifecycle transition decision for timestamp fields.
 * - `shouldSetStartedAt`: initialize `startedAt` when entering active processing
 * - `shouldSetFinishedAt`: stamp `finishedAt` when entering a terminal status
 * - `shouldClearFinishedAt`: clear `finishedAt` when moving back to non-terminal states
 */
export type LifecycleTimestampTransition = Readonly<{
  shouldSetStartedAt: boolean;
  shouldSetFinishedAt: boolean;
  shouldClearFinishedAt: boolean;
}>;

/**
 * Returns true for terminal order statuses.
 */
export function isOrderStatusTerminal(status: OrderStatus): boolean {
  switch (status) {
    case orderStatusSchema.enum.CREATED:
    case orderStatusSchema.enum.PROCESSING:
      return false;
    case orderStatusSchema.enum.SUCCEEDED:
    case orderStatusSchema.enum.FAILED:
    case orderStatusSchema.enum.CANCELLED:
    case orderStatusSchema.enum.PARTIALLY_COMPLETED:
      return true;
    default:
      // Ensure exhaustive matching
      return assertNeverStatus(status, 'order status');
  }
}

/**
 * Maps an order status into lifecycle timestamp transition decisions.
 */
export function getOrderStatusLifecycleTransition(
  status: OrderStatus,
): LifecycleTimestampTransition {
  switch (status) {
    case orderStatusSchema.enum.CREATED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case orderStatusSchema.enum.PROCESSING:
      return {
        shouldSetStartedAt: true,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case orderStatusSchema.enum.SUCCEEDED:
    case orderStatusSchema.enum.FAILED:
    case orderStatusSchema.enum.CANCELLED:
    case orderStatusSchema.enum.PARTIALLY_COMPLETED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: true,
        shouldClearFinishedAt: false,
      };
    default:
      return assertNeverStatus(status, 'order status');
  }
}

/**
 * Builds timestamp update values for order status transitions.
 */
export function buildOrderStatusLifecycleTransition(status: OrderStatus) {
  if (status) {
    const lifecycleTransitions = getOrderStatusLifecycleTransition(status);
    return buildLifecycleTransitionTimestampsValues(lifecycleTransitions);
  }
  return {};
}

/**
 * Returns true for terminal payment statuses.
 */
export function isPaymentStatusTerminal(status: PaymentStatus): boolean {
  switch (status) {
    case paymentStatusSchema.enum.CREATED:
    case paymentStatusSchema.enum.PROCESSING:
    case paymentStatusSchema.enum.REFUND_REQUESTED:
    case paymentStatusSchema.enum.REQUIRES_CAPTURE:
      return false;
    case paymentStatusSchema.enum.SUCCEEDED:
    case paymentStatusSchema.enum.FAILED:
    case paymentStatusSchema.enum.CANCELLED:
      return true;
    default:
      // Ensure exhaustive matching
      return assertNeverStatus(status, 'payment status');
  }
}

/**
 * Maps a payment status into lifecycle timestamp transition decisions.
 */
export function getPaymentStatusLifecycleTransition(
  status: PaymentStatus,
): LifecycleTimestampTransition {
  switch (status) {
    case paymentStatusSchema.enum.CREATED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case paymentStatusSchema.enum.PROCESSING:
      return {
        shouldSetStartedAt: true,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case paymentStatusSchema.enum.REFUND_REQUESTED:
    case paymentStatusSchema.enum.REQUIRES_CAPTURE:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: false,
      };
    case paymentStatusSchema.enum.SUCCEEDED:
    case paymentStatusSchema.enum.FAILED:
    case paymentStatusSchema.enum.CANCELLED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: true,
        shouldClearFinishedAt: false,
      };
    default:
      return assertNeverStatus(status, 'payment status');
  }
}

/**
 * Builds timestamp update values for payment status transitions.
 */
export function buildPaymentStatusLifecycleTransition(status: PaymentStatus) {
  if (status) {
    const lifecycleTransitions = getPaymentStatusLifecycleTransition(status);
    return buildLifecycleTransitionTimestampsValues(lifecycleTransitions);
  }
  return {};
}

/**
 * Returns true for terminal refund statuses.
 */
export function isRefundStatusTerminal(status: RefundStatus): boolean {
  switch (status) {
    case refundStatusSchema.enum.CREATED:
    case refundStatusSchema.enum.PROCESSING:
    case refundStatusSchema.enum.REQUIRES_ACTION:
      return false;
    case refundStatusSchema.enum.SUCCEEDED:
    case refundStatusSchema.enum.FAILED:
    case refundStatusSchema.enum.CANCELLED:
      return true;
    default:
      // Ensure exhaustive matching
      return assertNeverStatus(status, 'refund status');
  }
}

/**
 * Maps a refund status into lifecycle timestamp transition decisions.
 */
export function getRefundStatusLifecycleTransition(
  status: RefundStatus,
): LifecycleTimestampTransition {
  switch (status) {
    case refundStatusSchema.enum.CREATED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case refundStatusSchema.enum.PROCESSING:
      return {
        shouldSetStartedAt: true,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: true,
      };
    case refundStatusSchema.enum.REQUIRES_ACTION:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: false,
        shouldClearFinishedAt: false,
      };
    case refundStatusSchema.enum.SUCCEEDED:
    case refundStatusSchema.enum.FAILED:
    case refundStatusSchema.enum.CANCELLED:
      return {
        shouldSetStartedAt: false,
        shouldSetFinishedAt: true,
        shouldClearFinishedAt: false,
      };
    default:
      return assertNeverStatus(status, 'refund status');
  }
}

/**
 * Builds timestamp update values for refund status transitions.
 */
export function buildRefundStatusLifecycleTransition(status: RefundStatus) {
  if (status) {
    const lifecycleTransitions = getRefundStatusLifecycleTransition(status);
    return buildLifecycleTransitionTimestampsValues(lifecycleTransitions);
  }
  return {};
}

/**
 * Generic timestamp update payload builder for lifecycle transitions.
 *
 * Uses unqualified `started_at`/`finished_at` column references so the output can
 * be reused across multiple tables that share the same timestamp column names.
 */
export function buildLifecycleTransitionTimestampsValues(
  lifecycleTransitions: LifecycleTimestampTransition,
) {
  const lifecycleTimestamps: Pick<
    PgUpdateSetSource<typeof ordersTable>,
    'startedAt' | 'finishedAt'
  > = {};

  if (lifecycleTransitions.shouldSetStartedAt) {
    lifecycleTimestamps.startedAt = sql`coalesce(started_at, now())`;
  }
  if (lifecycleTransitions.shouldSetFinishedAt) {
    lifecycleTimestamps.finishedAt = sql`now()`;
  }
  if (lifecycleTransitions.shouldClearFinishedAt) {
    lifecycleTimestamps.finishedAt = null;
  }

  return lifecycleTimestamps;
}
export const orderItemStatusSchema = orderStatusSchema;
export type OrderItemStatus = OrderStatus;

export type {
  NamefiNftSelect,
  NamefiNftWithAiAnalysisSelect,
  NamefiNftOwnersSelect,
  BurnedNamefiNftSelect,
} from './schemas/onchain-indexers';
