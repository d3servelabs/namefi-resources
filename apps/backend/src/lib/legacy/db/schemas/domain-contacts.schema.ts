import { Schema, model } from 'mongoose';
import { ContactDetailsSchema } from './common-types';

const DomainContactsSchema = new Schema(
  {
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: Date,
    registrantContact: { type: ContactDetailsSchema, required: true },
    adminContact: ContactDetailsSchema,
    technicalContact: ContactDetailsSchema,
    domainHash: { type: String, required: true, unique: true },
  },
  {
    collection: 'domain-contacts',
    timestamps: false,
  },
);

export const DomainContacts = model('DomainContacts', DomainContactsSchema);
