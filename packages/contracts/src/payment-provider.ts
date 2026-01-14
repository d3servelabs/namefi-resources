import { z } from 'zod';

export const paymentProviderSchema = z.enum([
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'STRIPE',
]);

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

const stripePaymentDetailsSchema = z.object({
  paymentMethodId: z.string().optional(),
});

const nfscPaymentDetailsSchema = z.object({
  walletAddress: z.string(),
  chainId: z.number(),
});

export const stripePaymentProviderDetailsSchema = z.object({
  paymentProvider: z.literal(paymentProviderSchema.enum.STRIPE),
  stripePaymentDetails: stripePaymentDetailsSchema,
});

export const nfscPaymentProviderDetailsSchema = z.object({
  paymentProvider: z.enum([
    paymentProviderSchema.enum.NFSC_BASE,
    paymentProviderSchema.enum.NFSC_ETHEREUM,
    paymentProviderSchema.enum.NFSC_ETHEREUM_SEPOLIA,
  ]),
  nfscPaymentDetails: nfscPaymentDetailsSchema,
});

export const paymentProviderDetailsSchema = z.discriminatedUnion(
  'paymentProvider',
  [stripePaymentProviderDetailsSchema, nfscPaymentProviderDetailsSchema],
);

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
