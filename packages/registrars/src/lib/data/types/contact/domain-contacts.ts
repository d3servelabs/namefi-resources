import type { ContactEntity } from './contact-info';

export type DomainContacts = {
  registrantContact: ContactEntity;
  adminContact?: ContactEntity;
  technicalContact?: ContactEntity;
  billingContact?: ContactEntity;
};

export type ContactsMap<ContactType> = {
  registrantContact: ContactType;
  adminContact?: ContactType;
  technicalContact?: ContactType;
  billingContact?: ContactType;
};
