import { Schema, model } from 'mongoose';
import { ContactDetailsSchema } from './common-types';

const UserSchema = new Schema(
  {
    _id: { type: String, required: true }, // address
    createdAt: { type: Date, default: Date.now },
    image: String, // URI to profile image
    stripeCustomerId: String,
    contactDetails: ContactDetailsSchema,
  },
  {
    collection: 'users',
    timestamps: false,
  },
);

export const User = model('User', UserSchema);
