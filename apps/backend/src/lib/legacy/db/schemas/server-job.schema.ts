import { Schema, model } from 'mongoose';
import {
  ServerJobStatus,
  ServerJobStepsSchema,
  ServerJobType,
} from './common-types';

const ServerJobSchema = new Schema(
  {
    type: { type: String, enum: Object.values(ServerJobType), required: true },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    settledAt: Date,
    status: {
      type: String,
      enum: Object.values(ServerJobStatus),
      default: ServerJobStatus.PENDING,
    },
    currentStep: { type: Number, default: 0 },
    stepsCount: { type: Number, required: true },
    steps: [ServerJobStepsSchema],
    metadata: Schema.Types.Mixed,
    userAddress: String,
    submittedBy: String,
    visibleForUser: { type: Boolean, default: true },
    batchId: { type: Schema.Types.ObjectId },
  },
  {
    collection: 'server-jobs',
    timestamps: false,
  },
);

export const ServerJob = model('ServerJob', ServerJobSchema);
