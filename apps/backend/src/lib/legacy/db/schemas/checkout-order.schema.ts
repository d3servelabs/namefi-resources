import { Schema, model } from 'mongoose';
import { CheckoutOrderStatus } from './common-types';

const CheckoutOrderSchema = new Schema(
  {
    creatorId: { type: String, required: true },
    namefiPaymentIntentId: {
      type: Schema.Types.ObjectId,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: Object.values(CheckoutOrderStatus),
      default: CheckoutOrderStatus.CREATED,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    useNfscBalance: { type: Boolean, required: true },
    chargedWalletAddress: String,
    isTest: { type: Boolean, default: false },
  },
  {
    collection: 'checkout-orders',
    timestamps: false,
  },
);

export const CheckoutOrder = model('CheckoutOrder', CheckoutOrderSchema);
