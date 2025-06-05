import type {
  DynadotCreateContactDetails,
  DynadotResponseCode,
} from '../common-types';

export type DynadotCreateContactCommandParams = DynadotCreateContactDetails;
export type DynadotCreateContactCommandOutput = {
  CreateContactResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    CreateContactContent: {
      ContactId: `${number}`;
    };
  };
};
