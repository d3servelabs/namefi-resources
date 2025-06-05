import type * as R53 from '@aws-sdk/client-route-53-domains';
import {
  DomainContactPrivacyEnum,
  RenewOption,
} from '#/lib/abstract-registrar';
import type {
  ContactEntity,
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
  DomainContacts,
  DomainPriceDetails,
  DomainRegistration,
  Nameservers,
  PriceWithCurrency,
} from '#/lib/abstract-registrar';
import type { Transformers } from '#/lib/abstract-registrar';

export type R53ContactsMap = {
  RegistrantContact: R53.ContactDetail;
  AdminContact?: R53.ContactDetail;
  TechContact?: R53.ContactDetail;
  BillingContact?: R53.ContactDetail;
};

export type R53TransformersTypesMap = {
  From: {
    Price: R53.PriceWithCurrency;
    PriceDetails: R53.DomainPrice;
    Contact: R53.ContactDetail;
    ContactsMap: R53ContactsMap;
    DomainInfo: R53.GetDomainDetailResponse;
  };
};
export const R53Transformers = {
  PriceTransformer: {
    from(price) {
      return {
        price: price.Price,
        currency: price.Currency,
      } as PriceWithCurrency;
    },
    to(price) {
      return {
        Price: price.price,
        Currency: price.currency,
      };
    },
  },
  DomainPriceDetailsTransformer: {
    from(price): DomainPriceDetails {
      return {
        changeOwnershipPrice: R53Transformers.PriceTransformer.from(
          price.ChangeOwnershipPrice ?? { Price: Number.NaN, Currency: 'USD' },
        ) as PriceWithCurrency,
        registrationPrice: R53Transformers.PriceTransformer.from(
          price.RegistrationPrice ?? { Price: Number.NaN, Currency: 'USD' },
        ) as PriceWithCurrency,
        renewalPrice: R53Transformers.PriceTransformer.from(
          price.RenewalPrice ?? { Price: Number.NaN, Currency: 'USD' },
        ) as PriceWithCurrency,
        transferPrice: R53Transformers.PriceTransformer.from(
          price.TransferPrice ?? { Price: Number.NaN, Currency: 'USD' },
        ) as PriceWithCurrency,
        restorationPrice: R53Transformers.PriceTransformer.from(
          price.RestorationPrice ?? { Price: Number.NaN, Currency: 'USD' },
        ) as PriceWithCurrency,
      } as DomainPriceDetails;
    },
    to(price): R53.DomainPrice {
      return {
        ChangeOwnershipPrice: R53Transformers.PriceTransformer.to(
          price.changeOwnershipPrice,
        ),
        RegistrationPrice: R53Transformers.PriceTransformer.to(
          price.registrationPrice,
        ),
        RenewalPrice: R53Transformers.PriceTransformer.to(price.renewalPrice),
        TransferPrice: R53Transformers.PriceTransformer.to(price.transferPrice),
        RestorationPrice: R53Transformers.PriceTransformer.to(
          price.restorationPrice,
        ),
      };
    },
  },
  ContactsMapTransformer: {
    from(contacts: Partial<R53ContactsMap>): DomainContacts {
      const registrantContact = contacts.RegistrantContact
        ? R53Transformers.ContactTransformer.from(contacts.RegistrantContact)
        : undefined;
      if (!registrantContact) {
        throw new Error('registrant-contact-not-found');
      }
      return {
        registrantContact,
        adminContact: contacts.AdminContact
          ? R53Transformers.ContactTransformer.from(contacts.AdminContact)
          : undefined,
        technicalContact: contacts.TechContact
          ? R53Transformers.ContactTransformer.from(contacts.TechContact)
          : undefined,
        billingContact: contacts.BillingContact
          ? R53Transformers.ContactTransformer.from(contacts.BillingContact)
          : undefined,
      };
    },
    to(contacts): R53ContactsMap {
      return {
        RegistrantContact: R53Transformers.ContactTransformer.to(
          contacts.registrantContact,
        ),
        AdminContact: R53Transformers.ContactTransformer.to(
          contacts.adminContact,
        ),
        TechContact: R53Transformers.ContactTransformer.to(
          contacts.technicalContact,
        ),
        BillingContact: R53Transformers.ContactTransformer.to(
          contacts.billingContact || contacts.registrantContact,
        ),
      };
    },
  },
  ContactTransformer: {
    from(contact) {
      if (!contact) return undefined;
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
    },
    to(contact) {
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
    },
  },
  DomainInfoTransformer: {
    from(domain): Omit<DomainRegistration, 'supportsDnssec'> {
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
        domainName: domain.DomainName,
        nameservers: (domain.Nameservers?.map(({ Name }) => Name) ??
          []) as Nameservers,
        contacts: R53Transformers.ContactsMapTransformer.from(domain),
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
    },
    to(domain) {
      throw new Error('not-implemented');
    },
  },
} satisfies Transformers<R53TransformersTypesMap>;
