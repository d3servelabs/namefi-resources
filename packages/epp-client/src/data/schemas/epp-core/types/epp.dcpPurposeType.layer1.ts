/**
 * Layer-1 XML JSON schema for type epp:dcpPurposeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppDcpPurposeTypeXml = zloosen(
  z.object({
    'epp:admin': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:contact': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:other': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:prov': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type EppDcpPurposeTypeXml = z.infer<typeof EppDcpPurposeTypeXml>;
