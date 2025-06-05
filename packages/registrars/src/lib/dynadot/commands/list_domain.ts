import type { DynadotResponse } from '../common-types';
import type { DynadotDomainInfo } from './domain_info';

export type DynadotListDomainCommandParams = {
  customer_id?: string;
  count_per_page?: number;
  page_index?: number;
  sort?: `${'Count' | 'Name'}${'Asc' | 'Desc'}`;
};

export type DynadotListDomainCommandOutput = {
  ListDomainInfoResponse: DynadotResponse<
    void,
    void,
    {
      MainDomains: DynadotDomainInfo[];
    }
  >;
};
