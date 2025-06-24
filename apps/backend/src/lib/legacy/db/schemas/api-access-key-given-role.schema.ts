import { Schema, model } from 'mongoose';

const ApiAccessKeyGivenRoleSchema = new Schema(
  {
    roleId: { type: Schema.Types.ObjectId, required: true },
    apiAccessKeyId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    collection: 'api-access-key-given-roles',
    timestamps: false,
  },
);

export const ApiAccessKeyGivenRole = model(
  'ApiAccessKeyGivenRole',
  ApiAccessKeyGivenRoleSchema,
);
