import type { DynadotResponseCode } from '../common-types';

export type DynadotSetRenewOptionCommandParams = {
  /**
   * The domain name you want to set, 100 domains can be set per request, make sure they are separated by commas
   */
  domain: string;

  /**
   * It can be "donot", "auto", "reset"
   */
  renew_option: 'donot' | 'auto' | 'reset';
};
export type DynadotSetRenewOptionCommandOutput = {
  SetRenewOptionResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
