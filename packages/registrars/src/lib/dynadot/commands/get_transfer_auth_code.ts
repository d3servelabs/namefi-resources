import type { DynadotResponseCode } from '../common-types';

export type DynadotGetTransferAuthCodeCommandParams = {
  /**
   * The domain name you want to get transfer auth code for, only 1 domain can be entered per request
   */
  domain: string;

  /**
   * Generate a new transfer auth code
   */
  new_code?: 1;

  /**
   * 	If you want to unlock domain for transfer, set it equal to "1". If the request successfully processed, the domain will be unlocked.
   * 	(Optional. Requires api skip lock agreement to use)
   *
   */
  unlock_domain_for_transfer?: 1;
};
export type DynadotGetTransferAuthCodeCommandOutput = {
  GetTransferAuthCodeResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    AuthCode: string;
  };
};
