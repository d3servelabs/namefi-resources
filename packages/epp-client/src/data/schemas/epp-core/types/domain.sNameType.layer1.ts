/**
 * Layer-1 XML JSON schema for type domain:sNameType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainSNameTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
  }),
);

export type DomainSNameTypeXml = z.infer<typeof DomainSNameTypeXml>;
