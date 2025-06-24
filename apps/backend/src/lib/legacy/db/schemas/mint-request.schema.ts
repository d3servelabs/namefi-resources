import { Schema, model } from 'mongoose';
import { MintRequestAttemptSchema, MintRequestStatus } from './common-types';

const MintRequestSchema = new Schema(
  {
    operationId: { type: Schema.Types.ObjectId },
    txHash: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    txSentAt: Date,
    mintingDate: Date,
    settledAt: Date,
    retriedAt: Date,
    status: {
      type: String,
      enum: Object.values(MintRequestStatus),
      default: MintRequestStatus.PENDING,
    },
    nonce: String,
    attempts: [MintRequestAttemptSchema],
    chargeAmount: Number,
    chainId: Number,
    domainId: { type: String, required: true },
    ownerAddress: { type: String, required: true },
    error: Schema.Types.Mixed,
  },
  {
    collection: 'mint-requests',
    timestamps: false,
  },
);

// Indexes
MintRequestSchema.index({ ownerAddress: 1 });
MintRequestSchema.index({ domainId: 1 });
MintRequestSchema.index({ chainId: 1 });
MintRequestSchema.index({ status: 1 });
MintRequestSchema.index({ chainId: 1, ownerAddress: 1 });
MintRequestSchema.index({ chainId: 1, status: 1 });
MintRequestSchema.index({ chainId: 1, ownerAddress: 1, status: 1 });

export const MintRequest = model('MintRequest', MintRequestSchema);
