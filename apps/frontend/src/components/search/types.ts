import type { OriginRuntime } from '@/lib/origin';
import type { FC } from 'react';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { z } from 'zod';

export type LandingComponent = FC<{
  origin: OriginRuntime;
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
