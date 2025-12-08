/**
 * Layer-1 XML JSON schema for type domain:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainCreDataTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:crDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'domain:exDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type DomainCreDataTypeXml = z.infer<typeof DomainCreDataTypeXml>;
