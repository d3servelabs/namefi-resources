import type { OriginInfo } from '@/lib/origin/types';
import type { FC } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type SearchComponent = FC<{
  originInfo: OriginInfo;
}>;

export type ImportQuery = {
  domain: NamefiNormalizedDomain;
  eppAuthorizationCode?: string;
};

export enum SearchMode {
  REGISTER = 'REGISTER',
  IMPORT = 'IMPORT',
}
