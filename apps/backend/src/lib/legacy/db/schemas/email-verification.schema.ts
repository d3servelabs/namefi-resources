import { Schema, model } from 'mongoose';
import { VerificationStatus } from './common-types';

const EmailVerificationSchema = new Schema(
  {
    userAddress: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    verificationCode: { type: String, required: true },
  },
  {
    collection: 'email-verifications',
    timestamps: false,
  },
);

export const EmailVerification = model(
  'EmailVerification',
  EmailVerificationSchema,
);
