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

/**
 * Per-item domain setup overrides applied during REGISTER/IMPORT processing.
 * Each option is optional; when omitted, `fillDefaultDomainConfig` applies its
 * built-in defaults (autoEns/autoPark/autoRenew = true, dnssec = false).
 */
export const orderItemDomainSetupOptionsSchema = z.object({
  autoPark: z.boolean().optional(),
  autoEns: z.boolean().optional(),
  autoRenew: z.boolean().optional(),
  dnssec: z.boolean().optional(),
  /**
   * Import-only: keep the domain's current nameservers by skipping the
   * nameserver reset during setup. Stripped for non-IMPORT items at creation
   * (see {@link stripNonImportDomainSetupOptions}).
   */
  keepExistingNameservers: z.boolean().optional(),
});
export type OrderItemDomainSetupOptions = z.infer<
  typeof orderItemDomainSetupOptionsSchema
>;

/**
 * `keepExistingNameservers` only makes sense for IMPORT items — it keeps a
 * domain's current DNS by skipping the nameserver reset. For any other item
 * type it's meaningless, so strip it at order-item / cart-item creation to keep
 * the stored metadata honest. Returns the metadata unchanged when there's
 * nothing to strip.
 */
export function stripNonImportDomainSetupOptions<
  M extends { domainSetupOptions?: OrderItemDomainSetupOptions },
>(itemType: string, metadata: M | null | undefined): M | undefined {
  if (
    itemType === itemTypeSchema.enum.IMPORT ||
    metadata?.domainSetupOptions?.keepExistingNameservers === undefined
  ) {
    return metadata ?? undefined;
  }
  const { keepExistingNameservers: _drop, ...domainSetupOptions } =
    metadata.domainSetupOptions;
  return { ...metadata, domainSetupOptions };
}

/**
 * A user's GLOBAL domain defaults, stored in the `users.preferences` jsonb
 * column. These back per-item domain setup options: when an order/cart item
 * doesn't specify `autoEns` / `autoRenew`, the user's preference applies (and
 * only then the system default). Every user row is backfilled with
 * {@link DEFAULT_USER_PREFERENCES}.
 */
export const userPreferencesSchema = z.object({
  defaultAutoEns: z.boolean(),
  defaultAutoRenew: z.boolean(),
});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultAutoEns: true,
  defaultAutoRenew: true,
};

export const orderMintTransactionMetadataSchema = z.object({
  txHash: z.string(),
  recordedAt: z.string(),
});
export type OrderMintTransactionMetadata = z.infer<
  typeof orderMintTransactionMetadataSchema
>;

export const cartItemMetadataSchema = z
  .object({
    ...claimMetadataShape,
    domainSetupOptions: orderItemDomainSetupOptionsSchema.optional(),
    /**
     * User's acknowledgement of the TLD's registration requirements (e.g. the
     * .app/.dev "HTTPS required" notice). Only set for TLDs that require
     * explicit confirmation; gates checkout in the cart UI and is carried onto
     * the order item for audit.
     */
    tldRegistrationRequirementAcknowledged: z.boolean().optional(),
  })
  .loose();
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
  domainSetupOptions: orderItemDomainSetupOptionsSchema.optional(),
  // On-chain tx that minted the NFT (REGISTER/IMPORT). Recorded out-of-band by
  // the deferred mint, so it may appear after the item is already SUCCEEDED.
  mintTransaction: orderMintTransactionMetadataSchema.optional(),
  // On-chain tx that updated the NFT expiration (RENEW). Same deferred shape.
  extendTransaction: orderMintTransactionMetadataSchema.optional(),
  postProcessOrderItem: postProcessOrderItemSchema.optional(),
  requiredAction: orderItemRequiredActionSchema.optional(),
  failureDetails: orderItemFailureDetailsSchema.optional(),
  backfilled_started_finished_at: z.boolean().optional(),
  legacyOrderItemMetadata: legacyOrderItemMetadataSchema.optional(),
});
export type OrderItemMetadata = z.infer<typeof orderItemMetadataSchema>;

/**
 * Result of the before/after on-chain NFSC balance check performed by the
 * `reconcileNfscMint` activity for an NFSC top-up order item.
 *
 * All balance/delta fields are in NFSC token units (not USD cents). At the
 * fixed 1 USD = 1 NFSC rate they are numerically equal to the USD amount.
 * - `OK`: the observed balance delta matched the minted amount.
 * - `JUSTIFIED_ANOMALY`: the delta differed, but the difference is fully
 *   explained by concurrent NFSC mints/charges/refunds on the same wallet+chain.
 * - `UNJUSTIFIED_ANOMALY`: the delta differed and could not be explained — an
 *   alert is raised to Namefi.
 * - `BALANCE_READ_FAILED`: a before/after balance read failed; reconciliation
 *   was skipped (observability gap, not an order failure).
 */
export const nfscMintReconciliationSchema = z.object({
  outcome: z.enum([
    'OK',
    'JUSTIFIED_ANOMALY',
    'UNJUSTIFIED_ANOMALY',
    'BALANCE_READ_FAILED',
  ]),
  balanceBefore: z.number().nullable(),
  balanceAfter: z.number().nullable(),
  expectedDelta: z.number(),
  actualDelta: z.number().nullable(),
  sumConcurrentMints: z.number(),
  sumConcurrentCharges: z.number(),
  sumConcurrentRefunds: z.number(),
  unexplainedDelta: z.number().nullable(),
  concurrentMintItemIds: z.array(z.string()),
  concurrentChargePaymentIds: z.array(z.string()),
  concurrentRefundIds: z.array(z.string()),
  windowStart: z.string(),
  checkedAt: z.string(),
});
export type NfscMintReconciliation = z.infer<
  typeof nfscMintReconciliationSchema
>;

export const orderNfscItemMetadataSchema = z
  .object({
    mintTransaction: orderMintTransactionMetadataSchema.optional(),
    reconciliation: nfscMintReconciliationSchema.optional(),
  })
  .loose();
export type OrderNfscItemMetadata = z.infer<typeof orderNfscItemMetadataSchema>;

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
    extendTransactions: z
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
  preferences: userPreferencesSchema,
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

/**
 * Wire shape of a row in the `order_nfsc_items` table — a single NFSC top-up
 * line item. Kept structurally separate from `orderItemSchema` because NFSC
 * items have no domain/registrar/duration.
 *
 * Monetary units: `amountInUSDCents` is USD cents (financial source of truth);
 * `nfscAmount` is the NFSC token amount as an exact decimal string (the
 * `numeric` column is serialized as a string in JS).
 */
export const orderNfscItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amountInUSDCents: z.number(),
  nfscAmount: z.string(),
  recipientWalletAddress: z.string(),
  chainId: z.number(),
  mintTxHash: z.string().nullable(),
  status: orderStatusSchema.nullable(),
  metadata: orderNfscItemMetadataSchema.optional(),
  ...timestampFieldsSchema,
  ...lifecycleTimestampFieldsSchema,
});
export type OrderNfscItemSelect = z.infer<typeof orderNfscItemSchema>;

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
