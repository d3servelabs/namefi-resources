import type { DynadotResponseCode } from '../common-types';

export type DynadotGetNsCommandParams = {
  domain: string;
};
export type DynadotGetNsCommandOutput = {
  GetNsResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    NsContent: Record<`Host${number}`, string>;
  };
};
