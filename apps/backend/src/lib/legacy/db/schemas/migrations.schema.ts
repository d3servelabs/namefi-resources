import { Schema, model } from 'mongoose';
import { MigrationStatus } from './common-types';

const MigrationsSchema = new Schema(
  {
    _id: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    status: {
      type: String,
      enum: Object.values(MigrationStatus),
      default: MigrationStatus.STARTED,
    },
  },
  {
    collection: '__namefi_migrations',
    timestamps: false,
  },
);

export const Migrations = model('Migrations', MigrationsSchema);
