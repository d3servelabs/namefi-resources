import type { DynadotResponseCode } from '../common-types';
import type {
  DynadotDnssecAlgorithms,
  DynadotDnssecDigestType,
} from './set_dnssec';

export type DynadotGetDnssecCommandParams = {
  /**
   * The domain name for which you need to set up dnssec
   */
  domain_name: string;
};

export type DynadotGetDnssecCommandOutput = {
  GetDnssecResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;

    DnssecInfo: {
      KeyTag: number;
      Algorithm: `${string}(${DynadotDnssecAlgorithms})`;
      DigestType: `${string}(${DynadotDnssecDigestType})`;
      Digest: string;
    }[];
  };
};
