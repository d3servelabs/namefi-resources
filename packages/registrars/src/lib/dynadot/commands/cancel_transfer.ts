import type { DynadotResponse } from '../common-types';

export type DynadotCancelTransferCommandParams = {
  domain: string;

  order_id: string;
};
export type DynadotCancelTransferCommandOutput = {
  CancelTransferResponse: DynadotResponse;
};
