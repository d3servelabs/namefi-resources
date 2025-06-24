import { Schema, model } from 'mongoose';

const BatchJobSchema = new Schema(
  {
    userAddress: String,
    submittedBy: String,
    visibleForUser: { type: Boolean, default: true },
  },
  {
    collection: 'batch-jobs',
    timestamps: false,
  },
);

export const BatchJob = model('BatchJob', BatchJobSchema);
