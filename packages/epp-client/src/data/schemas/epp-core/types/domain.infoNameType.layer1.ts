/**
 * Layer-1 XML JSON schema for type domain:infoNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const DomainInfoNameTypeXml = zloosen(
  z.object({
    '@_hosts': z.enum(['all', 'del', 'none', 'sub']).default('all').optional(),
    '#text': z.string().min(1).max(255),
  }),
);

export type DomainInfoNameTypeXml = z.infer<typeof DomainInfoNameTypeXml>;
