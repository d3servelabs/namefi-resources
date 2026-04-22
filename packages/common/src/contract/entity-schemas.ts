import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { recordTypeEnum } from '@namefi-astra/zod-dns';
import { z } from 'zod';

import {
  itemTypeSchema,
  orderStatusSchema,
  paymentStatusSchema,
} from '../shared-schemas';
import {
  mppPaymentDetailsSchema,
  nfscPaymentDetailsSchema,
  paymentProviderSchema,
  stripePaymentDetailsSchema,
  x402PaymentDetailsSchema,
} from '../payment-provider';

const timestampFieldsSchema = {
  createdAt: z.date(),
  updatedAt: z.date(),
};

const lifecycleTimestampFieldsSchema = {
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
};

const claimMetadataShape = {
  freeClaim: z.boolean().optional(),
  groupOrCampaignKey: z.string().optional(),
  claimId: z.string().optional(),
};

export const orderMintTransactionMetadataSchema = z.object({
  txHash: z.string(),
  recordedAt: z.string(),
});
export type OrderMintTransactionMetadata = z.infer<
  typeof orderMintTransactionMetadataSchema
>;

export const cartItemMetadataSchema = z.object(claimMetadataShape).loose();
export type CartItemMetadata = z.infer<typeof cartItemMetadataSchema>;

const postProcessDnsRecordSchema = z.object({
  name: z.string(),
  type: recordTypeEnum,
  rdata: z.string(),
  ttl: z.number().int().min(0).max(2147483647).optional(),
});

const postProcessOrderItemActionSchema = z.object({
  scope: z.literal('dns-records'),
  action: z.enum(['add', 'set']),
  records: z.array(postProcessDnsRecordSchema).min(1),
});

export const postProcessOrderItemSchema = z
  .object({
    actions: z.array(postProcessOrderItemActionSchema).min(1),
  })
  .loose();
export type PostProcessOrderItem = z.infer<typeof postProcessOrderItemSchema>;

export const legacyOrderItemMetadataSchema = z.object({
  source: z.literal('legacy'),
  type: z.literal('legacy-migration'),
  legacyItemId: z.string().min(1, 'Legacy item ID is required'),
  chainId: z.number().min(1, 'Chain ID must be positive'),
  receivingWalletAddress: z.string().nullable(),
});

export const orderItemRequiredActionSchema = z.enum([
  'EPP_UNLOCK_REQUIRED',
  'EPP_AUTH_CODE_UPDATE_REQUIRED',
  'UNDETERMINED',
]);

export const orderItemFailureResolutionSchema = z.enum([
  'USER_SIGNAL',
  'TIMEOUT',
]);

export const orderItemFailureDetailsSchema = z.object({
  requiredAction: orderItemRequiredActionSchema,
  resolution: orderItemFailureResolutionSchema,
  actor: z.enum(['USER', 'ADMIN']).optional(),
  actorId: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
  recordedAt: z.string(),
});

export const orderItemMetadataSchema = cartItemMetadataSchema.extend({
  mintTransaction: orderMintTransactionMetadataSchema.optional(),
  postProcessOrderItem: postProcessOrderItemSchema.optional(),
  requiredAction: orderItemRequiredActionSchema.optional(),
  failureDetails: orderItemFailureDetailsSchema.optional(),
  backfilled_started_finished_at: z.boolean().optional(),
  legacyOrderItemMetadata: legacyOrderItemMetadataSchema.optional(),
});
export type OrderItemMetadata = z.infer<typeof orderItemMetadataSchema>;

export const legacyOrderMetadataSchema = z.object({
  source: z.literal('legacy'),
  type: z.literal('legacy-migration'),
  legacyOrderId: z.string().min(1, 'Legacy order ID is required'),
  useNfscBalance: z.boolean(),
  migratedAt: z.string().min(1, 'Migrated at date is required'),
  legacyPaymentIntentId: z
    .string()
    .min(1, 'Legacy payment intent ID is required')
    .optional(),
  legacyPaymentDetails: z
    .object({
      status: z.string().min(1, 'Payment status is required'),
      provider: z.string().min(1, 'Payment provider is required'),
      paymentType: z.string().min(1, 'Payment type is required'),
      txHash: z.string().optional(),
      externalId: z.string().optional(),
    })
    .optional(),
});

export const orderMetadataSchema = z
  .object({
    ...claimMetadataShape,
    mintTransactions: z
      .record(z.string(), orderMintTransactionMetadataSchema)
      .optional(),
    backfilled_started_finished_at: z.boolean().optional(),
    legacyOrderMetadata: legacyOrderMetadataSchema.optional(),
  })
  .loose();
export type OrderMetadata = z.infer<typeof orderMetadataSchema>;

const legacyStripeRefundDetailSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  amountInUSDCents: z.number().min(0, 'Amount must be non-negative'),
  status: z.string().min(1, 'Status is required'),
  createdAt: z.string().min(1, 'Creation date is required'),
  paymentProviderReferenceId: z
    .string()
    .min(1, 'Payment provider reference ID is required'),
});

const legacyStripeRefundSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  fullRefund: z.boolean(),
  totalRefundAmount: z
    .number()
    .min(0, 'Total refund amount must be non-negative'),
  refundsDetails: z.array(legacyStripeRefundDetailSchema),
});

const legacyPaymentIntentSchema = z.object({
  id: z.string().min(1, 'Payment intent ID is required'),
  amountinusdcents: z.number().min(0, 'Amount must be non-negative'),
  externalid: z.string().nullable(),
  paymenttype: z.string().min(1, 'Payment type is required'),
  status: z.string().min(1, 'Status is required'),
  txhash: z.string().nullable(),
  modified: z.boolean().nullable(),
  refundtxhash: z.string().nullable(),
  stripeRefund: legacyStripeRefundSchema.optional(),
});

export const paymentMetadataSchema = z.object({
  confirmationTokenId: z.string().optional(),
  legacyPaymentMetadata: legacyPaymentIntentSchema.optional(),
  mppPaymentDetails: mppPaymentDetailsSchema.optional(),
});
export type PaymentMetadata = z.infer<typeof paymentMetadataSchema>;

export const userSchema = z.object({
  id: z.string(),
  primaryEmail: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  privyUserId: z.string(),
  subscribeToEmails: z.boolean(),
  lastSignInAt: z.date().nullable(),
  lastAccessedSessionAt: z.date().nullable(),
  ...timestampFieldsSchema,
});
export type UserSelect = z.infer<typeof userSchema>;

export const cartItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  amountInUSDCents: z.number(),
  durationInYears: z.number(),
  type: itemTypeSchema,
  registrar: z.string(),
  encryptionKeyId: z.string().nullable(),
  encryptedEppAuthorizationCode: z.string().nullable(),
  metadata: cartItemMetadataSchema.nullish(),
  ...timestampFieldsSchema,
});
export type CartItemSelect = z.infer<typeof cartItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: orderStatusSchema,
  amountInUSDCents: z.number(),
  nftWalletAddress: z.string().nullable(),
  nftChainId: z.number().nullable(),
  metadata: orderMetadataSchema.nullish(),
  ...timestampFieldsSchema,
  ...lifecycleTimestampFieldsSchema,
});
export type OrderSelect = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  amountInUSDCents: z.number(),
  durationInYears: z.number(),
  type: itemTypeSchema,
  registrar: z.string(),
  encryptionKeyId: z.string().nullable(),
  encryptedEppAuthorizationCode: z.string().nullable(),
  status: orderStatusSchema.nullable(),
  metadata: orderItemMetadataSchema.optional(),
  ...timestampFieldsSchema,
  ...lifecycleTimestampFieldsSchema,
});
export type OrderItemSelect = z.infer<typeof orderItemSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  amountInUSDCents: z.number(),
  status: paymentStatusSchema,
  paymentProvider: paymentProviderSchema,
  paymentProviderReferenceId: z.string().nullable(),
  orderId: z.string().nullable(),
  nfscPaymentDetails: nfscPaymentDetailsSchema.nullable(),
  stripePaymentDetails: stripePaymentDetailsSchema.nullable(),
  metadata: paymentMetadataSchema.nullable(),
  x402PaymentDetails: x402PaymentDetailsSchema.nullable(),
  ...timestampFieldsSchema,
  ...lifecycleTimestampFieldsSchema,
});
export type PaymentSelect = z.infer<typeof paymentSchema>;

export const dnsRecordSchema = z.object({
  id: z.string(),
  zoneName: namefiNormalizedDomainSchema,
  name: z.string(),
  type: recordTypeEnum,
  class: z.string(),
  ttl: z.number(),
  rdata: z.string(),
  metadata: z.unknown(),
  ...timestampFieldsSchema,
});
export type DnsRecordSelect = z.infer<typeof dnsRecordSchema>;

export const wishlistedDomainSchema = z.object({
  id: z.string(),
  userId: z.string(),
  normalizedDomainName: namefiNormalizedDomainSchema,
  ...timestampFieldsSchema,
});
export type WishlistedDomainSelect = z.infer<typeof wishlistedDomainSchema>;

export const poweredByNamefiDurationConstraintsSchema = z.object({
  minDurationInYears: z.number(),
  maxDurationInYears: z.number(),
});

export const poweredByNamefiDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(z.string()).nullable(),
  additionalReservedNames: z.array(z.string()).nullable(),
  durationConstraints: poweredByNamefiDurationConstraintsSchema,
  costPerYearInUsdCents: z.number(),
  metadata: z.unknown(),
  ownerId: z.string().nullable(),
  enabled: z.boolean(),
  startRolloutAt: z.date().nullable(),
  ...timestampFieldsSchema,
});
export type PoweredByNamefiDomainSelect = z.infer<
  typeof poweredByNamefiDomainSchema
>;

export type OrderItemForUser = Omit<OrderItemSelect, 'metadata'> & {
  metadata: OrderItemMetadata | null;
  nftWalletAddress: OrderSelect['nftWalletAddress'];
  nftChainId: OrderSelect['nftChainId'];
  orderMetadata: OrderSelect['metadata'];
};

export type OrderItemsForUser = OrderItemForUser[];

export type InteractionLoggingCartItem = Pick<
  CartItemSelect,
  'amountInUSDCents' | 'normalizedDomainName'
>;

export type DomainNameRow = {
  normalizedDomainName: NamefiNormalizedDomain;
};
