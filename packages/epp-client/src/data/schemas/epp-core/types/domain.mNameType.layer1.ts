/**
 * Layer-1 XML JSON schema for type domain:mNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const DomainMNameTypeXml = zloosen(
  z.object({
    'domain:name': z
      .array(zloosen(z.object({ '#text': z.string().min(1).max(255) })))
      .min(1),
  }),
);

export type DomainMNameTypeXml = z.infer<typeof DomainMNameTypeXml>;
