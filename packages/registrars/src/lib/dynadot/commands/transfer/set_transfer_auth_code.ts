/**
 * The command which allows you to update auth code for processing transfer orders.
 * https://www.dynadot.com/domain/api-commands#set_transfer_auth_code
 */
import type { DynadotResponseCode } from '../../common-types';

export type DynadotSetTransferAuthCodeCommandParams = {
  /**
   * The domain name you update the transfer auth for, only 1 domain can be entered per request
   */
  domain: string;

  /**
   * The auth_code you want to re-submit
   */
  auth_code: string;

  /**
   * The transfer order id, you can get it from another api get_transfer_status.
   */
  order_id: string;
};
export type DynadotSetTransferAuthCodeCommandOutput = {
  SetTransferAuthCodeResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
