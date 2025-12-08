/**
 * Layer-1 XML JSON schema for type domain:renDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const DomainRenDataTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:exDate': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type DomainRenDataTypeXml = z.infer<typeof DomainRenDataTypeXml>;
