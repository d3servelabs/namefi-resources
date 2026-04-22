import { z } from 'zod';

import { paymentProviderValues } from './shared-schemas';

export const paymentProviderSchema = z.enum(paymentProviderValues);
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export const stripePaymentDetailsSchema = z.object({
  paymentMethodId: z.string().optional(),
});
export type StripePaymentDetails = z.infer<typeof stripePaymentDetailsSchema>;

export const nfscPaymentDetailsSchema = z.object({
  walletAddress: z.string(),
  chainId: z.number(),
});
export type NfscPaymentDetails = z.infer<typeof nfscPaymentDetailsSchema>;

export const nfscPaymentProviderSchema = z.enum([
  paymentProviderSchema.enum.NFSC_BASE,
  paymentProviderSchema.enum.NFSC_ETHEREUM,
  paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
]);
export type NfscPaymentProvider = z.infer<typeof nfscPaymentProviderSchema>;

export const autoRenewalPaymentProviderSchema = z.enum([
  paymentProviderSchema.enum.NFSC_BASE,
  paymentProviderSchema.enum.NFSC_ETHEREUM,
  paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
  paymentProviderSchema.enum.STRIPE,
]);
export type AutoRenewalPaymentProvider = z.infer<
  typeof autoRenewalPaymentProviderSchema
>;

export const mppPaymentMethodSchema = z.enum(['tempo', 'stripe']);
export type MppPaymentMethod = z.infer<typeof mppPaymentMethodSchema>;

export const mppPaymentReceiptSchema = z.object({
  externalId: z.string().optional(),
  method: mppPaymentMethodSchema,
  reference: z.string(),
  status: z.literal('success'),
  timestamp: z.string(),
});
export type MppPaymentReceipt = z.infer<typeof mppPaymentReceiptSchema>;

export const mppPaymentDetailsSchema = z.object({
  challenge: z.record(z.string(), z.unknown()).optional(),
  credentialSummary: z
    .object({
      source: z.string().optional(),
      tempoPayloadType: z.enum(['hash', 'transaction']).optional(),
      stripeExternalId: z.string().optional(),
    })
    .optional(),
  method: mppPaymentMethodSchema,
  nftReceivingWalletAddress: z.string().optional(),
  payerDid: z.string().optional(),
  payerWalletAddress: z.string().optional(),
  presettled: z.boolean().optional(),
  receipt: mppPaymentReceiptSchema,
  refundTxHash: z.string().optional(),
  settledAt: z.string().optional(),
});
export type MppPaymentDetails = z.infer<typeof mppPaymentDetailsSchema>;

export const x402PaymentPayloadSchema = z.object({
  x402Version: z.number(),
  resource: z.object({
    url: z.string(),
    description: z.string(),
    mimeType: z.string(),
  }),
  accepted: z.object({
    scheme: z.string(),
    // Runtime intentionally matches the previous z.string() behavior; the
    // template type keeps this contract assignable to the existing PaymentPayload.
    network: z.custom<`${string}:${string}`>(
      (value) => typeof value === 'string',
    ),
    asset: z.string(),
    amount: z.string(),
    payTo: z.string(),
    maxTimeoutSeconds: z.number(),
    extra: z.record(z.string(), z.unknown()),
  }),
  payload: z.record(z.string(), z.unknown()),
  extensions: z.record(z.string(), z.unknown()).optional(),
});
export type X402PaymentPayload = z.infer<typeof x402PaymentPayloadSchema>;

export const x402PaymentPayloadEncryptionVersionSchema = z.enum(['v1']);
export type X402PaymentPayloadEncryptionVersion = z.infer<
  typeof x402PaymentPayloadEncryptionVersionSchema
>;

export const x402PaymentDetailsSchema = z.object({
  buyerWalletAddress: z.string(),
  receiverWalletAddress: z.string(),
  network: z.string(),
  paymentPayload: x402PaymentPayloadSchema.optional(),
  paymentPayloadEncryptionVersion:
    x402PaymentPayloadEncryptionVersionSchema.optional(),
  presettled: z.boolean().optional(),
  settlementTxHash: z.string().optional(),
  settledAt: z.string().optional(),
  refundTxHash: z.string().optional(),
});
export type X402PaymentDetails = z.infer<typeof x402PaymentDetailsSchema>;

export const stripePaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.enum.STRIPE),
  stripePaymentDetails: stripePaymentDetailsSchema,
});

export const nfscPaymentProviderDetailsSchema = z.object({
  paymentProvider: nfscPaymentProviderSchema,
  nfscPaymentDetails: nfscPaymentDetailsSchema,
});

export const mppPaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.enum.MPP),
  metadata: z.object({
    mppPaymentDetails: mppPaymentDetailsSchema,
  }),
});

export const x402PaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.enum.X402),
  x402PaymentDetails: x402PaymentDetailsSchema,
});

export const paymentProviderDetailsSchema = z.discriminatedUnion(
  'paymentProvider',
  [
    stripePaymentProviderDetailsSchema,
    nfscPaymentProviderDetailsSchema,
    mppPaymentProviderDetailsSchema,
    x402PaymentProviderDetailsSchema,
  ],
);

export type StripePaymentProviderDetails = z.infer<
  typeof stripePaymentProviderDetailsSchema
>;
export type NfscPaymentProviderDetails = z.infer<
  typeof nfscPaymentProviderDetailsSchema
>;
export type MppPaymentProviderDetails = z.infer<
  typeof mppPaymentProviderDetailsSchema
>;
export type X402PaymentProviderDetails = z.infer<
  typeof x402PaymentProviderDetailsSchema
>;
export type PaymentProviderDetails = z.infer<
  typeof paymentProviderDetailsSchema
>;

export function isStripePayment(
  details: unknown,
): details is z.infer<typeof stripePaymentProviderDetailsSchema> {
  return stripePaymentProviderDetailsSchema.safeParse(details).success;
}

export function isNfscPayment(
  details: unknown,
): details is z.infer<typeof nfscPaymentProviderDetailsSchema> {
  return nfscPaymentProviderDetailsSchema.safeParse(details).success;
}

export function isX402Payment(
  details: unknown,
): details is z.infer<typeof x402PaymentProviderDetailsSchema> {
  return x402PaymentProviderDetailsSchema.safeParse(details).success;
}

export function isMppPayment(
  details: unknown,
): details is z.infer<typeof mppPaymentProviderDetailsSchema> {
  return mppPaymentProviderDetailsSchema.safeParse(details).success;
}
