import { nameRegex, nameRegexString } from '@namefi-astra/zod-dns';
import { z } from 'zod';

export const namefiNormalizedDomainRegex = nameRegex;

export const namefiNormalizedDomainSchema = z
  .string()
  .regex(new RegExp(`^${nameRegexString}$`))
  .brand<'NamefiNormalizedDomain'>();

export type NamefiNormalizedDomain = z.infer<
  typeof namefiNormalizedDomainSchema
>;
