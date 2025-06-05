import type {
  DynadotGetContactDetails,
  DynadotResponseCode,
} from '../common-types';

export type DynadotGetContactCommandParams = {
  contact_id: string;
};
export type DynadotGetContactCommandOutput = {
  GetContactResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    GetContact: DynadotGetContactDetails;
  };
};
