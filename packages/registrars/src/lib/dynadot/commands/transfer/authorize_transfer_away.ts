/**
 * Authorize transfer away request.
 * https://www.dynadot.com/domain/api-commands#authorize_transfer_away
 */
import type { DynadotResponseCode } from '../../common-types';

export type DynadotAuthorizeTransferAwayCommandParams = {
  /**
   * The domain name you want to authorize transfer away for, only 1 domain can be entered per request
   */
  domain: string;

  /**
   * The Dynadot order_id of the domain you want to transfer away
   */
  order_id: string;

  /**
   * To authorize the transfer away, set it equal to "approve". To deny the transfer away, set it equal to "deny".
   */
  authorize: 'approve' | 'deny';
};

export type DynadotAuthorizeTransferAwayCommandOutput = {
  AuthorizeTransferAwayResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    Result: string;
  };
};
