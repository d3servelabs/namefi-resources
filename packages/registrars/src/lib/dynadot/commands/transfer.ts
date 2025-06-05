import type {
  DynadotContactInfo,
  DynadotCurrency,
  DynadotResponse,
} from '../common-types';

export type DynadotTransferCommandParams = {
  /**
   * 	The domain name you want to transfer in to Dynadot, only 1 domain can be transferred per request
   */
  domain: string;
  /**
   *The authorization code for the transfer request.
   */
  auth: string;

  /**
   * 	You can decide the currency type and this parameter supported are "USD","CNY", "GBP","EUR","INR","CAD" and so on.If you missed this parameter,we will use the account default currency
   */
  currency?: DynadotCurrency;

  /**
   * The coupon code you want to apply to this command
   */
  coupon?: string;

  /**
   * The registrant contact that you want to use when transfer completed. (Not all tld supports this feature)
   */
  registrant_contact?: DynadotContactInfo;
  /**
   * The admin contact that you want to use when transfer completed. (Not all tld supports this feature)
   */
  admin_contact?: DynadotContactInfo;
  /**
   * The technical contact that you want to use when transfer completed. (Not all tld supports this feature)
   */
  technical_contact?: DynadotContactInfo;
  /**
   * The billing contact that you want to use when transfer completed. (Not all tld supports this feature)
   */
  billing_contact?: DynadotContactInfo;
};

export type DynadotTransferCommandOutput = {
  TransferResponse: DynadotResponse<
    'order created',
    DynadotTransferErrors,
    {
      DomainName: string;
    }
  >;
};

export const DynadotTransferErrors = Object.freeze({
  MISSING_AUTH_CODE:
    'This domain requires an auth code in order to initiate a domain transfer.  Please retrieve the authorization code from your current domain registrar.',
  ALREADY_TRANSFERRING:
    'The domain {W} is already being transferred in another order.',
});
export type DynadotTransferErrors =
  (typeof DynadotTransferErrors)[keyof typeof DynadotTransferErrors];
