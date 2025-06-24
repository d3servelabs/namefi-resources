import { Schema, model } from 'mongoose';
import {
  CheckoutOrderItemStatus,
  CheckoutOrderItemType,
  MoneyAmountSchema,
  NamefiRegistrarOption,
} from './common-types';

const CheckoutOrderItemSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: Object.values(CheckoutOrderItemStatus),
      default: CheckoutOrderItemStatus.CREATED,
    },
    mintTxHash: String,
    workflowId: { type: Schema.Types.ObjectId, unique: true },
    type: {
      type: String,
      enum: Object.values(CheckoutOrderItemType),
      required: true,
    },
    chainId: { type: Number, required: true },
    chargeAmount: { type: MoneyAmountSchema, required: true },
    domainNameLdh: String,
    registrar: { type: String, enum: Object.values(NamefiRegistrarOption) },
    durationInYears: Number,
    receivingWalletAddress: String,
    encryptionKeyId: String,
    encryptedEppAuthorizationCode: String,
    mintNfscAmount: Number,
  },
  {
    collection: 'checkout-order-items',
    timestamps: false,
  },
);

export const CheckoutOrderItem = model(
  'CheckoutOrderItem',
  CheckoutOrderItemSchema,
);
