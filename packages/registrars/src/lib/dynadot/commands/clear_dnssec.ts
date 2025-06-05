import type { DynadotResponseCode } from '../common-types';

export type DynadotClearDnssecCommandParams = {
  /**
   * The domain name for which you need to clear dnssec
   */
  domain_name: string;
};

export type DynadotClearDnssecCommandOutput = {
  ClearDnssecResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
