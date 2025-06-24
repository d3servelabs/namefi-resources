import { Schema, model } from 'mongoose';
import { NotificationRecordLevel } from './common-types';

const NotificationRecordSchema = new Schema(
  {
    title: Schema.Types.Mixed,
    message: Schema.Types.Mixed,
    notificationLevel: {
      type: String,
      enum: Object.values(NotificationRecordLevel),
      default: NotificationRecordLevel.INFO,
    },
    extraData: Schema.Types.Mixed,
    date: { type: Date, default: Date.now },
    userAddress: String,
    emailSent: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    tags: [String],
  },
  {
    collection: 'notification-records',
    timestamps: false,
  },
);

export const NotificationRecord = model(
  'NotificationRecord',
  NotificationRecordSchema,
);
