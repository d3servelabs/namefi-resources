export const DomainContactPrivacyEnum = {
  CONTACT_PRIVACY_UNSPECIFIED: 'CONTACT_PRIVACY_UNSPECIFIED',
  PRIVATE_CONTACT_DATA: 'PRIVATE_CONTACT_DATA',
  REDACTED_CONTACT_DATA: 'REDACTED_CONTACT_DATA',
  PUBLIC_CONTACT_DATA: 'PUBLIC_CONTACT_DATA',
} as const;

export type DomainContactPrivacyEnum =
  (typeof DomainContactPrivacyEnum)[keyof typeof DomainContactPrivacyEnum];

export type DomainContactsPrivacy = {
  registrantContact: DomainContactPrivacyEnum;
  adminContact?: DomainContactPrivacyEnum;
  technicalContact?: DomainContactPrivacyEnum;
  billingContact?: DomainContactPrivacyEnum;
};
