import type { PunycodeDomainName } from '#lib/data/validations';
import type { DomainContacts, DomainContactsPrivacy } from './contact';
import type { DnssecKey } from './dnssec';
import type { Nameservers } from './nameservers';
import type { RenewOption } from './renew-option';

export type DomainRegistration = {
  expirationTime: Date;
  creationTime: Date;
  domainName: PunycodeDomainName;
  autoRenewOption: RenewOption;
  nameservers: Nameservers;
  contacts: DomainContacts;
  contactsPrivacy: DomainContactsPrivacy;
  dnssecKeys?: DnssecKey[];
  supportsDnssec: boolean;
};

export type DomainSummary = {
  expirationTime: Date;
  domainName: PunycodeDomainName;
  autoRenewOption: RenewOption;
  transferLocked: boolean;
};
