import { Schema, model } from 'mongoose';
import { RenewOption } from './common-types';

const AutoRenewPreferenceSchema = new Schema(
  {
    _id: { type: String, required: true }, // ownerAddress_domainLdh
    autoRenewOption: {
      type: String,
      enum: Object.values(RenewOption),
      default: RenewOption.AUTOMATIC,
    },
  },
  {
    collection: 'auto-renew-preference',
    timestamps: false,
  },
);

export const AutoRenewPreference = model(
  'AutoRenewPreference',
  AutoRenewPreferenceSchema,
);
