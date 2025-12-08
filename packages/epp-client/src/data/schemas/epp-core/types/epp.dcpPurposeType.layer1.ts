/**
 * Layer-1 XML JSON schema for type epp:dcpPurposeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppDcpPurposeTypeXml = zloosen(
  z.object({
    'epp:admin': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:contact': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:other': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:prov': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type EppDcpPurposeTypeXml = z.infer<typeof EppDcpPurposeTypeXml>;
