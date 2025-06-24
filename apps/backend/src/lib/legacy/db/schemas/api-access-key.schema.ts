import { Schema, model } from 'mongoose';

const ApiAccessKeySchema = new Schema(
  {
    expirationDate: Date,
    accessToken: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
  },
  {
    collection: 'api-access-key',
    timestamps: false,
  },
);

export const ApiAccessKey = model('ApiAccessKey', ApiAccessKeySchema);
