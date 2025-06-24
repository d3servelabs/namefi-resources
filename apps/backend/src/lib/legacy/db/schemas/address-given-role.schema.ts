import { Schema, model } from 'mongoose';

const AddressGivenRoleSchema = new Schema(
  {
    roleId: { type: Schema.Types.ObjectId, required: true },
    eip155Address: { type: String, required: true },
  },
  {
    collection: 'address-given-roles',
    timestamps: false,
  },
);

export const AddressGivenRole = model(
  'AddressGivenRole',
  AddressGivenRoleSchema,
);
