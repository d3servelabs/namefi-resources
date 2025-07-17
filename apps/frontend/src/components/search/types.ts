import type { OriginInfo } from '@/lib/origin/types';
import type { FC } from 'react';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { z } from 'zod';

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

// Form schema for EPP authorization codes
export const eppAuthorizationCodesFormSchema = z.object({
  eppAuthorizationCodes: z.record(
    namefiNormalizedDomainSchema,
    z.string().optional(),
  ),
});

export type EppAuthorizationCodesFormData = z.infer<
  typeof eppAuthorizationCodesFormSchema
>;
