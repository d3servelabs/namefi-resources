import { Schema, model } from 'mongoose';
import { CartItemSchema, CartNoteSchema } from './common-types';

const CartSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: [CartItemSchema],
    notes: [CartNoteSchema],
  },
  {
    collection: 'carts',
    timestamps: false,
  },
);

export const Cart = model('Cart', CartSchema);
