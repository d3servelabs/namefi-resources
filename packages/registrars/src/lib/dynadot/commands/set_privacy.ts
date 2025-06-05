import type { DynadotResponseCode } from '../common-types';

export type DynadotSetPrivacyCommandParams = {
  /**
   *
   * The domain name you want to set, 100 domains can be set per request, make sure they are separated by commas
   */
  domain: string;

  /**
   *
   * The privacy status of the domain you want to set, it can be "full", "partial", or "off"
   */
  option: 'full' | 'partial' | 'off';
};
export type DynadotSetPrivacyCommandOutput = {
  SetPrivacyResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
