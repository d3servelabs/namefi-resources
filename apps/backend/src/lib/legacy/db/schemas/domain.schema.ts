import { Schema, model } from 'mongoose';

const DomainSchema = new Schema(
  {
    _id: { type: String, required: true }, // hash
    ldhName: { type: String, required: true },
    unicodeName: { type: String, required: true },
    levelsCount: { type: Number, default: 2 },
    parentDomainName: String,
    tldName: String,
    provider: { type: String, default: 'route53' },
    autoRenewEnabled: Boolean,
  },
  {
    collection: 'domains',
    timestamps: false,
  },
);

// Indexes
DomainSchema.index({ tldName: 1 });
DomainSchema.index({ levelsCount: 1 });
DomainSchema.index({ provider: 1 });

export const Domain = model('Domain', DomainSchema);
