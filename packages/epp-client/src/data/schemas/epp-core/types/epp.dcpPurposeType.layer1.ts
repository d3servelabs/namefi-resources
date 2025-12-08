/**
 * Layer-1 XML JSON schema for type epp:dcpPurposeType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const EppDcpPurposeTypeXml = z.object({
  'epp:admin': z.string().optional(),
  'epp:contact': z.string().optional(),
  'epp:other': z.string().optional(),
  'epp:prov': z.string().optional(),
});

export type EppDcpPurposeTypeXml = z.infer<typeof EppDcpPurposeTypeXml>;
