import { Schema, model } from 'mongoose';

const AlertSchema = new Schema(
  {
    title: String,
    message: String,
    level: { type: Number, required: true },
    extraData: Schema.Types.Mixed,
    emailSent: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    tags: [String],
  },
  {
    collection: 'alerts',
    timestamps: false,
  },
);

export const Alert = model('Alert', AlertSchema);
