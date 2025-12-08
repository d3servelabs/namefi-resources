/**
 * Layer-1 XML JSON schema for type domain:sNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const DomainSNameTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
  }),
);

export type DomainSNameTypeXml = z.infer<typeof DomainSNameTypeXml>;
