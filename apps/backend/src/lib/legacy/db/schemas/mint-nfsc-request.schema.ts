import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';
import {
  MintRequestAttemptSchema,
  MintRequestStatus,
  TokenAmountSchema,
} from './common-types';

const MintNfscRequestSchema = new Schema(
  {
    reference: { type: String, default: () => crypto.randomUUID() },
    amountInNfsc: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(MintRequestStatus),
      default: MintRequestStatus.PENDING,
    },
    txHash: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    txSentAt: Date,
    mintingDate: Date,
    settledAt: Date,
    retriedAt: Date,
    nonce: String,
    attempts: [MintRequestAttemptSchema],
    onChainChargeAmount: TokenAmountSchema,
    chainId: { type: Number, required: true },
    ownerAddress: { type: String, required: true },
    error: Schema.Types.Mixed,
    workflowStepId: { type: Schema.Types.ObjectId, unique: true },
    onRamp: Boolean,
  },
  {
    collection: 'mint-nfsc-requests',
    timestamps: false,
  },
);

// Indexes
MintNfscRequestSchema.index({ ownerAddress: 1 });
MintNfscRequestSchema.index({ chainId: 1 });
MintNfscRequestSchema.index({ status: 1 });
MintNfscRequestSchema.index({ chainId: 1, ownerAddress: 1 });
MintNfscRequestSchema.index({ chainId: 1, status: 1 });
MintNfscRequestSchema.index({ chainId: 1, ownerAddress: 1, status: 1 });

export const MintNfscRequest = model('MintNfscRequest', MintNfscRequestSchema);
