import { Schema, model } from 'mongoose';

const RoleSchema = new Schema(
  {
    uniqueName: { type: String, required: true, unique: true },
    label: { type: String, required: true },
  },
  {
    collection: 'roles',
    timestamps: false,
  },
);

export const Role = model('Role', RoleSchema);
