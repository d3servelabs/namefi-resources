import type { DynadotResponseCode } from '../common-types';

export type DynadotSetClearDomainSettingCommandParams = {
  /**
   * The domain name for which you need to clear dnssec
   */
  domain_name: string;

  /**
   * The service to clear
   */
  service:
    | 'forward'
    | 'stealth'
    | 'email_forwarding'
    | 'dns'
    | 'dnssec'
    | 'nameservers';
};

export type DynadotSetClearDomainSettingCommandOutput = {
  SetClearDomainSettingResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
