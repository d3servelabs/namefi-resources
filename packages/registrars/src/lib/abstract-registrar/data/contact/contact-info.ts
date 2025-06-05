import type { ContactType } from './contact-type';
import type { CountryCode } from './country-code';
import type { ExtraParam } from './extra-param';

export type ContactEntity = {
  firstName?: string | null;
  lastName?: string | null;

  organizationName?: string | null;

  phoneNumber?: string | null;
  phoneNumberVerified?: boolean | null;

  email?: string | null;
  emailVerified?: boolean | null;

  fax?: string | null;

  contactType?: ContactType | string | null;

  countryCode?: CountryCode | string | null;
  state?: string | null;
  city?: string | null;
  addressLines?: string[];
  zipCode?: string | null;

  extraParams?: ExtraParam[];
};
