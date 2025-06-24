import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';
import { CreditRecordExtraDataSchema } from './common-types';

const CreditRecordSchema = new Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    externalId: { type: String, required: true },
    txHash: { type: String, required: true },
    chainId: { type: Number, required: true },
    amount: { type: Number, required: true },
    blockNumber: { type: String, required: true },
    extraData: CreditRecordExtraDataSchema,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    toAddress: { type: String, required: true },
    fromAddress: { type: String, required: true },
    airdropped: { type: Boolean, required: true },
  },
  {
    collection: 'credit-records',
    timestamps: false,
  },
);

// Indexes
CreditRecordSchema.index({ toAddress: 1 });
CreditRecordSchema.index({ fromAddress: 1 });
CreditRecordSchema.index({ chainId: 1 });
CreditRecordSchema.index({ blockNumber: 1 });
CreditRecordSchema.index({ chainId: 1, toAddress: 1 });
CreditRecordSchema.index({ chainId: 1, fromAddress: 1 });
CreditRecordSchema.index({ chainId: 1, blockNumber: 1 });

// Unique compound index
CreditRecordSchema.index({ chainId: 1, externalId: 1 }, { unique: true });

export const CreditRecord = model('CreditRecord', CreditRecordSchema);
