import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import {
  aiGenerationsTable,
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
  usersTable,
  freeClaimsTable,
  freeClaimClaimingStatusEnum,
  domainAiAnalysisTable,
  namefiNftWithAiAnalysisView,
  aiAppraisalDataSchema,
  poweredbyNamefiDomainsTable,
} from './schema';

/**
 * Zod schemas for type-safe operations
 */
export const userInsertSchema = createInsertSchema(usersTable);
export const userSelectSchema = createSelectSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export const cartItemInsertSchema = createInsertSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const cartItemSelectSchema = createSelectSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const cartItemUpdateSchema = createUpdateSchema(cartItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});

export const paymentInsertSchema = createInsertSchema(paymentsTable);
export const paymentSelectSchema = createSelectSchema(paymentsTable);
export const paymentUpdateSchema = createUpdateSchema(paymentsTable);

export const refundInsertSchema = createInsertSchema(refundsTable);
export const refundSelectSchema = createSelectSchema(refundsTable);
export const refundUpdateSchema = createUpdateSchema(refundsTable);

export const orderInsertSchema = createInsertSchema(ordersTable);
export const orderSelectSchema = createSelectSchema(ordersTable);
export const orderUpdateSchema = createUpdateSchema(ordersTable);

export const orderItemInsertSchema = createInsertSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const orderItemSelectSchema = createSelectSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
});
export const orderItemUpdateSchema = createUpdateSchema(orderItemsTable, {
  normalizedDomainName: namefiNormalizedDomainSchema,
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

export const namefiNftWithAiAnalysisSelectSchema = createSelectSchema(
  namefiNftWithAiAnalysisView,
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

// Namefi Nft With Ai Analysis types
export type NamefiNftWithAiAnalysisSelect = z.infer<
  typeof namefiNftWithAiAnalysisSelectSchema
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
  paymentProviderSchema.Values.NFSC_BASE,
  paymentProviderSchema.Values.NFSC_ETHEREUM,
  paymentProviderSchema.Values.NFSC_ETHEREUM_SEPOLIA,
]);
export type NfscPaymentProvider = z.infer<typeof nfscPaymentProviderSchema>;

export const stripePaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.Values.STRIPE),
  stripePaymentDetails: stripePaymentDetailsSchema,
});

export type StripePaymentProviderDetails = z.infer<
  typeof stripePaymentProviderDetailsSchema
>;

export const nfscPaymentProviderDetailsSchema = z.object({
  paymentProvider: nfscPaymentProviderSchema,
  nfscPaymentDetails: paymentInsertSchema.shape.nfscPaymentDetails
    .unwrap()
    .refine((d) => d !== null),
});

export type NfscPaymentProviderDetails = z.infer<
  typeof nfscPaymentProviderDetailsSchema
>;

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
