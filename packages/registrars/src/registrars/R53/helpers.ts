import type * as R53 from '@aws-sdk/client-route-53-domains';
import { isNil, isNotNil } from 'ramda';
import { DomainContactPrivacyEnum, RenewOption } from '#lib/data/types';
import type {
  ContactEntity,
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
  DomainContacts,
  DomainPricingDetails,
  DomainRegistration,
  PriceWithCurrency,
} from '#lib/data/types';
import { toPunycodeDomainName, toPunycodeFqdn } from '#lib/data/validations';

export type R53ContactsMap = {
  RegistrantContact: R53.ContactDetail;
  AdminContact?: R53.ContactDetail;
  TechContact?: R53.ContactDetail;
  BillingContact?: R53.ContactDetail;
};

export function fromR53ContactsMap(
  contacts: Partial<R53ContactsMap>,
): DomainContacts {
  const registrantContact = contacts.RegistrantContact
    ? fromR53Contact(contacts.RegistrantContact)
    : undefined;
  if (!registrantContact) {
    throw new Error('registrant-contact-not-found');
  }
  return {
    registrantContact,
    adminContact: contacts.AdminContact
      ? fromR53Contact(contacts.AdminContact)
      : undefined,
    technicalContact: contacts.TechContact
      ? fromR53Contact(contacts.TechContact)
      : undefined,
    billingContact: contacts.BillingContact
      ? fromR53Contact(contacts.BillingContact)
      : undefined,
  };
}
export function toR53ContactsMap(contacts: DomainContacts): R53ContactsMap {
  return {
    RegistrantContact: toR53Contact(contacts.registrantContact),
    AdminContact: contacts.adminContact
      ? toR53Contact(contacts.adminContact)
      : undefined,
    TechContact: contacts.technicalContact
      ? toR53Contact(contacts.technicalContact)
      : undefined,
    BillingContact: contacts.billingContact
      ? toR53Contact(contacts.billingContact)
      : undefined,
  };
}
export function fromR53Contact(contact: R53.ContactDetail): ContactEntity {
  return {
    countryCode: contact.CountryCode as any,
    email: contact.Email,
    city: contact.City,
    organizationName: contact.OrganizationName,
    addressLines: [contact.AddressLine1, contact.AddressLine2],
    fax: contact.Fax,
    phoneNumber: contact.PhoneNumber,
    zipCode: contact.ZipCode,
    state: contact.State,
    firstName: contact.FirstName,
    lastName: contact.LastName,
    contactType: contact.ContactType,
    extraParams: contact.ExtraParams?.map(({ Name, Value }) => ({
      name: Name,
      value: Value,
    })),
  } as ContactEntity;
}
export function toR53Contact(contact: ContactEntity): R53.ContactDetail {
  if (
    !contact ||
    !contact.firstName ||
    !contact.lastName ||
    !contact.email ||
    !contact.countryCode ||
    !contact.city ||
    !contact.organizationName ||
    !contact.addressLines ||
    !contact.contactType ||
    !contact.zipCode ||
    !contact.state ||
    !contact.phoneNumber ||
    !contact.fax
  ) {
    throw new Error('contact-not-found');
  }
  return {
    CountryCode: contact.countryCode as R53.CountryCode,
    Email: contact.email,
    City: contact.city,
    OrganizationName: contact.organizationName,
    Fax: contact.fax,
    PhoneNumber: contact.phoneNumber,
    ZipCode: contact.zipCode,
    State: contact.state,
    FirstName: contact.firstName,
    LastName: contact.lastName,
    AddressLine1: contact.addressLines?.[0],
    AddressLine2: contact.addressLines?.[1],
    ContactType: contact.contactType as R53.ContactType,
    ExtraParams: contact.extraParams?.map(({ name, value }) => ({
      Name: name as any,
      Value: value,
    })),
  } satisfies R53.ContactDetail;
}

export function fromR53DomainInfo(
  domain: R53.GetDomainDetailResponse,
): Omit<DomainRegistration, 'supportsDnssec'> {
  if (!domain.DomainName) {
    throw new Error('domain-name-not-found');
  }
  if (!domain.CreationDate) {
    throw new Error('creation-date-not-found');
  }
  if (!domain.ExpirationDate) {
    throw new Error('expiration-date-not-found');
  }

  return {
    autoRenewOption: domain.AutoRenew
      ? RenewOption.AUTOMATIC
      : RenewOption.MANUAL,
    creationTime: domain.CreationDate,
    expirationTime: domain.ExpirationDate,
    domainName: toPunycodeDomainName(domain.DomainName),
    nameservers: (domain.Nameservers ?? [])
      .map(({ Name }) => (isNil(Name) ? undefined : toPunycodeFqdn(Name)))
      .filter(isNotNil),
    contacts: fromR53ContactsMap(domain),
    contactsPrivacy: {
      registrantContact: domain.RegistrantPrivacy
        ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
        : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
      adminContact: domain.AdminPrivacy
        ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
        : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
      technicalContact: domain.TechPrivacy
        ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
        : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
    },
    dnssecKeys: domain.DnssecKeys?.map((dnssecKey) => ({
      algorithm: dnssecKey.Algorithm as DnssecAlgorithms,
      digest: dnssecKey.Digest,
      digestType: dnssecKey.DigestType as DnssecDigestType,
      flags: dnssecKey.Flags as DnssecFlags,
      id: dnssecKey.Id,
      keyTag: dnssecKey.KeyTag,
      publicKey: dnssecKey.PublicKey,
    })),
  };
}

export function fromR53Price(price: R53.PriceWithCurrency): PriceWithCurrency {
  if (price.Currency !== 'USD') {
    throw new Error('fromR53Price: only-usd-prices-are-supported');
  }

  return {
    amount: price.Price,
    currency: price.Currency,
  } as PriceWithCurrency;
}
export function toR53Price(price: PriceWithCurrency): R53.PriceWithCurrency {
  return {
    Price: price.amount,
    Currency: price.currency,
  };
}

export function fromR53DomainPrice(
  price: R53.DomainPrice,
): DomainPricingDetails {
  return {
    changeOwnershipPrice: {
      type: 'PER_YEAR',
      price: fromR53Price(
        price.ChangeOwnershipPrice ?? { Price: Number.NaN, Currency: 'USD' },
      ),
    },
    registrationPrice: {
      type: 'PER_YEAR',
      price: fromR53Price(
        price.RegistrationPrice ?? { Price: Number.NaN, Currency: 'USD' },
      ),
    },
    renewalPrice: {
      type: 'PER_YEAR',
      price: fromR53Price(
        price.RenewalPrice ?? { Price: Number.NaN, Currency: 'USD' },
      ),
    },
    importPrice: {
      type: 'PER_YEAR',
      price: fromR53Price(
        price.TransferPrice ?? { Price: Number.NaN, Currency: 'USD' },
      ),
    },
    restorationPrice: {
      type: 'PER_YEAR',
      price: fromR53Price(
        price.RestorationPrice ?? { Price: Number.NaN, Currency: 'USD' },
      ),
    },
  } as DomainPricingDetails;
}
