import { head, tail } from 'ramda';
import type {
  ContactEntity,
  DomainContacts,
  DomainRegistration,
  Nameservers,
} from '#lib/abstract-registrar';
import { DomainContactPrivacyEnum, RenewOption } from '#lib/abstract-registrar';
import type { Transformers } from '#lib/abstract-registrar/transformers';
import { toPunycodeDomainName } from '#lib/data/validations';
import type {
  DynadotDomainInfo,
  DynadotGetContactDetails,
  DynadotTldPriceCommandOutput,
} from '#lib/dynadot/index';

export type DynadotContactsMap = {
  RegistrantContact: DynadotGetContactDetails;
  AdminContact?: DynadotGetContactDetails;
  TechContact?: DynadotGetContactDetails;
  BillingContact?: DynadotGetContactDetails;
};

export type DynadotTransformersTypesMap = {
  From: {
    PriceDetails: DynadotTldPriceCommandOutput['TldPriceResponse']['TldPrice'][number];
    Contact: DynadotGetContactDetails;
    ContactsMap: DynadotContactsMap;
    DomainInfo: {
      domainInfo: DynadotDomainInfo;
      nameservers: Nameservers;
      contacts: DynadotContactsMap;
    };
  };
};
export const DynadotTransformers = {
  ContactsMapTransformer: {
    from(contacts: DynadotContactsMap): DomainContacts {
      const registrantContact = DynadotTransformers.ContactTransformer.from(
        contacts.RegistrantContact,
      );
      if (!registrantContact) {
        throw new Error('registrant-contact-not-found');
      }
      return {
        registrantContact,
        adminContact: contacts.AdminContact
          ? DynadotTransformers.ContactTransformer.from(contacts.AdminContact)
          : undefined,
        technicalContact: contacts.TechContact
          ? DynadotTransformers.ContactTransformer.from(contacts.TechContact)
          : undefined,
        billingContact: contacts.BillingContact
          ? DynadotTransformers.ContactTransformer.from(contacts.BillingContact)
          : undefined,
      };
    },
    to(contacts): DynadotContactsMap {
      return {
        RegistrantContact: DynadotTransformers.ContactTransformer.to(
          contacts.registrantContact,
        ),
        AdminContact: DynadotTransformers.ContactTransformer.to(
          contacts.adminContact,
        ),
        TechContact: DynadotTransformers.ContactTransformer.to(
          contacts.technicalContact,
        ),
        BillingContact: DynadotTransformers.ContactTransformer.to(
          contacts.billingContact || contacts.registrantContact,
        ),
      };
    },
  },
  ContactTransformer: {
    from(contact) {
      if (!contact) return undefined;
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
      } as ContactEntity;
    },
    // 	if (!contact) return undefined;
    // 	const names = contact.name.split(/\s+/);
    // 	return new ContactEntity({
    // 		countryCode: contact.country as any,
    // 		email: contact.email,
    // 		city: contact.city,
    // 		organizationName: contact.organization,
    // 		addressLines: [contact.address1, contact.address2],
    // 		fax: contact.faxnum,
    // 		phoneNumber: contact.phonenum,
    // 		zipCode: contact.zip,
    // 		state: contact.state,
    // 		firstName: head(names),
    // 		lastName: tail(names),
    // 		contactType: 'COMPANY',
    // 	});
    // },
    // to(contact) {
    // 	if (!contact) return undefined;
    // 	return {
    // 		country: contact.countryCode,
    // 		email: contact.email,
    // 		city: contact.city,
    // 		organization: contact.organizationName,
    // 		faxnum: contact.fax,
    // 		phonenum: contact.phoneNumber,
    // 		phonecc: contact.phoneNumber,
    // 		zip: contact.zipCode,
    // 		state: contact.state,
    // 		name: contact.firstName + contact.lastName,
    // 		address1: contact.addressLines?.[0],
    // 		address2: contact.addressLines?.[1],
    // 	} satisfies DynadotCreateContactDetails;
    // },
    to(contact) {
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
    },
  },
  DomainInfoTransformer: {
    from({
      domainInfo: domain,
      nameservers,
      contacts,
    }): Omit<DomainRegistration, 'supportsDnssec'> {
      return {
        autoRenewOption:
          domain.RenewOption === 'manual renewal'
            ? RenewOption.MANUAL
            : RenewOption.AUTOMATIC,
        creationTime: new Date(Number.parseFloat(domain.Registration)),
        expirationTime: new Date(Number.parseFloat(domain.Expiration)),
        domainName: toPunycodeDomainName(domain.Name),
        nameservers: nameservers,
        contacts: DynadotTransformers.ContactsMapTransformer.from(contacts),
        contactsPrivacy: {
          registrantContact:
            domain.Privacy === 'full'
              ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
              : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
          adminContact:
            domain.Privacy === 'full'
              ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
              : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
          technicalContact:
            domain.Privacy === 'full'
              ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
              : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
        },
        dnssecKeys: [], //todo!!
      };
    },
    to(domain) {
      throw new Error('not-implemented');
    },
  },
} satisfies Transformers<DynadotTransformersTypesMap>;
