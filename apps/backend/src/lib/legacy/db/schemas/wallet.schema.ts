import { Schema, model } from 'mongoose';
import { FrozenAssetSchema } from './common-types';

const WalletSchema = new Schema(
  {
    _id: { type: String, required: true }, // chainId::address(checksummed)
    address: { type: String, required: true },
    chainId: { type: Number, default: 1 },
    frozenAssets: [FrozenAssetSchema],
    acidLocked: { type: Boolean, default: false },
  },
  {
    collection: 'wallets',
    timestamps: false,
  },
);

export const Wallet = model('Wallet', WalletSchema);
