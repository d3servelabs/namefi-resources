import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import {
  aiGenerationsTable,
  publicAiGenerationsTable,
  internalAiGenerationsTable,
  cartItemsTable,
  dnsRecordsTable,
  orderItemsTable,
  orderStatusEnum,
  ordersTable,
  paymentProviderEnum,
  paymentStatusEnum,
  paymentsTable,
  refundStatusEnum,
  itemTypeEnum,
  refundsTable,
  feedbackResponsesTable,
  usersTable,
  freeClaimsTable,
  freeClaimClaimingStatusEnum,
  domainAiAnalysisTable,
  aiAppraisalDataSchema,
  poweredbyNamefiDomainsTable,
  pbnIssuanceReservationsTable,
  cartItemMetadataSchema,
  orderMetadataSchema,
  orderItemMetadataSchema,
} from './schema';
export type { OrderItemMetadata, OrderMintTransactionMetadata } from './schema';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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

// DNS Record types
export type DnsRecordInsert = z.infer<typeof dnsRecordInsertSchema>;
export type DnsRecordSelect = z.infer<typeof dnsRecordSelectSchema>;
export type DnsRecordUpdate = z.infer<typeof dnsRecordUpdateSchema>;

// AI Generation types
export type AiGenerationInsert = z.infer<typeof aiGenerationInsertSchema>;
export type AiGenerationSelect = z.infer<typeof aiGenerationSelectSchema>;
export type AiGenerationUpdate = z.infer<typeof aiGenerationUpdateSchema>;

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

/**
 * Enum types from pgEnums
 */

export const paymentProviderSchema = z.enum(paymentProviderEnum.enumValues);
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export const refundStatusSchema = z.enum(refundStatusEnum.enumValues);
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export const orderStatusSchema = z.enum(orderStatusEnum.enumValues);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export const freeClaimClaimingStatusSchema = z.enum(
  freeClaimClaimingStatusEnum.enumValues,
);
export type FreeClaimClaimingStatus = z.infer<
  typeof freeClaimClaimingStatusSchema
>;

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
export type NfscPaymentDetails = Exclude<
  z.infer<typeof paymentInsertSchema.shape.nfscPaymentDetails>,
  undefined | null
>;
// Note: A bug or limitation of drizzle-zod seems to be that optional fields in json are inferred as unknown. Hence defining the type here.
const stripePaymentDetailsSchema = z.object({
  paymentMethodId: z.string().optional(),
});
export type StripePaymentDetails = z.infer<typeof stripePaymentDetailsSchema>;

export const nfscPaymentProviderSchema = z.enum([
  paymentProviderSchema.enum.NFSC_BASE,
  paymentProviderSchema.enum.NFSC_ETHEREUM,
  paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
]);
export type NfscPaymentProvider = z.infer<typeof nfscPaymentProviderSchema>;

export const stripePaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.enum.STRIPE),
  stripePaymentDetails: stripePaymentDetailsSchema,
});

export type StripePaymentProviderDetails = z.infer<
  typeof stripePaymentProviderDetailsSchema
>;

export const nfscPaymentProviderDetailsSchema = z.object({
  paymentProvider: nfscPaymentProviderSchema,
  nfscPaymentDetails: paymentInsertSchema.shape.nfscPaymentDetails
    .unwrap()
    .transform((details, ctx): NfscPaymentDetails => {
      if (details === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'NFSC payment details are required',
        });
        return z.NEVER;
      }
      return details;
    }),
});

export type NfscPaymentProviderDetails = Omit<
  z.infer<typeof nfscPaymentProviderDetailsSchema>,
  'nfscPaymentDetails'
> & {
  nfscPaymentDetails: NfscPaymentDetails;
};

export const paymentProviderDetailsSchema = z.discriminatedUnion(
  'paymentProvider',
  [stripePaymentProviderDetailsSchema, nfscPaymentProviderDetailsSchema],
);

export type PaymentProviderDetails = z.infer<
  typeof paymentProviderDetailsSchema
>;

/**
 * Type guard function to check if payment details are Stripe payment details
 * @param details The payment provider details to check
 * @returns Narrowed type with Stripe payment details if applicable
 */
export function isStripePayment(
  details:
    | {
        paymentProvider: (typeof paymentProviderSchema.options)[number];
        stripePaymentDetails?: z.infer<typeof stripePaymentDetailsSchema>;
        nfscPaymentDetails?: z.infer<
          typeof paymentInsertSchema.shape.nfscPaymentDetails
        >;
      }
    | unknown,
): details is StripePaymentProviderDetails {
  return stripePaymentProviderDetailsSchema.safeParse(details).success;
}

/**
 * Type guard function to check if payment details are NFSC payment details
 * @param details The payment provider details to check
 * @returns Narrowed type with NFSC payment details if applicable
 */
export function isNfscPayment(
  details:
    | {
        paymentProvider: (typeof paymentProviderSchema.options)[number];
        stripePaymentDetails?: z.infer<typeof stripePaymentDetailsSchema>;
        nfscPaymentDetails?: z.infer<
          typeof paymentInsertSchema.shape.nfscPaymentDetails
        >;
      }
    | unknown,
): details is NfscPaymentProviderDetails {
  return nfscPaymentProviderDetailsSchema.safeParse(details).success;
}

export const orderItemStatusSchema = z.enum(orderStatusEnum.enumValues);
export type OrderItemStatus = z.infer<typeof orderItemStatusSchema>;

export const itemTypeSchema = z.enum(itemTypeEnum.enumValues);
export type ItemType = z.infer<typeof itemTypeSchema>;

export type {
  NamefiNftSelect,
  NamefiNftWithAiAnalysisSelect,
  NamefiNftOwnersSelect,
  BurnedNamefiNftSelect,
} from './schemas/onchain-indexers';
