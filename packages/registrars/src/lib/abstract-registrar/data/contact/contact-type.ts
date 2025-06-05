/**
 * @public
 * @enum
 */
export const ContactType = Object.freeze({
  ASSOCIATION: 'ASSOCIATION',
  COMPANY: 'COMPANY',
  PERSON: 'PERSON',
  PUBLIC_BODY: 'PUBLIC_BODY',
  RESELLER: 'RESELLER',
});
/**
 * @public
 */
export type ContactType = (typeof ContactType)[keyof typeof ContactType];
