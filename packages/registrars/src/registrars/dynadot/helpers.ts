import { head, tail } from 'ramda';
import type { ContactEntity, DomainContacts } from '#lib/abstract-registrar';
import type { DynadotGetContactDetails } from '#lib/dynadot/common-types';

export function toDynadotContact(
  contact: ContactEntity,
): DynadotGetContactDetails {
  if (
    !contact ||
    !contact.email ||
    !contact.organizationName ||
    !contact.firstName ||
    !contact.lastName ||
    !contact.countryCode ||
    !contact.city ||
    !contact.zipCode ||
    !contact.state ||
    !contact.addressLines?.[0] ||
    !contact.phoneNumber ||
    !contact.fax
  ) {
    throw new Error('contact-not-found');
  }
  return {
    Country: contact.countryCode as any,
    Email: contact.email,
    City: contact.city,
    Organization: contact.organizationName,
    FaxNum: contact.fax,
    PhoneNum: contact.phoneNumber,
    PhoneCc: contact.phoneNumber,
    ZipCode: contact.zipCode,
    State: contact.state,
    Name: contact.firstName + contact.lastName,
    Address1: contact.addressLines?.[0],
    Address2: contact.addressLines?.[1],
    FaxCc: '',
    ContactId: '',
    GtldVerified: '',
  } satisfies DynadotGetContactDetails;
}

export function fromDynadotContact(
  contact: DynadotGetContactDetails,
): ContactEntity {
  const names = contact.Name.split(/\s+/);
  return {
    countryCode: contact.Country as any,
    email: contact.Email,
    city: contact.City,
    organizationName: contact.Organization,
    addressLines: [contact.Address1, contact.Address2],
    fax: contact.FaxNum,
    phoneNumber: contact.PhoneNum,
    zipCode: contact.ZipCode,
    state: contact.State,
    firstName: head(names),
    lastName: tail(names).join(' '),
    contactType: 'COMPANY',
  };
}

export function fromDynadotContactsMap(
  contacts: DynadotContactsMap,
): DomainContacts {
  return {
    registrantContact: fromDynadotContact(contacts.RegistrantContact),
    adminContact: contacts.AdminContact
      ? fromDynadotContact(contacts.AdminContact)
      : undefined,
    technicalContact: contacts.TechContact
      ? fromDynadotContact(contacts.TechContact)
      : undefined,
    billingContact: contacts.BillingContact
      ? fromDynadotContact(contacts.BillingContact)
      : undefined,
  };
}
export function toDynadotContactsMap(
  contacts: DomainContacts,
): DynadotContactsMap {
  return {
    RegistrantContact: toDynadotContact(contacts.registrantContact),
    AdminContact: contacts.adminContact
      ? toDynadotContact(contacts.adminContact)
      : undefined,
    TechContact: contacts.technicalContact
      ? toDynadotContact(contacts.technicalContact)
      : undefined,
    BillingContact: contacts.billingContact
      ? toDynadotContact(contacts.billingContact)
      : undefined,
  };
}

export type DynadotContactsMap = {
  RegistrantContact: DynadotGetContactDetails;
  AdminContact?: DynadotGetContactDetails;
  TechContact?: DynadotGetContactDetails;
  BillingContact?: DynadotGetContactDetails;
};
