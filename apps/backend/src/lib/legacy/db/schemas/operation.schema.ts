import { Schema, model } from 'mongoose';
import {
  DisableDnssecOperationDetailsSchema,
  OperationStatus,
  OperationType,
  RenewOperationDetailsSchema,
} from './common-types';

const OperationSchema = new Schema(
  {
    operationName: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    settledAt: Date,
    status: {
      type: String,
      enum: Object.values(OperationStatus),
      default: OperationStatus.PENDING,
    },
    metadata: Schema.Types.Mixed,
    chargeAmount: { type: Number, default: 0 },
    domainId: { type: String, required: true },
    userAddress: { type: String, required: true },
    type: { type: String, enum: Object.values(OperationType), required: true },
    error: Schema.Types.Mixed,
    chainId: Number,
    workflowStepId: { type: Schema.Types.ObjectId, unique: true },
    renewOperationDetails: RenewOperationDetailsSchema,
    disableDnssecOperationDetails: DisableDnssecOperationDetailsSchema,
  },
  {
    collection: 'operations',
    timestamps: false,
  },
);

// Indexes
OperationSchema.index({ userAddress: 1 });
OperationSchema.index({ domainId: 1 });
OperationSchema.index({ chainId: 1 });
OperationSchema.index({ type: 1 });
OperationSchema.index({ status: 1 });
OperationSchema.index({ chainId: 1, userAddress: 1 });
OperationSchema.index({ chainId: 1, status: 1 });
OperationSchema.index({ chainId: 1, type: 1 });
OperationSchema.index({ chainId: 1, type: 1, status: 1 });
OperationSchema.index({ chainId: 1, userAddress: 1, type: 1, status: 1 });

export const Operation = model('Operation', OperationSchema);
