import { Schema, model } from 'mongoose';

const PartnerSchema = new Schema(
  {
    _id: { type: String, required: true },
    accessToken: { type: String, required: true },
    chargingWalletAddress: String,
  },
  {
    collection: 'partners',
    timestamps: false,
  },
);

export const Partner = model('Partner', PartnerSchema);
