export enum DynadotCommand {
  search = 'search',
  register = 'register',
  transfer = 'transfer',
  cancel_transfer = 'cancel_transfer',
  tld_price = 'tld_price',
  domain_info = 'domain_info',
  renew = 'renew',
  lock_domain = 'lock_domain',
  unlock_domain = 'unlock_domain',
  set_ns = 'set_ns',
  get_ns = 'get_ns',
  set_whois = 'set_whois',
  set_dnssec = 'set_dnssec',
  get_dnssec = 'get_dnssec',
  clear_dnssec = 'clear_dnssec',
  set_clear_domain_setting = 'set_clear_domain_setting',
  set_renew_option = 'set_renew_option',
  set_privacy = 'set_privacy',
  create_contact = 'create_contact',
  get_transfer_auth_code = 'get_transfer_auth_code',
  get_transfer_status = 'get_transfer_status',
  get_contact = 'get_contact',
  get_account_balance = 'get_account_balance',
  list_domain = 'list_domain',
}

export type DynadotCurrency = 'USD' | 'CNY' | 'GBP' | 'EUR' | 'INR' | 'CAD';

export type DynadotResponseCode = '-1' | '0' | '1' | '5';
export type DynadotResponseStatus = 'success' | 'error' | 'system_busy';
export type DynadotResponseError = DynadotBaseErrorMessage;

export type DynadotBaseResponse<
  ExtendedStatuses = void,
  ExtendedErrors = void,
> = {
  ResponseCode: DynadotResponseCode;
  Status?: ExtendedStatuses extends void
    ? DynadotResponseStatus
    : DynadotResponseStatus | ExtendedStatuses;
  Error?: ExtendedErrors extends void
    ? DynadotResponseError
    : DynadotResponseError | ExtendedErrors;
};

export type DynadotResponse<
  ExtendedStatuses = void,
  ExtendedErrors = void,
  DATA = void,
> = Prettier<
  DATA extends void
    ? DynadotBaseResponse<ExtendedStatuses, ExtendedErrors>
    : DynadotBaseResponse<ExtendedStatuses, ExtendedErrors> & Partial<DATA>
>;

export type DynadotContactInfo = any;
export type DynadotCreateContactDetails = {
  /**
   * The organization information
   */
  organization?: string;
  /**
   * Name
   */
  name: string;
  /**
   * Email
   */
  email: string;
  /**
   * Phone number
   */
  phonenum: string;
  /**
   * Phone country code
   */
  phonecc: string;
  /**
   * Fax number
   */
  faxnum?: string;
  /**
   * Fax country code
   */
  faxcc?: string;
  /**
   * Address1
   */
  address1: string;
  /**
   * Address 2
   */
  address2?: string;
  /**
   * City
   */
  city: string;
  /**
   * State
   */
  state?: string;
  /**
   * Zip code
   */
  zip: string;
  /**
   * Country
   */
  country: string;
};

export type DynadotGetContactDetails = {
  ContactId: string;
  Organization: string;
  Name: string;
  Email: string;
  PhoneCc: string;
  PhoneNum: string;
  FaxCc: string;
  FaxNum: string;
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  GtldVerified: string;
};
export type Prettier<T> = { [k in keyof T]: T[k] } & {};

export const DynadotBaseErrorMessage = {
  PROCESSING_ANOTHER_REQUEST:
    'currently processing another request from this account',
  DOMAIN_NAME_ASCII_ONLY: 'domain must be in ascii',
  INCORRECT_COMMAND: 'incorrect command name',
  INVALID_KEY: 'invalid key',
} as const;

export type DynadotBaseErrorMessage =
  (typeof DynadotBaseErrorMessage)[keyof typeof DynadotBaseErrorMessage];
