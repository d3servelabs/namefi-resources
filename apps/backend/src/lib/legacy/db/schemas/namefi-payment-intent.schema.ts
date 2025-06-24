import { Schema, model } from 'mongoose';
import {
  MoneyAmountSchema,
  NamefiPaymentProvider,
  NamefiPaymentType,
  PaymentStatus,
  RefundDetailsSchema,
} from './common-types';

const NamefiPaymentIntentSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
    },
    amount: { type: MoneyAmountSchema, required: true },
    externalId: String,
    txHash: String,
    provider: { type: String, enum: Object.values(NamefiPaymentProvider) },
    paymentType: {
      type: String,
      enum: Object.values(NamefiPaymentType),
      required: true,
    },
    refund: RefundDetailsSchema,
  },
  {
    collection: 'namefi-payment-intents',
    timestamps: false,
  },
);

export const NamefiPaymentIntent = model(
  'NamefiPaymentIntent',
  NamefiPaymentIntentSchema,
);
