import { Schema, model } from 'mongoose';
import { TransactionStatus } from './common-types';

const TransactionSchema = new Schema(
  {
    txHash: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING_SUBMIT,
    },
    contract: String,
    method: String,
    metadata: Schema.Types.Mixed,
    error: Schema.Types.Mixed,
    receipt: Schema.Types.Mixed,
    txArgs: Schema.Types.Mixed,
    domainId: String,
    userAddress: String,
    chainId: { type: Number, required: true },
    callingOperationId: { type: Schema.Types.ObjectId },
    documentVersion: Number,
  },
  {
    collection: 'transaction',
    timestamps: false,
  },
);

// Indexes
TransactionSchema.index({ chainId: 1 });
TransactionSchema.index({ userAddress: 1 });
TransactionSchema.index({ domainId: 1 });

export const Transaction = model('Transaction', TransactionSchema);
